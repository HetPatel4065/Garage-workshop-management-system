import User from "../models/User.js";
import Owner from "../models/Owner.js";
import bcrypt from "bcryptjs";
import Advisor from "../models/Advisor.js";
import Mechanic from "../models/Mechanic.js";
import GarageSettings from "../models/GarageSettings.js";
import GarageLead from "../models/GarageLead.js";
import { createNotification } from "../utils/notificationHelper.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import { logActivity } from "../utils/activityLogger.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../utils/email.js";

const resolveUserByIdAcrossCollections = async (id) => {
  if (typeof id === "string" && id.includes("_co_")) {
    const [parentOwnerId, idxStr] = id.split("_co_");
    const idx = parseInt(idxStr);
    const parentOwner = await Owner.findById(parentOwnerId).select("+password");
    if (parentOwner && parentOwner.coOwners && parentOwner.coOwners[idx]) {
      const co = parentOwner.coOwners[idx];
      const coObj = {
        _id: id,
        name: co.name,
        email: co.email,
        password: co.password || parentOwner.password,
        role: "owner",
        isCoOwner: true,
        garageId: parentOwner.garageId,
        garageName: parentOwner.garageName,
        address: parentOwner.address,
        mobileNumber: co.mobileNumber || parentOwner.mobileNumber,
        isActive: parentOwner.isActive,
        permissions: parentOwner.permissions || ["all"],
        toObject: function () {
          return this;
        },
      };
      return coObj;
    }
  }
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
      targetGarageId,
    } = req.body;

    // Skip duplicate check if this is a co-owner registration (has targetGarageId + role owner)
    const isCoOwnerRegistration =
      role === "owner" && (targetGarageId || req.body.garageId);

    if (!isCoOwnerRegistration) {
      const alreadyExists =
        (await User.findOne({ email })) ||
        (await Owner.findOne({ email })) ||
        (await Advisor.findOne({ email })) ||
        (await Mechanic.findOne({ email }));

      if (alreadyExists) {
        console.warn("Register Attempt Denied: Email already exists", {
          email,
        });
        return res
          .status(400)
          .json({ error: "Email already registered in system" });
      }
    }
    // 🔗 LINKAGE VALIDATION: Ensure ownerId is a valid ObjectId or null
    let validatedOwnerId = null;
    if (role !== "owner") {
      // 🏢 Admin can specify a target garage by garageId (10-digit) to assign staff to correct garage
      if (targetGarageId && String(targetGarageId).length === 10) {
        // Resolve the PRIMARY owner (oldest) of the target garage
        const primaryOwner = await Owner.findOne({
          garageId: targetGarageId,
        }).sort({ createdAt: 1 });
        if (!primaryOwner) {
          return res
            .status(400)
            .json({ error: "Selected garage does not exist" });
        }
        validatedOwnerId = primaryOwner._id;
      } else if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
        // If ownerId is a valid MongoDB ObjectId, verify it belongs to a primary owner
        const ownerRecord = await Owner.findById(ownerId);
        if (ownerRecord) {
          // Always resolve to primary owner to ensure consistent staff lookup
          const primaryOwner = await Owner.findOne({
            garageId: ownerRecord.garageId,
          }).sort({ createdAt: 1 });
          validatedOwnerId = primaryOwner ? primaryOwner._id : ownerId;
        } else {
          validatedOwnerId = ownerId;
        }
      } else if (ownerId && String(ownerId).length === 10) {
        // Resolve 10-digit Dashboard PIN -> Actual Mongo _id via Native DB Lookup
        const ownerMatch = await Owner.findOne({ garageId: ownerId }).sort({
          createdAt: 1,
        });

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
      let garageIdToUse;
      let finalGarageName = garageName;
      let finalAddress = address;
      let finalMobileNumber = mobileNumber;
      let finalLogo = undefined;
      let createSettings = false;
      let isCoOwnerAdded = false;

      let existingVerificationStatus = "Pending";
      const garageId = targetGarageId || req.body.garageId;
      if (garageId) {
        // use existing garage
        // skip garage creation
        const existingGarage = await Owner.findOne({
          garageId: garageId,
          isCoOwner: { $ne: true },
        });
        if (!existingGarage) {
          return res
            .status(400)
            .json({ error: "Selected Garage does not exist" });
        }

        // Prevent duplicate Owner-Garage assignments
        const alreadyOwnerOfGarage = await Owner.findOne({
          email,
          garageId: existingGarage.garageId,
        });
        const alreadyCoOwnerOfGarage = existingGarage.coOwners?.some(
          (co) => co.email.toLowerCase() === email.toLowerCase(),
        );
        if (alreadyOwnerOfGarage || alreadyCoOwnerOfGarage) {
          return res.status(400).json({
            error: "This user is already an Owner of the selected Garage",
          });
        }

        // Add to the coOwners array of the existing primary owner document (no new database entry in Owner table)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        existingGarage.coOwners = existingGarage.coOwners || [];
        existingGarage.coOwners.push({
          name,
          email,
          mobileNumber,
          password: hashedPassword,
        });

        await existingGarage.save();

        const idx = existingGarage.coOwners.length - 1;
        user = {
          _id: `${existingGarage._id}_co_${idx}`,
          name,
          email,
          mobileNumber,
          role: "owner",
          isCoOwner: true,
          garageId: existingGarage.garageId,
          garageName: existingGarage.garageName,
          address: existingGarage.address,
          logo: existingGarage.logo,
          verificationStatus: existingGarage.verificationStatus || "Verified",
          isActive: existingGarage.isActive,
          toObject: function () {
            return this;
          },
        };

        isCoOwnerAdded = true;
        garageIdToUse = existingGarage.garageId;
        finalGarageName = existingGarage.garageName;
        finalAddress = existingGarage.address;
        finalMobileNumber = existingGarage.mobileNumber;
        finalLogo = existingGarage.logo;
        existingVerificationStatus =
          existingGarage.verificationStatus || "Verified";
        createSettings = false;
      } else if (req.user?.role === "admin") {
        return res.status(400).json({
          error: "Please select an existing Garage for the new Owner.",
        });
      } else {
        // Prevent duplicate Garage creation
        const existingGarageByName = await Owner.findOne({
          garageName: {
            $regex: new RegExp("^" + (garageName || "").trim() + "$", "i"),
          },
        });
        if (existingGarageByName) {
          return res.status(400).json({
            error:
              "A Garage with this name already exists. Please choose a different name or contact the administrator.",
          });
        }

        // Generate 10-digit Garage ID natively
        let isUnique = false;
        while (!isUnique) {
          garageIdToUse = Math.floor(
            1000000000 + Math.random() * 9000000000,
          ).toString();
          const existing = await Owner.findOne({ garageId: garageIdToUse });
          if (!existing) isUnique = true;
        }
        createSettings = true;
      }

      if (!isCoOwnerAdded) {
        const existingOwnerCount = await Owner.countDocuments({
          garageId: garageIdToUse,
        });

        const garageData = {
          ...userData,
          garageId: garageIdToUse,
          garageName: finalGarageName,
          address: finalAddress,
          mobileNumber: finalMobileNumber,
          logo: finalLogo,
          isCoOwner: existingOwnerCount > 0,
          verificationStatus: existingVerificationStatus,
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
              folder: `garage_logos/${garageIdToUse}`,
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

        // ⚙️ INITIALIZE DEFAULT SETTINGS FOR NEW OWNER ONLY IF NEW GARAGE
        if (createSettings) {
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
        }
      }
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
    // ✅ Log when an authenticated user (owner/admin) creates any staff, including co-owners
    if (req.user) {
      try {
        // For owner role additions: use the target garage's garageId so the log
        // is recorded under the correct garage (important for admin-initiated additions)
        let overrideGarageId = null;
        if (role === "owner") {
          // user is the newly created Owner document — it has garageId
          overrideGarageId = user.garageId || null;
        }
        await logActivity(
          req,
          "create",
          "Staff",
          `Added ${role} "${name}"`,
          user._id,
          {},
          overrideGarageId,
        );
      } catch (logErr) {
        console.warn("Activity log failed for staff creation:", logErr.message);
      }
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
      const parentOwner = await Owner.findOne({
        "coOwners.email": email.toLowerCase(),
      }).select("+password");
      if (parentOwner) {
        const co = parentOwner.coOwners.find(
          (c) => c.email.toLowerCase() === email.toLowerCase(),
        );
        if (co) {
          user = {
            _id: `${parentOwner._id}_co_${parentOwner.coOwners.indexOf(co)}`,
            name: co.name,
            email: co.email,
            password: co.password,
            role: "owner",
            isCoOwner: true,
            garageId: parentOwner.garageId,
            garageName: parentOwner.garageName,
            address: parentOwner.address,
            mobileNumber: co.mobileNumber || parentOwner.mobileNumber,
            isActive: parentOwner.isActive,
            comparePassword: async function (candidatePassword) {
              if (!candidatePassword) return false;
              if (this.password) {
                return await bcrypt.compare(candidatePassword, this.password);
              }
              return await bcrypt.compare(
                candidatePassword,
                parentOwner.password,
              );
            },
            toObject: function () {
              return { ...this };
            },
          };
        }
      }
    }

    if (!user) {
      console.warn("Login Failed: User not found", { email });
      return res
        .status(401)
        .json({ error: "No account found with this email" });
    }

    if (user.isActive === false) {
      console.warn("Login Failed: Account inactive", { email });
      return res.status(403).json({
        error:
          "Your garage has been susupended. Please contact the Administrator.",
      });
    }

    // Check if user's garage is suspended (only for non-admin users)
    if (user.role !== "admin") {
      let garageSuspended = false;
      if (user.role === "owner") {
        if (user.garageId) {
          const primaryOwner = await Owner.findOne({
            garageId: user.garageId,
            isCoOwner: { $ne: true },
          });
          if (primaryOwner && primaryOwner.isActive === false) {
            garageSuspended = true;
          }
        }
      } else {
        const primaryOwnerId = user.ownerId;
        if (primaryOwnerId) {
          let primaryOwner = await Owner.findById(primaryOwnerId);
          if (!primaryOwner) {
            primaryOwner = await User.findById(primaryOwnerId);
          }
          if (primaryOwner && primaryOwner.isActive === false) {
            garageSuspended = true;
          }
        }
      }

      if (garageSuspended) {
        console.warn("Login Failed: Garage suspended", { email });
        const errMsg =
          user.role === "owner" &&
          "Access denied. Your garage has been suspended by the administrator. Please contact your garage owner.";
        return res.status(403).json({ error: errMsg });
      }
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
      })
        .sort({ createdAt: 1 })
        .select("_id");
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
    let effectiveOwnerId =
      userObj.role === "owner"
        ? userObj._id
        : userObj.role === "admin"
          ? effectiveOwnerIdForToken
          : user.ownerId || userObj.ownerId;

    if (userObj.role === "owner") {
      const primaryOwner = await Owner.findOne({
        garageId: userObj.garageId,
      }).sort({ createdAt: 1 });
      if (primaryOwner) {
        effectiveOwnerId = primaryOwner._id;
      }
    }

    if (effectiveOwnerId) {
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

    if (user.isActive === false) {
      return res.status(403).json({ error: "Account is inactive" });
    }

    const role = String(user.role || "").toLowerCase();

    // Check if user's garage is suspended
    if (role !== "admin") {
      let garageSuspended = false;
      if (role === "owner") {
        if (user.garageId) {
          const primaryOwner = await Owner.findOne({
            garageId: user.garageId,
            isCoOwner: { $ne: true },
          });
          if (primaryOwner && primaryOwner.isActive === false) {
            garageSuspended = true;
          }
        }
      } else {
        const primaryOwnerId = user.ownerId;
        if (primaryOwnerId) {
          let primaryOwner = await Owner.findById(primaryOwnerId);
          if (!primaryOwner) {
            primaryOwner = await User.findById(primaryOwnerId);
          }
          if (primaryOwner && primaryOwner.isActive === false) {
            garageSuspended = true;
          }
        }
      }

      if (garageSuspended) {
        const errMsg =
          role === "owner"
            ? "Access denied. Your garage has been suspended by the administrator."
            : "Access denied. Your garage has been suspended by the administrator. Please contact your garage owner.";
        return res.status(403).json({ error: errMsg });
      }
    }
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
    } else if (requestedRole === "owner") {
      let garageId;
      const primaryOwnerObj = await Owner.findById(ownerId);
      if (primaryOwnerObj) {
        garageId = primaryOwnerObj.garageId;
      }
      if (garageId) {
        staffQueries.push(Owner.find({ garageId }));
      } else {
        staffQueries.push(Owner.findById(ownerId));
      }
    } else {
      let garageId;
      const primaryOwnerObj = await Owner.findById(ownerId);
      if (primaryOwnerObj) {
        garageId = primaryOwnerObj.garageId;
      }

      staffQueries = [
        User.find({ ownerId }),
        Advisor.find({ ownerId }),
        Mechanic.find({ ownerId }),
      ];
      if (garageId) {
        staffQueries.push(Owner.find({ garageId }));
      } else {
        staffQueries.push(Owner.findById(ownerId));
      }
    }

    const staffResults = await Promise.all(staffQueries);
    const flattenedStaff = [];

    staffResults
      .flat()
      .filter(Boolean)
      .forEach((member) => {
        const obj = member.toObject ? member.toObject() : member;
        delete obj.password;
        flattenedStaff.push(obj);

        if (obj.role === "owner" && Array.isArray(obj.coOwners)) {
          obj.coOwners.forEach((co, idx) => {
            flattenedStaff.push({
              _id: `${obj._id}_co_${idx}`,
              name: co.name,
              email: co.email,
              mobileNumber: co.mobileNumber,
              role: "owner",
              isCoOwner: true,
              parentOwnerId: obj._id, // needed for admin toggle endpoint
              garageId: obj.garageId,
              garageName: obj.garageName,
              address: obj.address,
              verificationStatus: obj.verificationStatus,
              isActive: co.isActive !== undefined ? co.isActive : true, // co-owner's own status
              createdAt: co.createdAt || obj.createdAt,
            });
          });
        }
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

    if (staffId.includes("_co_")) {
      const [pOwnerId, idxStr] = staffId.split("_co_");
      const idx = parseInt(idxStr);
      const owner = await Owner.findById(pOwnerId);
      if (owner && Array.isArray(owner.coOwners) && owner.coOwners[idx]) {
        owner.coOwners.splice(idx, 1);
        await owner.save();
        return res.status(200).json({ message: "Co-owner removed" });
      }
    }

    const results = await Promise.all([
      User.findOneAndDelete({ _id: staffId, ownerId }),
      Advisor.findOneAndDelete({ _id: staffId, ownerId }),
      Mechanic.findOneAndDelete({ _id: staffId, ownerId }),
      Owner.findOneAndDelete({ _id: staffId, isCoOwner: true }), // allow removing co-owners
    ]);

    const removed = results.some((r) => r !== null);
    if (!removed) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // ✅ Get the actual removed member for a meaningful log
    const removedMember = results.find((r) => r !== null);
    const action = `Removed ${removedMember?.role || "staff"} "${removedMember?.name || staffId}"`;
    await logActivity(req, "delete", "Staff", action, staffId);

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

    if (staffId.includes("_co_")) {
      const [pOwnerId, idxStr] = staffId.split("_co_");
      const idx = parseInt(idxStr);
      const owner = await Owner.findById(pOwnerId);
      if (owner && Array.isArray(owner.coOwners) && owner.coOwners[idx]) {
        owner.coOwners[idx].name = name.trim();
        if (email?.trim()) owner.coOwners[idx].email = email.trim();
        if (mobileNumber?.trim())
          owner.coOwners[idx].mobileNumber = mobileNumber.trim();
        await owner.save();

        const obj = {
          _id: staffId,
          name: owner.coOwners[idx].name,
          email: owner.coOwners[idx].email,
          mobileNumber: owner.coOwners[idx].mobileNumber,
          role: "owner",
          isCoOwner: true,
        };
        return res.status(200).json(obj);
      }
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

    // ✅ Distinguish between toggle and edit
    const isToggle = req.body.hasOwnProperty("isActive");
    const description = isToggle
      ? `${req.body.isActive ? "Activated" : "Deactivated"} ${obj.role} "${obj.name}"`
      : `Updated ${obj.role} "${obj.name}"`;

    await logActivity(req, "update", "Staff", description, updated._id);

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

    let garageIdToUse;
    let finalGarageName = lead.garageName;
    let finalAddress = lead.city;
    let finalMobileNumber = lead.mobileNumber;
    let finalLogo = undefined;
    let createSettings = false;

    const garageId = lead.garageId;
    if (garageId) {
      // use existing garage
      // skip garage creation
      const existingOwnerForGarage = await Owner.findOne({
        garageId: garageId,
      });
      if (existingOwnerForGarage) {
        // Additional owner being added to same garage — copy garage details
        garageIdToUse = existingOwnerForGarage.garageId;
        finalGarageName = existingOwnerForGarage.garageName;
        finalAddress = existingOwnerForGarage.address;
        finalMobileNumber = existingOwnerForGarage.mobileNumber;
        finalLogo = existingOwnerForGarage.logo;
      } else {
        garageIdToUse = garageId;
      }
      createSettings = false;
    } else {
      // Generate a new garageId — this only runs for legacy leads
      let isUnique = false;
      while (!isUnique) {
        garageIdToUse = Math.floor(
          1000000000 + Math.random() * 9000000000,
        ).toString();
        const existing = await Owner.findOne({ garageId: garageIdToUse });
        if (!existing) isUnique = true;
      }
      createSettings = true;
    }

    let owner;
    if (lead.garageId) {
      const existingOwner = await Owner.findOne({ garageId: garageIdToUse });
      if (existingOwner) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        existingOwner.coOwners = existingOwner.coOwners || [];
        existingOwner.coOwners.push({
          name: lead.ownerName,
          email: lead.email,
          mobileNumber: lead.mobileNumber,
          password: hashedPassword,
        });
        await existingOwner.save();
        owner = existingOwner;
      } else {
        owner = await Owner.create({
          name: lead.ownerName,
          email: lead.email,
          password,
          role: "owner",
          garageId: garageIdToUse,
          garageName: finalGarageName,
          mobileNumber: finalMobileNumber,
          address: finalAddress,
          logo: finalLogo,
          isCoOwner: false,
          verificationStatus: "Verified",
        });
      }
    } else {
      owner = await Owner.create({
        name: lead.ownerName,
        email: lead.email,
        password,
        role: "owner",
        garageId: garageIdToUse,
        garageName: finalGarageName,
        mobileNumber: finalMobileNumber,
        address: finalAddress,
        logo: finalLogo,
        isCoOwner: false,
        verificationStatus: "Verified",
      });
    }

    if (createSettings) {
      // Create Default Settings ONLY for new garage
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
    }

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

// 📧 FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Search Owner first, then Advisor, then Mechanic
    let user = await Owner.findOne({ email: email.toLowerCase() });
    let model = "Owner";

    if (!user) {
      user = await Advisor.findOne({ email: email.toLowerCase() });
      model = "Advisor";
    }
    if (!user) {
      user = await Mechanic.findOne({ email: email.toLowerCase() });
      model = "Mechanic";
    }

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: "If this email exists, a reset link has been sent.",
      });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    // Save to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send email
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&role=${model.toLowerCase()}`;
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    res.status(200).json({
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
};

// 🔑 RESET PASSWORD
export const resetPassword = async (req, res) => {
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

    // Search for valid token across all models
    let user =
      (await Owner.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() },
      }).select("+password +resetToken +resetTokenExpiry"))
      // (await Advisor.findOne({
      //   resetToken: token,
      //   resetTokenExpiry: { $gt: new Date() },
      // }).select("+password +resetToken +resetTokenExpiry")) ||
      // (await Mechanic.findOne({
      //   resetToken: token,
      //   resetTokenExpiry: { $gt: new Date() },
      // }).select("+password +resetToken +resetTokenExpiry"));

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset link. Please request a new one.",
      });
    }

    // Update password and clear token
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save(); // pre-save hook will hash it

    res
      .status(200)
      .json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
};
