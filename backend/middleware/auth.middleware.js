import jwt from "jsonwebtoken";
// NOTE: requireRole is a lighter alternative to authorize() when you only need
// to check the user's role (not granular permissions).
import User from "../models/User.js";
import Owner from "../models/Owner.js";
import Advisor from "../models/Advisor.js";
import Mechanic from "../models/Mechanic.js";
import Customer from "../models/Customer.js";

// 🔐 AUTH MIDDLEWARE (verify token)
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token || token === "null" || token === "undefined") {
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Search across all staff collections with explicit role tracking
    let user = await User.findById(decoded.id).select("-password");
    let detectedRole = user?.role || null;

    if (!user) {
      user = await Owner.findById(decoded.id).select("-password");
      if (user) detectedRole = "owner";
    }
    if (!user) {
      user = await Advisor.findById(decoded.id).select("-password");
      if (user) detectedRole = "advisor";
    }
    if (!user) {
      user = await Mechanic.findById(decoded.id).select("-password");
      if (user) detectedRole = "mechanic";
    }
    if (!user) {
      user = await Customer.findById(decoded.id).select("-password");
      if (user) detectedRole = "customer";
    }

    if (!user) {
      return res
        .status(401)
        .json({ message: "Account no longer exists in system" });
    }

    // 🔐 ROLE-BASED PERMISSIONS MAP
    const ROLE_PERMISSIONS = {
      admin: ["all"],
      owner: ["all"],
      advisor: [
        "view_jobcard",
        "inspect_vehicle",
        "create_service",
        "edit_service",
        "delete_service",
        "verify_service",
        "change_status",
        "change_priority",
        "view_services",
        "view_customers",
        "view_inventory",
        "view_staff",
        "manage_inventory",
      ],
      mechanic: [
        "create_service",
        "edit_service",
        "view_services",
        "view_customers",
        "view_inventory",
        "view_staff", // Needed for fetching mechanic/advisor dropdowns
        "update_service_status", // Mechanic restricted via controller to only their own items
      ],
      customer: ["view_own_data"],
    };

    const userObj = user.toObject();
    const userId = user._id;

    // 🛡️ ROLE RECOVERY (Ensure role and permissions exist)
    const role = detectedRole || userObj.role || "owner";
    userObj.role = role.toLowerCase();

    // Get default permissions for the role
    const defaultPermissions = ROLE_PERMISSIONS[userObj.role] || [];

    // Resolve final permissions: use DB permissions if present,
    // but ensure base staff permissions like 'view_staff' are always included for staff roles.
    let resolvedPermissions =
      Array.isArray(userObj.permissions) && userObj.permissions.length > 0
        ? userObj.permissions
        : defaultPermissions;

    // Special Case: Ensure staff members can always view other staff (needed for dropdowns)
    if (
      ["advisor", "mechanic"].includes(userObj.role) &&
      !resolvedPermissions.includes("view_staff")
    ) {
      resolvedPermissions = [...resolvedPermissions, "view_staff"];
    }

    userObj.permissions = resolvedPermissions;

    let effectiveOwnerId = userId;
    if (userObj.role === "owner") {
      const primaryOwner = await Owner.findOne({
        garageId: user.garageId,
      }).sort({ createdAt: 1 });
      if (primaryOwner) {
        effectiveOwnerId = primaryOwner._id;
        userObj.isCoOwner = primaryOwner._id.toString() !== userId.toString();
      }
    } else {
      effectiveOwnerId = user.ownerId || userObj.ownerId;
    }

    // Admin can carry an explicit garage context in the token or via request header
    if (userObj.role === "admin") {
      const headerOwnerId = req.header("x-effective-owner-id");
      if (
        headerOwnerId &&
        headerOwnerId !== "null" &&
        headerOwnerId !== "undefined"
      ) {
        effectiveOwnerId = headerOwnerId;
      } else if (decoded.effectiveOwnerId) {
        effectiveOwnerId = decoded.effectiveOwnerId;
      }
    }

    if (
      !effectiveOwnerId &&
      userObj.role !== "owner" &&
      userObj.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Staff account is not correctly linked to a garage" });
    }

    userObj.effectiveOwnerId = effectiveOwnerId;

    // 🏎️ ATTACH GARAGE METADATA (For staff members who don't have it on their own profile)
    if (userObj.role !== "owner" && userObj.effectiveOwnerId) {
      let ownerDetails = await User.findById(userObj.effectiveOwnerId).select(
        "garageName address logo mobileNumber",
      );
      if (!ownerDetails) {
        ownerDetails = await Owner.findById(userObj.effectiveOwnerId).select(
          "garageName address logo mobileNumber",
        );
      }

      if (ownerDetails) {
        userObj.garageName = ownerDetails.garageName;
        userObj.address = ownerDetails.address;
        userObj.logo = ownerDetails.logo;
        userObj.mobileNumber = ownerDetails.mobileNumber;
      }
    }

    req.user = userObj;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// 🛡️ AUTHORIZE MIDDLEWARE (check permissions)
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user || !user.permissions) {
        return res.status(403).json({ error: "Access denied" });
      }

      // 'all' permission (Owner) overrides everything
      if (user.permissions.includes("all")) {
        return next();
      }

      if (!user.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          error: "You do not have permission for this action",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization failed" });
    }
  };
};

