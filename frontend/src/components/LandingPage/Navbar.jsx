import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Wrench,
  Package,
  BarChart2,
  Smartphone,
  Clock,
  Shield,
  Users,
  FileText,
  CreditCard,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Features",
    href: "#features",
    children: [
      {
        icon: Wrench,
        label: "Digital Job Cards",
        desc: "Real-time job tracking & technician notes",
        href: "#features",
        color: "#6366f1",
        bg: "rgba(99,102,241,0.08)",
      },
      {
        icon: Package,
        label: "Smart Inventory",
        desc: "Automated stock alerts & parts management",
        href: "#features",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.08)",
      },
      {
        icon: BarChart2,
        label: "Business Insights",
        desc: "Daily, weekly & monthly revenue reports",
        href: "#features",
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.08)",
      },
      {
        icon: Smartphone,
        label: "WhatsApp Integration",
        desc: "Send invoices & updates to customers",
        href: "#features",
        color: "#10b981",
        bg: "rgba(16,185,129,0.08)",
      },
      {
        icon: Clock,
        label: "Appointment Booking",
        desc: "Manage workshop schedules effortlessly",
        href: "#features",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.08)",
      },
      {
        icon: Shield,
        label: "Secure Backups",
        desc: "Encrypted daily backups of all your data",
        href: "#features",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.08)",
      },
    ],
  },
  {
    label: "Solutions",
    href: "#features",
    children: [
      {
        icon: Users,
        label: "For Workshop Owners",
        desc: "Full control over staff, jobs & finances",
        href: "#features",
        color: "#6366f1",
        bg: "rgba(99,102,241,0.08)",
      },
      {
        icon: FileText,
        label: "For Service Advisors",
        desc: "Manage customers, vehicles & job cards",
        href: "#features",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.08)",
      },
      {
        icon: Wrench,
        label: "For Mechanics",
        desc: "View assigned jobs & update progress",
        href: "#features",
        color: "#10b981",
        bg: "rgba(16,185,129,0.08)",
      },
      {
        icon: CreditCard,
        label: "For Billing Teams",
        desc: "Fast invoice generation & payment tracking",
        href: "#features",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.08)",
      },
    ],
  },
  {
    label: "Pricing",
    href: "#pricing",
  },
  {
    label: "FAQ",
    href: "#faq",
  },
];

