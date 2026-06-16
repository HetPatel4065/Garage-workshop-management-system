import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const HEADER_STYLES = {
  danger: "bg-rose-600",
  error: "bg-rose-600",
  delete: "bg-rose-600",
  warning: "bg-amber-500",
  reset: "bg-amber-500",
  info: "bg-slate-800",
  success: "bg-slate-800",
  status: "bg-slate-800",
};

const BUTTON_STYLES = {
  danger: "bg-rose-600 hover:bg-rose-700",
  error: "bg-rose-600 hover:bg-rose-700",
  delete: "bg-rose-600 hover:bg-rose-700",
  warning: "bg-amber-500 hover:bg-amber-600",
  reset: "bg-amber-500 hover:bg-amber-600",
  info: "bg-slate-800 hover:bg-slate-900",
  success: "bg-slate-800 hover:bg-slate-900",
  status: "bg-slate-800 hover:bg-slate-900",
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm & Execute",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
  children,
  requireInput = false,
  expectedInput = "",
}) {
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    if (!isOpen) setUserInput("");
  }, [isOpen]);

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

  const headerClass = HEADER_STYLES[type] || HEADER_STYLES.danger;
  const buttonClass = BUTTON_STYLES[type] || BUTTON_STYLES.danger;
  const inputMismatch =
    requireInput && userInput.trim() !== expectedInput.trim();

  const handleConfirm = () => {
    if (inputMismatch) return;
    onConfirm?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div
              className={`p-5 text-white flex items-center gap-3 ${headerClass}`}
            >
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-md font-black tracking-tight uppercase">
                {title}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {message}
              </p>

              {children}

              {requireInput && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                    To confirm, type{" "}
                    <span className="text-rose-600 font-mono font-bold">
                      &quot;{expectedInput}&quot;
                    </span>{" "}
                    below:
                  </label>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={`Type ${expectedInput}`}
                    className="w-full h-10 px-3 bg-white rounded-xl border border-slate-200 text-sm font-bold tracking-wide text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-auto disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  disabled={isLoading || inputMismatch}
                  onClick={handleConfirm}
                  className={`flex-1 h-11 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-auto disabled:opacity-40 disabled:cursor-not-allowed ${buttonClass}`}
                >
                  {isLoading ? "Processing..." : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
