import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Car,
  Wrench,
} from "lucide-react";
import axios from "axios";
import { seedSessionHistory } from "../utils/authHistory";
import { io } from "socket.io-client";
import {
  FormInput,
  FormError,
  FormButton,
} from "../components/layout/Form/forms";

const normalizeSocketUrl = (value) => {
  if (!value) return "";
  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(/^http:\/([^/])/, "http://$1")
    .replace(/^https:\/([^/])/, "https://$1");
  return cleaned.startsWith("http://") || cleaned.startsWith("https://")
    ? cleaned
    : `http://${cleaned}`;
};

// ─── Greeting pool ───────────────────────────────────────────────────────────
const GREETINGS = [
  "Welcome to your customer portal",
  "Welcome back to your dashboard",
  "Good to see you again",
  "Track your vehicle's progress",
  "Check your current service status",
  "Your live repair timeline is ready",
  "View your vehicle's health updates",
  "See how your car is doing today",
  "Access your digital service book",
  "Your repair history is secure here",
  "Review your past invoices and jobs",
  "Your complete service records",
  "Secure login with a one-time code",
  "Instant access — no password needed",
  "Verify your email to enter your portal",
  "One quick verification code to sign in",
  "Fast, passwordless portal access",
];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({ active, done }) {
  return (
    <div
      className={`w-2 h-2 rounded-full transition-all duration-300 ${
        done
          ? "bg-blue-600 scale-100"
          : active
            ? "bg-blue-500 scale-125"
            : "bg-slate-700"
      }`}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CustomerLogin() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [registrationStatus, setRegistrationStatus] = useState(null);

  const greeting = useMemo(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    [],
  );

  // ── OTP resend countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── Real-time approval updates via socket ─────────────────────────────────
  useEffect(() => {
    if (step !== 3 || !email) return;
    const socketUrl =
      normalizeSocketUrl(import.meta.env.VITE_BASE_URL) ||
      "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["websocket"] });

    socket.on("connect", () => socket.emit("join", email));
    socket.on("registration_update", (data) => setRegistrationStatus(data));

    return () => socket.disconnect();
  }, [step, email]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/portal/login-otp`,
        { email },
      );
      if (data.success) {
        if (data.isRequested) {
          setRegistrationStatus({
            status: data.status,
            reason: data.rejectionReason,
            customerName: data.customerName,
            garageName: data.garageName,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
          });
          setStep(3);
        } else {
          setStep(2);
          setCountdown(30);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Account not found or not active.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/portal/verify-login`,
        { email, otp },
      );

      if (data.success) {
        if (data.isRequested) {
          setRegistrationStatus({
            status: data.status,
            reason: data.rejectionReason,
            customerName: data.customerName,
            garageName: data.garageName,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
          });
          setStep(3);
          return;
        }

        sessionStorage.setItem("portal_token", data.token);
        sessionStorage.setItem("portal_user", JSON.stringify(data.user));

        const garage = data.user?.garage;
        if (garage) {
          try {
            const stored = JSON.parse(
              sessionStorage.getItem("linkedGarages") || "[]",
            );
            if (!stored.find((g) => g.id === garage._id)) {
              stored.push({
                id: garage._id,
                garageName: garage.garageName,
                email,
              });
              sessionStorage.setItem("linkedGarages", JSON.stringify(stored));
            }
          } catch {
            /* non-critical */
          }
        }

        navigate("/portal/dashboard", { replace: true });
        seedSessionHistory("/portal/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setError("");
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/portal/login-otp`, {
        email,
      });
      setCountdown(30);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-blue-500/30">
      <div className="w-full max-w-xl">
        {/* ── Brand & Typography Header ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-8"
        >
          <div
            className="group inline-flex items-center gap-2.5 mb-4 cursor-auto select-none"
            onClick={() => navigate("/portal")}
          >
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-600/20 transition-transform duration-300 group-hover:scale-105">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              Garage<span className="text-blue-500">Pro</span>
            </span>
          </div>

          {/* Sub-badge */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Customer Portal
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-normal w-full mb-2">
            {greeting}
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Sign in with your registered email — no password needed
          </p>

          {/* Step Pagination Dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <StepDot active={step === 1} done={step > 1} />
            <StepDot active={step === 2} done={step > 2} />
            <StepDot active={step === 3} done={false} />
          </div>
        </motion.div>

        {/* ── Main Card Container ─────────────────────────────────── */}
        <div className="bg-[#161920] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Accent Line Gradient */}
          <div className="h-1 w-full bg-linear-to-r from-blue-400 via-blue-500 to-blue-500" />

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Email ── */}
              {step === 1 && (
                <motion.form
                  key="step-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSendOTP}
                  className="space-y-5"
                >
                  <FormInput
                    id="customer-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    label="Registered Email"
                    labelClassName="text-sm font-semibold text-slate-300 mb-1.5"
                    leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
                    inputClassName="h-12 pl-11 pr-4 border-slate-800 bg-[#0e1117] text-slate-100 placeholder-slate-600 focus:ring-blue-500/20 focus:border-blue-500"
                  />

                  {error && (
                    <FormError
                      message={error}
                      isBanner
                      className="bg-rose-500/5 border-rose-500/20 text-rose-400"
                    />
                  )}

                  <FormButton
                    id="customer-send-otp-btn"
                    type="submit"
                    loading={loading}
                    loadingText="Sending code…"
                    variant="blue"
                    icon={<Mail className="w-4 h-4" />}
                    size="lg"
                  >
                    Send Login Code
                  </FormButton>
                </motion.form>
              )}

              {/* ── STEP 2: OTP Verification ── */}
              {step === 2 && (
                <motion.form
                  key="step-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleVerifyOTP}
                  className="space-y-5"
                >
                  <div className="text-center py-1">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-sm text-slate-400">
                      We sent a 6-digit verification code to{" "}
                      <span className="font-semibold text-slate-200 block mt-0.5">
                        {email}
                      </span>
                    </p>
                  </div>

                  <FormInput
                    id="customer-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    label="One-Time Password"
                    labelClassName="text-md font-semibold text-slate-300 mb-1.5"
                    inputClassName="h-14 border-slate-800 bg-[#0e1117] text-center text-2xl font-black tracking-[0.6rem] text-slate-100 placeholder-slate-800 focus:ring-blue-500/20 focus:border-blue-500"
                  />

                  {error && (
                    <FormError
                      message={error}
                      isBanner
                      className="bg-rose-500/5 border-rose-500/20 text-rose-400"
                    />
                  )}

                  <FormButton
                    id="customer-verify-btn"
                    type="submit"
                    loading={loading}
                    loadingText="Verifying identity…"
                    variant="blue"
                    size="lg"
                  >
                    Login Now
                  </FormButton>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setOtp("");
                        setError("");
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-400 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={countdown > 0 || loading}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                      {countdown > 0
                        ? `Resend in ${countdown}s`
                        : "Resend code"}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── STEP 3: Registration Status View Screen ── */}
              {step === 3 && registrationStatus && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="text-center space-y-5"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
                      registrationStatus.status === "rejected"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : registrationStatus.status === "approved"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}
                  >
                    {registrationStatus.status === "rejected" ? (
                      <FormError
                        message=" "
                        isBanner
                        className="bg-transparent border-none p-0 w-6 h-6 text-rose-400 shrink-0"
                      />
                    ) : registrationStatus.status === "approved" ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-slate-100">
                      {registrationStatus.status === "rejected"
                        ? "Registration Rejected"
                        : registrationStatus.status === "approved"
                          ? "Request Approved!"
                          : "Request Pending"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                      {registrationStatus.status === "rejected"
                        ? `Hi ${registrationStatus.customerName}, unfortunately your request at ${registrationStatus.garageName} was not approved.`
                        : registrationStatus.status === "approved"
                          ? `Great news ${registrationStatus.customerName}! Your request at ${registrationStatus.garageName} has been approved.`
                          : `Hi ${registrationStatus.customerName}, your request at ${registrationStatus.garageName} is still being reviewed. We'll update you soon.`}
                    </p>
                  </div>

                  {registrationStatus.status === "approved" &&
                    registrationStatus.appointmentDate && (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center space-y-1">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                          Confirmed Appointment
                        </p>
                        <p className="text-sm font-bold text-slate-200">
                          {new Date(
                            registrationStatus.appointmentDate,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        {registrationStatus.appointmentTime && (
                          <div className="flex items-center justify-center gap-1.5 pt-0.5 text-emerald-400/80 font-medium text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{registrationStatus.appointmentTime}</span>
                          </div>
                        )}
                      </div>
                    )}

                  {registrationStatus.status === "rejected" &&
                    registrationStatus.reason && (
                      <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl text-left space-y-1">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                          Reason
                        </p>
                        <p className="text-xs text-rose-400/90 leading-relaxed">
                          {registrationStatus.reason}
                        </p>
                      </div>
                    )}

                  {registrationStatus.status === "approved" ? (
                    <button
                      onClick={() => {
                        setStep(1);
                        setOtp("");
                        setError("");
                        setRegistrationStatus(null);
                      }}
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/10"
                    >
                      Proceed to Login
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/portal")}
                      className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-all"
                    >
                      Back to Portal
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Routing Link Section */}
          <div className="px-6 sm:px-8 py-4 bg-[#11141a] border-t border-slate-800/60 text-center">
            <p className="text-xs text-slate-500">
              Not registered yet?{" "}
              <Link
                to="/portal"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Set up your access...
              </Link>
            </p>
          </div>
        </div>

        {/* ── Sub-Footer Core System Access ───────────────────────────────── */}
        <div className="flex items-center justify-center gap-3 mt-8 text-xs text-slate-600 font-medium">
          <Link to="/login" className="hover:text-slate-400 transition-colors">
            Staff / Owner Login
          </Link>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <Link
            to="/admin/login"
            className="hover:text-orange-400 transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
