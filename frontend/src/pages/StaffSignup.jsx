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
import { FormInput, FormError, FormButton, FormRow, FormSection } from "../components/layout/Form/forms";

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

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-xl"
      >
        {/* ── Brand Header ── */}
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

        {/* ── Card ── */}
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
                  className="mb-5"
                >
                  <FormError message={error} isBanner />
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
              <FormSection title="Personal Details" className="pt-2">
                {/* Name */}
                <FormInput
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  label="Full Name"
                  leftIcon={<User className="w-4 h-4 text-violet-400" />}
                  inputClassName="border-violet-200 bg-violet-50/60 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white"
                />

                {/* Email & Mobile */}
                <FormRow cols={2}>
                  <FormInput
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    label="Email Address"
                    leftIcon={<Mail className="w-4 h-4 text-violet-400" />}
                    inputClassName="border-violet-200 bg-violet-50/60 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white"
                  />

                  <FormInput
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
                    label="Mobile Number"
                    leftIcon={<Phone className="w-4 h-4 text-violet-400" />}
                    inputClassName="border-violet-200 bg-violet-50/60 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white"
                  />
                </FormRow>

                {/* Password */}
                <FormInput
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  label="Password"
                  leftIcon={<div className="text-violet-400 font-bold text-base select-none">*</div>}
                  inputClassName="border-violet-200 bg-violet-50/60 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white pr-11"
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-violet-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </FormSection>

              {/* Garage Link Details */}
              <FormSection title="Garage Verification" className="pt-2">
                <div className="flex gap-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Staff registration requires a unique 10-digit Garage ID
                    supplied by your garage owner. This links your account to
                    their dashboard.
                  </p>
                </div>

                {/* Garage ID */}
                <FormInput
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
                  label="10-Digit Garage Connection ID"
                  leftIcon={<Wrench className="w-4 h-4 text-violet-400" />}
                  inputClassName="border-violet-200 bg-violet-50/60 focus:ring-violet-400/30 focus:border-violet-400 focus:bg-white font-mono tracking-widest"
                />
              </FormSection>

              {/* Submit */}
              <FormButton
                type="submit"
                loading={isLoading}
                loadingText="Creating your staff account…"
                variant="violet"
                icon={<FaUsers className="w-4 h-4" />}
                className="mt-3"
              >
                Request to Join Garage
              </FormButton>
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
