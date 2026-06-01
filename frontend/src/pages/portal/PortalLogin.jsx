import React, { useState, useEffect, useMemo } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

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

const PortalLogin = ({ isOpen, onClose, prefilledEmail }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState(prefilledEmail || "");
  const [otp, setOtp] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState(null); // { status, reason, customerName, garageName }
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [isOpen, prefilledEmail]);

  const greeting = useMemo(() => {
    const greetings = [
      "Welcome back",
      "Hello again",
      "Good to see you",
      "Ready to work?",
      "Workspace ready",
      "Glad you're here",
      "We missed you!",
      "Welcome home",
      "The legend returns",
      "Ready to crush it?",
      "Let’s make magic happen",
      "Your next big win starts here",
      "Ready to move the needle?",
      "Level up time",
      "The stage is yours",
      "Unstoppable today?",
      "Time to build something great",
      "It’s always a pleasure",
      "So glad you could make it",
      "Your workspace missed you",
      "Nice to see your face again",
      "Pick up where you left off",
      "Let’s get started",
      "Good to have you back in the driver's seat",
      "Let’s make progress",
      "A wild user appears!",
      "Back for more glory?",
      "Mission Control, we have contact",
      "The world was getting quiet without you",
      "Ah, our favorite VIP is back",
      "Ready to change the world?",
      "Back in the game",
      "Let's get to it",
      "System ready",
      "Awaiting your input",
      "Your dashboard is ready",
      "Focus mode engaged",
      "Systems are a go",
      "Guess who's back?",
      "Active",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Real-time status updates via socket
  useEffect(() => {
    let socket;
    if (isOpen && step === 3 && email) {
      const socketUrl =
        normalizeSocketUrl(import.meta.env.VITE_BASE_URL) ||
        "http://localhost:5000";
      socket = io(socketUrl, { transports: ["websocket"] });

      socket.on("connect", () => {
        console.log("Portal status socket connected");
        socket.emit("join", email);
      });

      socket.on("registration_update", (data) => {
        console.log("Registration update received:", data);
        setRegistrationStatus(data);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen, step, email]);

  if (!isOpen) return null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/portal/login-otp`,
        { email },
      );
      if (response.data.success) {
        if (response.data.isRequested) {
          setRegistrationStatus({
            status: response.data.status,
            reason: response.data.rejectionReason,
            customerName: response.data.customerName,
            garageName: response.data.garageName,
          });
          setStep(3);
          return;
        }
        setStep(2);
        setCountdown(30);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Account not found or not active.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/portal/verify-login`,
        { email, otp },
      );
      if (response.data.success) {
        if (response.data.isRequested) {
          setRegistrationStatus({
            status: response.data.status,
            reason: response.data.rejectionReason,
            customerName: response.data.customerName,
            garageName: response.data.garageName,
          });
          setStep(3); // Success/Status step
          return;
        }

        sessionStorage.setItem("portal_token", response.data.token);
        sessionStorage.setItem(
          "portal_user",
          JSON.stringify(response.data.user),
        );

        const userGarage = response.data.user.garage;
        if (userGarage) {
          try {
            let storedGarages = JSON.parse(
              sessionStorage.getItem("linkedGarages") || "[]",
            );
            if (!storedGarages.find((g) => g.id === userGarage._id)) {
              storedGarages.push({
                id: userGarage._id,
                garageName: userGarage.garageName,
                email: email,
              });
              sessionStorage.setItem(
                "linkedGarages",
                JSON.stringify(storedGarages),
              );
            }
          } catch (e) {
            console.error("Failed to store linked garages");
          }
        }

        // We might want to reload or update context here
        // For now, let's just navigate to dashboard
        window.location.href = "/portal/dashboard";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };
  const Label = ({ children, required, hint, error }) => (
    <label
      className={`flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest mb-1.5 ${error ? "text-red-600" : "text-gray-900"}`}
    >
      {children}
      {required && <span className="text-red-500 font-black ml-0.5">*</span>}
      {hint && (
        <span className="normal-case font-normal text-gray-500 text-[11px] ml-1">
          ({hint})
        </span>
      )}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8 pb-0">
          <span className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-2 block">
            Customer Login
          </span>
          <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}
          </h3>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="login-step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label
                    required
                    className="text-sm font-bold text-slate-700 ml-1"
                  >
                    Registered Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Send Login Code"
                  )}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="login-step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyLogin}
                className="space-y-6 text-center"
              >
                <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>

                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">
                    Check your email
                  </h4>
                  <p className="text-slate-500">
                    We've sent a login code to{" "}
                    <span className="font-bold text-slate-900">{email}</span>
                  </p>
                </div>

                <div className="max-w-xs mx-auto">
                  <input
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="w-full text-center text-4xl font-black tracking-[1rem] py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl transition-all outline-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Login Now"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Change email address
                </button>
              </motion.form>
            )}

            {step === 3 && registrationStatus && (
              <motion.div
                key="login-status"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-6"
              >
                <div className="relative mx-auto w-20 h-20">
                  <div
                    className={`absolute inset-0 rounded-3xl flex items-center justify-center ${
                      registrationStatus.status === "rejected"
                        ? "bg-rose-50"
                        : registrationStatus.status === "approved"
                          ? "bg-emerald-50"
                          : "bg-amber-50"
                    }`}
                  >
                    {registrationStatus.status === "rejected" ? (
                      <AlertCircle className="w-10 h-10 text-rose-500" />
                    ) : registrationStatus.status === "approved" ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    ) : (
                      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-slate-900">
                    {registrationStatus.status === "rejected"
                      ? "Registration Rejected"
                      : registrationStatus.status === "approved"
                        ? "Request Approved!"
                        : "Request Pending"}
                  </h4>
                  <p className="text-slate-500 text-sm">
                    {registrationStatus.status === "rejected"
                      ? `Hi ${registrationStatus.customerName}, unfortunately your request at ${registrationStatus.garageName} was not approved.`
                      : registrationStatus.status === "approved"
                        ? `Great news ${registrationStatus.customerName}! Your request at ${registrationStatus.garageName} has been approved.`
                        : `Hi ${registrationStatus.customerName}, your request at ${registrationStatus.garageName} is still being reviewed.`}
                  </p>

                  {registrationStatus.status === "approved" &&
                    registrationStatus.appointmentDate && (
                      <div className="mt-4 p-5 bg-emerald-50 border border-emerald-100 rounded-4xl text-center shadow-sm">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">
                          Confirmed Appointment
                        </p>
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-lg font-black text-slate-900">
                            {new Date(
                              registrationStatus.appointmentDate,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <div className="flex items-center gap-2 text-emerald-700 font-bold">
                            <Clock className="w-4 h-4" />
                            <span>
                              {registrationStatus.appointmentTime || "10:00 AM"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                  {registrationStatus.status === "rejected" &&
                    registrationStatus.reason && (
                      <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-left">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">
                          Reason for rejection
                        </p>
                        <p className="text-sm font-bold text-rose-700">
                          {registrationStatus.reason}
                        </p>
                      </div>
                    )}
                </div>

                {registrationStatus.status === "approved" ? (
                  <button
                    onClick={() => setStep(1)}
                    className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                  >
                    Proceed to Login
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold text-lg hover:bg-slate-800 transition-all"
                  >
                    Close
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default PortalLogin;
