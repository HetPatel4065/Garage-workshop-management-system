import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ShieldCheck, Wrench } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, undefined);
    } catch (err) {
      setError(err.message || "Admin access denied. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  /* ── shared input classes ── */
  const inputCls =
    "w-full h-11 px-3.5 rounded-xl border border-orange-200 bg-orange-50/60 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white transition-all";

  const ADMIN_GREETING =
    "Accessing secure command center. Let's manage today's operations.";
  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          {/* Logo + Name — centered row */}
          <div
            className="group inline-flex items-center gap-3 mb-3 cursor-auto select-none"
            onClick={() => navigate("/")}
          >
            <div className="bg-orange-500 p-2.5 rounded-xl shadow-lg  transition-all duration-300  group-hover:scale-110">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              Garage<span className="text-orange-500">Pro</span>
            </span>
          </div>

          {/* Admin badge — its own centered line */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-[11px] font-black uppercase tracking-widest text-orange-600">
                Admin Portal
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {ADMIN_GREETING}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Authorised person only — enter your admin credentials
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
          {/* Orange accent bar */}
          <div className="h-1 w-full bg-linear-to-r from-orange-400 via-orange-500 to-amber-500" />

          <div className="p-6 sm:p-8">
            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100"
              >
                <svg
                  className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Admin Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Admin Email
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@garagepro.com"
                  className={inputCls}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon style={{ width: 18, height: 18 }} />
                    ) : (
                      <EyeIcon style={{ width: 18, height: 18 }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-400/30 transition-all mt-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Verifying access…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <Link
                to="/login"
                className="font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← All login options
              </Link>
              <Link
                to="/portal"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Customer Portal →
              </Link>
            </div>
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-[11px] text-slate-400 mt-4">
          All admin sessions are logged and audited.
        </p>
      </motion.div>
    </div>
  );
}
