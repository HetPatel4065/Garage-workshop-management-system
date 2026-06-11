export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  ADVISOR: "advisor",
  MECHANIC: "mechanic",
  CUSTOMER: "customer",
};

/** Roles that access the main garage management dashboard */
export const GARAGE_ROLES = [
  ROLES.ADMIN,
  ROLES.OWNER,
  ROLES.ADVISOR,
  ROLES.MECHANIC,
];

/** Staff roles that require a Garage ID on login */
export const STAFF_ROLES = [ROLES.ADVISOR, ROLES.MECHANIC];

// ─────────────────────────────────────────────
// DISPLAY META
// ─────────────────────────────────────────────
export const ROLE_LABELS = {
  admin: "Administrator",
  owner: "Garage Owner",
  advisor: "Service Advisor",
  mechanic: "Mechanic",
  customer: "Customer",
};

export const ROLE_DESCRIPTIONS = {
  admin: "Full system access across all garages",
  owner: "Manage your garage, staff and reports",
  advisor: "Handle job cards, services and customers",
  mechanic: "View and update your assigned services",
  customer: "Track your vehicle service history",
};

// ─────────────────────────────────────────────
// ROUTING HELPERS
// ─────────────────────────────────────────────

/** Returns the dedicated login route for a given role */
export const getLoginRoute = (role) => {
  switch (role?.toLowerCase()) {
    case ROLES.ADMIN:
      return "/admin/login";
    case ROLES.OWNER:
      return "/owner/login";
    case ROLES.ADVISOR:
    case ROLES.MECHANIC:
      return "/staff/login";
    case ROLES.CUSTOMER:
      return "/portal/login";
    default:
      return "/login";
  }
};

/** Returns the post-login dashboard route for a given role */
export const getDashboardRoute = (role) => {
  if (role?.toLowerCase() === ROLES.CUSTOMER) return "/portal/dashboard";
  return "/dashboard";
};

// ─────────────────────────────────────────────
// FRONTEND PERMISSION HELPERS
// ─────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  admin: ["all"],
  owner: ["all"],
  advisor: [
    "view_customers",
    "view_vehicles",
    "view_services",
    "view_jobcard",
    "view_inventory",
    "view_staff",
    "create_service",
    "edit_service",
    "delete_service",
    "verify_service",
    "change_status",
    "change_priority",
    "inspect_vehicle",
    "manage_inventory",
  ],
  mechanic: [
    "view_services",
    "view_customers",
    "view_vehicles",
    "view_inventory",
    "view_staff",
    "create_service",
    "edit_service",
    "update_service_status",
    "view_jobcard",
  ],
  customer: ["view_own_data"],
};

export const hasPermission = (user, permission) => {
  if (!user?.permissions) return false;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes("all") || perms.includes(permission);
};

/** True if the role has access to the garage management UI */
export const isGarageRole = (role) =>
  GARAGE_ROLES.includes(role?.toLowerCase());

/** True if the role is a staff member (advisor or mechanic) */
export const isStaffRole = (role) => STAFF_ROLES.includes(role?.toLowerCase());

// ─────────────────────────────────────────────
// ROUTE ACCESS MAP (which routes each role may visit)
// ─────────────────────────────────────────────
export const ROLE_ALLOWED_ROUTES = {
  admin: [
    "/dashboard",
    "/customers",
    "/vehicles",
    "/job-cards",
    "/services",
    "/inventory",
    "/billing",
    "/staff-members",
    "/requested-customers",
    "/partnership-leads",
    "/reminders",
    "/settings",
    "/notifications",
    "/search",
    "/profile",
    "/help",
    "/sell-vehicles",
  ],
  owner: [
    "/dashboard",
    "/customers",
    "/vehicles",
    "/job-cards",
    "/services",
    "/inventory",
    "/billing",
    "/staff-members",
    "/requested-customers",
    "/reminders",
    "/settings",
    "/notifications",
    "/search",
    "/profile",
    "/help",
    "/sell-vehicles",
  ],
  advisor: [
    "/dashboard",
    "/customers",
    "/vehicles",
    "/job-cards",
    "/services",
    "/inventory",
    "/notifications",
    "/search",
    "/profile",
    "/settings",
    "/help",
  ],
  mechanic: [
    "/dashboard",
    "/services",
    "/job-cards",
    "/vehicles",
    "/customers",
    "/inventory",
    "/notifications",
    "/search",
    "/profile",
    "/help",
  ],
  customer: ["/portal/dashboard"],
};

/** Check if a role may visit a given route path */
export const canRoleAccessRoute = (role, pathname) => {
  const normalised = role?.toLowerCase();
  const allowed = ROLE_ALLOWED_ROUTES[normalised] ?? [];
  return allowed.some((r) =>
    r === "/dashboard" ? pathname === r : pathname.startsWith(r),
  );
};

/** Check if a role is allowed to access the Customer Portal */
export const canAccessCustomerPortal = (role) => {
  const r = role?.toLowerCase();
  return r === ROLES.CUSTOMER || r === ROLES.ADMIN || r === ROLES.OWNER;
};