/* ─────────────────────────────────────────────
    DROPDOWN (desktop)
───────────────────────────────────────────── */
const Dropdown = ({ items, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-50"
        style={{ minWidth: items.length > 4 ? 560 : 340 }}
      >
        <div
          className="rounded-2xl p-4 shadow-2xl"
          style={{
            background: "var(--dropdown-bg)",
            border: "1.5px solid var(--dropdown-border)",
            backdropFilter: "blur(24px)",
            boxShadow:
              "0 24px 64px rgba(99,102,241,0.13), 0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className={`grid gap-1 ${
              items.length > 4 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-150 group"
                  style={{ textDecoration: "none" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: item.bg, color: item.color }}
                  >
                    <Icon size={17} />
                  </div>
                  <div>
                    <div
                      className="text-sm font-bold leading-snug"
                      style={{ color: "var(--dropdown-text)" }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="text-xs font-medium mt-0.5 leading-snug"
                      style={{ color: "var(--dropdown-desc)" }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─────────────────────────────────────────────
    MOBILE ACCORDION ITEM
───────────────────────────────────────────── */
const MobileNavItem = ({ item, onClose }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children;

  if (!hasChildren) {
    if (item.href.startsWith("/")) {
      return (
        <Link
          to={item.href}
          onClick={onClose}
          className="block text-base font-semibold py-2 transition-colors hover:text-indigo-600"
          style={{ color: "var(--text-heading)" }}
        >
          {item.label}
        </Link>
      );
    }
    return (
      <a
        href={item.href}
        onClick={onClose}
        className="block text-base font-semibold py-2 transition-colors hover:text-indigo-600"
        style={{ color: "var(--text-heading)" }}
      >
        {item.label}
      </a>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-base font-semibold py-2 transition-colors"
        style={{ color: open ? "#6366f1" : "var(--text-heading)" }}
      >
        {item.label}
        <ChevronDown
          size={17}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s",
            color: open ? "#6366f1" : "#94a3b8",
          }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="pl-3 pb-2 pt-1 flex flex-col gap-1">
              {item.children.map((child) => {
                const Icon = child.icon;
                return (
                  <a
                    key={child.label}
                    href={child.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{ textDecoration: "none" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = child.bg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: child.bg, color: child.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-heading)" }}
                    >
                      {child.label}
                    </span>
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────────────────────
    MAIN NAVBAR
───────────────────────────────────────────── */
export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* close mobile menu on resize to desktop */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const openDropdown = (label) => {
    clearTimeout(closeTimer.current);
    setActiveDropdown(label);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2 md:py-3" : "py-4 md:py-5"
      }`}
      style={
        scrolled
          ? {
              background: "var(--nav-bg)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid var(--nav-border)",
              boxShadow: "0 4px 32px rgba(99,102,241,0.08)",
            }
          : { background: "transparent" }
      }
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* ── Logo ── */}
        <Link
          to="/"
          className="flex items-center gap-2 md:gap-2.5 group"
          style={{ textDecoration: "none" }}
        >
          <div
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-xs md:text-sm group-hover:scale-110 transition-transform duration-300"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
            }}
          >
            GP
          </div>
          <span
            className="text-lg md:text-xl font-extrabold tracking-tight"
            style={{ color: "var(--text-heading)" }}
          >
            GaragePro
          </span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.children && openDropdown(item.label)}
              onMouseLeave={() => item.children && scheduleClose()}
            >
              {item.children ? (
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{
                    color:
                      activeDropdown === item.label
                        ? "#6366f1"
                        : "var(--text-muted)",
                    background:
                      activeDropdown === item.label
                        ? "rgba(99,102,241,0.07)"
                        : "transparent",
                  }}
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === item.label ? null : item.label,
                    )
                  }
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    style={{
                      transform:
                        activeDropdown === item.label
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s",
                      color:
                        activeDropdown === item.label ? "#6366f1" : "#94a3b8",
                    }}
                  />
                </button>
              ) : item.href.startsWith("/") ? (
                <Link
                  to={item.href}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:text-indigo-600 hover:bg-indigo-50"
                  style={{ color: "var(--text-muted)", textDecoration: "none" }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href={item.href}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:text-indigo-600 hover:bg-indigo-50"
                  style={{ color: "var(--text-muted)", textDecoration: "none" }}
                >
                  {item.label}
                </a>
              )}

              {item.children && (
                <div
                  onMouseEnter={() => openDropdown(item.label)}
                  onMouseLeave={() => scheduleClose()}
                >
                  <Dropdown
                    items={item.children}
                    visible={activeDropdown === item.label}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Tablet/Small Desktop Nav Links (Medium Screens) ── */}
        <div className="hidden md:flex lg:hidden items-center gap-1">
          {NAV_ITEMS.filter((i) => !i.children).map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.label}
                to={item.href}
                className="block px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:text-indigo-600 hover:bg-indigo-50"
                style={{ color: "var(--text-muted)", textDecoration: "none" }}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="block px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:text-indigo-600 hover:bg-indigo-50"
                style={{ color: "var(--text-muted)", textDecoration: "none" }}
              >
                {item.label}
              </a>
            ),
          )}
        </div>

        {/* ── Desktop CTA ── */}
        <div className="hidden md:flex items-center gap-2 md:gap-3">
          <Link
            to="/login"
            className="px-4 md:px-5 py-2 text-xs md:text-sm font-bold transition-colors duration-200 hover:text-indigo-600 rounded-xl hover:bg-indigo-50"
            style={{ color: "#64748b", textDecoration: "none" }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-white flex items-center gap-1.5 transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
              boxShadow: "0 4px 16px rgba(99,102,241,0.32)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 6px 24px rgba(99,102,241,0.48)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(99,102,241,0.32)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started
            <ArrowRight size={14} className="hidden sm:block" />
          </Link>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          className="md:hidden p-1.5 rounded-xl transition-colors"
          style={{ color: "#6366f1" }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="absolute top-full left-0 right-0 overflow-hidden md:hidden"
            style={{
              background: "var(--nav-bg)",
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid var(--nav-border)",
              boxShadow: "0 12px 40px rgba(99,102,241,0.10)",
            }}
          >
            <div className="p-4 flex flex-col gap-1 divide-y divide-indigo-50">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="py-1">
                  <MobileNavItem
                    item={item}
                    onClose={() => setMenuOpen(false)}
                  />
                </div>
              ))}

              {/* Mobile CTA */}
              <div className="flex flex-col gap-3 pt-4 mt-2">
                <Link
                  to="/login"
                  className="w-full py-3.5 font-bold text-center rounded-xl transition-all"
                  style={{
                    color: "#6366f1",
                    border: "1.5px solid rgba(99,102,241,0.25)",
                    background: "rgba(99,102,241,0.05)",
                    textDecoration: "none",
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="w-full py-3.5 rounded-xl text-white font-bold text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.30)",
                    textDecoration: "none",
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
