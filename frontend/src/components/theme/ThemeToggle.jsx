import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle({ variant = "compact" }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getIcon = () => {
    const sizeClasses = variant === "full" ? "w-7 h-7" : "w-5 h-5";
    switch (theme) {
      case "light":
        return <Sun className={sizeClasses} />;
      case "dark":
        return <Moon className={sizeClasses} />;
      case "system":
        return <Monitor className={sizeClasses} />;
      default:
        return <Monitor className={sizeClasses} />;
    }
  };

  return (
    <motion.button
      id="theme-toggle-button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Current Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
      className={`relative group rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all duration-300 ${variant === "full" ? "p-4" : "p-3"}`}
    >
      <div className="absolute inset-0 rounded-full bg-linear-to-tr from-zinc-100 to-white dark:from-zinc-800 dark:to-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div
        className={`relative z-10 flex items-center justify-center ${variant === "full" ? "w-6 h-6" : "w-4 h-4"}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {getIcon()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
