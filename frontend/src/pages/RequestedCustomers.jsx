import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  Eye,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  UserCheck,
  UserX,
  CalendarCheck,
  X,
  MoreHorizontal,
  Wrench,
  Car,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import SearchBar from "../components/UI/SearchBar";
import EmptyState from "../components/UI/EmptyState";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import ExportButton from "../components/common/ExportButton";
import { useSocket } from "../context/SocketContext";
import { FaCar } from "react-icons/fa";

// ─── MetaField (mirrors CustomerCard) ────────────────────────────
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

// ─── Status Badge ─────────────────────────────────────────────────
const STATUS_META = {
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  approved: "text-emerald-700 bg-emerald-50 border-emerald-200",
  rejected: "text-rose-700 bg-rose-50 border-rose-200",
};

const STATUS_DOT = {
  pending: "bg-amber-400 animate-pulse",
  approved: "bg-emerald-500",
  rejected: "bg-rose-500",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${STATUS_META[status] || STATUS_META.pending}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] || STATUS_DOT.pending}`}
      />
      {status}
    </span>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────
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

// ─── Stat Card ────────────────────────────────────────────────────
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

// ─── Request Card (mirrors CustomerCard layout) ───────────────────
function RequestCard({ req, onView, onApprove, onReject, onDelete }) {
  const dateObj = new Date(req.createdAt);
  const apponintmwntTime = req.appointmentTime
    ? new Date(`1999-01-01T${req.appointmentTime}:00`)
    : null;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 mb-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border border-slate-100 shadow-sm relative overflow-hidden group cursor-auto">
      {/* ── TOP ROW: Name + ID + Status ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
            {req.customerName || "Unnamed"}
          </h3>
          <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-bold rounded-lg uppercase tracking-wide">
            #{req._id?.slice(-6)?.toUpperCase() || "N/A"}
          </span>
          <StatusBadge status={req.status} />
        </div>
      </div>

      {/* ── META GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4 relative z-10">
        <MetaField label="Phone" primary={req.phone || "No Phone"} />
        <MetaField label="Email" primary={req.email || "—"} noCapitalize />
        <MetaField label="Vehicle" primary={req.vehicleModel || "—"} />
        <MetaField
          label="Complaint"
          primary={req.requestedService || "—"}
          className="col-span-2 sm:col-span-1"
        />
        <MetaField
          label="Location"
          primary={req.location || "—"}
          icon={MapPin}
          className="col-span-1"
        />
        <MetaField
          label="Submitted Date"
          primary={dateObj.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          secondary={`Time: ${dateObj.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}`}
        />
        <MetaField
          label="Appointment Date"
          primary={
            req.status !== "approved"
              ? "Not Scheduled"
              : req.appointmentDate &&
                  new Date(req.appointmentDate).getFullYear() > 2000
                ? new Date(req.appointmentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Date Not Set"
          }
          secondary={`Time: ${apponintmwntTime ? apponintmwntTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}`}
        />
      </div>

      {/* ── DIVIDER ── */}
      <div className="border-t border-gray-100 my-3" />

      {/* ── BOTTOM ROW: Actions ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-2">
        {/* View */}
        <button
          onClick={() => onView(req)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition active:scale-95"
        >
          <Eye size={14} />
          View Details
        </button>

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
          {req.status === "pending" && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => onApprove(req)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition active:scale-95 shadow-sm shadow-emerald-100"
              >
                <CheckCircle size={14} />
                Approve
              </button>
              <button
                onClick={() => onReject(req)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition active:scale-95 shadow-sm shadow-amber-100"
              >
                <UserX size={14} />
                Reject
              </button>
            </div>
          )}

          {req.status === "approved" &&
            (!req.appointmentDate ||
              new Date(req.appointmentDate).getFullYear() < 2000) && (
              <button
                onClick={() => onApprove(req)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition active:scale-95"
              >
                <CalendarCheck size={14} />
                Set Appointment
              </button>
            )}

          <button
            onClick={() => onDelete(req)}
            className="inline-flex items-center justify-center p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 bg-slate-50 border border-slate-200 rounded-xl transition active:scale-90"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Heading (for modal) ─────────────────────────────────
function SectionHeading({ title }) {
  return (
    <div className="flex items-center gap-2 pt-4.5 pb-2">
      <span className="w-1 h-4 rounded-full bg-black dark:bg-white shrink-0" />
      <h3 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.14em]">
        {title}
      </h3>
    </div>
  );
}

// ─── Detail Row (for modal) ───────────────────────────────────────
function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-4">
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] text-slate-400 font-medium mb-0.5">{label}</p>
        <p className="text-[13.5px] font-semibold text-slate-800 leading-snug wrap-break-words">
          {value || "Not specified"}
        </p>
      </div>
    </div>
  );
}

// ─── Meta Card (for modal) ────────────────────────────────────────
function MetaCard({ title, children, wide = false }) {
  return (
    <div
      className={`px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-100 ${wide ? "col-span-2" : ""}`}
    >
      <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function RequestedCustomers() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionTime, setInspectionTime] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const { addToast } = useToast();
  const { token } = useAuth();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/requested-customers`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRequests(response.data);
    } catch (error) {
      addToast(
        error.response?.data?.error || "Failed to fetch requests",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      fetchRequests();
      setIsRefreshing(false);
    }, 5000);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setActiveQuery(searchInput);
    setSearchInput("");
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchInput("");
    setActiveQuery("");
    setCurrentPage(1);
  };

  const filteredRequests = requests.filter((req) => {
    const query = activeQuery.toLowerCase();
    const matchesSearch =
      req.customerName.toLowerCase().includes(query) ||
      req.vehicleNumber.toLowerCase().includes(query) ||
      req.phone.includes(query) ||
      req.email.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = 1;
  const currentRequests = filteredRequests;

  const statusCounts = requests.reduce(
    (acc, req) => {
      acc.All += 1;
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    },
    { All: 0, pending: 0, approved: 0, rejected: 0 },
  );

  const handleApprove = async () => {
    if (isSubmitting) return;
    if (!inspectionDate || !inspectionTime) {
      addToast("Please select both appointment date and time", "warning");
      return;
    }
    try {
      setIsSubmitting(true);
      if (selectedRequest.status === "approved") {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/requested-customers/${selectedRequest._id}/appointment`,
          { appointmentDate: inspectionDate, appointmentTime: inspectionTime },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        addToast("Appointment scheduled successfully!", "success");
      } else {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/requested-customers/${selectedRequest._id}/approve`,
          { inspectionDate, inspectionTime },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        addToast("Customer approved and welcome email sent!", "success");
      }
      setApproveModalOpen(false);
      setDetailsModalOpen(false);
      fetchRequests();
    } catch (error) {
      addToast(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Operation failed",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/requested-customers/${selectedRequest._id}/reject`,
        { rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      addToast("Request rejected", "warning");
      setRejectModalOpen(false);
      setDetailsModalOpen(false);
      setRejectionReason("");
      fetchRequests();
    } catch (error) {
      addToast(error.response?.data?.error || "Rejection failed", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/requested-customers/${selectedRequest._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      addToast("Request deleted", "delete");
      setDeleteModalOpen(false);
      setDetailsModalOpen(false);
      fetchRequests();
    } catch (error) {
      addToast(error.response?.data?.error || "Delete failed", "error");
    }
  };

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
      label: "Pending",
      count: statusCounts.pending,
      icon: Clock,
      value: "pending",
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
      label: "Approved",
      count: statusCounts.approved,
      icon: UserCheck,
      value: "approved",
      colorClasses: {
        activeBg: "bg-emerald-50 dark:!bg-emerald-950/40",
        activeBorder: "border-emerald-300 dark:!border-emerald-800",
        iconBg: "bg-emerald-100 dark:!bg-emerald-900/50",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        label: "text-emerald-600 dark:text-emerald-400",
        count: "text-emerald-700 dark:text-emerald-300",
      },
    },
    {
      label: "Rejected",
      count: statusCounts.rejected,
      icon: UserX,
      value: "rejected",
      colorClasses: {
        activeBg: "bg-rose-50 dark:bg-rose-950/40",
        activeBorder: "border-rose-200 dark:border-rose-800",
        iconBg: "bg-rose-100 dark:bg-rose-900/50",
        iconColor: "text-rose-600 dark:text-rose-400",
        label: "text-rose-600 dark:text-rose-400",
        count: "text-rose-700 dark:text-rose-300",
      },
    },
  ];

  const exportColumns = [
    {
      header: "Request ID",
      accessor: (row) => row._id?.slice(-6)?.toUpperCase() || "N/A",
    },
    { header: "Customer Name", accessor: "customerName" },
    { header: "Phone", accessor: "phone" },
    { header: "Email", accessor: "email" },
    { header: "Vehicle Number", accessor: "vehicleNumber" },
    { header: "Vehicle Model", accessor: "vehicleModel" },
    { header: "Status", accessor: "status" },
    { header: "Location", accessor: "location" },
    {
      header: "Submitted On",
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Appointment Date",
      accessor: (row) =>
        row.appointmentDate
          ? new Date(row.appointmentDate).toLocaleDateString()
          : "N/A",
    },
    {
      header: "Appointment Time",
      accessor: (row) => row.appointmentTime || "N/A",
    },
  ];

  // Derived values for modal
  const requestId = `#${selectedRequest?._id?.slice(-6).toUpperCase() ?? "———"}`;
  const formattedSubmittedDate = selectedRequest
    ? new Date(selectedRequest.createdAt).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";
  const appointmentLabel =
    selectedRequest?.status === "approved"
      ? selectedRequest.appointmentDate
        ? `${new Date(selectedRequest.appointmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} at ${selectedRequest.appointmentTime || "TBD"}`
        : "Date Not Set"
      : null;

  return (
    <div className="p-4 sm:p-6 bg-gray-100 max-w-screen min-h-screen mx-auto dark:bg-slate-950">
      {/* ── Header ── */}
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">
              Requested Customer Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Registration Requests
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-3">
              Review and approve new customer registrations from the portal
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ExportButton
              title="Registration Requests"
              columns={exportColumns}
              data={filteredRequests}
              filenamePrefix="registration_requests"
            />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700 rounded-2xl text-sm font-bold text-white transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-70 h-10.5"
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

      {/* ── Search ── */}
      <div className="mb-6">
        <SearchBar
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onSearch={(term) => {
            setActiveQuery(term);
            setSearchInput("");
            setCurrentPage(1);
          }}
          activeSearch={activeQuery}
          onClearActive={handleClear}
          placeholder="Search by name, phone, email or vehicle..."
          className="w-full"
        />
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {statCards.map((card) => (
          <StatCard
            key={card.value}
            {...card}
            active={statusFilter === card.value}
            onClick={() => handleFilterChange(card.value)}
          />
        ))}
      </div>

      {/* ── Active Filter Chip ── */}
      {(statusFilter !== "All" || activeQuery) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">
            Active Filters:
          </span>
          {statusFilter !== "All" && (
            <button
              onClick={() => handleFilterChange("All")}
              className="inline-flex items-center capitalize gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Status: {statusFilter} <X size={11} />
            </button>
          )}
          {activeQuery && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Search: "{activeQuery}" <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* ── Count ── */}
      {!loading && filteredRequests.length > 0 && (
        <div className="mt-4 border-t border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-500">
            Total Requests:{" "}
            <span className="text-gray-900 font-bold">
              {filteredRequests.length}
            </span>
          </p>
        </div>
      )}

      {/* ── Cards ── */}
      <div>
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : currentRequests.length === 0 ? (
          <EmptyState
            icon={!!activeQuery || statusFilter !== "All" ? Search : Users}
            title={
              !!activeQuery || statusFilter !== "All"
                ? "No matching requests"
                : "No registration requests"
            }
            description={
              !!activeQuery || statusFilter !== "All"
                ? "Try adjusting your search or filter."
                : "New customer requests will appear here."
            }
          />
        ) : (
          currentRequests.map((req) => (
            <RequestCard
              key={req._id}
              req={req}
              onView={(r) => {
                setSelectedRequest(r);
                setDetailsModalOpen(true);
              }}
              onApprove={(r) => {
                setSelectedRequest(r);
                setInspectionDate(new Date().toISOString().split("T")[0]);
                setInspectionTime("10:00");
                setApproveModalOpen(true);
              }}
              onReject={(r) => {
                setSelectedRequest(r);
                setRejectModalOpen(true);
              }}
              onDelete={(r) => {
                setSelectedRequest(r);
                setDeleteModalOpen(true);
              }}
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

      {/* ── Details Modal ── */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Registration Request Details"
        size="md"
      >
        {selectedRequest && (
          <div className="flex flex-col max-h-[80vh] overflow-hidden">
            {/* ── Modal Header: tag + close + vehicle identity ── */}
            <div className="pb-0 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.14em]">
                  Registration request
                </span>
              </div>

              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <FaCar size={25} className="dark:text-white text-black" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-black text-slate-900 leading-tight truncate">
                    {selectedRequest.vehicleNumber}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[13px] capitalize font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      {selectedRequest.vehicleModel}
                    </span>
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto pr-1">
              <SectionHeading title="Customer details" />

              <DetailRow
                icon={<Mail size={15} className="text-slate-500" />}
                label="Email"
                value={selectedRequest.email}
              />
              <DetailRow
                icon={<Phone size={15} className="text-slate-500" />}
                label="Contact number"
                value={selectedRequest.phone}
              />
              <DetailRow
                icon={<MapPin size={15} className="text-slate-500" />}
                label="Service location"
                value={selectedRequest.location}
              />
              <DetailRow
                icon={<Wrench size={15} className="text-slate-500" />}
                label="Complaint / service request"
                value={selectedRequest.requestedService || "—"}
              />
              {selectedRequest.status === "approved" && (
                <DetailRow
                  icon={<CalendarCheck size={15} className="text-slate-500" />}
                  label="Scheduled appointment"
                  value={appointmentLabel}
                />
              )}

              <SectionHeading title="Request metadata" />

              <div className="grid grid-cols-2 gap-2 pb-4">
                <MetaCard title="Status">
                  <StatusBadge status={selectedRequest.status} />
                </MetaCard>
                <MetaCard title="Request ID">
                  <p className="text-[12px] font-bold text-slate-700 font-mono">
                    {requestId}
                  </p>
                </MetaCard>
                <MetaCard title="Submitted on" wide>
                  <p className="text-[12px] font-semibold text-slate-700">
                    {formattedSubmittedDate}
                  </p>
                </MetaCard>
              </div>
            </div>

            {/* ── Footer actions ── */}
            <div className="pt-4 border-t border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-colors active:scale-95"
                >
                  Dismiss
                </button>

                {selectedRequest.status === "pending" && (
                  <>
                    <div className="w-px h-6 bg-slate-200 mx-0.5" />
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors active:scale-95"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors active:scale-95"
                    >
                      <UserX size={13} />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setInspectionDate(
                          new Date().toISOString().split("T")[0],
                        );
                        setInspectionTime("10:00");
                        setApproveModalOpen(true);
                      }}
                      className="flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-slate-900 text-white hover:bg-black transition-colors active:scale-95"
                    >
                      <CheckCircle size={13} />
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Approve Modal ── */}
      <ConfirmModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={handleApprove}
        title={
          selectedRequest?.status === "approved"
            ? "Set Appointment"
            : "Confirm Approval"
        }
        message={
          selectedRequest?.status === "approved"
            ? `Set the visit date and time for ${selectedRequest?.customerName}.`
            : `This will register ${selectedRequest?.customerName} as an active customer. Set an optional visit date and time for the welcome email.`
        }
        confirmText={
          selectedRequest?.status === "approved"
            ? "Save Appointment"
            : "Confirm & Approve"
        }
        type="success"
        isLoading={isSubmitting}
      >
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck size={15} className="text-emerald-600" />
            <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">
              Schedule Visit
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Visit Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                max={
                  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Visit Time
              </label>
              <input
                type="time"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                value={inspectionTime}
                onChange={(e) => setInspectionTime(e.target.value)}
              />
            </div>
          </div>
        </div>
      </ConfirmModal>

      {/* ── Reject Modal ── */}
      <ConfirmModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
        title="Reject Registration Request"
        message={`Are you sure you want to reject ${selectedRequest?.customerName}'s request?`}
        confirmText="Yes, Reject Request"
        type="warning"
      >
        <div className="mt-4 space-y-1.5 text-left">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Rejection Reason (Optional)
          </label>
          <textarea
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none h-24"
            placeholder="e.g. Service not available in your location..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </ConfirmModal>

      {/* ── Delete Modal ── */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Registration Request"
        message="Are you sure you want to delete this request? This action cannot be undone and the customer will not be notified."
        confirmText="Yes, Delete Request"
        type="error"
      />
    </div>
  );
}
