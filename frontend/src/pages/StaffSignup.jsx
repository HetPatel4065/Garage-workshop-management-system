import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Wrench,
  HardHat,
  UserCog,
  Phone,
  Mail,
  User,
  ShieldCheck,
} from "lucide-react";
import { FaUsers } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const GREETINGS = [
  // Friendly & Community-Focused
  "We’re thrilled to have you! Let’s get you set up",
  "Ready to meet the rest of the team?",
  "Your seat at the table is waiting",
  "Let’s make great things together",
  "Welcome aboard! Let’s create your account",

  // Short & Punchy
  "Let's get you onboarded",
  "Create your staff account",
  "Welcome to your new dashboard",
  "Setup your workspace",
  "Ready when you are",
];

const ROLE_OPTIONS = [
  {
    value: "advisor",
    label: "Service Advisor",
    icon: UserCog,
    description: "Manage customer relations & jobs",
  },
  {
    value: "mechanic",
    label: "Mechanic",
    icon: HardHat,
    description: "Execute vehicle repairs & inspections",
  },
];

export default function StaffSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("+91 ");
  const [role, setRole] = useState("advisor");
  const [ownerId, setOwnerId] = useState(""); // This is the 10-digit Garage ID

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const greeting = useMemo(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    [],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!ownerId || ownerId.length !== 10) {
      setError("Please enter a valid 10-digit Garage ID.");
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append("name", name);
      data.append("email", email);
      data.append("password", password);
      data.append("role", role);
      data.append("mobileNumber", mobileNumber);
      data.append("ownerId", ownerId); // Backend resolves 10-digit ownerId natively

      await register(data);

      navigate("/staff/login", {
        replace: true,
        state: {
          success: "Account created successfully. Please sign in.",
        },
      });
    } catch (err) {
      setError(
        err.message || "Failed to register. Check connection ID and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full h-11 pl-10 pr-3.5 rounded-xl border border-violet-200 bg-violet-50/60 text-sm " +
    "text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 " +
    "focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white transition-all";

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        {/* ── Brand Header ─────────────────────────────────────── */}
        <div className="text-center mb-6">
          <div
            className="group inline-flex items-center gap-3 mb-2 cursor-auto select-none"
            onClick={() => navigate("/")}
          >
            <div className="bg-violet-500 p-2.5 rounded-xl  shadow-violet-200 transition-all duration-300group-hover:scale-110">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              Garage<span className="text-violet-500">Pro</span>
            </span>
          </div>

          {/* Role badge */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200">
              <FaUsers className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-600">
                Staff Registration
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Join an existing workshop to access your digital workspace
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
          <div className="h-1 w-full bg-linear-to-r from-violet-400 via-violet-500 to-purple-500" />

          <div className="p-6 sm:p-8">
            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
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
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Your Staff Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`
                          relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all
                          ${
                            isActive
                              ? "bg-violet-50 border-violet-500 text-violet-700 shadow-sm"
                              : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                          }
                        `}
                      >
                        <Icon
                          size={18}
                          className={
                            isActive ? "text-violet-600" : "text-slate-400"
                          }
                        />
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className="text-[10px] leading-tight text-slate-400 hidden sm:inline">
                          {opt.description}
                        </span>
                        {isActive && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-3.5 pt-2">
                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                  Personal Details
                </p>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Email & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                      <input
                        type="tel"
                        required
                        value={mobileNumber}
                        onChange={(e) => {
                          let v = e.target.value;
                          if (!v.startsWith("+91 ")) {
                            v = "+91 " + v.replace("+91", "").trim();
                          }
                          if (v.length <= 14) setMobileNumber(v);
                        }}
                        placeholder="+91 9876543210"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="hidden" />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 flex items-center justify-center font-bold text-base select-none">
                      *
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Garage Link Details */}
              <div className="space-y-3.5 pt-2">
                <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">
                  Garage Verification
                </p>

                <div className="flex gap-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Staff registration requires a unique 10-digit Garage ID
                    supplied by your garage owner. This links your account to
                    their dashboard.
                  </p>
                </div>

                {/* Garage ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    10-Digit Garage Connection ID{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Wrench className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      value={ownerId}
                      onChange={(e) =>
                        setOwnerId(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="e.g. 1234567890"
                      className={`${inputCls} font-mono tracking-widest`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-violet-500 hover:bg-violet-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-400/30 transition-all mt-3"
              >
                {isLoading ? (
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
                    <span>Creating your staff account…</span>
                  </>
                ) : (
                  <>
                    <FaUsers className="w-4 h-4" />
                    <span>Request to Join Garage</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between text-sm">
              <Link
                to="/signup"
                className="font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back to roles
              </Link>
              <Link
                to="/staff/login"
                className="font-medium text-violet-600 hover:text-violet-700 transition-colors"
              >
                Sign in instead →
              </Link>
            </div>
          </div>
        </div>

        {/* Footer legal disclaimer */}
        <p className="mt-5 text-center text-[11px] text-slate-400 px-4">
          After signing up, your garage owner will receive a notification to
          verify your credentials.
        </p>
      </motion.div>
    </div>
  );
}
