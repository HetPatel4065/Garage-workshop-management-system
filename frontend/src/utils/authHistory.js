/** Public routes that should not appear in history while authenticated */
export const PUBLIC_AUTH_PATHS = new Set([
  "/",
  "/login",
  "/owner/login",
  "/staff/login",
  "/admin/login",
  "/customer/login",
  "/portal/login",
  "/portal",
  "/signup",
  "/owner/signup",
  "/owner/register",
  "/staff/signup",
]);

export const HISTORY_SEEDED_KEY = "app_history_seeded";

export function isPublicAuthPath(pathname) {
  return PUBLIC_AUTH_PATHS.has(pathname);
}

/**
 * Collapse the current history entry and add a buffer so the first Back
 * press stays on the dashboard instead of leaving the app or login pages.
 */
export function seedSessionHistory(pathname) {
  if (typeof window === "undefined") return;
  window.history.replaceState({ appSession: true }, "", pathname);
  window.history.pushState({ appSession: true }, "", pathname);
  sessionStorage.setItem(HISTORY_SEEDED_KEY, pathname);
}

export function clearSessionHistoryFlag() {
  sessionStorage.removeItem(HISTORY_SEEDED_KEY);
}
