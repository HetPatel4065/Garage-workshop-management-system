import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ShieldCheck, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { FormInput, FormError, FormButton } from "../components/layout/Form/forms";

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
                className="mb-5"
              >
                <FormError message={error} isBanner />
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Admin Email */}
              <FormInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@garagepro.com"
                label="Admin Email"
                inputClassName="border-orange-200 bg-orange-50/60 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white"
              />

              {/* Password */}
              <FormInput
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                label="Password"
                inputClassName="border-orange-200 bg-orange-50/60 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white pr-11"
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon style={{ width: 18, height: 18 }} />
                    ) : (
                      <EyeIcon style={{ width: 18, height: 18 }} />
                    )}
                  </button>
                }
              />

              {/* Submit */}
              <FormButton
                type="submit"
                loading={loading}
                loadingText="Verifying access…"
                variant="primary"
                icon={<ShieldCheck className="w-4 h-4" />}
                className="mt-2"
              >
                Admin Sign In
              </FormButton>
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
