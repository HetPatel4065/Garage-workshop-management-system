import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
};

const HEADER_GRADIENTS = {
  blue: "bg-gradient-to-r from-blue-500 to-indigo-600",
  slate: "bg-slate-800 dark:bg-slate-900", // Dark mode addition for header
  danger: "bg-rose-600 dark:bg-rose-700",
  warning: "bg-amber-500 dark:bg-amber-600",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "lg",
  headerTone = "default",
  headerColor = "blue",
  icon,
  footer,
  closeOnBackdrop = true,
  showCloseButton = true,
  isError = false,
}) {
  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sizeClass = SIZES[size] || SIZES.lg;
  const coloredHeader = headerTone === "colored";

  const headerClass = coloredHeader
    ? `${HEADER_GRADIENTS[headerColor] || HEADER_GRADIENTS.blue} px-4 sm:px-6 md:px-8 py-4 sm:py-5 text-white`
    : isError
      ? "px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b shrink-0 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30"
      : "px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b shrink-0 border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              if (closeOnBackdrop) onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
            aria-hidden="true"
          />

          {/* Modal Container Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full ${sizeClass} overflow-hidden flex flex-col max-h-[92vh] mx-auto`}
          >
            {/* Header Layout Component */}
            {(title || icon) && (
              <div
                className={`flex justify-between items-start gap-4 shrink-0 ${headerClass}`}
              >
                <div className="min-w-0 flex-1">
                  {icon && (
                    <div
                      className={
                        coloredHeader ? "flex items-center gap-2" : "mb-2"
                      }
                    >
                      {coloredHeader ? (
                        <>
                          <span className="shrink-0">{icon}</span>
                          <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                            {title}
                          </h2>
                        </>
                      ) : (
                        icon
                      )}
                    </div>
                  )}

                  {!coloredHeader && title && (
                    <h2
                      className={`text-base sm:text-lg md:text-xl tracking-normal font-black ${isError ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}
                    >
                      {title}
                    </h2>
                  )}

                  {coloredHeader && !icon && title && (
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                      {title}
                    </h2>
                  )}

                  {subtitle && (
                    <p
                      className={
                        coloredHeader
                          ? "text-xs text-blue-100/80 mt-1"
                          : "text-xs text-slate-500 dark:text-slate-400 mt-1"
                      }
                    >
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Fixed and Unified Close Action Button with Night Mode Support */}
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full font-bold text-xs shrink-0 transition-all duration-200 ease-in-out active:scale-90 cursor-auto ${
                      coloredHeader
                        ? "bg-white/10 text-white hover:bg-white/20 hover:scale-105 dark:bg-white/5 dark:hover:bg-white/15"
                        : isError
                          ? "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-500 dark:hover:text-white hover:shadow-sm"
                    }`}
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Main Content Frame */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 w-full text-slate-700 dark:text-slate-300">
              {children}
            </div>

            {/* Modal Footer Area */}
            {footer && (
              <div className="shrink-0 border-t border-slate-100 dark:border-slate-800/80 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
