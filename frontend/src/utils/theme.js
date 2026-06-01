/**
 * Theme utility functions for determining system preference and active state.
 */

/**
 * Checks if the system/browser prefers dark mode.
 * @returns {boolean} True if the system/OS preference is dark mode.
 */
export function getSystemThemePreference() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Determines if the resolved theme is dark.
 * @param {string} theme - The theme setting ('light', 'dark', 'system').
 * @returns {boolean} True if the resolved active theme is dark.
 */
export function isDarkTheme(theme) {
  if (theme === "dark") return true;
  if (theme === "system") return getSystemThemePreference();
  return false;
}