// 🔑 REQUIRE ROLE MIDDLEWARE
// Usage: router.get('/admin-only', auth, requireRole('admin'), handler)
// Usage: router.get('/owner-or-admin', auth, requireRole('admin', 'owner'), handler)
const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userRole = user.role?.toLowerCase();
      const allowed = roles.map((r) => r.toLowerCase());
      if (!allowed.includes(userRole)) {
        return res.status(403).json({
          error: "Access denied: insufficient role",
          required: allowed,
          current: userRole,
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Role check failed" });
    }
  };
};

// Optional auth — attaches req.user when a valid token is present; never blocks
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token || token === "null" || token === "undefined") {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await User.findById(decoded.id).select("-password");
    let detectedRole = user?.role || null;

    if (!user) {
      user = await Owner.findById(decoded.id).select("-password");
      if (user) detectedRole = "owner";
    }
    if (!user) {
      user = await Advisor.findById(decoded.id).select("-password");
      if (user) detectedRole = "advisor";
    }
    if (!user) {
      user = await Mechanic.findById(decoded.id).select("-password");
      if (user) detectedRole = "mechanic";
    }
    if (!user) {
      user = await Customer.findById(decoded.id).select("-password");
      if (user) detectedRole = "customer";
    }

    if (!user) {
      return next();
    }

    const userObj = user.toObject();
    const userId = user._id;
    const role = detectedRole || userObj.role || "owner";
    userObj.role = role.toLowerCase();

    let effectiveOwnerId = userId;
    if (userObj.role === "owner") {
      const primaryOwner = await Owner.findOne({
        garageId: userObj.garageId,
      }).sort({ createdAt: 1 });
      if (primaryOwner) {
        effectiveOwnerId = primaryOwner._id;
        userObj.isCoOwner = primaryOwner._id.toString() !== userId.toString();
      }
    } else {
      effectiveOwnerId = user.ownerId || userObj.ownerId;
    }

    if (userObj.role === "admin") {
      const headerOwnerId = req.header("x-effective-owner-id");
      if (
        headerOwnerId &&
        headerOwnerId !== "null" &&
        headerOwnerId !== "undefined"
      ) {
        effectiveOwnerId = headerOwnerId;
      } else if (decoded.effectiveOwnerId) {
        effectiveOwnerId = decoded.effectiveOwnerId;
      }
    }

    userObj.effectiveOwnerId = effectiveOwnerId;
    req.user = userObj;
    next();
  } catch {
    next();
  }
};

export { auth, authorize, requireRole, optionalAuth };
