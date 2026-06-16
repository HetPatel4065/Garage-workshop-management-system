const PORTAL_PREVIEW_CUSTOMER_HEADER = "x-portal-preview-customer-id";

export const resolvePortalCustomerId = (req) => {
  const role = req.user?.role?.toLowerCase();
  if (role === "customer") {
    return req.user._id || req.user.id;
  }
  if (["admin", "owner", "advisor", "mechanic"].includes(role)) {
    const previewId = req.header(PORTAL_PREVIEW_CUSTOMER_HEADER);
    if (previewId && previewId !== "null" && previewId !== "undefined") {
      return previewId;
    }
  }
  return null;
};

export const requirePortalCustomerId = (req, res) => {
  const customerId = resolvePortalCustomerId(req);
  if (!customerId) {
    res.status(403).json({
      success: false,
      error: "Customer portal access required",
    });
    return null;
  }
  return customerId;
};
