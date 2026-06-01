import React from "react";
import { AnimatePresence } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import ToastNotification from "./ToastNotification";
import { motion } from "framer-motion";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-9999 flex flex-col items-end pointer-events-none">
      <div className="relative w-80 flex flex-col items-end">
        <AnimatePresence mode="popLayout">
          {toasts
            .slice(-3)
            .reverse()
            .map((toast, index) => (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{
                  opacity: 1 - index * 0.15,
                  x: 0,
                  scale: 1 - index * 0.04,
                  y: index * 10,
                  zIndex: 100 - index,
                }}
                exit={{ opacity: 0, x: 20, scale: 0.9, filter: "blur(4px)" }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8,
                }}
                className="absolute top-0 right-0 w-full pointer-events-auto"
                style={{
                  originY: 0,
                  originX: "right",
                }}
              >
                <ToastNotification
                  id={toast.id}
                  message={toast.message}
                  type={toast.type}
                  duration={toast.duration}
                  onClose={removeToast}
                  onConfirm={toast.onConfirm}
                  onCancel={toast.onCancel}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
