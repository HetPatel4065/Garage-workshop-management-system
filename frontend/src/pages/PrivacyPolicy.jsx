import React, { useState, useEffect, useRef } from "react";
import EmptyState from "../components/UI/EmptyState";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Database,
  Globe,
  Mail,
  Phone,
  MapPin,
  Search,
  FileText,
  Calendar,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const SECTIONS = [
  {
    id: "introduction",
    title: "1. Introduction",
    icon: Shield,
    content: `Welcome to GaragePro (referred to as "we", "our", "us", or "the Platform"). Your privacy is of paramount importance to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web-based garage management application, including any related services, databases, and portal features.

By accessing or using the GaragePro platform, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with any terms of this policy, please do not access or register for our services.`,
  },
  {
    id: "info-collection",
    title: "2. Information We Collect",
    icon: Database,
    content: `We collect several different types of information for various purposes to provide and improve our service to you:

a) Personal Account Information: When registering as an Owner or Staff Member, we collect details such as your full name, email address, password, mobile number, and role selection.
b) Business Profile Information: To configure your workspace, we collect your garage business name, logo, physical address, and GSTIN (if applicable).
c) Customer & Vehicle Data: In the course of utilizing our workshop system, you may enter details about your customers (names, phone numbers, email addresses) and their vehicles (make, model, registration plate number, service history).
d) System Operations Data: We collect details of services rendered, labor charges, job card statuses, billing details, and inventory spare parts tracking.
e) Technical & Usage Data: We automatically record technical metrics, including IP addresses, browser types, session tokens, page views, and navigation logs to ensure optimal performance.`,
  },
  {
    id: "how-we-use",
    title: "3. How We Use Information",
    icon: Eye,
    content: `GaragePro uses the collected data to power your workshop operations and support service quality:

• To Provision Services: Setting up your account, compiling dashboard metrics, tracking job cards, managing inventory thresholds, and preparing billing invoices.
• To Automate Reminders: Triggering scheduled service alerts, SMS, or WhatsApp reminders to your customers (with your consent).
• System Protection: Protecting system integrity, preventing fraudulent login attempts, and securing multi-role access controls.
• Enhancing Performance: Running internal diagnostics to optimize page loads, fix software glitches, and streamline user workflows.
• Customer Service: Troubleshooting user accounts, responding to advisor enquiries, and handling support calls.`,
  },
  {
    id: "data-security",
    title: "4. Data Security",
    icon: Lock,
    content: `The security of your data is a top priority. We implement state-of-the-art security safeguards to prevent unauthorized access:

- Local & Cloud Encryption: All transmissions are secured using SSL/TLS encryption. Sensitive databases are stored in encrypted environments.
- Role-Based Permissions: Access to inventory, billing, and settings is gated by cryptographic tokens, preventing advisors or technicians from accessing unauthorized business operations.
- Daily Automated Backups: Customer list databases, service histories, and settings are backed up automatically every 24 hours to secure offsite servers.
- Password Safety: User passwords are encrypted natively. We do not store plain-text passwords and encourage the activation of Two-Factor Authentication (2FA).`,
  },
  {
    id: "cookies-tracking",
    title: "5. Session & Cookies Policy",
    icon: Globe,
    content: `We use cookies and equivalent web storage technologies (SessionStorage and LocalStorage) to keep you logged in and preserve your workspace preferences:

• Session Identifiers: We store active session tokens (e.g. portal_token, garage_token) temporarily to remember your authentication status and role access.
• Interface Preferences: We store configuration variables such as Sidebar collapse state and UI theme state (light/dark mode) to preserve your preferences.
• Control Options: You can configure your browser to reject cookies. However, doing so will prevent you from logging in and utilizing our secure cloud dashboard.`,
  },
  {
    id: "your-rights",
    title: "6. Your Rights & Controls",
    icon: FileText,
    content: `As an owner or customer on the platform, you maintain absolute control over your records:

- Access & Export: You can view and download CSV lists of your inventory, customer records, and invoice sheets at any time.
- Rectification: You can update your business name, logo, address, and profile credentials directly from the Profile and Settings pages.
- Deletion: If you decide to deactivate a staff account or delete a customer profile, the changes are processed instantly across your active workspace.
- Account Termination: To fully remove your garage workspace and purge all associated customer records from our database, you may contact our administrator support.`,
  },
  {
    id: "policy-updates",
    title: "7. Changes to This Policy",
    icon: Calendar,
    content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top.

You are advised to review this Privacy Policy periodically for any adjustments. Changes to this Privacy Policy are effective immediately upon being published on this page.`,
  },
  {
    id: "contact-support",
    title: "8. Contact Us",
    icon: Mail,
    content: `If you have any questions, clarifications, or complaints regarding this Privacy Policy, please feel free to reach out to our dedicated support desk:

• Support Email: support@garageapp.com
• Phone Assistance: +91 99789 72413 (Mon-Sat, 9 AM - 7 PM)
• Head Office: GaragePro Ecosystem Ltd., Ahmedabad - 380059`,
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [feedback, setFeedback] = useState(null); // 'yes' or 'no'
  const sectionRefs = useRef({});

  // Setup intersection observer to highlight active section on scroll
  useEffect(() => {
    const observers = [];

    const handleIntersect = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // Trigger when section occupies mid-screen
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) {
        observer.observe(el);
        sectionRefs.current[section.id] = el;
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Helper to highlight matching text from search query
  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(
      `(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-0.5 rounded font-semibold"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // Filter sections by search query
  const filteredSections = SECTIONS.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors duration-300">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-auto"
            >
              <ArrowLeft size={18} />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-extrabold text-xs"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                }}
              >
                GP
              </div>
              <span className="text-md font-extrabold tracking-tight text-slate-900 dark:text-white">
                GaragePro
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
              }}
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 bg-linear-to-b from-indigo-50/50 via-white to-transparent dark:from-indigo-950/20 dark:via-zinc-950 dark:to-transparent">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-30 dark:opacity-10 pointer-events-none blur-3xl bg-indigo-400" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full opacity-20 dark:opacity-5 pointer-events-none blur-3xl bg-blue-400" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex justify-center items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 mb-4 uppercase tracking-widest">
            <Link
              to="/"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-600 dark:text-zinc-300">
              Privacy Policy
            </span>
          </nav>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4">
            Privacy Policy
          </h1>

          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-200/50 dark:border-zinc-700/50">
              <Calendar size={13} className="text-indigo-500" />
              Last Updated: May 20, 2026
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-slate-200/50 dark:border-zinc-700/50">
              <Shield size={13} className="text-emerald-500" />
              General Data Protection Compliant
            </span>
          </div>

          {/* Search bar */}
          <div className="max-w-md mx-auto mt-8 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search privacy topics, terms..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-800 dark:text-zinc-100 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-950/20 shadow-sm transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── Main Content Grid ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table of Contents (Sticky sidebar) */}
          <nav className="hidden lg:block lg:col-span-3 sticky top-24 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-xs space-y-1.5 max-h-[75vh] overflow-y-auto scrollbar-hide">
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3 px-2">
              TABLE OF CONTENTS
            </p>
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-auto ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent"
                  }`}
                >
                  <Icon
                    size={15}
                    className={isActive ? "text-indigo-500" : "text-slate-400"}
                  />
                  <span className="truncate">{sec.title.substring(3)}</span>
                </button>
              );
            })}
          </nav>

          {/* Policy Detail Sections */}
          <div className="col-span-1 lg:col-span-9 space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredSections.length > 0 ? (
                filteredSections.map((sec, idx) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <motion.article
                      key={sec.id}
                      id={sec.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(idx * 0.05, 0.25),
                      }}
                      className={`bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
                        isActive
                          ? "border-indigo-300 dark:border-indigo-800/60 shadow-md shadow-indigo-100/10"
                          : "border-slate-200/80 dark:border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800">
                        <div
                          className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                              : "bg-slate-50 text-slate-400 dark:bg-zinc-800/50 dark:text-zinc-500"
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                          {highlightText(sec.title, searchQuery)}
                        </h2>
                      </div>

                      <div className="text-sm font-medium text-slate-600 dark:text-zinc-300 leading-relaxed space-y-4 whitespace-pre-line">
                        {highlightText(sec.content, searchQuery)}
                      </div>
                    </motion.article>
                  );
                })
              ) : (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                  <Search
                    size={36}
                    className="mx-auto text-slate-300 dark:text-zinc-700 mb-4 animate-bounce"
                  />
                  <p className="text-slate-600 dark:text-zinc-300 font-bold mb-1">
                    No results match "{searchQuery}"
                  </p>
                  <p className="text-slate-400 dark:text-zinc-500 text-xs mb-5">
                    Try checking spelling or search a different phrase.
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl text-xs font-bold hover:bg-indigo-100/60 transition-all cursor-auto"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </AnimatePresence>

            {/* Quick Contact / Support box */}
            <div className="bg-linear-to-br from-indigo-500 to-indigo-600 dark:from-indigo-650 dark:to-indigo-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-500/10">
              {/* Blobs */}
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none translate-x-12 translate-y-12" />
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none -translate-x-6 -translate-y-6" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg sm:text-xl">
                    Have custom privacy requests?
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-100 max-w-lg leading-relaxed">
                    Under the GDPR and CCPA regulations, you have right to purge
                    all service database records, request full account
                    summaries, or edit system accesses.
                  </p>
                </div>
                <a
                  href="mailto:support@garageapp.com?subject=Privacy%20Request"
                  className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:bg-slate-50 transition-all shrink-0 cursor-auto self-start md:self-auto"
                >
                  <Mail size={16} />
                  Submit Request
                </a>
              </div>
            </div>

            {/* Acknowledge and Feedback Widget */}
            <div className="bg-slate-100 dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HelpCircle className="text-slate-400 shrink-0" size={20} />
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200">
                    Did this privacy policy address your queries?
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500">
                    Help us improve system transparency.
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {feedback ? (
                  <motion.div
                    key="thank-you"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold"
                  >
                    <CheckCircle2 size={15} />
                    Thank you for your feedback!
                  </motion.div>
                ) : (
                  <motion.div
                    key="feedback-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2"
                  >
                    <button
                      onClick={() => setFeedback("yes")}
                      className="flex items-center gap-1 text-xs text-slate-650 hover:text-emerald-600 border border-slate-200/60 bg-white dark:bg-zinc-850 dark:border-zinc-800 px-3 py-1.5 rounded-xl transition-all cursor-auto font-bold"
                    >
                      <ThumbsUp size={12} /> Yes
                    </button>
                    <button
                      onClick={() => setFeedback("no")}
                      className="flex items-center gap-1 text-xs text-slate-650 hover:text-red-500 border border-slate-200/60 bg-white dark:bg-zinc-850 dark:border-zinc-800 px-3 py-1.5 rounded-xl transition-all cursor-auto font-bold"
                    >
                      <ThumbsDown size={12} /> No
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-zinc-800/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 dark:bg-zinc-850 p-1.5 rounded">
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-extrabold text-slate-700 dark:text-zinc-300">
              GaragePro Privacy Standards
            </span>
          </div>
          <p>© 2026 GaragePro Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
