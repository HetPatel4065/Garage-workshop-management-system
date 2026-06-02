import User from "../models/User.js";
import Owner from "../models/Owner.js";
import Advisor from "../models/Advisor.js";
import Mechanic from "../models/Mechanic.js";
import GarageSettings from "../models/GarageSettings.js";
import GarageLead from "../models/GarageLead.js";
import { createNotification } from "../utils/notificationHelper.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

const resolveUserByIdAcrossCollections = async (id) => {
  let user = await User.findById(id).select("+password");
  if (!user) user = await Owner.findById(id).select("+password");
  if (!user) user = await Advisor.findById(id).select("+password");
  if (!user) user = await Mechanic.findById(id).select("+password");
  return user;
};

const createToken = (id, role, permissions, extraClaims = {}) => {
  return jwt.sign(
    { id, role, permissions, ...extraClaims },
    process.env.JWT_SECRET,
    {
      expiresIn: "15d",
    },
  );
};

// 📝 REGISTER (Unified User Creation)
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      garageName,
      address,
      mobileNumber,
      ownerId,
    } = req.body;

    // 🛡️ Comprehensive Uniqueness Check (Unified + Legacy collections)
    const alreadyExists =
      (await User.findOne({ email })) ||
      (await Owner.findOne({ email })) ||
      (await Advisor.findOne({ email })) ||
      (await Mechanic.findOne({ email }));

    if (alreadyExists) {
      console.warn("Register Attempt Denied: Email already exists", { email });
      return res
        .status(400)
        .json({ error: "Email already registered in system" });
    }

    // 🔗 LINKAGE VALIDATION: Ensure ownerId is a valid ObjectId or null
    let validatedOwnerId = null;
    if (role !== "owner") {
      if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
        validatedOwnerId = ownerId;
      } else if (ownerId && String(ownerId).length === 10) {
        // Resolve 10-digit Dashboard PIN -> Actual Mongo _id via Native DB Lookup
        const ownerMatch = await Owner.findOne({ garageId: ownerId });

        if (!ownerMatch) {
          return res.status(400).json({
            error:
              "Invalid 10-digit Garage Connection ID (No matching owner found)",
          });
        }
        validatedOwnerId = ownerMatch._id;
      } else if (ownerId) {
        return res
          .status(400)
          .json({ error: "Invalid Garage Connection ID format" });
      }
    }

    const userData = {
      name,
      email,
      password,
      role,
      mobileNumber,
      ownerId: validatedOwnerId,
    };

    let user;
    if (role === "owner") {
      // Generate 10-digit Garage ID natively
      let newGarageId;
      let isUnique = false;
      while (!isUnique) {
        newGarageId = Math.floor(
          1000000000 + Math.random() * 9000000000,
        ).toString();
        const existing = await Owner.findOne({ garageId: newGarageId });
        if (!existing) isUnique = true;
      }

      const garageData = {
        ...userData,
        garageId: newGarageId,
        garageName,
        address,
        mobileNumber,
      };

      if (req.file) {
        // configure cloudinary
        if (process.env.CLOUDINARY_URL) {
          cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
        } else {
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          });
        }
        try {
          const uploaded = await cloudinary.uploader.upload(req.file.path, {
            folder: `garage_logos/${newGarageId}`,
          });
          if (uploaded && uploaded.secure_url) {
            garageData.logo = uploaded.secure_url;
          }
        } catch (err) {
          console.error("Cloudinary upload failed for owner logo:", err);
          garageData.logo = req.file.path.replace(/\\/g, "/");
        }
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          // ignore
        }
      }

      user = await Owner.create(garageData);

      // ⚙️ INITIALIZE DEFAULT SETTINGS FOR NEW OWNER
      await GarageSettings.create({
        ownerId: user._id,
        garageName: user.garageName,
        contactNumber: user.mobileNumber,
        businessAddress: user.address,
        notifications: {
          emailReports: true, // Default to true so they get reports
          serviceReminders: true, // Default to true
          lowStock: true,
          reminderSchedule: [-7, -3, 0, 3],
        },
      });
    } else if (role === "advisor") {
      user = await Advisor.create(userData);
    } else if (role === "mechanic") {
      user = await Mechanic.create(userData);
    } else {
      // Fallback for any other user roles
      user = await User.create(userData);
    }

    // 🔔 Notify Owner of new staff registration
    if (role !== "owner" && validatedOwnerId) {
      await createNotification({
        ownerId: validatedOwnerId,
        title: "New Staff Member Registered",
        message: `${name} has registered as a ${role} in your garage.`,
        type: "info",
        link: "/staff-members",
      });
    }

    console.log("Register Success:", {
      id: user._id,
      email: user.email,
      role: user.role,
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("Register Error:", error);

    // 🛡️ Specific Handling for Mongoose Validation Errors (Status 400)
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation Failed",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({ error: "Registration failed: " + error.message });
  }
};

