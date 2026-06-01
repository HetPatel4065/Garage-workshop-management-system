import React, { createContext, useState, useEffect, useMemo } from "react";

export const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== "undefined") {
      // FIX: Default to "light" instead of "system" for first-time visitors
      return sessionStorage.getItem("theme") || "system";
    }
    return "light";
  });

  const setTheme = (newTheme) => {
    if (newTheme !== "light" && newTheme !== "dark" && newTheme !== "system")
      return;
    setThemeState(newTheme);
    sessionStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateThemeDOM = () => {
      root.classList.remove("light", "dark");

      const isDarkNow =
        theme === "dark" || (theme === "system" && mediaQuery.matches);

      if (isDarkNow) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    };

    updateThemeDOM();

    if (theme === "system") {
      mediaQuery.addEventListener("change", updateThemeDOM);
    }

    return () => {
      mediaQuery.removeEventListener("change", updateThemeDOM);
    };
  }, [theme]);

  // NOTE: The 'storage' event listener only triggers for localStorage,
  // sessionStorage does not sync across tabs by default.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "theme" && e.newValue) {
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
