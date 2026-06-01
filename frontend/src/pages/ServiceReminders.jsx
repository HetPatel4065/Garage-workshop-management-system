import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  X,
  Car,
} from "lucide-react";
import { format } from "date-fns";
import { FaCar } from "react-icons/fa6";
import ExportButton from "../components/common/ExportButton";

// ─── MetaField (mirrors RequestedCustomers) ───
function MetaField({
  label,
  primary,
  secondary,
  icon: Icon,
  className = "",
  noCapitalize = false,
}) {
  return (
    <div className={`flex flex-col min-w-0 ${className}`}>
      <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-wide text-slate-500 border-b-2 border-slate-100 w-fit pb-0.5 mb-1.5 flex items-center gap-1 whitespace-nowrap">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </p>
      <p
        className={`text-xs sm:text-sm font-bold text-slate-800 leading-normal truncate ${noCapitalize ? "" : "capitalize"}`}
      >
        {primary || "—"}
      </p>
      {secondary && (
        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
          {secondary}
        </p>
      )}
    </div>
  );
}

function getStatusMeta(reminderStatus, nextServiceDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDateNorm = new Date(nextServiceDate);
  nextDateNorm.setHours(0, 0, 0, 0);

  const isPastOrToday = nextDateNorm <= today;
  const isCompleted = reminderStatus === "Completed" && isPastOrToday;

  if (isCompleted)
    return {
      label: "Completed",
      style: "text-emerald-700 bg-emerald-50 border-emerald-200",
      dot: "bg-emerald-500",
    };
  if (nextDateNorm < today)
    return {
      label: "Overdue",
      style: "text-rose-700 bg-rose-50 border-rose-200",
      dot: "bg-rose-500 animate-pulse",
    };
  if (nextDateNorm.toDateString() === today.toDateString())
    return {
      label: "Due Today",
      style: "text-amber-700 bg-amber-50 border-amber-200",
      dot: "bg-amber-400 animate-pulse",
    };
  return {
    label: "Upcoming",
    style: "text-blue-700 bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
  };
}

function StatusBadge({ reminderStatus, nextServiceDate }) {
  const { label, style, dot } = getStatusMeta(reminderStatus, nextServiceDate);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}

// ─── Skeleton Card ────
const SkeletonCard = () => (
  <div className="bg-white rounded-3xl p-4 sm:p-5 mb-4 border border-slate-100 shadow-sm animate-pulse">
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="h-5 bg-slate-100 rounded w-32" />
      <div className="h-5 bg-slate-100 rounded-lg w-16" />
      <div className="h-5 bg-slate-100 rounded-full w-20" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 bg-slate-100 rounded w-14" />
          <div className="h-4 bg-slate-100 rounded w-24" />
        </div>
      ))}
    </div>
    <div className="border-t border-slate-100 my-3" />
    <div className="h-8 bg-slate-100 rounded-2xl w-full" />
  </div>
);

// ─── Empty State ───
const EmptyState = ({ hasSearch }) => (
  <div className="flex flex-col items-center gap-3 py-16 px-6 text-center bg-white rounded-3xl border border-slate-100">
    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
      {hasSearch ? (
        <Search size={24} className="text-slate-300" />
      ) : (
        <Calendar size={24} className="text-slate-300" />
      )}
    </div>
    <div>
      <p className="font-black text-slate-700 text-sm">
        {hasSearch ? "No matching reminders" : "No service reminders"}
      </p>
      <p className="text-xs text-slate-400 font-medium mt-1">
        {hasSearch
          ? "Try adjusting your search or filter"
          : "Service reminders will appear here"}
      </p>
    </div>
  </div>
);

// ─── Stat Card ───
const StatCard = ({
  label,
  count,
  icon: Icon,
  colorClasses,
  onClick,
  active,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 text-left w-full
      ${
        active
          ? `${colorClasses.activeBg} ${colorClasses.activeBorder} shadow-sm scale-[1.02]`
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? colorClasses.iconBg : "bg-slate-50"}`}
    >
      <Icon
        size={16}
        className={active ? colorClasses.iconColor : "text-slate-400"}
      />
    </div>
    <div className="min-w-0">
      <p
        className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${active ? colorClasses.label : "text-slate-400"}`}
      >
        {label}
      </p>
      <p
        className={`text-xl font-black leading-none ${active ? colorClasses.count : "text-slate-800"}`}
      >
        {count}
      </p>
    </div>
  </button>
);

