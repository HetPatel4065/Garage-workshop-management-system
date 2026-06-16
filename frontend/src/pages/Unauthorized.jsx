import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDashboardRoute, ROLE_LABELS } from "../utils/roles";

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const from = location.state?.from ?? "/dashboard";
  const requiredRoles = location.state?.requiredRoles ?? [];
  const userRole = user?.role?.toLowerCase();
  const dashRoute = getDashboardRoute(userRole);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ rotate: -15, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6"
        >
          <ShieldOff className="w-9 h-9 text-red-400" />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-red-400">
              403 — Access Denied
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            You don't have permission
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            The page{" "}
            <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">
              {from}
            </code>{" "}
            requires{" "}
            {requiredRoles.length > 0
              ? requiredRoles.map((r) => ROLE_LABELS[r] ?? r).join(" or ")
              : "elevated"}{" "}
            access. Your current role is{" "}
            <span className="text-blue-400 font-semibold">
              {ROLE_LABELS[userRole] ?? userRole ?? "Unknown"}
            </span>
            .
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <button
            onClick={() => navigate(dashRoute, { replace: true })}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
          >
            <Home className="w-4 h-4" />
            My Dashboard
          </button>
        </motion.div>

        {/* Switch account */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-xs text-gray-600"
        >
          Wrong account?{" "}
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            Sign out and switch
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
