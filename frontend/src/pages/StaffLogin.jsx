import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Wrench, HardHat, UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FaUsers } from "react-icons/fa";
import { FormInput, FormError, FormButton } from "../components/layout/Form/forms";

const GREETINGS = [
  "Ready to start your shift?",
  "Let's get those gears turning",
  "Your workbench is waiting",
  "Time to clock in",
  "Another productive day begins",
  "Tools ready, let's go",
  "Your job cards await",
];

const ROLE_OPTIONS = [
  {
    value: "advisor",
    label: "Service Advisor",
    icon: UserCog,
    color: "text-violet-600",
  },
  {
    value: "mechanic",
    label: "Mechanic",
    icon: HardHat,
    color: "text-violet-600",
  },
];

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [garageId, setGarageId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const greeting = useMemo(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    [],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!garageId || garageId.length !== 10) {
      setError("Please enter your 10-digit Garage ID.");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, garageId);
    } catch (err) {
      setError(
        err.message || "Login failed. Check your credentials and Garage ID.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        {/* ── Brand Header ─────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div
            className="group inline-flex items-center gap-3 mb-3 cursor-auto select-none"
            onClick={() => navigate("/")}
          >
            <div className="bg-violet-500 p-2.5 rounded-xl transition-all duration-300  group-hover:scale-110">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              Garage<span className="text-violet-500">Pro</span>
            </span>
          </div>

          {/* Role badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200">
              <HardHat className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-600">
                Staff Portal
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Advisors &amp; mechanics — enter your Garage ID to continue
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
          <div className="h-1 w-full bg-linear-to-r from-violet-400 via-violet-500 to-purple-500" />

          <div className="p-6 sm:p-8">
            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="mb-5"
                >
                  <FormError message={error} isBanner />
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <FormInput
                id="staff-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourgarage.com"
                label="Work Email"
                inputClassName="border-violet-200 bg-violet-50/60 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white"
              />

              {/* Garage ID — required for all staff */}
              <div>
                <FormInput
                  id="staff-garage-id"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={garageId}
                  onChange={(e) =>
                    setGarageId(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="1234567890"
                  label="Garage ID"
                  hint="10-digit"
                  inputClassName="border-violet-200 bg-violet-50/60 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white font-mono tracking-widest"
                />
                <p className="mt-1.5 text-[11px] text-slate-400 ml-0.5">
                  Ask your garage owner for this 10-digit ID.
                </p>
              </div>

              {/* Password */}
              <FormInput
                id="staff-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                label="Password"
                inputClassName="border-violet-200 bg-violet-50/60 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white pr-11"
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeSlashIcon style={{ width: 18, height: 18 }} />
                    ) : (
                      <EyeIcon style={{ width: 18, height: 18 }} />
                    )}
                  </button>
                }
              />

              {/* Staff role hint */}
              <div className="flex gap-2 pt-1">
                {ROLE_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                  <div
                    key={value}
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100 text-xs text-slate-500"
                  >
                    <Icon size={14} className={color} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <FormButton
                id="staff-login-btn"
                type="submit"
                loading={isLoading}
                loadingText="Clocking in…"
                variant="violet"
                icon={<FaUsers className="w-4 h-4" />}
                className="mt-2"
              >
                Staff Sign In
              </FormButton>
            </form>

            {/* Footer */}
            <div className="mt-5 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <Link
                to="/login"
                className="font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
              >
                All Login Options
              </Link>

              <Link
                to="/staff/signup"
                className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
              >
                New Signup
              </Link>
            </div>
          </div>
        </div>

        {/* Quick-switch */}
        <div className="mt-4 flex items-center justify-center gap-5 text-xs text-slate-400">
          <Link
            to="/admin/login"
            className="hover:text-orange-500 transition-colors"
          >
            Admin
          </Link>
          <span>·</span>
          <Link
            to="/portal/login"
            className="hover:text-blue-500 transition-colors"
          >
            Customer Portal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
