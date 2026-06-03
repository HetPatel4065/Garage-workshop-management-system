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
  ShieldCheck,
  Store,
  HardHat,
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

const SidebarNavLink = React.memo(
  ({
    to,
    icon: Icon,
    label,
    showBadge = false,
    isCollapsedDesktop,
    unreadCount,
  }) => (
    <NavLink
      to={to}
      title={isCollapsedDesktop ? label : undefined}
      className={({ isActive }) =>
        `relative flex w-full min-h-11 items-center rounded-xl text-sm font-semibold transition-colors duration-200 group ${
          isCollapsedDesktop ? "justify-center py-3" : "gap-3 px-3 py-2.5"
        } ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative flex shrink-0 items-center justify-center">
            <Icon
              size={18}
              className={`transition-colors duration-200 ${
                isActive
                  ? "text-white"
                  : "text-slate-500 dark:text-gray-500 group-hover:text-slate-700 dark:group-hover:text-gray-300"
              }`}
            />
            {showBadge && unreadCount > 0 && !isActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm animate-pulse" />
            )}
          </div>
          {!isCollapsedDesktop && <span className="truncate">{label}</span>}
          {isCollapsedDesktop && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-100 border border-slate-700 dark:border-white/10 shadow-xl">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  ),
);
SidebarNavLink.displayName = "SidebarNavLink";

const LogoEl = React.memo(({ size = "w-9 h-9", iconSize = 18 }) => {
  const { user, selectedGarage } = useAuth();
  const role = user?.role?.toLowerCase() || "mechanic";
  const targetUser = role === "admin" && selectedGarage ? selectedGarage : user;

  const cacheBuster = useMemo(() => {
    if (targetUser?.updatedAt) {
      return `t=${new Date(targetUser.updatedAt).getTime()}`;
    }
    if (typeof window !== "undefined") {
      return `t_init=${window.__sidebar_mount_time || (window.__sidebar_mount_time = Date.now())}`;
    }
    return "t_init=0";
  }, [targetUser?.updatedAt, targetUser?.logo]);

  if (!targetUser) return null;

  return (
    <div
      className={`${size} rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-lg`}
    >
      {targetUser?.logo ? (
        <img
          src={
            targetUser.logo.startsWith("http")
              ? `${targetUser.logo}${targetUser.logo.includes("?") ? "&" : "?"}${cacheBuster}`
              : `${import.meta.env.VITE_BASE_URL}/${targetUser.logo}?${cacheBuster}`
          }
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
LogoEl.displayName = "LogoEl";

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
  const role = user?.role?.toLowerCase() || "mechanic";
  const { unreadCount } = useNotifications();
  const isAdminDashboard =
    role === "admin" &&
    location.pathname.startsWith("/dashboard") &&
    !selectedGarage;

  const [openSections, setOpenSections] = useState(() => {
    const saved = sessionStorage.getItem("sidebar_open_sections");
    return saved ? JSON.parse(saved) : NAV_SECTIONS.map(() => true);
  });

  const sidebarRef = useRef(null);

  // Robust desktop detection without re-render loops
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (e) => setIsDesktop(e.matches);

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    sessionStorage.setItem("sidebar_collapsed", collapsed);
    const width = collapsed ? "80px" : "280px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [collapsed]);

  // Persist open sections state
  useEffect(() => {
    sessionStorage.setItem(
      "sidebar_open_sections",
      JSON.stringify(openSections),
    );
  }, [openSections]);

  // Restore scroll position
  useEffect(() => {
    const nav = sidebarRef.current;
    if (nav) {
      const savedScroll = sessionStorage.getItem("sidebar_scroll");
      if (savedScroll) nav.scrollTop = parseInt(savedScroll, 10);

      const handleScroll = () => {
        sessionStorage.setItem("sidebar_scroll", nav.scrollTop);
      };
      nav.addEventListener("scroll", handleScroll);
      return () => nav.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (!isDesktop && isOpen) {
      onClose();
    }
  }, [location.pathname, isDesktop]);

  const isActive = (path) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(`${path}/`);
  };

  const toggleSection = (idx) =>
    setOpenSections((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  const garageName =
    role === "admin"
      ? selectedGarage
        ? selectedGarage.garageName
        : "Admin Dashboard"
      : user?.businessName || user?.garageName || "Garage Name";

  const address =
    role === "admin" && selectedGarage
      ? selectedGarage.address
      : user?.address || user?.garageAddress || "";

  const formattedAddress = useMemo(() => {
    if (!address) return "";
    return address.replace(/,([^\s])/g, ", $1");
  }, [address]);

  const isCollapsedDesktop = collapsed && isDesktop;
  const isOwner = role === "owner";

  // Evaluates dynamically instead of using a broken mock false state
  const isProfileActive = isActive("/profile");

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        duration: 0.12,
        ease: "linear",
      },
    },
    closed: {
      x: isDesktop ? 0 : "-100%",
      transition: {
        duration: 0.12,
        ease: "linear",
      },
    },
  };
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
        className={`fixed top-0 left-0 z-50 h-screen flex flex-col bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 overflow-hidden transition-[width] duration-300 ease-in-out shadow-xl lg:shadow-none
        ${isDesktop ? (collapsed ? "w-20" : "w-70") : "w-[85vw] max-w-80"}
    `}
      >
        {/* HEADER */}
        <div className="flex flex-col shrink-0 border-b border-slate-200 dark:border-white/5">
          {isCollapsedDesktop ? (
            <div className="flex items-center justify-center py-4 px-2">
              {/* Logo Container */}
              <div
                onClick={() => isDesktop && setCollapsed(!collapsed)}
                className="shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <LogoEl size="w-10 h-10" iconSize={20} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 pt-6 pb-5 px-6">
              {/* Top Row: Logo & Buttons */}
              <div className="flex items-center justify-between">
                <div
                  onClick={() => isDesktop && setCollapsed(!collapsed)}
                  className="shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <LogoEl size="w-16 h-16" iconSize={32} />
                </div>

                <div className="flex items-center gap-1">
                  {/* Mobile Close Button */}
                  {!isDesktop && (
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 self-center"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Garage Info - Stacked below logo for maximum readability */}
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

        {/* QUICK LINKS */}
        <div className="px-3 py-3 border-b border-slate-200 dark:border-white/5 shrink-0">
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

        {/* NAVIGATION */}
        <nav
          ref={sidebarRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin"
        >
          {NAV_SECTIONS.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => {
              if (
                item.path === "/dashboard" ||
                item.path === "/partnership-leads"
              )
                return false;

              if (!item.roles.includes(role)) return false;

              if (role === "admin" && !selectedGarage) {
                return false;
              }

              return true;
            });

            if (!visibleItems.length) return null;

            const isOpenSection = openSections[sIdx];

            return (
              <div
                key={section.label}
                className={`${isCollapsedDesktop ? "mb-2" : "mb-5"}`}
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

        {/* FOOTER */}
        <div
          className={`border-t border-slate-200 dark:border-white/5 ${
            isCollapsedDesktop ? "p-2" : "p-3"
          }`}
        >
          {isAdminDashboard && (
            <div
              className={`mb-3 flex flex-col gap-2 ${
                isCollapsedDesktop ? "items-center" : "items-start"
              }`}
            >
              {/* Theme Toggle - Circular and Left-Aligned */}
              <div
                className={`flex w-full ${isCollapsedDesktop ? "justify-center" : "justify-start px-1"}`}
              >
                <ThemeToggle />
              </div>

              {/* Customer Portal Button */}
              <button
                type="button"
                onClick={() => navigate("/portal/dashboard")}
                title="Customer Portal"
                className={`inline-flex w-full items-center rounded-2xl text-[15px] font-medium transition-colors duration-200 ${
                  isCollapsedDesktop
                    ? "justify-center p-3"
                    : "justify-start gap-4 px-4 py-3.5"
                } bg-zinc-800 text-zinc-100 hover:bg-zinc-700/80`}
              >
                <ExternalLink size={22} className="shrink-0 stroke-2" />
                {!isCollapsedDesktop && <span>Customer Portal</span>}
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className={`inline-flex w-full items-center rounded-2xl text-[15px] font-medium transition-colors duration-200 ${
                  isCollapsedDesktop
                    ? "justify-center p-3"
                    : "justify-start gap-4 px-4 py-3.5"
                } bg-red-950/20 text-red-400 hover:bg-red-950/40`}
              >
                <LogOut size={22} className="shrink-0 stroke-2" />
                {!isCollapsedDesktop && <span>Sign Out</span>}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (!isOwner) return;
              navigate("/profile");
            }}
            disabled={!isOwner}
            aria-disabled={!isOwner}
            className={`w-full flex items-center rounded-xl text-sm font-semibold transition-colors duration-200 ${
              isCollapsedDesktop ? "justify-center py-3" : "gap-3 px-3 py-2.5"
            } ${
              isProfileActive
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200/70 dark:active:bg-white/5"
            } ${!isOwner ? "cursor-auto opacity-70" : ""}`}
          >
            {/* User Avatar Container */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 transition-colors ${
                isProfileActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-600/20 text-blue-500"
              }`}
            >
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>

            {!isCollapsedDesktop && (
              <>
                {/* User Details */}
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`text-sm font-semibold truncate transition-colors ${
                      isProfileActive
                        ? "text-white"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {user?.name || "User"}
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

                {/* Role Badge */}
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
