import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search,
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  X,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ExportButton from "../components/common/ExportButton";
import ConfirmModal from "../components/UI/ConfirmModal";
import EmptyState from "../components/UI/EmptyState";

const MODULE_OPTIONS = [
  "All",
  "Customer",
  "Vehicle",
  "JobCard",
  "Service",
  "Inventory",
  "Invoice",
  "ServiceCatalog",
  "VehicleSale",
  "Staff",
  "CustomerRequest",
];

const ACTION_OPTIONS = ["All", "create", "update", "delete", "reject"];

const ACTION_CONFIG = {
  create: {
    label: "Created",
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
    icon: Plus,
  },
  update: {
    label: "Updated",
    color:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dot: "bg-blue-500",
    icon: Edit2,
  },
  delete: {
    label: "Deleted",
    color:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500",
    icon: Trash2,
  },
  reject: {
    label: "Rejected",
    color:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    dot: "bg-orange-500",
    icon: XCircle,
  },
  approve: {
    label: "Approved",
    color:
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    dot: "bg-teal-500",
    icon: CheckCircle,
  },
};

const MODULE_COLOR = {
  Customer:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  Vehicle:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  JobCard:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  Service:
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  Inventory:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  Invoice:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  ServiceCatalog:
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800",
  VehicleSale:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  Staff:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  CustomerRequest:
    "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800",
};

const AVATAR_COLORS = [
  "from-blue-500 to-slate-900",
  "from-orange-500 via-orange-600 to-orange-700",
  "from-sky-500 via-blue-600 to-indigo-700",
  "from-violet-600 via-fuchsia-500 to-pink-500",
  "from-slate-400 via-slate-500 to-slate-600",
];

