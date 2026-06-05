import React, { createContext, useState, useEffect, useMemo } from "react";

export const ThemeContext = createContext(undefined);

/**
 * Synchronously swaps .dark/.light on <html> WITHOUT disabling transitions.
 *
 * Because the class is applied in the same JS event tick (before any paint),
 * every element that has a CSS transition on background-color / color / border
 * starts its animation at exactly the same moment → perfectly synchronised,
 * smooth, lag-free theme change.
 */
function applyThemeDOM(theme) {
  const root = document.documentElement;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const isDarkNow =
    theme === "dark" || (theme === "system" && mediaQuery.matches);

  root.classList.remove("light", "dark");
  root.classList.add(isDarkNow ? "dark" : "light");
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("theme") || "system";
    }
    return "light";
  });

  /** Public setter – applies DOM class change immediately then triggers re-render. */
  const setTheme = (newTheme) => {
    if (newTheme !== "light" && newTheme !== "dark" && newTheme !== "system")
      return;

    sessionStorage.setItem("theme", newTheme);

    // Apply the class synchronously in the same event tick.
    // Every element with a CSS transition starts fading at the same instant.
    applyThemeDOM(newTheme);

    setThemeState(newTheme);
  };

  // On mount: sync DOM to stored theme. Also listen for OS-level changes
  // when the user has chosen "system".
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Initial sync on mount
    applyThemeDOM(theme);

    const handleSystemChange = () => {
      if (theme === "system") {
        applyThemeDOM("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  // Cross-tab sync (localStorage fires 'storage'; sessionStorage does not)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "theme" && e.newValue) {
        applyThemeDOM(e.newValue);
        setThemeState(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = useMemo(() => {
    const mediaMatches =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false;
    const isDark = theme === "dark" || (theme === "system" && mediaMatches);

    return {
      theme,
      setTheme,
      isDark,
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
