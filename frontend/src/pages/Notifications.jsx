import React, { useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import {
  Bell,
  Trash2,
  CheckCheck,
  Clock,
  FileText,
  User,
  Wrench,
  AlertCircle,
  Box,
  ArrowRight,
  Shield,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import SearchBar from "../components/UI/SearchBar";
import EmptyState from "../components/UI/EmptyState";

/* ─── Helper: icon + colour per type ─── */
function getTypeStyles(type) {
  switch (type) {
    case "unpaid_invoice":
      return {
        icon: FileText,
        color: "text-rose-500",
        bg: "bg-rose-50",
        border: "border-rose-100",
        label: "Unpaid Invoice",
        badge: "text-rose-700 bg-rose-100 border-rose-100",
      };
    case "new_customer":
      return {
        icon: User,
        color: "text-blue-500",
        bg: "bg-blue-50",
        border: "border-blue-100",
        label: "New Customer",
        badge: "text-blue-700 bg-blue-100 border-blue-100",
      };
    case "service_reminder":
      return {
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-100",
        label: "Service Reminder",
        badge: "text-amber-700 bg-amber-100 border-amber-100",
      };
    case "error":
      return {
        icon: AlertCircle,
        color: "text-red-500",
        bg: "bg-red-50",
        border: "border-red-100",
        label: "Error",
        badge: "text-red-700 bg-red-100 border-red-100",
      };
    case "warning":
      return {
        icon: AlertCircle,
        color: "text-orange-500",
        bg: "bg-orange-50",
        border: "border-orange-100",
        label: "Warning",
        badge: "text-orange-700 bg-orange-100 border-orange-100",
      };
    case "low_stock":
      return {
        icon: Box,
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-100",
        label: "Low Stock",
        badge: "text-orange-700 bg-orange-100 border-orange-100",
      };
    case "job_update":
      return {
        icon: Wrench,
        color: "text-indigo-500",
        bg: "bg-indigo-50",
        border: "border-indigo-100",
        label: "Job Update",
        badge: "text-indigo-700 bg-indigo-100 border-indigo-100",
      };
    default:
      return {
        icon: Bell,
        color: "text-indigo-500",
        bg: "bg-indigo-50",
        border: "border-indigo-100",
        label: "General",
        badge: "text-indigo-700 bg-indigo-100 border-indigo-100",
      };
  }
}

/* ─── Helper: icon + colour per source ─── */
function getSourceStyles(source) {
  switch (source) {
    case "Admin":
      return {
        icon: Shield,
        color: "text-rose-600 bg-rose-50 border-rose-100",
        label: "From Admin",
      };
    case "Customer":
      return {
        icon: User,
        color: "text-indigo-600 bg-indigo-50 border-indigo-100",
        label: "From Customer",
      };
    case "Garage":
      return {
        icon: Wrench,
        color: "text-emerald-600 bg-emerald-50 border-emerald-100",
        label: "From Garage",
      };
    case "System":
    default:
      return {
        icon: Settings,
        color: "text-slate-600 bg-slate-50 border-slate-200",
        label: "From System",
      };
  }
}

/* ─── MetaField — mirrors CustomerCard's MetaField ─── */
function MetaField({ label, primary, secondary, icon: Icon }) {
  return (
    <div className="flex flex-col min-w-0">
      <p className="text-[9px] sm:text-[12px] uppercase font-black tracking-wide text-slate-600 border-b-2 border-slate-200 w-fit pb-0.5 mb-1.5 flex items-center gap-1 whitespace-nowrap">
        {Icon && <Icon size={14} className="text-slate-700" />}
        {label}
      </p>
      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-normal break-all sm:wrap-break-words">
        {primary || "—"}
      </p>
      {secondary && (
        <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">
          {secondary}
        </p>
      )}
    </div>
  );
}

/* ─── NotificationCard — mirrors CustomerCard visually ─── */
function NotificationCard({ notification, onMarkRead, onDelete }) {
  const { title, message, type, read, createdAt, link, source, subtitle } =
    notification;
  const { icon: Icon, color, bg, border, badge } = getTypeStyles(type);
  const { label } = getTypeStyles(type);

  const sourceStyles = getSourceStyles(source || "System");
  const SourceIcon = sourceStyles.icon;

  const formattedDate = createdAt
    ? format(new Date(createdAt), "d MMM yyyy")
    : "—";
  const formattedTime = createdAt ? format(new Date(createdAt), "h:mm a") : "—";

  return (
    <div
      className={`bg-white rounded-3xl p-4 sm:p-5 mb-4 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 border shadow-sm relative overflow-hidden group cursor-auto ${
        read ? "border-slate-100 opacity-80" : "border-slate-100"
      }`}
    >
      {/* Top row: title + type badge + source badge */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              {title}
            </h3>
            <span
              className={`px-2 py-0.5 border text-[10px] font-black tracking-widest rounded-lg uppercase ${badge}`}
            >
              {label}
            </span>
            <span
              className={`px-2 py-0.5 border text-[10px] font-black tracking-widest rounded-lg uppercase flex items-center gap-1 ${sourceStyles.color}`}
            >
              <SourceIcon size={10} />
              {source || "System"}
            </span>
            {!read && (
              <span className="px-2 py-0.5 border text-[10px] font-black tracking-widest rounded-lg uppercase text-blue-700 bg-blue-100 border-blue-100">
                Unread
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs font-semibold text-slate-500 mb-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* META GRID — mirrors CustomerCard grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 mb-4">
        <MetaField label="Type" icon={Icon} primary={label} />
        <MetaField label="Date" primary={formattedDate} />
        <MetaField label="Time" primary={formattedTime} />
        <MetaField
          label="Source"
          icon={SourceIcon}
          primary={sourceStyles.label}
        />
      </div>

      {/* Message body */}
      <div className="border-t border-gray-100 my-3" />
      <p className="text-sm font-medium text-slate-600 leading-relaxed">
        {message}
      </p>

      {/* DIVIDER */}
      <div className="border-t border-gray-100 my-3" />

      {/* BOTTOM ROW: link + actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-2">
        {link ? (
          <a
            href={link}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition active:scale-95"
          >
            <ArrowRight size={14} />
            View Details
          </a>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {!read && (
            <button
              onClick={() => onMarkRead(notification._id)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition active:scale-95 shadow-sm"
              title="Mark as read"
            >
              <CheckCheck size={14} />
              Mark Read
            </button>
          )}
          <button
            onClick={() => onDelete(notification._id)}
            className="inline-flex items-center justify-center p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 bg-slate-50 border border-slate-200 rounded-xl transition active:scale-90"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications Page ─── */
export default function Notifications() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  /* ─── Filter logic mirrors Customers page ─── */
  const filteredNotifications = notifications.filter((n) => {
    const query = (isTyping ? searchQuery : activeSearch).toLowerCase();
    const matchTitle = (n.title || "").toLowerCase().includes(query);
    const matchMessage = (n.message || "").toLowerCase().includes(query);
    const searchMatch = matchTitle || matchMessage;

    if (filter === "All") return searchMatch;
    if (filter === "Unread") return searchMatch && !n.read;
    if (filter === "Important")
      return (
        searchMatch && ["error", "warning", "unpaid_invoice"].includes(n.type)
      );
    if (filter.startsWith("source_")) {
      const srcVal = filter.replace("source_", "");
      return searchMatch && (n.source || "System") === srcVal;
    }
    return searchMatch && n.type === filter;
  });

  /* ─── Type counts (mirrors statusCounts in Customers) ─── */
  const typeCounts = notifications.reduce(
    (acc, n) => {
      acc.All += 1;
      if (!n.read) acc.Unread += 1;
      if (["error", "warning", "unpaid_invoice"].includes(n.type))
        acc.Important += 1;

      const src = n.source || "System";
      acc.sources[src] = (acc.sources[src] || 0) + 1;
      return acc;
    },
    {
      All: 0,
      Unread: 0,
      Important: 0,
      sources: { Admin: 0, Customer: 0, Garage: 0, System: 0 },
    },
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-100 max-w-screen h-screen mx-auto">
      {/* ── PAGE HEADER — mirrors Customers ── */}
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.22em] mb-2">
              Notification Center
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Notifications
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-3">
              Stay updated with everything happening in your garage
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-xl"
            >
              <CheckCheck size={17} />
              Mark All Read
            </button>
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 rounded-2xl text-sm font-bold transition-all duration-300 shadow-sm"
            >
              <Trash2 size={17} />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH + FILTER — mirrors Customers ── */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsTyping(true);
            }}
            onSearch={(term) => {
              const clean = term.trim();
              setIsTyping(false);
              setActiveSearch(clean);
              setSearchQuery("");
            }}
            activeSearch={!isTyping && activeSearch}
            onClearActive={() => {
              setActiveSearch("");
            }}
            placeholder="Search by notification title or message..."
            className="w-full"
          />
        </div>
        <div className="w-full lg:w-64">
          <select
            id="notification-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="All">All Notifications ({typeCounts.All})</option>
            <option value="Unread">Unread ({typeCounts.Unread})</option>
            <option value="Important">
              Important ({typeCounts.Important})
            </option>
            <option disabled className="text-slate-400 font-bold border-t">
              ── Filter By Source ──
            </option>
            <option value="source_Admin">
              From Admin ({typeCounts.sources.Admin || 0})
            </option>
            <option value="source_Customer">
              From Customer ({typeCounts.sources.Customer || 0})
            </option>
            <option value="source_Garage">
              From Garage ({typeCounts.sources.Garage || 0})
            </option>
            <option value="source_System">
              From System ({typeCounts.sources.System || 0})
            </option>
          </select>
        </div>
      </div>

      {/* ── TYPE CHIPS — mirrors Customers' status chips ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          ["All", "bg-indigo-100 text-indigo-700 border-indigo-300"],
          ["Unread", "bg-blue-100 text-blue-700 border-blue-300"],
          ["Important", "bg-red-100 text-red-700 border-red-300"],
        ].map(([label, classes]) => (
          <span
            key={label}
            className={`text-[11px] font-bold px-3 py-1 rounded-full border ${classes}`}
          >
            {label}: {typeCounts[label] || 0}
          </span>
        ))}
      </div>

      {/* ── TOTAL COUNT — mirrors Customers ── */}
      <div className="mt-4 border-t border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-600">
          Total Notifications:{" "}
          <span className="text-gray-900">{filteredNotifications.length}</span>
        </p>
      </div>

      {/* ── NOTIFICATION LIST ── */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <NotificationCard
              key={n._id}
              notification={n}
              onMarkRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description="You currently have no notifications. We'll show messages here when there are updates."
          className="mt-2"
        />
      )}
    </div>
  );
}
