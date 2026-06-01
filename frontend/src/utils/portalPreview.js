export const PORTAL_PREVIEW_CUSTOMER_KEY = "portal_preview_customer_id";

export const getStoredPreviewCustomerId = () =>
  sessionStorage.getItem(PORTAL_PREVIEW_CUSTOMER_KEY) || "";

export const setStoredPreviewCustomerId = (id) => {
  if (id) {
    sessionStorage.setItem(PORTAL_PREVIEW_CUSTOMER_KEY, id);
  } else {
    sessionStorage.removeItem(PORTAL_PREVIEW_CUSTOMER_KEY);
  }
};

export const buildPortalAuthHeaders = (token, previewCustomerId) => {
  const headers = { Authorization: `Bearer ${token}` };
  if (previewCustomerId) {
    headers["x-portal-preview-customer-id"] = previewCustomerId;
  }
  return headers;
};
