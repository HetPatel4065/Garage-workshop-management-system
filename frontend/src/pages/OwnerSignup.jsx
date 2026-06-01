import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Wrench,
  Store,
  Phone,
  User,
  MapPin,
  CheckCircle,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Shield,
  MessageCircle,
  Clock,
  Mail,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const SERVICES_LIST = [
  "General Maintenance",
  "Periodic Servicing",
  "AC & Electrical Repair",
  "Denting & Painting",
  "Washing & Detailing",
  "Wheel Alignment",
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Boost Revenue by 40%",
    desc: "Automate service reminders and customer retention programs seamlessly.",
  },
  {
    icon: Wrench,
    title: "All-in-One Operating System",
    desc: "Manage digital job cards, smart inventory, and invoicing in one hub.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Integration",
    desc: "Send service updates, invoices, and payment links directly to WhatsApp.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "Your garage operations, financial data, and customer list are fully encrypted.",
  },
];

export default function OwnerSignup() {
  const [garageName, setGarageName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();

  const handleServiceToggle = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((s) => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (selectedServices.length === 0) {
      setError("Please select at least one service offered.");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/garage-leads`, {
        garageName,
        ownerName,
        email,
        mobileNumber,
        city,
        servicesOffered: selectedServices,
        message,
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Something went wrong while requesting partnership. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp click to chat link (with standard pre-filled message)
  const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    "Hi GaragePro team, I am interested in partnering as a Garage Owner. Can you please share more details?",
  )}`;

  return (
    <div className="min-h-screen bg-emerald-50/30 dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-emerald-200">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-emerald-100 dark:border-zinc-800 shadow-[0_24px_70px_rgba(16,185,129,0.06)] overflow-hidden min-h-[600px]">
        {/* ── Left Column: Value Prop & Trust (Emerald Branding) ── */}
        <div className="w-full lg:w-5/12 bg-emerald-600 dark:bg-emerald-950 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative ambient gradient blobs inside the panel */}
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-15%] w-80 h-80 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Brand Header */}
            <div
              className="inline-flex items-center gap-3 cursor-auto group mb-10"
              onClick={() => navigate("/")}
            >
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tighter">
                Garage<span className="text-emerald-300">Pro</span>
              </span>
            </div>

            {/* Welcome text */}
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Grow Your Garage Business With Us
            </h2>
            <p className="text-emerald-100/90 text-sm sm:text-base mb-8 max-w-md font-medium leading-relaxed">
              Join India's fastest-growing digital platform for mechanical
              workshops. We help you streamline operations, engage customers,
              and scale your business.
            </p>

            {/* Benefits list */}
            <div className="space-y-6">
              {BENEFITS.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 shrink-0 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/15">
                      <Icon className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        {benefit.title}
                      </h4>
                      <p className="text-emerald-100/80 text-xs sm:text-sm mt-0.5 max-w-sm">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Trust & Contact */}
          <div className="mt-12 relative z-10 border-t border-emerald-500/30 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-300">
                  Trust Metrics
                </p>
                <p className="text-lg font-extrabold text-white mt-0.5">
                  500+ Garages Partnered
                </p>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-xs font-bold"
              >
                <FaWhatsapp className="text-base text-emerald-400" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ── Right Column: Lead Form or Success Page ── */}
        <div className="w-full lg:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-zinc-900 transition-colors">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form-state"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md mx-auto"
              >
                {/* Header */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mb-3">
                    <Store className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Partnership Program
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                    Request Partnership
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                    Submit your interest and our onboarding specialists will
                    contact you.
                  </p>
                </div>

                {/* Error Box */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400"
                  >
                    <svg
                      className="w-4 h-4 mt-0.5 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-xs font-semibold">{error}</p>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Garage & Owner Name (Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Garage Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/80" />
                        <input
                          type="text"
                          required
                          value={garageName}
                          onChange={(e) => setGarageName(e.target.value)}
                          placeholder="Speedy Auto Works"
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-emerald-100 dark:border-zinc-800 bg-emerald-50/20 dark:bg-zinc-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 transition-all dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Owner Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/80" />
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="Rahul Sharma"
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-emerald-100 dark:border-zinc-800 bg-emerald-50/20 dark:bg-zinc-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 transition-all dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile & City (Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/80" />
                        <input
                          type="tel"
                          required
                          value={mobileNumber || "+91 "} // Fallback to prefix if state is empty
                          onChange={(e) => {
                            const input = e.target.value;

                            // 1. Prevent deleting the '+91 ' prefix
                            if (!input.startsWith("+91 ")) {
                              // If they somehow clear it, reset it back to just the prefix
                              setMobileNumber("+91 ");
                              return;
                            }

                            // 2. Extract just the dynamic numbers typed after '+91 '
                            const rawDigits = input.slice(4).replace(/\D/g, "");

                            // 3. Limit to exactly 10 digits maximum
                            if (rawDigits.length <= 10) {
                              setMobileNumber(`+91 ${rawDigits}`);
                            }
                          }}
                          placeholder="+91 9876543210"
                          maxLength={14} // Length of "+91 " (4 chars) + 10 digits = 14 total characters Max
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-emerald-100 dark:border-zinc-800 bg-emerald-50/20 dark:bg-zinc-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 transition-all dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/80" />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Mumbai"
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-emerald-100 dark:border-zinc-800 bg-emerald-50/20 dark:bg-zinc-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 transition-all dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Address Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/80" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@example.com"
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-emerald-100 dark:border-zinc-800 bg-emerald-50/20 dark:bg-zinc-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 transition-all dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Services Offered (Chips/Tags) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
                      Services Offered <span className="text-red-500">*</span>
                      <span className="text-slate-400 dark:text-zinc-500 font-normal ml-1">
                        (Select all that apply)
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICES_LIST.map((service) => {
                        const isSelected = selectedServices.includes(service);
                        return (
                          <button
                            type="button"
                            key={service}
                            onClick={() => handleServiceToggle(service)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-xs shadow-emerald-500/20"
                                : "bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-emerald-300 dark:hover:border-emerald-500/30"
                            }`}
                          >
                            {service}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Optional Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us more about your garage (e.g. number of bays, key mechanics, years in business...)"
                      rows={3}
                      className="w-full p-3.5 rounded-xl border border-emerald-100 dark:border-zinc-800 bg-emerald-50/20 dark:bg-zinc-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 transition-all resize-none dark:text-white"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-65 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10 transition-all pt-0.5 mt-2"
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
                        <span>Requesting Partnership...</span>
                      </>
                    ) : (
                      <>
                        <Store className="w-4 h-4" />
                        <span>Request Partnership</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Home / Login link */}
                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs sm:text-sm">
                  <RouterLink
                    to="/signup"
                    className="font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} /> Back to roles
                  </RouterLink>
                  <RouterLink
                    to="/owner/login"
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    Owner Login Instead →
                  </RouterLink>
                </div>
              </motion.div>
            ) : (
              // ── Success State ──
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-full max-w-sm mx-auto text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs shadow-emerald-500/10">
                  <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight mb-2">
                  Partnership Requested!
                </h3>

                <p className="text-sm text-slate-600 dark:text-zinc-400 font-semibold max-w-xs mx-auto leading-relaxed mb-8">
                  Thank you! Our team will contact you shortly.
                </p>

                <div className="space-y-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-500/10"
                  >
                    <FaWhatsapp className="text-lg" />
                    <span>Quick Chat on WhatsApp</span>
                  </a>

                  <button
                    onClick={() => navigate("/")}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
                  >
                    <span>Back to Home Page</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
