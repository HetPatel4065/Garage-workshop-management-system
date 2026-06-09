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
  MapPin,
  Clock,
  Users,
  UserCheck,
  UserX,
  X,
  Store,
  MessageCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "../context/ToastContext";
import SearchBar from "../components/UI/SearchBar";
import EmptyState from "../components/UI/EmptyState";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import ExportButton from "../components/common/ExportButton";

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
      <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-wide text-slate-500 border-b-2 border-slate-100 dark:border-zinc-800 w-fit pb-0.5 mb-1.5 flex items-center gap-1 whitespace-nowrap">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </p>
      <p
        className={`text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 leading-normal truncate ${noCapitalize ? "" : "capitalize"}`}
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

const STATUS_META = {
  pending:
    "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/50",
  contacted:
    "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/50",
  approved:
    "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/50",
  rejected:
    "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/50",
};

const STATUS_DOT = {
  pending: "bg-amber-400 animate-pulse",
  contacted: "bg-blue-400",
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

const SkeletonCard = () => (
  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 mb-4 border border-slate-100 dark:border-zinc-800 shadow-sm animate-pulse">
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="h-5 bg-slate-100 dark:bg-zinc-800 rounded w-32" />
      <div className="h-5 bg-slate-100 dark:bg-zinc-800 rounded-lg w-16" />
      <div className="h-5 bg-slate-100 dark:bg-zinc-800 rounded-full w-20" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-14" />
          <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-24" />
        </div>
      ))}
    </div>
    <div className="border-t border-slate-100 dark:border-zinc-800 my-3" />
    <div className="h-8 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-full" />
  </div>
);

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
          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-sm"
      }`}
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? colorClasses.iconBg : "bg-slate-50 dark:bg-zinc-800"}`}
    >
      <Icon
        size={16}
        className={active ? colorClasses.iconColor : "text-slate-400"}
      />
    </div>
    <div className="min-w-0">
      <p
        className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${active ? colorClasses.label : "text-slate-400 dark:text-zinc-500"}`}
      >
        {label}
      </p>
      <p
        className={`text-xl font-black leading-none ${active ? colorClasses.count : "text-slate-800 dark:text-zinc-200"}`}
      >
        {count}
      </p>
    </div>
  </button>
);

function LeadCard({ lead, onView, onStatusUpdate, onDelete }) {
  const dateObj = new Date(lead.createdAt);

  // Format WhatsApp message pre-fill
  const waMessage = `Hi ${lead.ownerName}, this is from the GaragePro team regarding your partnership request for ${lead.garageName}. Let's chat!`;
  const whatsappUrl = `https://wa.me/${lead.mobileNumber.replace(/\s+/g, "").replace(/\+/g, "")}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-5 mb-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all duration-300 border border-slate-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group cursor-auto">
      {/* ── TOP ROW: Garage Name + ID + Status ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-150 tracking-tight">
            {lead.garageName}
          </h3>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 text-[11px] font-bold rounded-lg uppercase tracking-wide">
            #{lead._id?.slice(-6)?.toUpperCase() || "N/A"}
          </span>
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {/* ── META GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4 mb-4">
        <MetaField label="Owner" primary={lead.ownerName} />

        {/* Mobile (with quick WhatsApp action) */}
        <div>
          <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-wide text-slate-500 border-b-2 border-slate-100 dark:border-zinc-800 w-fit pb-0.5 mb-1.5 flex items-center gap-1 whitespace-nowrap">
            <Phone size={12} className="text-slate-400" />
            Contact
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
              {lead.mobileNumber}
            </span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-150 dark:hover:bg-emerald-900 transition"
              title="Chat on WhatsApp"
              onClick={(e) => e.stopPropagation()}
            >
              <FaWhatsapp size={13} />
            </a>
          </div>
        </div>

        <MetaField label="City" primary={lead.city} icon={MapPin} />

        <MetaField
          label="Submitted"
          primary={dateObj.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          secondary={dateObj.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        />

        {/* Services Offered preview */}
        <div>
          <p className="text-[9px] sm:text-[11px] uppercase font-black tracking-wide text-slate-500 border-b-2 border-slate-100 dark:border-zinc-800 w-fit pb-0.5 mb-1.5">
            Services
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400 truncate max-w-xs">
            {lead.servicesOffered?.join(", ") || "—"}
          </p>
        </div>
      </div>

      {/* ── Message Preview (if any) ── */}
      {lead.message && (
        <div className="mt-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100/50 dark:border-zinc-800">
          <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MessageCircle size={10} /> Message
          </p>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium line-clamp-1 italic">
            "{lead.message}"
          </p>
        </div>
      )}

      {/* ── DIVIDER ── */}
      <div className="border-t border-gray-100 dark:border-zinc-850 my-3" />

      {/* ── BOTTOM ROW: Actions ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-2">
        {/* View Details */}
        <button
          onClick={() => onView(lead)}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-slate-600 dark:text-zinc-350 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-750 transition active:scale-95"
        >
          <Eye size={14} />
          View Details
        </button>

        {/* Status transition actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          {lead.status === "pending" && (
            <button
              onClick={() => onStatusUpdate(lead, "contacted")}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition active:scale-95 shadow-sm shadow-blue-100 dark:shadow-none"
            >
              <Phone size={14} />
              Mark Contacted
            </button>
          )}

          {(lead.status === "pending" || lead.status === "contacted") && (
            <div className="flex gap-2 flex-1 sm:flex-none">
              <button
                onClick={() => onStatusUpdate(lead, "approved")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition active:scale-95 shadow-sm shadow-emerald-100 dark:shadow-none"
              >
                <CheckCircle size={14} />
                Approve
              </button>
              <button
                onClick={() => onStatusUpdate(lead, "rejected")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition active:scale-95 shadow-sm shadow-amber-100 dark:shadow-none"
              >
                <UserX size={14} />
                Reject
              </button>
            </div>
          )}

          <button
            onClick={() => onDelete(lead)}
            className="inline-flex items-center justify-center p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl transition active:scale-90"
            title="Delete Lead"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 group-hover:scale-110 transition-all duration-200 shrink-0">
      {icon}
    </div>
    <div className="flex-1 border-b border-slate-50 dark:border-zinc-850 pb-2 min-w-0">
      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none mb-1.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 wrap-break-words">
        {value || "Not specified"}
      </p>
    </div>
  </div>
);

export default function PartnershipLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { addToast } = useToast();
  const { token } = useAuth();

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/garage-leads`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setLeads(response.data);
    } catch (error) {
      addToast(
        error.response?.data?.error || "Failed to fetch partnership leads",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLeads().then(() => {
      setTimeout(() => setIsRefreshing(false), 800);
      addToast("Leads synced successfully", "success");
    });
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

  const handleStatusUpdate = async (lead, newStatus) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/garage-leads/${lead._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      addToast(`Lead status updated to ${newStatus}`, "success");
      fetchLeads();
    } catch (err) {
      addToast(err.response?.data?.error || "Status update failed", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/garage-leads/${selectedLead._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      addToast("Partnership lead deleted", "delete");
      setDeleteModalOpen(false);
      fetchLeads();
    } catch (error) {
      addToast(error.response?.data?.error || "Delete failed", "error");
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const query = activeQuery.toLowerCase();
    const matchesSearch =
      lead.garageName.toLowerCase().includes(query) ||
      lead.ownerName.toLowerCase().includes(query) ||
      lead.mobileNumber.includes(query) ||
      lead.city.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "All" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const statusCounts = leads.reduce(
    (acc, lead) => {
      acc.All += 1;
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    },
    { All: 0, pending: 0, contacted: 0, approved: 0, rejected: 0 },
  );

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
        activeBg: "bg-emerald-50 dark:bg-emerald-950/40",
        activeBorder: "border-emerald-300 dark:border-emerald-800",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
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
      header: "Lead ID",
      accessor: (row) => row._id?.slice(-6)?.toUpperCase() || "N/A",
    },
    { header: "Garage Name", accessor: "garageName" },
    { header: "Owner Name", accessor: "ownerName" },
    { header: "Mobile Number", accessor: "mobileNumber" },
    { header: "City", accessor: "city" },
    {
      header: "Services Offered",
      accessor: (row) => row.servicesOffered?.join(", ") || "",
    },
    { header: "Status", accessor: "status" },
    { header: "Message", accessor: "message" },
    {
      header: "Submitted On",
      accessor: (row) => new Date(row.createdAt).toLocaleDateString("en-IN"),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-screen h-screen mx-auto bg-gray-100 dark:bg-zinc-950 transition-colors duration-300">
      {/* ── Header ── */}
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
              Partnership Leads
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-3">
              Review and manage partnership interest applications submitted by
              workshop owners.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ExportButton
              title="Partnership Leads"
              columns={exportColumns}
              data={filteredLeads}
              filenamePrefix="partnership_leads"
            />

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700 rounded-2xl text-sm font-bold text-white transition-all duration-300 shadow-xs hover:shadow-md disabled:opacity-75 h-10.5"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <StatCard
            key={card.value}
            {...card}
            active={statusFilter === card.value}
            onClick={() => {
              setStatusFilter(card.value);
              setCurrentPage(1);
            }}
          />
        ))}
      </div>

      {/* ── Search Bar ── */}
      <div className="mb-4">
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
          placeholder="Search by garage name, owner, contact or city..."
          className="w-full"
        />
      </div>

      {/* ── Filter Chips ── */}
      {(statusFilter !== "All" || activeQuery) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-550">
            Active Filters:
          </span>
          {statusFilter !== "All" && (
            <button
              onClick={() => {
                setStatusFilter("All");
                setCurrentPage(1);
              }}
              className="inline-flex items-center capitalize gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250 dark:border-emerald-900/50 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
            >
              Status: {statusFilter} <X size={11} />
            </button>
          )}
          {activeQuery && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-250 dark:border-amber-900/50 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors"
            >
              Search: "{activeQuery}" <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* ── Count ── */}
      {!loading && filteredLeads.length > 0 && (
        <div className="mb-3 px-1">
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
            Total Leads Found:{" "}
            <span className="text-gray-900 dark:text-zinc-150 font-bold">
              {filteredLeads.length}
            </span>
          </p>
        </div>
      )}

      {/* ── Cards List ── */}
      <div>
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : currentLeads.length === 0 ? (
          <EmptyState
            icon={!!activeQuery || statusFilter !== "All" ? Search : Store}
            title={
              !!activeQuery || statusFilter !== "All"
                ? "No matching leads"
                : "No partnership leads"
            }
            description={
              !!activeQuery || statusFilter !== "All"
                ? "Try adjusting your search filters."
                : "Garage partnership applications will appear here."
            }
          />
        ) : (
          currentLeads.map((lead) => (
            <LeadCard
              key={lead._id}
              lead={lead}
              onView={(l) => {
                setSelectedLead(l);
                setDetailsModalOpen(true);
              }}
              onStatusUpdate={handleStatusUpdate}
              onDelete={(l) => {
                setSelectedLead(l);
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
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Detailed Info Modal ── */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Partnership Lead Details"
        size="md"
      >
        {selectedLead && (
          <div className="flex flex-col max-h-[80vh] overflow-hidden">
            <div className="mb-6 flex items-center gap-4 shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-100 dark:shadow-none shrink-0">
                <Store className="text-2xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-slate-900 dark:text-zinc-150 leading-tight truncate">
                  {selectedLead.garageName}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    {selectedLead.city}
                  </span>
                  <StatusBadge status={selectedLead.status} />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              <div className="pb-4 border-b border-slate-50 dark:border-zinc-850">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded-full bg-emerald-500" />
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em]">
                    Contact Info
                  </h3>
                </div>
                <div className="space-y-4">
                  <DetailRow
                    icon={<Users size={16} className="text-slate-500" />}
                    label="Owner / Contact Person"
                    value={selectedLead.ownerName}
                  />
                  <DetailRow
                    icon={<Phone size={16} className="text-slate-500" />}
                    label="Mobile Number"
                    value={selectedLead.mobileNumber}
                  />
                  <DetailRow
                    icon={<MapPin size={16} className="text-slate-500" />}
                    label="City / Location"
                    value={selectedLead.city}
                  />
                  <DetailRow
                    icon={<Clock size={16} className="text-slate-500" />}
                    label="Applied On"
                    value={new Date(selectedLead.createdAt).toLocaleString(
                      "en-IN",
                    )}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded-full bg-emerald-500" />
                  <h3 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.15em]">
                    Business Details
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10.5px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-2">
                      Services Offered
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLead.servicesOffered?.map((srv, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                        >
                          {srv}
                        </span>
                      )) || (
                        <span className="text-xs font-semibold text-slate-400">
                          None selected
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedLead.message && (
                    <div>
                      <p className="text-[10.5px] font-black text-slate-400 dark:text-zinc-500 uppercase mb-1.5">
                        Introduction Message
                      </p>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-850 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-medium italic leading-relaxed whitespace-pre-wrap">
                        "{selectedLead.message}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Partnership Lead"
        message="Are you sure you want to permanently delete this lead? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
