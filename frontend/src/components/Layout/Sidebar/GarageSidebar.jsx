import React, { useState, useEffect, useMemo, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  Package,
  Settings,
  HelpCircle,
  X,
  UserCog,
  Bell,
  UserPlus,
  ReceiptIndianRupeeIcon,
  ChevronDown,
  Calendar,
  MapPin,
  Store,
  Tag,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { FaCar } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { useNotifications } from "../../../context/NotificationContext";
import ThemeToggle from "../../theme/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { ROLE_LABELS } from "../../../utils/roles";

// ─── Navigation config ────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Main Menu",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "owner", "advisor", "mechanic"],
      },
      {
        name: "Customers",
        path: "/customers",
        icon: Users,
        roles: ["admin", "owner", "advisor", "mechanic"],
      },
      {
        name: "Requested Customers",
        path: "/requested-customers",
        icon: UserPlus,
        roles: ["admin", "owner"],
      },
      {
        name: "Partnership Leads",
        path: "/partnership-leads",
        icon: Store,
        roles: ["admin"],
      },
      {
        name: "Vehicles",
        path: "/vehicles",
        icon: FaCar,
        roles: ["admin", "owner", "advisor", "mechanic"],
      },
      {
        name: "Job Cards",
        path: "/job-cards",
        icon: FileText,
        roles: ["admin", "owner", "advisor", "mechanic"],
      },
      {
        name: "Services",
        path: "/services",
        icon: Wrench,
        roles: ["admin", "owner", "advisor", "mechanic"],
      },
      {
        name: "Inventory",
        path: "/inventory",
        icon: Package,
        roles: ["admin", "owner", "advisor", "mechanic"],
      },
      {
        name: "Billing",
        path: "/billing",
        icon: ReceiptIndianRupeeIcon,
        roles: ["admin", "owner"],
      },
      {
        name: "Sell Cars",
        path: "/sell-vehicles",
        icon: Tag,
        roles: ["admin", "owner"],
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        name: "Staff Members",
        path: "/staff-members",
        icon: UserCog,
        roles: ["admin", "owner"],
      },
      {
        name: "Reminders",
        path: "/reminders",
        icon: Calendar,
        roles: ["admin", "owner"],
      },
      {
        name: "Notifications",
        path: "/notifications",
        icon: Bell,
        roles: ["admin", "owner"],
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Settings",
        path: "/settings",
        icon: Settings,
        roles: ["admin", "owner"],
      },
      {
        name: "Help Center",
        path: "/help",
        icon: HelpCircle,
        roles: ["admin", "owner", "advisor", "mechanic"],
      },
    ],
  },
];

// ─── Quick-link paths (rendered separately, excluded from main nav) ────────────

const QUICK_LINK_PATHS = new Set(["/dashboard", "/partnership-leads"]);

// ─── Sub-components ───────────────────────────────────────────────────────────

