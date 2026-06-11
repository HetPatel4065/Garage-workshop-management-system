import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  X,
  HelpCircle,
  Trash2,
  Info,
} from "lucide-react";

const toastVariants = {
  initial: {
    opacity: 0,
    y: -24,
    scale: 0.9,
    filter: "blur(4px)",
  },

  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 450,
      damping: 35,
      mass: 0.5,
    },
  },

  exit: {
    opacity: 0,
    scale: 0.85,
    y: -25, // Slide upward to disappear
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

const TYPE_CONFIG = {
  success: {
    color: "text-emerald-600",
    bar: "bg-emerald-500",
    bg: "bg-emerald-200 dark:bg-emerald-950/50",
    icon: <CheckCircle size={18} strokeWidth={2.5} />,
  },
  error: {
    color: "text-rose-600",
    bar: "bg-rose-500",
    bg: "bg-rose-200 dark:bg-rose-950/50",
    icon: <AlertCircle size={18} strokeWidth={2.5} />,
  },
  delete: {
    color: "text-rose-600",
    bar: "bg-rose-600",
    bg: "bg-rose-200 dark:bg-rose-950/50",
    icon: <Trash2 size={18} strokeWidth={2.5} />,
  },
  confirm: {
    color: "text-indigo-600",
    bar: "bg-indigo-600",
    bg: "bg-indigo-200 dark:bg-indigo-950/50",
    icon: <HelpCircle size={18} strokeWidth={2.5} />,
  },
  info: {
    color: "text-blue-600",
    bar: "bg-blue-500",
    bg: "bg-blue-200 dark:bg-blue-950/90",
    icon: <Info size={18} strokeWidth={2.5} />,
  },
};

export default function ToastNotification({
  id,
  message,
  type = "success",
  duration = 4000,
  onClose,
  onConfirm,
  onCancel,
}) {
  const isConfirm = type === "confirm";
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.success;

  useEffect(() => {
    if (!isConfirm && duration !== Infinity) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, isConfirm, onClose]);

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout="position"
      style={{ willChange: "transform, opacity" }}
      className="pointer-events-auto w-full sm:w-96 antialiased"
    >
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/90 shadow-xl shadow-black/5 backdrop-blur-">
        <div className={`absolute inset-0 opacity-40 ${config.bg}`} />
        <div className="relative flex items-center gap-3.5 p-4">
          <div className={`w-1 h-7 shrink-0 rounded-full ${config.bar}`} />
          <div className={`shrink-0 ${config.color}`}>{config.icon}</div>
          <div className="flex-1 text-[14px] font-semibold text-slate-800 leading-tight">
            {message}
          </div>
          {!isConfirm && (
            <button
              onClick={() => onClose(id)}
              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors active:scale-90"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        {isConfirm && (
          <div className="relative flex gap-2 justify-end px-4 pb-4 -mt-1">
            <button
              onClick={() => onCancel?.(id)}
              className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm?.(id)}
              className={`px-5 py-1.5 text-xs font-bold text-white rounded-full shadow-md active:scale-95 transition-all ${config.bar} hover:brightness-110`}
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
