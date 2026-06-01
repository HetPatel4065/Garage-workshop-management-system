import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Search,
  LogOut,
  User,
  X,
  Menu,
  Bell,
  ExternalLink,
  Loader2,
  Wrench,
  ClipboardList,
  Users,
  Box,
  FileText,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { canAccessCustomerPortal } from "../../../utils/roles";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../../theme/ThemeToggle";
import { useNotifications } from "../../../context/NotificationContext";

const Highlight = ({ text = "", query = "" }) => {
  if (!query || !text) return <span>{text || ""}</span>;

  // Escape special characters for regex
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escapedQuery})`, "gi"));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-blue-500/30 text-blue-700 dark:bg-blue-500/40 dark:text-blue-200 rounded-sm px-0.5 font-bold no-underline"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
};

const ResultSection = ({ title, items, onSelect, renderItem }) => {
  if (!items?.length) return null;
  return (
    <section className="mb-3 last:mb-0">
      <div className="flex items-center justify-between px-3 py-1.5 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-slate-200 dark:border-white/5 mb-1">
        <p className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.2em]">
          {title}
        </p>
        <span className="text-[9px] font-bold text-slate-500 dark:text-gray-600 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
          {items.length}
        </span>
      </div>
      <div className="space-y-0.5 mt-1 px-1">
        {items.map((item, i) => (
          <button
            key={item._id || i}
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/5 focus:bg-slate-200 dark:focus:bg-white/10 outline-none rounded-xl text-left transition-all group"
          >
            {renderItem(item)}
          </button>
        ))}
      </div>
    </section>
  );
};

const ResultsDropdown = ({
  searchResults,
  isSearching,
  searchQuery,
  setSearchQuery,
  setShowResults,
  setMobileSearchOpen,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleSelect = (item) => {
    const q = item.searchParam || "";
    navigate(item.path + (q ? `?q=${encodeURIComponent(q)}` : ""));
    setShowResults(false);
    setSearchQuery("");
    setMobileSearchOpen?.(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setShowResults]);

  const iconBox = (color, children) => (
    <div
      className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-white/5`}
    >
      {children}
    </div>
  );

  const hasAnyResults = Object.values(searchResults).some(
    (arr) => arr.length > 0,
  );

  return (
    <div
      ref={dropdownRef}
      className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden ring-1 ring-slate-100 dark:ring-white/5"
    >
      <div className="max-h-[65vh] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-white/10 scroll-smooth">
        {isSearching ? (
          <div className="py-16 text-center text-slate-500 dark:text-gray-500 text-sm flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full" />
            </div>
            <span className="font-medium tracking-tight">
              Scanning records...
            </span>
          </div>
        ) : (
          <>
            {!hasAnyResults ? (
              <div className="py-12 text-center text-slate-500 dark:text-gray-500 flex flex-col items-center gap-3">
                <Search size={24} className="opacity-10" />
                <p className="text-sm">
                  No exact matches for{" "}
                  <span className="text-slate-700 dark:text-gray-300 font-bold">
                    "{searchQuery}"
                  </span>
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-white/5">
                <ResultSection
                  title="Customers"
                  items={searchResults.customers}
                  onSelect={(i) =>
                    handleSelect({
                      ...i,
                      path: "/customers",
                      searchParam: i.name,
                    })
                  }
                  renderItem={(c) => (
                    <>
                      {iconBox(
                        "bg-blue-500/10",
                        <User size={14} className="text-blue-400" />,
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <Highlight text={c.name} query={searchQuery} />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-gray-500 flex items-center gap-2">
                          <span>{c.phone}</span>
                          {c.email && (
                            <span className="w-1 h-1 bg-slate-300 dark:bg-gray-700 rounded-full" />
                          )}
                          <span className="truncate">{c.email}</span>
                        </p>
                      </div>
                    </>
                  )}
                />

                <ResultSection
                  title="Vehicles"
                  items={searchResults.vehicles}
                  onSelect={(i) =>
                    handleSelect({
                      ...i,
                      path: "/vehicles",
                      searchParam: i.licensePlate,
                    })
                  }
                  renderItem={(v) => (
                    <>
                      {iconBox(
                        "bg-emerald-500/10",
                        <span className="text-emerald-400 font-black text-[10px]">
                          {v.licensePlate?.slice(-4)}
                        </span>,
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          <Highlight
                            text={`${v.make} ${v.model}`}
                            query={searchQuery}
                          />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-gray-500 font-mono tracking-tighter uppercase">
                          {v.licensePlate}
                        </p>
                      </div>
                    </>
                  )}
                />

                <ResultSection
                  title="Inventory / Parts"
                  items={searchResults.inventory}
                  onSelect={(i) =>
                    handleSelect({
                      ...i,
                      path: "/inventory",
                      searchParam: i.name,
                    })
                  }
                  renderItem={(i) => (
                    <>
                      {iconBox(
                        "bg-amber-500/10",
                        <Box size={14} className="text-amber-400" />,
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          <Highlight text={i.name} query={searchQuery} />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-gray-500">
                          SKU: {i.sku} • Stock:{" "}
                          <span
                            className={
                              i.stock < 5
                                ? "text-red-400 font-bold"
                                : "text-amber-400/70"
                            }
                          >
                            {i.stock}
                          </span>
                        </p>
                      </div>
                    </>
                  )}
                />

                <ResultSection
                  title="Services"
                  items={searchResults.services}
                  onSelect={(i) =>
                    handleSelect({
                      ...i,
                      path: "/services",
                      searchParam: i.serviceName,
                    })
                  }
                  renderItem={(s) => (
                    <>
                      {iconBox(
                        "bg-purple-500/10",
                        <Wrench size={14} className="text-purple-400" />,
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          <Highlight text={s.serviceName} query={searchQuery} />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-gray-500">
                          Vehicle: {s.vehicleId?.licensePlate || "N/A"}
                        </p>
                      </div>
                    </>
                  )}
                />

                <ResultSection
                  title="Job Cards"
                  items={searchResults.jobCards}
                  onSelect={(i) =>
                    handleSelect({
                      ...i,
                      path: "/job-cards",
                      searchParam: i.jobCardId,
                    })
                  }
                  renderItem={(jc) => (
                    <>
                      {iconBox(
                        "bg-rose-500/10",
                        <ClipboardList size={14} className="text-rose-400" />,
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          <Highlight text={jc.jobCardId} query={searchQuery} />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-gray-500 capitalize">
                          {jc.status?.replace("-", " ")} • {jc.customerName}
                        </p>
                      </div>
                    </>
                  )}
                />

                <ResultSection
                  title="Staff Members"
                  items={searchResults.staff}
                  onSelect={(i) =>
                    handleSelect({
                      ...i,
                      path: "/staff-members",
                      searchParam: i.name,
                    })
                  }
                  renderItem={(st) => (
                    <>
                      {iconBox(
                        "bg-indigo-500/10",
                        <Users size={14} className="text-indigo-400" />,
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          <Highlight text={st.name} query={searchQuery} />
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-gray-500 capitalize">
                          {st.role || st.type}
                        </p>
                      </div>
                    </>
                  )}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function TopNavbar({ userName = "User", onToggleSidebar }) {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const queryFromUrl = useMemo(
    () => new URLSearchParams(location.search).get("q") || "",
    [location.search],
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    customers: [],
    vehicles: [],
    services: [],
    inventory: [],
    jobCards: [],
    staff: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef();
  const searchRef = useRef();
  const notifRef = useRef();
  const mobileSearchRef = useRef();

  const firstName = (user?.name || userName).split(" ")[0];
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "User";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const performSearch = useCallback(
    async (query) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults({
          customers: [],
          vehicles: [],
          services: [],
          inventory: [],
          jobCards: [],
          staff: [],
        });
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      setShowResults(true);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const api = import.meta.env.VITE_API_URL;
        const role = user?.role?.toLowerCase();
        const isListCarAllowed = ["admin", "owner"].includes(role);

        const endpoints = [
          `${api}/customers`,
          isListCarAllowed ? `${api}/vehicles` : null,
          `${api}/services`,
          `${api}/inventory`,
          `${api}/job-cards`,
          `${api}/auth/staff`,
        ];

        const responses = await Promise.all(
          endpoints.map((url) => {
            if (!url) return Promise.resolve([]);
            return fetch(url, { headers }).then((res) =>
              res.ok ? res.json() : [],
            );
          }),
        );

        const [cust, veh, serv, inv, jc, staff] = responses;

        const filter = (arr, fields) => {
          if (!Array.isArray(arr)) return [];
          return arr
            .filter((item) =>
              fields.some((f) => {
                const val = String(item[f] || "").toLowerCase();
                return val.includes(query.toLowerCase());
              }),
            )
            .slice(0, 5);
        };

        setSearchResults({
          customers: filter(cust, ["name", "phone", "email"]),
          vehicles: filter(veh, ["make", "model", "licensePlate"]),
          inventory: filter(inv, ["name", "sku", "carModel"]),
          services: filter(serv, ["serviceName"]),
          jobCards: filter(jc, ["jobCardId", "customerName", "licensePlate"]),
          staff: filter(staff, ["name", "email", "role"]),
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    },
    [token, user?.role],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== queryFromUrl || showResults) {
        performSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch, queryFromUrl, showResults]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e && e.key && e.key !== "Enter") return;

    if (searchQuery.trim()) {
      if (e && e.preventDefault) e.preventDefault();
      const term = searchQuery.trim();
      setShowResults(false);
      setMobileSearchOpen(false);
      setSearchQuery("");
      navigate(`/search?q=${encodeURIComponent(term)}`);
    }
  };

  return (
    <>
      <header
        className={`
          h-16 sm:h-20 flex items-center px-4 sm:px-8 sticky top-0 transition-all duration-300 z-40
          bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800
          ${scrolled ? "shadow-md dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)]" : ""}
        `}
      >
        <div className="flex items-center justify-between w-full max-w-full min-w-0 mx-auto gap-1.5 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2.5 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95"
          >
            <Menu size={22} />
          </button>

          <div
            className="flex-1 max-w-2xl hidden md:block relative"
            ref={searchRef}
          >
            <div className="relative group">
              <Search
                size={18}
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none ${
                  showResults
                    ? "text-blue-500"
                    : "text-slate-400 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400"
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                placeholder="Search everything (Customer, Vehicle, Parts, Staff...)"
                className="
                  w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
                  rounded-2xl py-3 pl-12 pr-28
                  text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500
                  outline-none focus:bg-white dark:focus:bg-white/8 focus:border-blue-500/40
                  focus:ring-8 focus:ring-blue-500/5
                  transition-all duration-300 shadow-inner
                "
              />
              <AnimatePresence>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => {
                        setSearchQuery("");
                        setShowResults(false);
                        if (location.pathname === "/search")
                          navigate("/search");
                      }}
                      className="text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                  <button
                    onClick={handleSearchSubmit}
                    className="px-3 py-1.5 bg-blue-600 dark:bg-blue-950/90 text-white text-[10px] font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-wider"
                  >
                    Search
                  </button>
                </div>
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-3 z-999"
                >
                  <ResultsDropdown
                    searchResults={searchResults}
                    isSearching={isSearching}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setShowResults={setShowResults}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 md:hidden" />

          <div
            className="flex items-center gap-1 sm:gap-3 shrink-0"
            ref={dropdownRef}
          >
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className={`md:hidden p-2.5 rounded-xl transition-all duration-300 ${
                mobileSearchOpen
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Search size={20} />
            </button>

            <ThemeToggle />

            <button
              onClick={() => navigate("/notifications")}
              className="relative p-2.5 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-300 group cursor-auto animate-fade-in"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900 shadow-sm animate-pulse" />
              )}
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-300 group"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-none">
                    {firstName}
                  </p>
                  <p className="text-[8px] text-slate-600 dark:text-white mt-1.5 uppercase tracking-[0.15em] font-black opacity-80">
                    {roleLabel}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-linear-to-br bg-indigo-600 p-px shadow-lg group-hover:shadow-blue-500/20 transition-all">
                  <div className="w-full h-full rounded-[11px] capitalize bg-slate-100 dark:bg-gray-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg">
                    {firstName[0]}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-1.5 shadow-2xl ring-1 ring-slate-100 dark:ring-black/50 z-50"
                  >
                    {/* User Profile Section (Mobile Only) */}
                    <div className="px-3 py-2.5 mb-1 sm:hidden">
                      <p className="text-sm font-semibold uppercase text-slate-900 dark:text-zinc-100 truncate">
                        {user?.name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500">
                        {user?.role}
                      </p>
                    </div>

                    {/* Divider - Only shows if mobile profile is present */}
                    <div className="h-px bg-slate-200 dark:bg-white/5 my-1 mx-1 sm:hidden" />

                    {/* Action Buttons */}
                    <div className="space-y-1">
                      {user?.role?.toLowerCase() === "admin" && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/portal/dashboard");
                          }}
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-zinc-400 transition-all hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 dark:bg-zinc-800 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            <ExternalLink size={16} />
                          </div>
                          Customer Portal
                        </button>
                      )}
                      <button
                        onClick={logout}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 dark:bg-zinc-800 transition-colors group-hover:bg-red-500/20 group-hover:text-red-500 dark:group-hover:text-red-400">
                          <LogOut size={16} />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSearchOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-45 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-950 p-4 border-b border-slate-200 dark:border-white/10 shadow-2xl"
            >
              <div className="flex items-center gap-3" ref={mobileSearchRef}>
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500"
                  />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    placeholder="Search customers, vehicles, parts..."
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-24 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5"
                  />
                  <button
                    onClick={handleSearchSubmit}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600  text-white text-[10px] font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-wider"
                  >
                    Search
                  </button>
                </div>
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              {showResults && (
                <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-2xl">
                  <ResultsDropdown
                    searchResults={searchResults}
                    isSearching={isSearching}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setShowResults={setShowResults}
                    setMobileSearchOpen={setMobileSearchOpen}
                  />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