// ─── Reminder Card (mirrors RequestCard layout) ───────────────────
function ReminderCard({ r, onSendEmail, onSendSMS, onCall, isSending }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDateNorm = new Date(r.nextServiceDate);
  nextDateNorm.setHours(0, 0, 0, 0);
  // Consistent with filter: completed only when flag set AND date has passed
  const isCompleted = r.reminderStatus === "Completed" && nextDateNorm <= today;
  const isOverdue = nextDateNorm < today && !isCompleted;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 mb-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border border-slate-100 shadow-sm relative overflow-hidden group">
      {/* ── TOP ROW: Plate + Make/Model + Status ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            {r.licensePlate}
          </h3>
          <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold rounded-lg uppercase tracking-wide">
            {r.make} {r.model}
          </span>
          <StatusBadge
            reminderStatus={r.reminderStatus}
            nextServiceDate={r.nextServiceDate}
          />
        </div>
      </div>

      {/* ── META GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 mb-4">
        <MetaField
          label="Customer"
          primary={r.customerId?.name || r.customerName || "Walk-in"}
        />
        <MetaField label="Phone" primary={r.customerId?.phone || "—"} />
        <MetaField
          label="Email"
          primary={r.customerId?.email || "—"}
          noCapitalize
        />
        <MetaField
          label="Due Date"
          primary={format(new Date(r.nextServiceDate), "dd MMM yyyy")}
          secondary={isOverdue ? "Overdue" : ""}
        />
      </div>

      {/* ── DIVIDER ── */}
      <div className="border-t border-gray-100 my-3" />

      {/* ── BOTTOM ROW: Actions ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-2">
        {/* Left: previous service record */}
        {r.lastServiceDate ? (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
              <FaCar size={11} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 leading-none mb-0.5">
                Previous Service
              </p>
              {r.lastServiceName && (
                <p className="text-[12px] font-bold text-slate-700 capitalize leading-tight">
                  {r.lastServiceName}
                </p>
              )}
              <p className="text-[11px] font-semibold text-slate-400">
                {format(new Date(r.lastServiceDate), "dd MMM yyyy")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Car size={11} className="text-slate-300" />
            </div>
            <p className="text-[11px] font-semibold text-slate-400 italic">
              No previous service recorded
            </p>
          </div>
        )}

        {/* Right: contact actions */}
        <div className="flex items-center gap-2">
          {r.customerId?.email && (
            <button
              type="button"
              onClick={() => onSendEmail(r)}
              disabled={isSending}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold rounded-xl transition active:scale-95 ${
                isSending
                  ? "bg-slate-200 text-slate-500 border border-slate-200 cursor-not-allowed"
                  : "text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white"
              }`}
            >
              <Mail size={14} />
              {isSending ? "Sending..." : "Email"}
            </button>
          )}
          {r.customerId?.phone && (
            <>
              <a
                href={`https://wa.me/${r.customerId.phone.replace(/\D/g, "")}?text=Hello ${r.customerId.name || r.customerName}, your vehicle ${r.make} ${r.model} (${r.licensePlate}) is due for service on ${format(new Date(r.nextServiceDate), "dd MMM yyyy")}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-600 hover:text-white transition active:scale-95"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
              <a
                href={`tel:${r.customerId.phone}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white transition active:scale-95"
              >
                <Phone size={14} />
                Call
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function ServiceReminders() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReminders(res.data);
    } catch (err) {
      console.error("Error fetching reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const [sendingReminderId, setSendingReminderId] = useState(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      fetchReminders();
      setIsRefreshing(false);
    }, 5000);
  };

  const handleSendEmail = async (r) => {
    if (!r.customerId?.email) {
      addToast("Customer email is not available.", "error");
      return;
    }

    try {
      setSendingReminderId(r._id);
      const res = await axios.post(
        "/api/notifications/service-reminder",
        { vehicleId: r._id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      addToast(
        res.data.message || "Reminder email sent successfully.",
        "success",
      );
      fetchReminders();
    } catch (err) {
      addToast(
        err.response?.data?.message ||
          err.message ||
          "Failed to send reminder email.",
        "error",
      );
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleSendSMS = (r) => console.log("SMS", r);
  const handleCall = (r) => console.log("Call", r);

  const filteredReminders = reminders.filter((r) => {
    if (!r.nextServiceDate) return false;

    const nextDate = new Date(r.nextServiceDate);
    // Normalise to start-of-day in local time for reliable comparisons
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDateNorm = new Date(nextDate);
    nextDateNorm.setHours(0, 0, 0, 0);

    const isPastOrToday = nextDateNorm <= today;
    const isFuture = nextDateNorm > today;
    const isToday = nextDateNorm.toDateString() === today.toDateString();

    // "Completed" requires the flag AND the scheduled date to have passed
    const isCompleted = r.reminderStatus === "Completed" && isPastOrToday;

    // Overdue: past its date, not yet marked completed
    const isOverdue = nextDateNorm < today && !isCompleted;

    // Upcoming: any future-dated entry, OR completed-flagged entries with a future date
    // (edge case: service marked completed but nextServiceDate was rescheduled forward)
    const isUpcoming = isFuture && !isCompleted;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.licensePlate?.toLowerCase().includes(query) ||
      r.customerName?.toLowerCase().includes(query) ||
      r.customerId?.name?.toLowerCase().includes(query) ||
      r.customerId?.phone?.includes(query) ||
      r.customerId?.email?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (statusFilter === "Today") return isToday && !isCompleted;
    if (statusFilter === "Overdue") return isOverdue;
    if (statusFilter === "Upcoming") return isUpcoming;
    if (statusFilter === "Completed") return isCompleted;
    return true; // "All"
  });

  // ── Status counts (mirrors filteredReminders classification logic) ──
  const statusCounts = reminders.reduce(
    (acc, r) => {
      if (!r.nextServiceDate) return acc;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDateNorm = new Date(r.nextServiceDate);
      nextDateNorm.setHours(0, 0, 0, 0);

      const isPastOrToday = nextDateNorm <= today;
      const isFuture = nextDateNorm > today;
      const isToday = nextDateNorm.toDateString() === today.toDateString();
      const isCompleted = r.reminderStatus === "Completed" && isPastOrToday;
      const isOverdue = nextDateNorm < today && !isCompleted;
      const isUpcoming = isFuture && !isCompleted;

      acc.All += 1;
      if (isCompleted) acc.Completed += 1;
      else if (isOverdue) acc.Overdue += 1;
      else if (isToday) acc.Today += 1;
      else if (isUpcoming) acc.Upcoming += 1;

      return acc;
    },
    { All: 0, Today: 0, Upcoming: 0, Overdue: 0, Completed: 0 },
  );

  // ── Pagination ──
  const totalPages = Math.ceil(filteredReminders.length / itemsPerPage);
  const currentReminders = filteredReminders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const statCards = [
    {
      label: "All",
      count: statusCounts.All,
      icon: Users,
      value: "All",
      colorClasses: {
        activeBg: "bg-blue-50 dark:bg-blue-950/40",
        activeBorder: "border-blue-200 dark:border-blue-800",
        iconBg: "bg-blue-100 dark:bg-blue-900/50",
        iconColor: "text-blue-600 dark:text-blue-400",
        label: "text-blue-600 dark:text-blue-400",
        count: "text-blue-700 dark:text-blue-300",
      },
    },
    {
      label: "Today",
      count: statusCounts.Today,
      icon: Clock,
      value: "Today",
      colorClasses: {
        activeBg: "bg-amber-50 dark:bg-amber-950/40",
        activeBorder: "border-amber-200 dark:border-amber-800",
        iconBg: "bg-amber-100 dark:bg-amber-900/50",
        iconColor: "text-amber-600 dark:text-amber-400",
        label: "text-amber-600 dark:text-amber-400",
        count: "text-amber-700 dark:text-amber-300",
      },
    },
    {
      label: "Upcoming",
      count: statusCounts.Upcoming,
      icon: Calendar,
      value: "Upcoming",
      colorClasses: {
        activeBg: "bg-indigo-50 dark:bg-indigo-950/40",
        activeBorder: "border-indigo-200 dark:border-indigo-800",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
        iconColor: "text-indigo-600 dark:text-indigo-400",
        label: "text-indigo-600 dark:text-indigo-400",
        count: "text-indigo-700 dark:text-indigo-300",
      },
    },
    {
      label: "Overdue",
      count: statusCounts.Overdue,
      icon: AlertCircle,
      value: "Overdue",
      colorClasses: {
        activeBg: "bg-rose-50 dark:bg-rose-950/40",
        activeBorder: "border-rose-200 dark:border-rose-800",
        iconBg: "bg-rose-100 dark:bg-rose-900/50",
        iconColor: "text-rose-600 dark:text-rose-400",
        label: "text-rose-600 dark:text-rose-400",
        count: "text-rose-700 dark:text-rose-300",
      },
    },
    {
      label: "Completed",
      count: statusCounts.Completed,
      icon: CheckCircle,
      value: "Completed",
      colorClasses: {
        activeBg: "bg-emerald-50 dark:!bg-emerald-950/40",
        activeBorder: "border-emerald-300 dark:!border-emerald-800",
        iconBg: "bg-emerald-100 dark:!bg-emerald-900/50",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        label: "text-emerald-600 dark:text-emerald-400",
        count: "text-emerald-700 dark:text-emerald-300",
      },
    },
  ];

  // Placeholder handlers

  const exportColumns = [
    { header: "License Plate", accessor: "licensePlate" },
    {
      header: "Vehicle",
      accessor: (row) => `${row.make || ""} ${row.model || ""}`.trim(),
    },
    {
      header: "Customer",
      accessor: (row) => row.customerId?.name || row.customerName || "Walk-in",
    },
    { header: "Phone", accessor: (row) => row.customerId?.phone || "N/A" },
    { header: "Email", accessor: (row) => row.customerId?.email || "N/A" },
    {
      header: "Last Service",
      accessor: (row) =>
        row.lastServiceDate
          ? format(new Date(row.lastServiceDate), "dd MMM yyyy")
          : "N/A",
    },
    {
      header: "Next Service Due",
      accessor: (row) =>
        row.nextServiceDate
          ? format(new Date(row.nextServiceDate), "dd MMM yyyy")
          : "N/A",
    },
    {
      header: "Status",
      accessor: (row) =>
        getStatusMeta(row.reminderStatus, row.nextServiceDate).label,
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      {/* ── Header ── */}
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.22em] mb-2">
              Service Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Service Reminders
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-3">
              Manage and track upcoming vehicle service reminders
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ExportButton
              title="Service Reminders"
              columns={exportColumns}
              data={filteredReminders}
              filenamePrefix="service_reminders"
            />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700 rounded-2xl text-sm font-bold text-white transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-70 h-11"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? "animate-spin [animation-direction:reverse]" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map((card) => (
          <StatCard
            key={card.value}
            {...card}
            active={statusFilter === card.value}
            onClick={() => handleFilterChange(card.value)}
          />
        ))}
      </div>

      {/* ── Search ── */}
      <div className="mb-4">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, phone, email or license plate..."
            className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Active Filter Chip ── */}
      {statusFilter !== "All" && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">
            Filtering by:
          </span>
          <button
            onClick={() => handleFilterChange("All")}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {statusFilter} <X size={11} />
          </button>
        </div>
      )}

      {/* ── Count ── */}
      {!loading && filteredReminders.length > 0 && (
        <div className="mb-3 px-1">
          <p className="text-sm font-medium text-gray-500">
            Total Reminders:{" "}
            <span className="text-gray-900 font-bold">
              {filteredReminders.length}
            </span>
          </p>
        </div>
      )}

      {/* ── Cards ── */}
      <div>
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : currentReminders.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery || statusFilter !== "All"} />
        ) : (
          currentReminders.map((r) => (
            <ReminderCard
              key={r._id}
              r={r}
              onSendEmail={handleSendEmail}
              onSendSMS={handleSendSMS}
              onCall={handleCall}
              isSending={sendingReminderId === r._id}
            />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