function getAvatarColor(name = "") {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || {
    label: action,
    color:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
    icon: Activity,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ModuleBadge({ module }) {
  const color =
    MODULE_COLOR[module] ||
    "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border ${color}`}
    >
      {module}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ITEMS_PER_PAGE = 25;

const STAT_CARDS = [
  {
    key: "total",
    label: "Total Actions",
    filter: () => true,
    colorClasses: {
      activeBg: "bg-blue-50 dark:!bg-blue-950/40",
      activeBorder: "border-blue-300 dark:!border-blue-800",
      iconBg: "bg-blue-100 dark:!bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      label: "text-blue-600 dark:text-blue-400",
      count: "text-blue-700 dark:text-blue-300",
    },
  },
  {
    key: "create",
    label: "Created",
    filter: (l) => l.action === "create",
    colorClasses: {
      activeBg: "bg-emerald-50 dark:bg-emerald-950/40",
      activeBorder: "border-emerald-300 dark:border-emerald-800",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      label: "text-emerald-600 dark:text-emerald-400",
      count: "text-emerald-700 dark:text-emerald-300",
    },
  },
  {
    key: "update",
    label: "Updated",
    filter: (l) => l.action === "update",
    colorClasses: {
      activeBg: "bg-blue-50 dark:bg-blue-950/40",
      activeBorder: "border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-500 dark:text-blue-400",
      label: "text-blue-500 dark:text-blue-400",
      count: "text-blue-600 dark:text-blue-300",
    },
  },
  {
    key: "delete",
    label: "Deleted",
    filter: (l) => l.action === "delete",
    colorClasses: {
      activeBg: "bg-red-50 dark:bg-red-950/40",
      activeBorder: "border-red-200 dark:border-red-800",
      iconBg: "bg-red-100 dark:bg-red-900/50",
      iconColor: "text-red-500 dark:text-red-400",
      label: "text-red-500 dark:text-red-400",
      count: "text-red-600 dark:text-red-300",
    },
  },
];

function StatCard({ label, count, colorClasses, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 text-left w-full
        ${
          active
            ? `${colorClasses.activeBg} ${colorClasses.activeBorder} scale-[1.02]`
            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
    >
      <div className="min-w-0">
        <p
          className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${
            active ? colorClasses.label : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {label}
        </p>
        <p
          className={`text-xl font-black leading-none ${
            active ? colorClasses.count : "text-slate-800 dark:text-slate-100"
          }`}
        >
          {count}
        </p>
      </div>
    </button>
  );
}

export default function ActivityLog() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [activeStatKey, setActiveStatKey] = useState("total");

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (moduleFilter !== "All") params.append("module", moduleFilter);
      if (actionFilter !== "All") params.append("action", actionFilter);
      if (dateFrom) params.append("startDate", dateFrom);
      if (dateTo) params.append("endDate", dateTo);

      const endpoint = `${import.meta.env.VITE_API_URL}/activity-log/mine`;
      const res = await axios.get(`${endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      setLogs(Array.isArray(data) ? data : data?.logs || data?.data || []);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, moduleFilter, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const activeStatFilter = STAT_CARDS.find((s) => s.key === activeStatKey);

  const filtered = logs.filter((log) => {
    // stat card filter
    if (activeStatKey !== "total" && activeStatFilter) {
      if (!activeStatFilter.filter(log)) return false;
    }
    // search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        log.description?.toLowerCase().includes(q) ||
        log.performedBy?.name?.toLowerCase().includes(q) ||
        log.module?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // ── PAGINATION (fixed) ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  // keep current page within valid bounds whenever the filtered list changes
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const activeFilterCount = [
    moduleFilter !== "All",
    actionFilter !== "All",
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setModuleFilter("All");
    setActionFilter("All");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const goToPrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const goToNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  const handleDeleteOldLogs = async () => {
    if (!token) return;
    setDeleting(true);
    setError(null);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/activity-log/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteModalOpen(false);
      await fetchLogs();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete activity logs");
    } finally {
      setDeleting(false);
    }
  };

  // Export columns
  const exportColumns = [
    {
      header: "Date",
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      header: "Time",
      accessor: (row) => formatTime(row.createdAt),
    },
    {
      header: "Performed By",
      accessor: (row) => row.performedBy?.name || "Unknown",
    },
    {
      header: "Role",
      accessor: (row) => row.performedBy?.role || "—",
    },
    {
      header: "Action",
      accessor: (row) => ACTION_CONFIG[row.action]?.label || row.action || "—",
    },
    {
      header: "Module",
      accessor: "module",
    },
    {
      header: "Description",
      accessor: "description",
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-100 dark:bg-slate-950 min-h-screen">
      {/* ── HEADER ── */}
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">
              Audit & Monitoring
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Activity Log
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3">
              Track every action performed across your garage
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ExportButton
              title="Activity Log"
              columns={exportColumns}
              data={filtered}
              filenamePrefix="activity_log"
            />
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-950/90 dark:hover:bg-blue-700 border border-slate-200 dark:border-slate-700 text-white dark:text-slate-200 rounded-lg transition-colors font-medium text-sm"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((stat) => {
          const count =
            stat.key === "total"
              ? logs.length
              : logs.filter(stat.filter).length;
          return (
            <StatCard
              key={stat.key}
              label={stat.label}
              count={count}
              colorClasses={stat.colorClasses}
              active={activeStatKey === stat.key}
              onClick={() => {
                setActiveStatKey(stat.key);
                setPage(1);
              }}
            />
          );
        })}
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name, module, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((p) => !p)}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-bold transition-all ${
            showFilters || activeFilterCount > 0
              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
          }`}
        >
          <Filter size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-black">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                Module
              </label>
              <select
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {MODULE_OPTIONS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {ACTION_OPTIONS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── COUNT BAR ── */}
      <div className="border-t border-gray-100 dark:border-slate-700 py-3 mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
          Total Logs:{" "}
          <span className="text-gray-900 dark:text-slate-100">
            {filtered.length}
          </span>
        </p>

        <div>
          <button
            onClick={() => setDeleteModalOpen(true)}
            disabled={deleting || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={15} className={deleting ? "animate-pulse" : ""} />
            {deleting ? "Deleting..." : "Delete Previous Logs"}
          </button>
        </div>
      </div>

      {/* ── TABLE / CARDS ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading activity log...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <XCircle size={40} className="text-red-400" />
            <p className="text-sm font-semibold text-red-500">{error}</p>
            <button
              onClick={fetchLogs}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Activity
              size={40}
              className="text-slate-300 dark:text-slate-600"
            />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {search || activeFilterCount > 0
                ? "No results match your filters"
                : "No activity recorded yet"}
            </p>
            {(search || activeFilterCount > 0) && (
              <button
                onClick={() => {
                  setSearch("");
                  clearFilters();
                  setActiveStatKey("total");
                }}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    {[
                      "Date & Time",
                      "Performed By",
                      "Action",
                      "Module",
                      "Description",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {paginated.map((log) => {
                    const avatarGrad = getAvatarColor(
                      log.performedBy?.name || "",
                    );
                    return (
                      <tr
                        key={log._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        {/* Date & Time */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                            <Clock
                              size={12}
                              className="text-slate-400 shrink-0"
                            />
                            {formatDate(log.createdAt)}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 ml-4">
                            {formatTime(log.createdAt)}
                          </div>
                        </td>

                        {/* Performed By */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl bg-linear-to-br ${avatarGrad} flex items-center justify-center text-white font-black text-xs shrink-0`}
                            >
                              {log.performedBy?.name
                                ? log.performedBy.name.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 capitalize dark:text-white text-xs">
                                {log.performedBy?.name || "Unknown"}
                              </p>
                              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 capitalize">
                                {log.performedBy?.role || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <ActionBadge action={log.action} />
                        </td>

                        {/* Module */}
                        <td className="px-5 py-4">
                          <ModuleBadge module={log.module} />
                        </td>

                        {/* Description */}
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                            {log.description}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {timeAgo(log.createdAt)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-700">
              {paginated.map((log) => {
                const avatarGrad = getAvatarColor(log.performedBy?.name || "");
                return (
                  <div
                    key={log._id}
                    className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl bg-linear-to-br ${avatarGrad} flex items-center justify-center text-white font-black text-xs shrink-0`}
                        >
                          {log.performedBy?.name
                            ? log.performedBy.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {log.performedBy?.name || "Unknown"}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 capitalize">
                            {log.performedBy?.role || "—"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <ActionBadge action={log.action} />
                      <ModuleBadge module={log.module} />
                    </div>

                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                      {log.description}
                    </p>

                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(log.createdAt)} · {formatTime(log.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bottom Pagination */}
        {!loading && !error && filtered.length > 0 && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteOldLogs}
        title="Delete All Logs"
        message={`This will permanently delete all ${logs.length} activity log${logs.length !== 1 ? "s" : ""} for your garage. This action cannot be undone.`}
        confirmText="Yes, Delete All"
        type="delete"
        isLoading={deleting}
      />
    </div>
  );
}
