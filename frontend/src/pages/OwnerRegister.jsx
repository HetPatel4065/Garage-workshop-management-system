import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Wrench,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Store,
} from "lucide-react";

export default function OwnerRegister() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch lead details by token on load
  useEffect(() => {
    const fetchLeadDetails = async () => {
      if (!token) {
        setError("Invalid registration request. A secure token is required.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/onboarding-details?token=${token}`
        );
        if (response.data.success) {
          setLead(response.data.lead);
        } else {
          setError("Failed to retrieve onboarding details. The link may have expired.");
        }
      } catch (err) {
        console.error("Fetch lead error:", err);
        setError(
          err.response?.data?.error ||
            "Invalid or expired onboarding registration token. Please request partnership again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeadDetails();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/complete-onboarding`,
        {
          token,
          password,
        }
      );

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Complete onboarding error:", err);
      setError(
        err.response?.data?.error || "Failed to complete registration. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" />
            <Wrench className="absolute inset-0 m-auto w-8 h-8 text-emerald-400 animate-bounce" />
          </div>
          <p className="text-emerald-400 font-medium tracking-wide">
            Loading secure onboarding setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-emerald-500/30 relative overflow-hidden">
      {/* Dynamic abstract grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-140 h-140 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-140 h-140 rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-zinc-900/60 backdrop-blur-2xl rounded-[2.5rem] border border-zinc-800/80 shadow-[0_24px_80px_rgba(0,0,0,0.5)] overflow-hidden p-8 sm:p-12 relative z-10">
        <AnimatePresence mode="wait">
          {error && !lead ? (
            // ── Error State ──
            <motion.div
              key="error-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-red-950/30 border border-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white mb-3">
                Onboarding Failed
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-8 font-medium leading-relaxed">
                {error}
              </p>
              <button
                onClick={() => navigate("/owner/signup")}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all border border-zinc-700"
              >
                Go to Signup Page
              </button>
            </motion.div>
          ) : success ? (
            // ── Success State ──
            <motion.div
              key="success-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-emerald-950/30 border border-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white mb-2">
                Onboarding Completed!
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-8 font-semibold leading-relaxed">
                Your credentials are set and your garage has been activated. You can now log into your dashboard.
              </p>
              <button
                onClick={() => navigate("/owner/login")}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-[0.98]"
              >
                Proceed to Login
              </button>
            </motion.div>
          ) : (
            // ── Form State ──
            <motion.div
              key="form-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-900/30 text-emerald-400 mb-3 mx-auto">
                  <Wrench className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Secure Registration
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Welcome to GaragePro!
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-medium max-w-sm mx-auto">
                  Complete your details and create a password to set up your partner dashboard.
                </p>
              </div>

              {/* Lead Information Review Box */}
              <div className="mb-6 p-5 rounded-2xl bg-zinc-800/40 border border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                      Garage Name
                    </p>
                    <p className="text-sm font-bold text-white mt-0.5">{lead?.garageName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <div>
                      <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">
                        Owner Name
                      </p>
                      <p className="text-xs font-bold text-zinc-300">{lead?.ownerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <div>
                      <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">
                        City
                      </p>
                      <p className="text-xs font-bold text-zinc-300">{lead?.city}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">
                        Email Address
                      </p>
                      <p className="text-xs font-bold text-zinc-300 truncate" title={lead?.email}>
                        {lead?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <div>
                      <p className="text-[9px] uppercase font-black tracking-widest text-zinc-500">
                        Mobile Number
                      </p>
                      <p className="text-xs font-bold text-zinc-300">{lead?.mobileNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="mb-6 flex items-start gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-zinc-800 bg-zinc-800/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-sm transition-all text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-zinc-800 bg-zinc-800/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 text-sm transition-all text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-65 transition-all shadow-md shadow-emerald-500/10 pt-0.5 mt-2"
                >
                  {submitting ? (
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Activate Garage & Dashboard</span>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-8 pt-5 border-t border-zinc-800/80 text-center">
                <span className="text-xs text-zinc-500 font-medium">Already registered? </span>
                <RouterLink
                  to="/owner/login"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Login here
                </RouterLink>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
