import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Wrench, HardHat, UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FaUsers } from "react-icons/fa";
import {
  FormInput,
  FormError,
  FormButton,
} from "../components/layout/Form/forms";

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
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspendedMessage, setSuspendedMessage] = useState("");

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

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
      if (err.message && err.message.toLowerCase().includes("suspended")) {
        setSuspendedMessage(err.message);
        setShowSuspendedModal(true);
      } else {
        setError(
          err.message || "Login failed. Check your credentials and Garage ID.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotMessage("");
    setForgotLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForgotMessage(data.message);
    } catch (err) {
      setForgotError(err.message || "Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotEmail(email); // pre-fill with whatever they typed
    setForgotMessage("");
    setForgotError("");
    setShowForgotModal(true);
  };

  const handleCloseForgot = () => {
    setShowForgotModal(false);
    setForgotMessage("");
    setForgotError("");
    setForgotEmail("");
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
            <div className="bg-violet-500 p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110">
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

              {/* Password + Forgot link */}
              <div>
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
                {/* Forgot Password link */}
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={handleOpenForgot}
                    className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

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

              {/* ———— Submit ———— */}
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

      {/* ── Forgot Password Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl border border-violet-100 max-w-md w-full overflow-hidden"
            >
              {/* Accent bar */}
              <div className="h-1.5 w-full bg-violet-500" />

              <div className="p-6">
                {forgotMessage ? (
                  /* ── Success state ── */
                  <div className="text-center py-2">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-violet-50 mb-4">
                      <span className="text-4xl">✉️</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      Check Your Inbox
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                      {forgotMessage}
                    </p>
                    <button
                      type="button"
                      onClick={handleCloseForgot}
                      className="w-full py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  /* ── Form state ── */
                  <>
                    <div className="mb-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        Forgot Password?
                      </h3>
                      <p className="text-sm text-slate-500">
                        Enter your work email and we'll send you a secure reset
                        link valid for 30 minutes.
                      </p>
                    </div>

                    {/* Error */}
                    {forgotError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl"
                      >
                        <p className="text-sm text-red-600 font-medium">
                          {forgotError}
                        </p>
                      </motion.div>
                    )}

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                          Work Email
                        </label>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="you@yourgarage.com"
                          className="w-full h-11 px-4 rounded-xl border border-violet-200 bg-violet-50/60 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 focus:bg-white text-sm transition-all"
                        />
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleCloseForgot}
                          className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="flex-1 py-2.5 bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          {forgotLoading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending…
                            </>
                          ) : (
                            "Send Reset Link"
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛡️ Suspension Modal Popup */}
      <AnimatePresence>
        {showSuspendedModal && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl border border-red-100 max-w-md w-full overflow-hidden"
            >
              {/* Top Accent bar */}
              <div className="h-1.5 w-full bg-red-500" />

              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-4">
                  <span className="text-red-500 text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Garage Suspended
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {suspendedMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setShowSuspendedModal(false)}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
