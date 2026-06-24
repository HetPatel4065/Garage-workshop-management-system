import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  createContext,
  useContext,
} from "react";
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
      {
        name: "Activity Log",
        path: "/activity-log",
        icon: FileText,
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

const QUICK_LINK_PATHS = new Set(["/dashboard", "/partnership-leads"]);

// ─── Context (avoids prop-drilling isCollapsedDesktop to every nav link) ──────

const SidebarCtx = createContext(false);

// ─── SidebarNavLink ───────────────────────────────────────────────────────────

const SidebarNavLink = React.memo(function SidebarNavLink({
  to,
  icon: Icon,
  label,
  showBadge = false,
  unreadCount,
}) {
  // Read from context — changing collapsed won't re-render via prop
  const isCollapsedDesktop = useContext(SidebarCtx);

  return (
    <NavLink
      to={to}
      title={isCollapsedDesktop ? label : undefined}
      className={({ isActive }) =>
        [
          "relative flex w-full min-h-11 items-center rounded-xl text-sm font-semibold",
          "transition-colors duration-150 group",
          isCollapsedDesktop ? "justify-center py-3" : "gap-3 px-3 py-2.5",
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative flex shrink-0 items-center justify-center">
            <Icon
              size={18}
              className={[
                "transition-colors duration-150",
                isActive
                  ? "text-white"
                  : "text-slate-500 dark:text-gray-500 group-hover:text-slate-700 dark:group-hover:text-gray-300",
              ].join(" ")}
            />
            {showBadge && unreadCount > 0 && !isActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 shadow-sm animate-pulse" />
            )}
          </div>
          {!isCollapsedDesktop && <span className="truncate">{label}</span>}

          {/* Appears next to the current component on hover when in collapsed mode */}

          {isCollapsedDesktop && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 dark:bg-white text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-100 border border-slate-700 dark:border-white shadow-xl">
              {label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
});

// ─── LogoEl ───

const LogoEl = React.memo(function LogoEl({ size = "w-9 h-9", iconSize = 18 }) {
  const { user, selectedGarage } = useAuth();
  const role = user?.role?.toLowerCase() ?? "mechanic";
  const targetUser = role === "admin" && selectedGarage ? selectedGarage : user;

  // Stable cache-buster — only recomputes when updatedAt or logo actually changes
  const cacheBuster = useMemo(() => {
    if (targetUser?.updatedAt) {
      return `t=${new Date(targetUser.updatedAt).getTime()}`;
    }
    return "t=0";
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

// ─── Main component ───

export default function GarageSidebar({
  isOpen,
  onClose,
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
    (location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/partnership-leads")) &&
    !selectedGarage;

  // ── Local state ──

  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = sessionStorage.getItem("sidebar_open_sections");
      return saved ? JSON.parse(saved) : NAV_SECTIONS.map(() => true);
    } catch {
      return NAV_SECTIONS.map(() => true);
    }
  });

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );

  const sidebarRef = useRef(null);

  // ── Derived values ──

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

  // ── Side effects ──

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("sidebar_collapsed", String(collapsed));
    } catch {}
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "80px" : "280px",
    );
  }, [collapsed]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "sidebar_open_sections",
        JSON.stringify(openSections),
      );
    } catch {}
  }, [openSections]);

  // Restore scroll position
  useEffect(() => {
    const nav = sidebarRef.current;
    if (!nav) return;
    try {
      const saved = sessionStorage.getItem("sidebar_scroll");
      if (saved) nav.scrollTop = parseInt(saved, 10);
    } catch {}
    const handleScroll = () => {
      try {
        sessionStorage.setItem("sidebar_scroll", String(nav.scrollTop));
      } catch {}
    };
    nav.addEventListener("scroll", handleScroll, { passive: true });
    return () => nav.removeEventListener("scroll", handleScroll);
  }, []);

  // Close on mobile route change
  useEffect(() => {
    if (!isDesktop && isOpen) onClose();
  }, [location.pathname, isDesktop]);

  // ── Handlers ──

  const toggleSection = (idx) =>
    setOpenSections((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  const toggleCollapsed = () => {
    if (isDesktop) setCollapsed((c) => !c);
  };

  // ── Render ──

  return (
    <SidebarCtx.Provider value={isCollapsedDesktop}>
      {/* Mobile overlay — pure CSS transition, no framer-motion */}
      <div
        style={{
          transform:
            isDesktop && collapsed ? `scaleX(${280 / 80})` : "scaleX(1)",
          transformOrigin: "left center",
          transition: "transform 300ms cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
        className="h-full flex flex-col"
      />
      <aside
        style={{
          width: isDesktop ? (collapsed ? "80px" : "280px") : undefined,
          transition: isDesktop
            ? "width 300ms cubic-bezier(0.25,0.46,0.45,0.94)"
            : undefined,
          willChange: "width",
        }}
        className={[
          isDesktop
            ? "relative shrink-0 z-50 h-screen flex flex-col overflow-hidden"
            : "fixed top-0 left-0 z-50 h-screen flex flex-col overflow-hidden w-[85vw] max-w-80",
          "bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800",
          !isDesktop && (isOpen ? "translate-x-0" : "-translate-x-full"),
          !isDesktop &&
            "transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        ].join(" ")}
      >
        {/* ── Header ── */}
        <div className="flex flex-col shrink-0 border-b border-slate-200 dark:border-white/5">
          {isCollapsedDesktop ? (
            <div className="flex items-center justify-center py-4 px-2">
              <div
                onClick={toggleCollapsed}
                className="shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <LogoEl size="w-10 h-10" iconSize={20} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-5 pb-4 px-5">
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
                <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug tracking-tight break-word">
                  {garageName}
                </h2>

                {formattedAddress && (
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-400"
                    />
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed font-medium break-word">
                      {formattedAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Quick links ── */}
        <div className="px-3 py-1.5 border-b border-slate-200 dark:border-white/5 shrink-0">
          <div className="flex flex-col gap-1">
            <SidebarNavLink
              to="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              unreadCount={unreadCount}
            />
            {role === "admin" && (
              <SidebarNavLink
                to="/partnership-leads"
                icon={Store}
                label="Partnership Leads"
                unreadCount={unreadCount}
              />
            )}
          </div>
        </div>

        {/* ── Main navigation ── */}
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
                        unreadCount={unreadCount}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div
          className={`border-t border-slate-200 dark:border-white/5 ${isCollapsedDesktop ? "p-2" : "p-3"}`}
        >
          {/* Admin-only actions */}
          {isAdminDashboard && (
            <div
              className={`mb-3 flex flex-col gap-2 ${isCollapsedDesktop ? "items-center" : "items-start"}`}
            >
              {/* Theme Toggle */}
              <div
                className={[
                  "flex w-full items-center rounded-xl text-[15px] font-medium transition-colors duration-150",
                  isCollapsedDesktop
                    ? "justify-center p-2.5"
                    : "justify-start gap-3 px-3 py-2.5",
                  "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5",
                ].join(" ")}
              >
                <div className="flex items-center justify-center shrink-0">
                  <ThemeToggle />
                </div>
                {!isCollapsedDesktop && (
                  <span className="select-none text-sm font-medium text-slate-600 dark:text-slate-400">
                    Appearance
                  </span>
                )}
              </div>

              {/* Customer Portal */}
              <button
                type="button"
                onClick={() => navigate("/portal/dashboard")}
                title="Customer Portal"
                className={[
                  "inline-flex w-full items-center rounded-2xl text-[15px] font-medium",
                  "transition-colors duration-150",
                  isCollapsedDesktop
                    ? "justify-center p-3"
                    : "justify-start gap-4 px-4 py-3",
                  "bg-slate-200 text-slate-800 hover:bg-slate-300/80 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15",
                ].join(" ")}
              >
                <ExternalLink size={22} className="shrink-0 stroke-2" />
                {!isCollapsedDesktop && <span>Customer Portal</span>}
              </button>

              {/* Sign Out */}
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className={[
                  "inline-flex w-full items-center rounded-2xl text-[15px] font-medium",
                  "transition-colors duration-150",
                  isCollapsedDesktop
                    ? "justify-center p-3"
                    : "justify-start gap-4 px-4 py-3",
                  "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40",
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
              "w-full flex items-center rounded-xl text-sm font-semibold transition-colors duration-150",
              isCollapsedDesktop ? "justify-center py-3" : "gap-3 px-3 py-2.5",
              isProfileActive
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200/70 dark:active:bg-white/5",
              !isOwner ? "cursor-auto opacity-70" : "",
            ].join(" ")}
          >
            <div
              className={[
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 transition-colors",
                isProfileActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
              ].join(" ")}
            >
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>

            {!isCollapsedDesktop && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className={`text-sm font-semibold capitalize truncate transition-colors ${isProfileActive ? "text-white" : "text-slate-900 dark:text-white"}`}
                  >
                    {user?.name ?? "User"}
                  </p>
                  <p
                    className={`text-[11px] truncate transition-colors ${isProfileActive ? "text-blue-100" : "text-slate-500 dark:text-gray-500"}`}
                  >
                    {user?.email}
                  </p>
                </div>

                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shrink-0 transition-colors ${
                    isProfileActive
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  }`}
                >
                  {ROLE_LABELS[role] ?? role}
                </span>
              </>
            )}
          </button>
        </div>
      </aside>
    </SidebarCtx.Provider>
  );
}