// 🔐 LOGIN (Legacy-Aware Deep Search)
export const login = async (req, res) => {
  const { email, password, garageId } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Deep Search across all staff collections to prevent lock-out during migration
    let user = await User.findOne({ email }).select("+password");
    if (!user) user = await Owner.findOne({ email }).select("+password");
    if (!user) user = await Advisor.findOne({ email }).select("+password");
    if (!user) user = await Mechanic.findOne({ email }).select("+password");

    if (!user) {
      console.warn("Login Failed: User not found", { email });
      return res
        .status(401)
        .json({ error: "No account found with this email" });
    }

    if (user.isActive === false) {
      console.warn("Login Failed: Account inactive", { email });
      return res
        .status(403)
        .json({ error: "Your account is inactive. Please contact the owner." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn("Login Failed: Incorrect password", { email });
      return res.status(401).json({ error: "Incorrect password" });
    }

    // 🛡️ ROLE-SPECIFIC GARAGE ID VALIDATION / CONTEXT
    // Mechanics and Advisors MUST provide a valid 10-digit Garage ID
    if (user.role === "mechanic" || user.role === "advisor") {
      if (!garageId) {
        return res
          .status(400)
          .json({ error: "10-digit Garage ID is required for staff login" });
      }

      if (garageId.length !== 10 || !/^\d+$/.test(garageId)) {
        return res
          .status(400)
          .json({ error: "Invalid Garage ID format. Must be 10 digits." });
      }

      // Resolve the owner to verify the garageId
      let owner = await Owner.findById(user.ownerId);
      if (!owner) {
        // Fallback to User collection if not in Owner collection
        owner = await User.findById(user.ownerId);
      }

      if (!owner || !owner.garageId || owner.garageId !== garageId) {
        console.warn("Login Failed: Garage ID mismatch for staff", {
          email,
          provided: garageId,
          expected: owner?.garageId,
        });
        return res.status(401).json({
          error: "Access Denied: Garage ID does not match your assigned garage",
        });
      }
    } else if (user.role === "owner" && garageId) {
      // If an owner provides a garageId, it must match their own (if they have one)
      if (user.garageId && user.garageId !== garageId) {
        console.warn("Login Failed: Garage ID mismatch for owner", {
          email,
          provided: garageId,
          expected: user.garageId,
        });
        return res
          .status(401)
          .json({ error: "Invalid Garage ID for this owner account" });
      }
    } else if (user.role === "admin") {
      // Admin login doesn't strictly require a Garage ID anymore. If provided, we validate it.
      if (garageId) {
        if (String(garageId).length !== 10 || !/^\d+$/.test(String(garageId))) {
          return res.status(400).json({
            error: "Invalid Garage ID format. Must be 10 digits.",
          });
        }
      }
    }

    // Resolve admin selected garage context (effectiveOwnerId)
    let effectiveOwnerIdForToken = undefined;
    if (user.role === "admin" && garageId) {
      const ownerMatch = await Owner.findOne({
        garageId: String(garageId),
      }).select("_id");
      if (!ownerMatch) {
        console.warn("Admin Login Failed: Target Garage ID not found", {
          email,
          garageId,
        });
        return res.status(401).json({
          error:
            "Invalid Garage ID: No matching owner found with this 10-digit ID",
        });
      }
      effectiveOwnerIdForToken = ownerMatch._id;
    }

    const token = createToken(user._id, user.role, user.permissions, {
      ...(effectiveOwnerIdForToken
        ? { effectiveOwnerId: effectiveOwnerIdForToken }
        : {}),
    });

    const refreshToken = jwt.sign(
      {
        id: user._id,
        ...(effectiveOwnerIdForToken
          ? { effectiveOwnerId: effectiveOwnerIdForToken }
          : {}),
      },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userObj = user.toObject();
    delete userObj.password;
    if (userObj.role) userObj.role = userObj.role.toLowerCase();

    // Generate garageId lazily for legacy owners on login to prevent breaking older accounts
    if (userObj.role === "owner" && !userObj.garageId) {
      let isUnique = false;
      let newGId;
      while (!isUnique) {
        newGId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        if (!(await Owner.findOne({ garageId: newGId }))) isUnique = true;
      }
      await Owner.findByIdAndUpdate(userObj._id, { garageId: newGId });
      userObj.garageId = newGId;
    }

    //  ATTACH GARAGE DETAILS (For staff members + admin context post-login)
    const effectiveOwnerId =
      userObj.role === "owner"
        ? userObj._id
        : userObj.role === "admin"
          ? effectiveOwnerIdForToken
          : user.ownerId || userObj.ownerId;

    if (userObj.role !== "owner" && effectiveOwnerId) {
      let ownerDetails = await User.findById(effectiveOwnerId).select(
        "garageName address logo mobileNumber garageId",
      );
      if (!ownerDetails) {
        ownerDetails = await Owner.findById(effectiveOwnerId).select(
          "garageName address logo mobileNumber garageId",
        );
      }

      if (ownerDetails) {
        userObj.garageName = ownerDetails.garageName;
        userObj.address = ownerDetails.address;
        userObj.logo = ownerDetails.logo;
        userObj.mobileNumber = ownerDetails.mobileNumber;
        userObj.garageId = ownerDetails.garageId;
      }
    }

    res.status(200).json({
      message: "Login successful",
      token,
      user: userObj,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await resolveUserByIdAcrossCollections(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Account no longer exists" });
    }

    const role = String(user.role || "").toLowerCase();
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    const extraClaims =
      role === "admin" && decoded.effectiveOwnerId
        ? { effectiveOwnerId: decoded.effectiveOwnerId }
        : {};

    const newAccessToken = createToken(
      user._id,
      role,
      permissions,
      extraClaims,
    );
    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    res.status(403).json({ error: "Invalid refresh token" });
  }
};

export const getStaff = async (req, res) => {
  try {
    const ownerId = req.user.effectiveOwnerId;
    const requestedRole = req.query.role?.toLowerCase();

    let staffQueries = [];

    if (requestedRole === "mechanic") {
      staffQueries.push(Mechanic.find({ ownerId }));
    } else if (requestedRole === "advisor") {
      staffQueries.push(Advisor.find({ ownerId }));
    } else {
      staffQueries = [
        User.find({ ownerId }),
        Advisor.find({ ownerId }),
        Mechanic.find({ ownerId }),
      ];
      // Only include the Owner in the list if the requester is an admin and no specific role requested
      if (req.user.role === "admin") {
        staffQueries.push(Owner.findById(ownerId));
      }
    }

    const staffResults = await Promise.all(staffQueries);
    const flattenedStaff = staffResults
      .flat()
      .filter(Boolean)
      .map((member) => {
        const obj = member.toObject();
        delete obj.password;
        return obj;
      });

    res.status(200).json(flattenedStaff);
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

export const removeStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const ownerId = req.user.effectiveOwnerId;

    if (staffId === ownerId.toString()) {
      return res.status(400).json({ error: "Cannot remove owner account" });
    }

    const results = await Promise.all([
      User.findOneAndDelete({ _id: staffId, ownerId }),
      Advisor.findOneAndDelete({ _id: staffId, ownerId }),
      Mechanic.findOneAndDelete({ _id: staffId, ownerId }),
    ]);

    const removed = results.some((r) => r !== null);
    if (!removed) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.status(200).json({ message: "Staff member removed" });
  } catch (error) {
    console.error("REMOVE STAFF ERROR:", error);
    res.status(500).json({ error: "Failed to remove staff" });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const ownerId = req.user.effectiveOwnerId;
    const { name, email, mobileNumber } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const updatePayload = { name: name.trim() };
    if (email?.trim()) updatePayload.email = email.trim();
    if (mobileNumber?.trim()) updatePayload.mobileNumber = mobileNumber.trim();
    if (req.body.hasOwnProperty("isActive"))
      updatePayload.isActive = req.body.isActive;

    // Try to update across all staff collections
    const results = await Promise.all([
      User.findOneAndUpdate({ _id: staffId, ownerId }, updatePayload, {
        new: true,
      }),
      Advisor.findOneAndUpdate({ _id: staffId, ownerId }, updatePayload, {
        new: true,
      }),
      Mechanic.findOneAndUpdate({ _id: staffId, ownerId }, updatePayload, {
        new: true,
      }),
    ]);

    // Admin can also update owners
    let updated = results.find((r) => r !== null);
    if (!updated && req.user.role === "admin") {
      updated = await Owner.findByIdAndUpdate(staffId, updatePayload, {
        new: true,
      });
    }

    if (!updated) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const obj = updated.toObject();
    delete obj.password;
    res.status(200).json(obj);
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);
    res.status(500).json({ error: "Failed to update staff member" });
  }
};

// 🛡️ ADMIN ONLY: REMOVE ANY USER
export const removeAnyUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized: Admin access required" });
    }

    // Attempt deletion across all collections
    const results = await Promise.all([
      User.findByIdAndDelete(id),
      Owner.findByIdAndDelete(id),
      Advisor.findByIdAndDelete(id),
      Mechanic.findByIdAndDelete(id),
    ]);

    const removed = results.some((r) => r !== null);
    if (!removed) {
      return res.status(404).json({ error: "User/Owner not found" });
    }

    res.status(200).json({ message: "Account permanently removed by Admin" });
  } catch (error) {
    console.error("ADMIN REMOVE ERROR:", error);
    res.status(500).json({ error: "Failed to remove account" });
  }
};

