import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Wrench,
  LogOut,
  Loader2,
  FileText,
  LayoutDashboard,
  AlertCircle,
  Tag,
  Calendar,
  Clock,
  ChevronDown,
  Users,
  Heart,
  Fuel,
  Gauge,
  MapPin,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { clearSessionHistoryFlag } from "../../utils/authHistory";
import {
  buildPortalAuthHeaders,
  getStoredPreviewCustomerId,
  setStoredPreviewCustomerId,
} from "../../utils/portalPreview";
import { FaCar } from "react-icons/fa";
import { HiDocumentCurrencyRupee } from "react-icons/hi2";
import { useWishlist } from "../../context/WishlistContext";

// Components
import TabButton from "./components/TabButton";
import DashboardStats from "./components/DashboardStats";
import RecentActivityItem from "./components/RecentActivityItem";
import VehicleCard from "./components/VehicleCard";
import JobCardRow from "./components/JobCardRow";
import ServiceHistoryItem from "./components/ServiceHistoryItem";
import InvoiceRow from "./components/InvoiceRow";
import MarketplaceListings from "../MarketplaceListings";
import ThemeToggle from "../../components/theme/ThemeToggle";
import { useExpandableId } from "../../hooks/useExpandableId";

const PortalDashboard = ({ garageSettings }) => {
  const [overviewData, setOverviewData] = useState({
    vehicles: [],
    services: [],
    invoices: [],
  });
  const [vehicles, setVehicles] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Wishlist state
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistRemoving, setWishlistRemoving] = useState("");

  // ── USE GLOBAL WISHLIST CONTEXT ──────────────────────────
  const { removeWishlistIds } = useWishlist();

  const jobExpand = useExpandableId(activeTab);
  const svcExpand = useExpandableId(activeTab);
  const vehicleExpand = useExpandableId(activeTab);
  const invoiceExpand = useExpandableId(activeTab);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const [token, setToken] = useState(
    sessionStorage.getItem("portal_token") ||
      sessionStorage.getItem("garage_token"),
  );
  const navigate = useNavigate();
  const fullYear = new Date().getFullYear();

  const [user, setUser] = useState(() => {
    try {
      return (
        JSON.parse(sessionStorage.getItem("portal_user")) ||
        JSON.parse(sessionStorage.getItem("user")) ||
        null
      );
    } catch {
      return null;
    }
  });

  const [portalCustomers, setPortalCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    getStoredPreviewCustomerId(),
  );

  const isStaffPortalSession =
    !sessionStorage.getItem("portal_token") &&
    !!sessionStorage.getItem("garage_token");

  const portalHeaders = (authToken, customerId = selectedCustomerId) =>
    buildPortalAuthHeaders(authToken, isStaffPortalSession ? customerId : "");

  useEffect(() => {
    const storedToken =
      sessionStorage.getItem("portal_token") ||
      sessionStorage.getItem("garage_token");
    if (!storedToken) {
      navigate("/portal");
      return;
    }
    setToken(storedToken);

    const init = async () => {
      let previewId = getStoredPreviewCustomerId();

      if (isStaffPortalSession) {
        setCustomersLoading(true);
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/portal/preview-customers`,
            { headers: buildPortalAuthHeaders(storedToken) },
          );
          if (res.data.success) {
            const list = res.data.data || [];
            setPortalCustomers(list);
            const validStored = list.some((c) => c.id === previewId);
            if (list.length && (!previewId || !validStored)) {
              previewId = list[0].id;
              setSelectedCustomerId(previewId);
              setStoredPreviewCustomerId(previewId);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCustomersLoading(false);
        }
      }

      await fetchUser(storedToken, previewId);
      await fetchDashboardData(storedToken, previewId);
      setInitialLoading(false);
    };
    init();
  }, []);

  const fetchUser = async (authToken, customerId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/portal/me`, {
        headers: portalHeaders(authToken, customerId),
      });
      if (res.data.success) {
        const nextUser = res.data?.data ?? res.data;
        setUser(nextUser);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchDashboardData = async (authToken, customerId) => {
    setError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/portal/dashboard`,
        { headers: portalHeaders(authToken, customerId) },
      );
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      setError("Failed to load dashboard data.");
      console.error(err);
    } finally {
    }
  };

  // Helper to normalize and set dashboard data into local state
  const setData = (data = {}) => {
    const {
      vehicles: dv = [],
      jobCards: dj = [],
      invoices: di = [],
      services: ds = [],
    } = data;
    setVehicles(dv || []);
    setJobCards(dj || []);
    setInvoices(di || []);
    setServices(ds || []);

    // Overview uses a smaller subset for summary panels
    setOverviewData({
      vehicles: (dv || []).slice(0, 12),
      services: (ds || []).slice(0, 8),
      invoices: (di || []).slice(0, 8),
    });
  };

  const fetchInvoicesData = useCallback(async (authToken, customerId) => {
    // The portal backend doesn't expose a dedicated invoices list endpoint
    // for customers; refresh via the dashboard endpoint which returns invoices.
    await fetchDashboardData(authToken, customerId);
  }, []);

  const fetchTabData = useCallback(
    async (tabId, authToken, customerId) => {
      // For simplicity, re-use the dashboard aggregate endpoint when data is missing
      if (tabId === "invoices") {
        await fetchInvoicesData(authToken, customerId);
        return;
      }

      // If we already have data for the tab, avoid unnecessary refetch
      if (tabId === "vehicles" && vehicles.length) return;
      if (tabId === "jobcards" && jobCards.length) return;
      if (tabId === "services" && services.length) return;

      await fetchDashboardData(authToken, customerId);
    },
    [vehicles.length, jobCards.length, services.length],
  );

  const handleCustomerSelect = async (nextCustomerId) => {
    setSelectedCustomerId(nextCustomerId);
    setStoredPreviewCustomerId(nextCustomerId);
    // When switching preview customer, refresh profile + dashboard
    if (token) {
      await fetchUser(token, nextCustomerId);
      await fetchDashboardData(token, nextCustomerId);
    }
  };

  const fetchWishlist = useCallback(
    async (authToken, customerId) => {
      setWishlistLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/wishlist`,
          { headers: portalHeaders(authToken || token, customerId) },
        );
        if (res.data.success) setWishlist(res.data.vehicles || []);
      } catch (err) {
        console.error("Wishlist fetch error:", err);
      } finally {
        setWishlistLoading(false);
      }
    },
    [token],
  );

  const handleRemoveWishlist = async (vehicleId) => {
    setWishlistRemoving(vehicleId);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/wishlist/toggle`,
        { vehicleId },
        { headers: portalHeaders(token, selectedCustomerId) },
      );
      // Remove from local list
      setWishlist((prev) => prev.filter((v) => v._id !== vehicleId));
      // Remove from global context so heart buttons update everywhere
      removeWishlistIds([vehicleId]);
    } catch (err) {
      console.error("Remove wishlist error:", err);
    } finally {
      setWishlistRemoving("");
    }
  };

  const handleLogout = () => {
    if (isStaffPortalSession) {
      setStoredPreviewCustomerId("");
      navigate("/dashboard", { replace: true });
      return;
    }
    sessionStorage.removeItem("portal_token");
    sessionStorage.removeItem("portal_user");
    clearSessionHistoryFlag();
    navigate("/portal", { replace: true });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "in-progress":
      case "sent":
        return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "pending":
      case "draft":
        return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700/50";
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchTabData(activeTab, token, selectedCustomerId);
  }, [activeTab, selectedCustomerId, token, fetchTabData]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-zinc-400 font-bold tracking-widest uppercase text-xs sm:text-sm text-center">
          Loading Dashboard
        </p>
      </div>
    );
  }

  const {
    vehicles: overviewVehicles,
    services: overviewServices,
    invoices: overviewInvoices,
  } = overviewData;

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-zinc-950 dark:text-zinc-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/50 selection:text-blue-600 dark:selection:text-blue-400 flex flex-col transition-colors duration-300">
      {/* ── STICKY TOP WRAPPER GROUP (Binds Header + Banner together cleanly) ── */}
      <div className="sticky top-0 z-50 shrink-0 w-full bg-white dark:bg-zinc-900 shadow-xs border-b border-slate-200/60 dark:border-zinc-800">
        {/* Main Navbar Header */}
        <header className="px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex justify-start items-center gap-4 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                {user?.garage?.logo ? (
                  <img
                    src={
                      user.garage.logo.startsWith("http")
                        ? user.garage.logo
                        : `${import.meta.env.VITE_BASE_URL?.replace(/\/$/, "")}/${user.garage.logo.replace(/^\//, "")}`
                    }
                    alt="Garage Logo"
                    className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl object-cover border-2 border-white dark:border-zinc-800 shadow-xs"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.garage.garageName || "G"}&background=2563eb&color=fff`;
                    }}
                  />
                ) : (
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-base font-black shadow-md">
                    {user?.garage?.garageName?.charAt(0) || "G"}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  {user?.garage?.garageName || "Your Garage"}
                  <span className="block text-[10px] sm:text-xs font-medium tracking-normal text-blue-600 dark:text-blue-400 mt-0.5">
                    Customer Portal
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="hidden md:block text-right min-w-0 max-w-48">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-200 truncate">
                  {user?.name || "Customer"}
                </p>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 truncate">
                  {user?.email}
                </p>
              </div>
              <ThemeToggle variant="compact" />
              <button
                onClick={handleLogout}
                className="p-2 sm:p-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                title={isStaffPortalSession ? "Back to Admin Portal" : "Logout"}
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Admin Preview Mode sub-bar (Renders inside header container to fix empty vertical layout gaps) */}
        {isStaffPortalSession && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-900/30 px-4 sm:px-6 py-2.5 transition-colors duration-300">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
              {/* Left: Indicator Badge */}
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 shrink-0">
                <Users className="w-4 h-4" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  Admin Preview Mode
                </span>
              </div>

              {/* Right: Controls & Info Wrapper */}
              <div className="flex flex-wrap items-center gap-3 min-w-0 sm:flex-nowrap">
                <div className="relative w-full xs:w-64 sm:w-72 lg:w-96 shrink-0">
                  <select
                    id="portal-customer-select"
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    disabled={customersLoading || !portalCustomers.length}
                    className="w-full appearance-none rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-zinc-900 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white py-1.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-400/40 disabled:opacity-60"
                  >
                    {!portalCustomers.length && (
                      <option value="">
                        {customersLoading
                          ? "Loading customers…"
                          : "No portal customers found"}
                      </option>
                    )}
                    {portalCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 dark:text-amber-400 pointer-events-none" />
                </div>

                {selectedCustomerId && portalCustomers.length > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold truncate max-w-50 sm:max-w-none">
                    Your role as:{" "}
                    <strong className="font-black text-amber-900 dark:text-amber-200">
                      {portalCustomers.find((c) => c.id === selectedCustomerId)
                        ?.name ||
                        user?.name ||
                        "Customer"}
                    </strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Container ── */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 min-w-0">
        {/* Responsive Horizontal Scroll Tabs */}
        <div className="w-full mb-6 sm:mb-8">
          <div className="flex items-center overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none [scrollbar-width:none] overscroll-x-contain">
            <TabButton
              id="overview"
              icon={LayoutDashboard}
              label="Overview"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              id="vehicles"
              icon={FaCar}
              label="My Vehicles"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              id="jobcards"
              icon={FileText}
              label="Job Cards"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              id="services"
              icon={Wrench}
              label="Services"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              id="invoices"
              icon={HiDocumentCurrencyRupee}
              label="Invoices"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              id="sell"
              icon={Tag}
              label="Pre-Owned Cars"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-6 sm:space-y-8"
            >
              <DashboardStats
                vehicleCount={overviewVehicles?.length || 0}
                serviceCount={overviewServices?.length || 0}
                invoiceCount={overviewInvoices?.length || 0}
                invoiceAmount={
                  Array.isArray(overviewInvoices)
                    ? overviewInvoices.reduce((sum, inv) => {
                        // Invoice model stores the grand total in `total` (not `totalAmount`)
                        const amount = Number(inv?.total) || 0;
                        return sum + amount;
                      }, 0)
                    : 0
                }
              />

              {/* Reminders Panel */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden transition-colors duration-300">
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
                    Upcoming Service Reminders
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Schedule and status of your vehicle service deadlines
                  </p>
                </div>

                <div className="p-4 sm:p-6">
                  {overviewVehicles &&
                  overviewVehicles.filter((v) => v.nextServiceDate).length >
                    0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {overviewVehicles
                        .filter((v) => v.nextServiceDate)
                        .sort(
                          (a, b) =>
                            new Date(a.nextServiceDate) -
                            new Date(b.nextServiceDate),
                        )
                        .map((vehicle) => {
                          const daysLeft = (() => {
                            const due = new Date(vehicle.nextServiceDate);
                            const today = new Date();
                            due.setHours(0, 0, 0, 0);
                            today.setHours(0, 0, 0, 0);
                            return Math.ceil(
                              (due.getTime() - today.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                          })();

                          let statusText = "";
                          let statusClass = "";
                          let statusDotClass = "";
                          let statusBadgeLabel = "";
                          let containerBorder = "";

                          if (daysLeft < 0) {
                            statusText = `Overdue by ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? "day" : "days"}`;
                            statusBadgeLabel = "Action Required";
                            statusClass =
                              "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50";
                            statusDotClass = "bg-rose-500 animate-pulse";
                            containerBorder =
                              "border-rose-250 dark:border-rose-900/50";
                          } else if (daysLeft <= 7) {
                            statusText = daysLeft === 0 ? "Due Today" : daysLeft === 1 ? "Due Tomorrow" : `In ${daysLeft} days`;
                            statusBadgeLabel = "Due Soon";
                            statusClass =
                              "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900/50";
                            statusDotClass = "bg-amber-400 animate-pulse";
                            containerBorder =
                              "border-amber-250 dark:border-amber-900/50";
                          } else {
                            statusText = `In ${daysLeft} days`;
                            statusBadgeLabel = "Stable";
                            statusClass =
                              "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50";
                            statusDotClass = "bg-emerald-500";
                            containerBorder =
                              "border-emerald-250 dark:border-emerald-900/50";
                          }

                          return (
                            <div
                              key={vehicle._id}
                              className={`flex flex-col justify-between gap-4 p-4 rounded-2xl border bg-white dark:bg-zinc-900/50 hover:shadow-xs transition-all duration-300 ${containerBorder}`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-700">
                                  <FaCar className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-zinc-200 truncate">
                                    {vehicle.make} {vehicle.model}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[9px] font-black uppercase bg-slate-600 dark:bg-zinc-700 text-white px-1.5 py-0.5 rounded-xs tracking-wider">
                                      {vehicle.licensePlate}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-800/60 pt-3 mt-1">
                                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(
                                      vehicle.nextServiceDate,
                                    ).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass}`} />
                                    {statusBadgeLabel}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                                    {statusText}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Clock className="w-10 h-10 text-slate-350 dark:text-zinc-700 mb-2" />
                      <p className="text-slate-500 dark:text-zinc-400 font-bold text-sm">
                        All vehicles are up to date!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity Panel */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden transition-colors duration-300">
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <button
                    onClick={() => handleTabChange("services")}
                    className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="p-4 sm:p-6">
                  {overviewServices.length > 0 ? (
                    <div className="space-y-3">
                      {overviewServices.slice(0, 3).map((item) => (
                        <RecentActivityItem
                          key={item._id}
                          item={item}
                          getStatusColor={getStatusColor}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 dark:text-zinc-500 text-center py-6 text-sm">
                      No recent activities found.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── VEHICLES TAB ── */}
          {activeTab === "vehicles" && (
            <motion.div
              key="vehicles"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  My Vehicles
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                  List of your registered vehicles — click to see full details
                </p>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle._id}
                      vehicle={vehicle}
                      isOpen={vehicleExpand.isExpanded(vehicle._id)}
                      toggleExpand={vehicleExpand.toggle}
                    />
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <FaCar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-medium">
                      No vehicles registered yet.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── JOB CARDS TAB ── */}
          {activeTab === "jobcards" && (
            <motion.div
              key="jobcards"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Job Cards
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                  Click any row to expand full workshop workflow tracks
                </p>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {jobCards.length > 0 ? (
                  jobCards.map((job) => (
                    <JobCardRow
                      key={job._id}
                      job={job}
                      isOpen={jobExpand.isExpanded(job._id)}
                      toggleExpand={jobExpand.toggle}
                    />
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-medium">
                      No active job cards found.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SERVICES TAB ── */}
          {activeTab === "services" && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Service History
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                  Individual operation logs and historical timelines
                </p>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {services.length > 0 ? (
                  services.map((svc) => (
                    <ServiceHistoryItem
                      key={svc._id}
                      svc={svc}
                      isOpen={svcExpand.isExpanded(svc._id)}
                      toggleExpand={svcExpand.toggle}
                    />
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-medium">
                      No logs recorded.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── INVOICES TAB ── */}
          {activeTab === "invoices" && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Invoices
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                  View and download your digital accounting slips
                </p>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice._id}
                      invoice={{
                        ...invoice,
                        invoiceId: `${fullYear}-${invoice.invoiceNumber}`,
                        totalAmount: invoice.total,
                        licensePlate:
                          invoice.serviceId?.vehicleId?.licensePlate ||
                          invoice.serviceId?.vehicle?.licensePlate,
                        vehicleMake:
                          invoice.serviceId?.vehicleId?.make ||
                          invoice.serviceId?.vehicle?.make,
                        vehicleModel:
                          invoice.serviceId?.vehicleId?.model ||
                          invoice.serviceId?.vehicle?.model,
                      }}
                      isOpen={invoiceExpand.isExpanded(invoice._id)}
                      toggleExpand={invoiceExpand.toggle}
                      getStatusColor={getStatusColor}
                      onRefresh={() =>
                        fetchInvoicesData(token, selectedCustomerId)
                      }
                      token={token}
                      portalPreviewCustomerId={
                        isStaffPortalSession ? selectedCustomerId : ""
                      }
                    />
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <HiDocumentCurrencyRupee className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-medium">
                      No transactions found.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PortalDashboard;
