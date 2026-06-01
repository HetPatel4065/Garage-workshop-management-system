import React, { useState, useEffect, useMemo, useTransition } from "react";
import axios from "axios";
import {
  Search,
  MapPin,
  Phone,
  ArrowRight,
  Wrench,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RegistrationModal from "./RegistrationModal";
import GarageDetailsModal from "./GarageDetailsModal";
import PortalLogin from "./PortalLogin";
import { useNavigate, Link } from "react-router-dom";

/* ─── Skeleton card ─── */
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="w-11 h-11 bg-slate-100 rounded-xl" />
        <div className="w-14 h-6 bg-slate-100 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded-md w-3/5" />
        <div className="h-3 bg-slate-100 rounded-md w-2/5" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between">
        <div className="h-3 bg-slate-100 rounded-md w-1/3" />
        <div className="w-7 h-7 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function PortalHome() {
  const navigate = useNavigate();
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginPrefill, setLoginPrefill] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getPortalToken = () =>
    sessionStorage.getItem("portal_token") ||
    sessionStorage.getItem("garage_token");
  const isAuthenticated = !!getPortalToken();

  useEffect(() => {
    fetchGarages();
  }, []);

  const fetchGarages = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/portal/garages`,
      );
      if (res.data.success) setGarages(res.data.data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setInputValue("");
    startTransition(() => setSearchQuery(""));
  };

  const filtered = useMemo(
    () =>
      garages.filter(
        (g) =>
          g.garageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.address?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [garages, searchQuery],
  );

  /* ═══════════════ RENDER ═══════════════ */
  return (
    /* Explicitly added light background and slate text colors to counter structural dark mode configs */
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* ── Header ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "py-2 backdrop-blur-2xl border-b border-indigo-500/10 bg-transparent shadow-[0_4px_32px_rgba(99,102,241,0.08)] md:py-3"
            : "py-4 bg-transparent md:py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Logo / Brand Button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-2 transition-transform active:scale-98 md:gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 text-xs font-extrabold text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-transform duration-300 group-hover:scale-110 md:h-9 md:w-9 md:text-sm">
              GP
            </div>
            <span className="text-lg font-extrabold tracking-tight text-indigo-950 dark:text-zinc-100 md:text-xl">
              GaragePro
            </span>
          </button>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {!isAuthenticated && (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-indigo-400 md:text-sm"
              >
                Sign in
              </button>
            )}

            <button
              onClick={() =>
                isAuthenticated
                  ? navigate("/portal/dashboard")
                  : setIsLoginModalOpen(true)
              }
              className="flex items-center gap-1.5 rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-[0_4px_16px_rgba(99,102,241,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(99,102,241,0.48)] active:translate-y-0 md:px-6 md:py-2.5 md:text-sm"
            >
              <span>{isAuthenticated ? "Dashboard" : "Get Started"}</span>
              <ArrowRight size={14} className="hidden sm:block" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-14 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-black uppercase tracking-widest mb-7"
            >
              <Sparkles className="w-3 h-3" />
              Trusted across India
            </motion.div>

            {/* Headline */}
            <motion.h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4rem] font-black text-slate-900 tracking-tight leading-[1.06] mb-5">
              Your vehicle deserves
              <br />
              <span className="text-blue-600">expert care.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="text-[15px] text-slate-500 leading-relaxed mb-9 max-w-md mx-auto"
            >
              Find verified mechanics, book appointments, and track your full
              service history — all in one place.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="max-w-lg mx-auto mb-10"
            >
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    startTransition(() => setSearchQuery(e.target.value));
                  }}
                  placeholder="Search garage name or city…"
                  className="w-full pl-12 pr-11 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 text-[14.5px] placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 shadow-sm hover:border-slate-300 transition-all duration-200"
                />
                <AnimatePresence>
                  {inputValue && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Grid section ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          {/* Section label */}
          <AnimatePresence>
            {!loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between mb-5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-bold text-slate-800">
                    {searchQuery
                      ? `Results for "${searchQuery}"`
                      : "All Garages"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {filtered.length}
                  </span>
                </div>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors bg-transparent border-none cursor-auto"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((garage, index) => (
                  <motion.article
                    key={garage._id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{
                      duration: 0.2,
                      delay: Math.min(index * 0.035, 0.28),
                    }}
                    onClick={() => {
                      setSelectedGarage(garage);
                      setIsDetailsModalOpen(true);
                    }}
                    className="group relative bg-white rounded-2xl border border-slate-100 hover:border-blue-200  transition-all duration-300 cursor-auto overflow-hidden"
                  >
                    {/* Top accent line */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 to-indigo-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-t-2xl" />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl border border-slate-100 bg-slate-50 group-hover:bg-blue-50 group-hover:border-blue-100 flex items-center justify-center transition-all duration-300 shrink-0">
                          {garage.logo ? (
                            <img
                              src={`${import.meta.env.VITE_BASE_URL?.replace(/\/$/, "")}/${String(garage.logo).replace(/^\//, "")}`}
                              alt={garage.garageName}
                              className="w-7 h-7 object-contain"
                            />
                          ) : (
                            <Wrench
                              className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors"
                              strokeWidth={2}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                            Open
                          </span>
                        </div>
                      </div>

                      {/* Name & address */}
                      <div className="mb-4 min-w-0">
                        <h3 className="text-[14.5px] font-bold text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors leading-snug truncate">
                          {garage.garageName}
                        </h3>
                        <div className="flex items-start gap-1.5 text-slate-400 text-[12px]">
                          <MapPin
                            className="w-3.5 h-3.5 shrink-0 mt-px"
                            strokeWidth={2}
                          />
                          <span className="truncate">
                            {garage.address || "Location not specified"}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3.5 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-[12px] text-slate-500">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <Phone
                              className="w-3 h-3 text-slate-400"
                              strokeWidth={2}
                            />
                          </div>
                          <span className="font-medium tabular-nums">
                            {garage.mobileNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[12px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap">
                            View Details
                          </span>
                          <div className="w-7 h-7 rounded-xl border border-slate-100 bg-slate-50 group-hover:bg-blue-600 group-hover:border-blue-600 flex items-center justify-center transition-all duration-300 shrink-0">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200"
            >
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <Search className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                No garages found
              </p>
              <p className="text-sm text-slate-400 mb-5">
                No results for "{searchQuery}"
              </p>
              <button
                onClick={clearSearch}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-2 bg-transparent border-none cursor-auto"
              >
                Clear search
              </button>
            </motion.div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-black text-slate-900 tracking-tight">
              GaragePro
            </span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {["Privacy Policy", "Terms of Service", "Contact Support"].map(
              (l) => {
                if (l === "Privacy Policy") {
                  return (
                    <Link
                      key={l}
                      to="/privacy-policy"
                      className="text-[13px] text-slate-400 font-medium hover:text-blue-600 transition-colors"
                    >
                      {l}
                    </Link>
                  );
                }
                if (l === "Contact Support") {
                  return (
                    <Link
                      key={l}
                      to="/portal/support"
                      className="text-[13px] text-slate-400 font-medium hover:text-blue-600 transition-colors"
                    >
                      {l}
                    </Link>
                  );
                }
                return (
                  <a
                    key={l}
                    href="#"
                    className="text-[13px] text-slate-400 font-medium hover:text-blue-600 transition-colors"
                  >
                    {l}
                  </a>
                );
              },
            )}
          </nav>
          <p className="text-[12px] text-slate-400">
            &copy; 2026 GaragePro Ecosystem
          </p>
        </div>
      </footer>

      {/* ── Modals ── */}
      <GarageDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        garage={selectedGarage}
        onRegister={(garage) => {
          setSelectedGarage(garage);
          setIsModalOpen(true);
        }}
      />
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        garage={selectedGarage}
      />
      <PortalLogin
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setLoginPrefill("");
        }}
        prefilledEmail={loginPrefill}
      />
    </div>
  );
}