// 📝 GET LEAD DETAILS BY TOKEN
export const getLeadDetailsByToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Registration token is required" });
    }

    const lead = await GarageLead.findOne({
      signupToken: token,
      signupTokenExpires: { $gt: new Date() },
    });

    if (!lead) {
      return res
        .status(400)
        .json({ error: "Invalid or expired onboarding registration token" });
    }

    res.status(200).json({
      success: true,
      lead: {
        garageName: lead.garageName,
        ownerName: lead.ownerName,
        email: lead.email,
        mobileNumber: lead.mobileNumber,
        city: lead.city,
      },
    });
  } catch (error) {
    console.error("GET LEAD BY TOKEN ERROR:", error);
    res.status(500).json({ error: "Failed to retrieve onboarding details" });
  }
};

// 📝 COMPLETE OWNER ONBOARDING
export const completeOwnerOnboarding = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const lead = await GarageLead.findOne({
      signupToken: token,
      signupTokenExpires: { $gt: new Date() },
    });

    if (!lead) {
      return res
        .status(400)
        .json({ error: "Invalid or expired onboarding registration token" });
    }

    // Check if owner email already exists
    const alreadyExists =
      (await User.findOne({ email: lead.email })) ||
      (await Owner.findOne({ email: lead.email })) ||
      (await Advisor.findOne({ email: lead.email })) ||
      (await Mechanic.findOne({ email: lead.email }));

    if (alreadyExists) {
      return res
        .status(400)
        .json({ error: "This email is already registered in the system" });
    }

    // Generate unique 10-digit Garage ID
    let newGarageId;
    let isUnique = false;
    while (!isUnique) {
      newGarageId = Math.floor(
        1000000000 + Math.random() * 9000000000,
      ).toString();
      const existing = await Owner.findOne({ garageId: newGarageId });
      if (!existing) isUnique = true;
    }

    // Create the Owner
    const owner = await Owner.create({
      name: lead.ownerName,
      email: lead.email,
      password,
      role: "owner",
      garageId: newGarageId,
      garageName: lead.garageName,
      mobileNumber: lead.mobileNumber,
      address: lead.city, // Map city as initial address
      verificationStatus: "Verified", // Automatically verify onboarding leads
    });

    // Create Default Settings
    await GarageSettings.create({
      ownerId: owner._id,
      garageName: owner.garageName,
      contactNumber: owner.mobileNumber,
      businessAddress: owner.address,
      notifications: {
        emailReports: true,
        serviceReminders: true,
        lowStock: true,
        reminderSchedule: [-7, -3, 0, 3],
      },
    });

    // Invalidate onboarding token
    lead.signupToken = undefined;
    lead.signupTokenExpires = undefined;
    lead.status = "approved"; // Ensure status is approved
    await lead.save();

    res.status(201).json({
      success: true,
      message: "Garage Owner onboarding completed successfully!",
      owner: {
        id: owner._id,
        garageId: owner.garageId,
        email: owner.email,
      },
    });
  } catch (error) {
    console.error("COMPLETE ONBOARDING ERROR:", error);
    res
      .status(500)
      .json({ error: "Failed to complete onboarding: " + error.message });
  }
};