const SidebarNavLink = React.memo(function SidebarNavLink({
  to,
  icon: Icon,
  label,
  showBadge = false,
  isCollapsedDesktop,
  unreadCount,
}) {
  return (
    <NavLink
      to={to}
      title={isCollapsedDesktop ? label : undefined}
      className={({ isActive }) =>
        [
          "relative flex w-full min-h-11 items-center rounded-xl text-sm font-semibold",
          "transition-colors duration-200 group",
          isCollapsedDesktop ? "justify-center py-3" : "gap-3 px-3 py-2.5",
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Icon + optional badge */}
          <div className="relative flex shrink-0 items-center justify-center">
            <Icon
              size={18}
              className={[
                "transition-colors duration-200",
                isActive
                  ? "text-white"
                  : "text-slate-500 dark:text-gray-500 group-hover:text-slate-700 dark:group-hover:text-gray-300",
              ].join(" ")}
            />
            {showBadge && unreadCount > 0 && !isActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm animate-pulse" />
            )}
          </div>

          {/* Label (expanded mode) */}
          {!isCollapsedDesktop && <span className="truncate">{label}</span>}

          {/* Tooltip (collapsed mode) */}
          {isCollapsedDesktop && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-100 border border-slate-700 dark:border-white/10 shadow-xl">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
});

const LogoEl = React.memo(function LogoEl({ size = "w-9 h-9", iconSize = 18 }) {
  const { user, selectedGarage } = useAuth();
  const role = user?.role?.toLowerCase() ?? "mechanic";
  const targetUser = role === "admin" && selectedGarage ? selectedGarage : user;

  const cacheBuster = useMemo(() => {
    if (targetUser?.updatedAt) {
      return `t=${new Date(targetUser.updatedAt).getTime()}`;
    }
    if (typeof window !== "undefined") {
      return `t_init=${
        window.__sidebar_mount_time ??
        (window.__sidebar_mount_time = Date.now())
      }`;
    }
    return "t_init=0";
  }, [targetUser?.updatedAt, targetUser?.logo]);

  if (!targetUser) return null;

  const logoSrc = targetUser.logo
    ? targetUser.logo.startsWith("http")
      ? `${targetUser.logo}${targetUser.logo.includes("?") ? "&" : "?"}${cacheBuster}`
      : `${import.meta.env.VITE_BASE_URL}/${targetUser.logo}?${cacheBuster}`
    : null;

  return (
    <div
      className={`${size} rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-lg`}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt="logo"
          className="w-full h-full object-contain p-1.5"
          loading="eager"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "";
          }}
        />
      ) : (
        <Wrench size={iconSize} className="text-blue-500 dark:text-blue-400" />
      )}
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function GarageSidebar({
  isOpen,
  onClose,
  showNotifications,
  collapsed,
  setCollapsed,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, selectedGarage, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const role = user?.role?.toLowerCase() ?? "mechanic";
  const isOwner = role === "owner";

  const isAdminDashboard =
    role === "admin" &&
    location.pathname.startsWith("/dashboard") &&
    !selectedGarage;

  // ── Local state ──────────────────────────────────────────────────────────────

  const [openSections, setOpenSections] = useState(() => {
    const saved = sessionStorage.getItem("sidebar_open_sections");
    return saved ? JSON.parse(saved) : NAV_SECTIONS.map(() => true);
  });

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  const sidebarRef = useRef(null);

  // ── Derived values ───────────────────────────────────────────────────────────

  const isCollapsedDesktop = collapsed && isDesktop;
  const isProfileActive =
    location.pathname === "/profile" ||
    location.pathname.startsWith("/profile/");

  const garageName =
    role === "admin"
      ? (selectedGarage?.garageName ?? "Admin Dashboard")
      : (user?.businessName ?? user?.garageName ?? "Garage Name");

  const rawAddress =
    role === "admin" && selectedGarage
      ? selectedGarage.address
      : (user?.address ?? user?.garageAddress ?? "");

  const formattedAddress = useMemo(
    () => (rawAddress ? rawAddress.replace(/,([^\s])/g, ", $1") : ""),
    [rawAddress],
  );

  // ── Side effects ─────────────────────────────────────────────────────────────

  // Responsive breakpoint listener
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Persist collapsed state + CSS variable
  useEffect(() => {
    sessionStorage.setItem("sidebar_collapsed", collapsed);
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "80px" : "280px",
    );
  }, [collapsed]);

  // Persist open sections
  useEffect(() => {
    sessionStorage.setItem(
      "sidebar_open_sections",
      JSON.stringify(openSections),
    );
  }, [openSections]);

  // Restore scroll position
  useEffect(() => {
    const nav = sidebarRef.current;
    if (!nav) return;

    const saved = sessionStorage.getItem("sidebar_scroll");
    if (saved) nav.scrollTop = parseInt(saved, 10);

    const handleScroll = () =>
      sessionStorage.setItem("sidebar_scroll", nav.scrollTop);

    nav.addEventListener("scroll", handleScroll);
    return () => nav.removeEventListener("scroll", handleScroll);
  }, []);

  // Close on mobile route change
  useEffect(() => {
    if (!isDesktop && isOpen) onClose();
  }, [location.pathname, isDesktop]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const toggleSection = (idx) =>
    setOpenSections((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  const toggleCollapsed = () => {
    if (isDesktop) setCollapsed((c) => !c);
  };

  // ── Animation variants ───────────────────────────────────────────────────────

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { duration: 0.12, ease: "linear" },
    },
    closed: {
      x: isDesktop ? 0 : "-100%",
      transition: { duration: 0.12, ease: "linear" },
    },
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isOpen || isDesktop ? "open" : "closed"}
        variants={sidebarVariants}
        className={[
          "fixed top-0 left-0 z-50 h-screen flex flex-col",
          "bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800",
          "overflow-hidden transition-[width] duration-300 ease-in-out",
          "shadow-xl lg:shadow-none",
          isDesktop ? (collapsed ? "w-20" : "w-68") : "w-[85vw] max-w-80",
        ].join(" ")}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col shrink-0 border-b border-slate-200 dark:border-white/5">
          {isCollapsedDesktop ? (
            // Collapsed: just the logo
            <div className="flex items-center justify-center py-4 px-2">
              <div
                onClick={toggleCollapsed}
                className="shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <LogoEl size="w-10 h-10" iconSize={20} />
              </div>
            </div>
          ) : (
            // Expanded: logo + garage info
            <div className="flex flex-col gap-3 pt-5.5 pb-4.5 px-5.5">
              <div className="flex items-center justify-between">
                <div
                  onClick={toggleCollapsed}
                  className="shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <LogoEl size="w-16 h-16" iconSize={32} />
                </div>

                {!isDesktop && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 self-center"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="min-w-0 flex flex-col">
                <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug tracking-tight wrap-break-words">
                  {garageName}
                </h2>

                {formattedAddress && (
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-400"
                    />
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-medium wrap-break-words">
                      {formattedAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Quick links ─────────────────────────────────────────────────────── */}
        <div className="px-3 py-1.5 border-b border-slate-200 dark:border-white/5 shrink-0">
          <div className="flex flex-col gap-1">
            <SidebarNavLink
              to="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              isCollapsedDesktop={isCollapsedDesktop}
              unreadCount={unreadCount}
            />

            {role === "admin" && (
              <SidebarNavLink
                to="/partnership-leads"
                icon={Store}
                label="Partnership Leads"
                isCollapsedDesktop={isCollapsedDesktop}
                unreadCount={unreadCount}
              />
            )}
          </div>
        </div>

        {/* ── Main navigation ──────────────────────────────────────────────────── */}
        <nav
          ref={sidebarRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2.5 scrollbar-thin"
        >
          {NAV_SECTIONS.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => {
              if (QUICK_LINK_PATHS.has(item.path)) return false;
              if (!item.roles.includes(role)) return false;
              if (role === "admin" && !selectedGarage) return false;
              return true;
            });

            if (!visibleItems.length) return null;

            const isOpenSection = openSections[sIdx];

            return (
              <div
                key={section.label}
                className={isCollapsedDesktop ? "mb-2" : "mb-5"}
              >
                {!isCollapsedDesktop && (
                  <button
                    onClick={() => toggleSection(sIdx)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">
                      {section.label}
                    </span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${
                        isOpenSection ? "" : "-rotate-90"
                      }`}
                    />
                  </button>
                )}

                {(isOpenSection || isCollapsedDesktop) && (
                  <div className="space-y-1 mt-1">
                    {visibleItems.map((item) => (
                      <SidebarNavLink
                        key={item.path}
                        to={item.path}
                        icon={item.icon}
                        label={item.name}
                        showBadge={item.name === "Notifications"}
                        isCollapsedDesktop={isCollapsedDesktop}
                        unreadCount={unreadCount}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div
          className={`border-t border-slate-200 dark:border-white/5 ${
            isCollapsedDesktop ? "p-2" : "p-3"
          }`}
        >
          {/* Admin-only actions */}
          {isAdminDashboard && (
            <div
              className={`mb-3 flex flex-col gap-2 ${
                isCollapsedDesktop ? "items-center" : "items-start"
              }`}
            >
              <div
                className={`flex w-full ${
                  isCollapsedDesktop ? "justify-center" : "justify-start px-1"
                }`}
              >
                <ThemeToggle />
              </div>

              <button
                type="button"
                onClick={() => navigate("/portal/dashboard")}
                title="Customer Portal"
                className={[
                  "inline-flex w-full items-center rounded-2xl text-[15px] font-medium",
                  "transition-colors duration-200",
                  isCollapsedDesktop
                    ? "justify-center p-3"
                    : "justify-start gap-4 px-4 py-3.5",
                  "bg-zinc-800 text-zinc-100 hover:bg-zinc-700/80",
                ].join(" ")}
              >
                <ExternalLink size={22} className="shrink-0 stroke-2" />
                {!isCollapsedDesktop && <span>Customer Portal</span>}
              </button>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className={[
                  "inline-flex w-full items-center rounded-2xl text-[15px] font-medium",
                  "transition-colors duration-200",
                  isCollapsedDesktop
                    ? "justify-center p-3"
                    : "justify-start gap-4 px-4 py-3.5",
                  "bg-red-950/20 text-red-400 hover:bg-red-950/40",
                ].join(" ")}
              >
                <LogOut size={22} className="shrink-0 stroke-2" />
                {!isCollapsedDesktop && <span>Sign Out</span>}
              </button>
            </div>
          )}

          {/* User profile button */}
          <button
            type="button"
            onClick={() => isOwner && navigate("/profile")}
            disabled={!isOwner}
            aria-disabled={!isOwner}
            className={[
              "w-full flex items-center rounded-xl text-sm font-semibold transition-colors duration-200",
              isCollapsedDesktop ? "justify-center py-3" : "gap-3 px-3 py-2",
              isProfileActive
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200/70 dark:active:bg-white/5",
              !isOwner ? "cursor-auto opacity-70" : "",
            ].join(" ")}
          >
            {/* Avatar */}
            <div
              className={[
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 transition-colors",
                isProfileActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-600/20 text-blue-500",
              ].join(" ")}
            >
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>

            {/* User details + role badge (expanded mode only) */}
            {!isCollapsedDesktop && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`text-sm font-semibold truncate transition-colors ${
                      isProfileActive
                        ? "text-white"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {user?.name ?? "User"}
                  </p>
                  <p
                    className={`text-[11px] truncate transition-colors ${
                      isProfileActive
                        ? "text-blue-100"
                        : "text-slate-500 dark:text-gray-500"
                    }`}
                  >
                    {user?.email}
                  </p>
                </div>

                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shrink-0 transition-colors ${
                    isProfileActive
                      ? "bg-white/20 text-white"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {ROLE_LABELS[role] ?? role}
                </span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
