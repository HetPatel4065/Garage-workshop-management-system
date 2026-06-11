import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Users,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  ShieldCheck,
  Wrench,
  UserCog,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  SquareUser,
  Plus,
} from "lucide-react";
import { FaUsers } from "react-icons/fa6";
import SearchBar from "../components/UI/SearchBar";
import EmptyState from "../components/UI/EmptyState";
import { CardSkeleton, TableSkeleton } from "../components/UI/Skeleton";
import ExportButton from "../components/common/ExportButton";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";

const ROLE_CONFIG = {
  owner: {
    label: "Owner",
    class:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    dot: "bg-purple-500",
  },
  admin: {
    label: "Admin",
    class:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dot: "bg-rose-500",
  },
  advisor: {
    label: "Advisor",
    class:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  mechanic: {
    label: "Mechanic",
    class:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  user: {
    label: "Technician",
    class:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

const Label = ({ children, hint, required }) => (
  <label className="block text-sm text-gray-700 dark:text-slate-300 mb-1">
    {children}
    {required && <span className="text-red-600 ml-0.5">*</span>}
    {hint && (
      <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">
        ({hint})
      </span>
    )}
  </label>
);

const AVATAR_COLORS = [
  "from-blue-500 to-slate-900",
  "from-orange-500 via-orange-600 to-orange-700",
  "from-sky-500 via-blue-600 to-indigo-700",
  "from-violet-600 via-fuchsia-500 to-pink-500",
  "from-slate-400 via-slate-500 to-slate-600",
];

function getAvatarColor(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border ${cfg.class}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

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
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
      }`}
  >
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        active ? colorClasses.iconBg : "bg-slate-50 dark:bg-slate-700"
      }`}
    >
      <Icon
        size={16}
        className={
          active ? colorClasses.iconColor : "text-slate-400 dark:text-slate-400"
        }
      />
    </div>
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

export default function StaffMembers() {
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const canManage = ["admin", "owner"].includes(user?.role);
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("all");

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [garages, setGarages] = useState([]);
  const [loadingGarages, setLoadingGarages] = useState(false);
  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get("q") || "";
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeSearch, setActiveSearch] = useState(queryParam);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (queryParam !== activeSearch) {
      setActiveSearch(queryParam);
    }
  }, [queryParam]);

  useEffect(() => {
    if (user?.role === "admin") {
      const fetchGaragesForSelection = async () => {
        setLoadingGarages(true);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/admin/garages?limit=1000`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (res.ok) {
            const data = await res.json();
            setGarages(data.garages || []);
          }
        } catch (err) {
          console.error("Failed to fetch garages:", err);
        } finally {
          setLoadingGarages(false);
        }
      };
      fetchGaragesForSelection();
    }
  }, [user, token]);

  // Add modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    role: "mechanic",
    mobileNumber: "",
    password: "",
    targetGarageId: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobileNumber: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaff = useCallback(
    async (silently = false) => {
      if (!silently) setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/staff`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch staff");
        const data = await res.json();
        setStaff(data);
      } catch (err) {
        addToast(err.message, "error");
      } finally {
        if (!silently) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const ROLE_ORDER = { owner: 1, admin: 2, advisor: 3, mechanic: 4, user: 5 };

  const filteredStaff = staff
    .filter((m) => {
      // Owners should only see advisors and mechanics, not other owners
      if (user?.role === "owner" && m.role === "owner") return false;

      const query = (isTyping ? searchQuery : activeSearch).toLowerCase();
      const matchSearch =
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query);
      const matchRole = roleFilter === "all" || m.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const orderA = ROLE_ORDER[a.role] || 99;
      const orderB = ROLE_ORDER[b.role] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || "").localeCompare(b.name || "");
    });

  const visibleStaff =
    user?.role === "owner" ? staff.filter((m) => m.role !== "owner") : staff;

  const stats = {
    total: visibleStaff.length,
    mechanics: visibleStaff.filter((m) => m.role === "mechanic").length,
    advisors: visibleStaff.filter((m) => m.role === "advisor").length,
    owners: visibleStaff.filter((m) => m.role === "owner").length,
  };

  const STAFF_STATS_CONFIG = [
    {
      role: "all",
      label: "Total Staff",
      count: stats.total,
      icon: Users,
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
      role: "mechanic",
      label: "Mechanics",
      count: stats.mechanics,
      icon: Wrench,
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
      role: "advisor",
      label: "Advisors",
      count: stats.advisors,
      icon: SquareUser,
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
      role: "owner",
      label: "Owners",
      count: stats.owners,
      icon: ShieldCheck,
      colorClasses: {
        activeBg: "bg-purple-50 dark:bg-purple-950/40",
        activeBorder: "border-purple-200 dark:border-purple-800",
        iconBg: "bg-purple-100 dark:bg-purple-900/50",
        iconColor: "text-purple-600 dark:text-purple-400",
        label: "text-purple-600 dark:text-purple-400",
        count: "text-purple-700 dark:text-purple-300",
      },
    },
  ];

  const handleStatCardClick = (role) => {
    setActiveRole(role);
    setRoleFilter(role);
  };

  // ── EDIT ──
  const openEdit = (member) => {
    setEditTarget(member);
    setEditForm({
      name: member.name || "",
      email: member.email || "",
      mobileNumber: member.mobileNumber || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const trimmedName = editForm.name.trim();
    const trimmedEmail = editForm.email.trim();
    if (!trimmedName) {
      addToast("Full name is required", "error");
      return;
    }
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        addToast("Please provide a valid email address", "error");
        return;
      }
    }
    setIsSaving(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/staff/${editTarget._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            mobileNumber: editForm.mobileNumber.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      addToast("Staff member updated successfully", "success");
      setEditModalOpen(false);
      fetchStaff();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (member) => {
    if (member._id === user?._id) {
      addToast("You cannot deactivate your own account", "error");
      return;
    }
    const newStatus = !member.isActive;
    setStaff((prev) =>
      prev.map((m) =>
        m._id === member._id ? { ...m, isActive: newStatus } : m,
      ),
    );
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/staff/${member._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: member.name, isActive: newStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setStaff((prev) =>
          prev.map((m) =>
            m._id === member._id ? { ...m, isActive: !newStatus } : m,
          ),
        );
        throw new Error(data.error || "Failed to update status");
      }
      addToast(
        `Staff member ${newStatus ? "activated" : "deactivated"} successfully`,
        newStatus ? "success" : "error",
      );
      fetchStaff(true);
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // ── DELETE ──
  const openDelete = (member) => {
    setDeleteTarget(member);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const endpoint = deleteTarget._id?.toString().includes("_co_")
        ? `${import.meta.env.VITE_API_URL}/auth/staff/${deleteTarget._id}`
        : user?.role === "admin"
          ? `${import.meta.env.VITE_API_URL}/auth/remove-user/${deleteTarget._id}`
          : `${import.meta.env.VITE_API_URL}/auth/staff/${deleteTarget._id}`;
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to remove staff");
      }
      setStaff((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      addToast("Team member removed successfully", "delete");
      setDeleteModalOpen(false);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── ADD ──
  const openAdd = () => {
    setAddForm({
      name: "",
      email: "",
      role: "mechanic",
      mobileNumber: "",
      password: "",
      targetGarageId: "",
    });
    setAddModalOpen(true);
  };

  const handleAddStaff = async () => {
    const trimmedName = addForm.name.trim();
    const trimmedEmail = addForm.email.trim();
    const { role, password, targetGarageId } = addForm;
    // Co-owners don't need email/password — they share primary owner's credentials
    if (addForm.role === "owner") {
      if (!trimmedName || !trimmedEmail) {
        addToast("Please enter the co-owner's name and email", "error");
        return;
      }
    } else {
      if (!trimmedName || !trimmedEmail || !password) {
        addToast("Please fill in all required fields", "error");
        return;
      }
    }
    // Admin must always select a garage for any staff role
    if (user?.role === "admin" && !targetGarageId) {
      addToast(
        "Please select a garage to assign this staff member to",
        "error",
      );
      return;
    }
    if (role === "owner" && !targetGarageId) {
      addToast("Please select a garage for the owner", "error");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: role === "owner" ? `placeholder_${Date.now()}` : password,
          role,
          mobileNumber: addForm.mobileNumber.trim(),
          ownerId:
            user?.role !== "admin"
              ? user?.effectiveOwnerId || user?._id
              : undefined,
          targetGarageId: targetGarageId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add staff");

      if (data.sharedCredentials) {
        addToast(
          `Co-owner added! They should login with: ${data.loginEmail}`,
          "success",
        );
      } else {
        addToast("Staff member added successfully", "success");
      }
      setAddModalOpen(false);
      fetchStaff();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleInputChange = (setter, field) => (e) =>
    setter((p) => ({ ...p, [field]: e.target.value }));

  const handlePhone = (setter) => (e) => {
    let v = e.target.value;
    let rawInput = v.startsWith("+91") ? v.slice(4) : v;
    let digitsOnly = rawInput.replace(/\D/g, "");
    let formattedValue = "+91 " + digitsOnly;
    if (formattedValue.length <= 14)
      setter((p) => ({ ...p, mobileNumber: formattedValue }));
  };

  const exportColumns = [
    { header: "ID", accessor: (row) => row._id?.slice(-6)?.toUpperCase() },
    { header: "Name", accessor: "name" },
    { header: "Role", accessor: "role" },
    { header: "Email", accessor: "email" },
    { header: "Mobile Number", accessor: "mobileNumber" },
    {
      header: "Status",
      accessor: (row) => (row.isActive !== false ? "Active" : "Inactive"),
    },
    {
      header: "Join Date",
      accessor: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
  ];

  // Shared input class
  const inputCls =
    "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 transition";

  return (
    <div className="max-w-screen min-h-screen mx-auto bg-gray-100 dark:bg-slate-900 p-4 sm:p-6 cursor-auto">
      {/* ── HEADER ── */}
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
              Team Management
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Staff Members
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3">
              Manage your garage team — view, edit and remove members
            </p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <ExportButton
                title="Staff Members List"
                columns={exportColumns}
                data={filteredStaff}
                filenamePrefix="staff_members"
              />
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-xl h-11"
              >
                <Plus size={17} />
                Add New Staff
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsTyping(true);
            }}
            onSearch={(term) => {
              const cleanTerm = term.trim();
              setIsTyping(false);
              setActiveSearch(cleanTerm);
              setSearchQuery("");
              if (cleanTerm) {
                navigate(`/staff-members?q=${encodeURIComponent(cleanTerm)}`, {
                  replace: true,
                });
              } else {
                navigate("/staff-members", { replace: true });
              }
            }}
            activeSearch={!isTyping && activeSearch}
            onClearActive={() => {
              setActiveSearch("");
              navigate("/staff-members", { replace: true });
            }}
            placeholder="Search staff by name, email, or ID..."
            className="w-full"
          />
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 ${user?.role === "admin" ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
      >
        {STAFF_STATS_CONFIG.map((stat) => {
          if (stat.role === "owner" && user?.role !== "admin") return null;
          return (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              count={stat.count}
              colorClasses={stat.colorClasses}
              active={activeRole === stat.role}
              onClick={() => handleStatCardClick(stat.role)}
            />
          );
        })}
      </div>

      {/* ── COUNT BAR ── */}
      <div className="border-t border-gray-100 dark:border-slate-700 py-3">
        <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
          Total Staff Members:{" "}
          <span className="text-gray-900 dark:text-slate-100">
            {filteredStaff?.length || 0}
          </span>
        </p>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="space-y-6">
          <div className="md:hidden space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={6} />
          </div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No staff found"
          description="We couldn't find any staff members matching your search criteria. Try adjusting your filters or search term."
          className="mx-4 sm:mx-6 my-6"
        />
      ) : (
        <>
          {/* MOBILE: CARD VIEW */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            {filteredStaff.map((member) => {
              const avatarGrad = getAvatarColor(member.name);
              return (
                <div
                  key={member._id}
                  className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-linear-to-br ${avatarGrad} flex items-center justify-center text-white font-black text-xs shadow-sm`}
                      >
                        {member.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm capitalize font-bold text-slate-900 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                          ID: {member._id?.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <RoleBadge role={member.role} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mb-1 border-b border-slate-100 dark:border-slate-700 w-fit">
                        Email Address
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                        {member.email || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mb-1 border-b border-slate-100 dark:border-slate-700 w-fit">
                        Phone Number
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                        {member.mobileNumber || "—"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mb-1 border-b border-slate-100 dark:border-slate-700 w-fit">
                        Status
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={!canManage || member._id === user?._id}
                          onClick={() => handleToggleStatus(member)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-auto items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${member.isActive !== false ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${member.isActive !== false ? "translate-x-5.5" : "translate-x-1"}`}
                          />
                        </button>
                        <span
                          className={`inline-block w-14 text-[10px] font-bold uppercase tracking-wider ${member.isActive !== false ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          {member.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest mb-1 border-b border-slate-100 dark:border-slate-700 w-fit">
                        Joined Date
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString(
                              "en-IN",
                              { day: "numeric", month: "short" },
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(member)}
                        className="flex-1 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      {member._id !== user?._id &&
                        (user?.role === "admin" || member.role !== "owner") && (
                          <button
                            onClick={() => openDelete(member)}
                            className="flex-1 py-2 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center gap-1.5 active:scale-95 transition"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* DESKTOP: TABLE VIEW */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="w-14 px-5 py-3 text-center text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      #
                    </th>
                    <th className="px-5 py-3 text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Team Member
                    </th>
                    <th className="px-5 py-3 text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      System Role
                    </th>
                    <th className="px-5 py-3 text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-5 py-3 text-center text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      Join Date
                    </th>
                    {canManage && (
                      <th className="w-30 px-5 py-3 text-center text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((member, i) => {
                      const avatarGrad = getAvatarColor(member.name);
                      const isCurrentUser = member._id === user?._id;
                      return (
                        <tr
                          key={member._id}
                          className={`group transition-colors duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 ${isCurrentUser ? "bg-blue-50/40 dark:bg-blue-950/20" : "bg-white dark:bg-slate-800"}`}
                        >
                          <td className="px-5 py-4 text-center">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`shrink-0 w-8.5 h-8.5 rounded-lg bg-linear-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white dark:ring-slate-800`}
                              >
                                {member.name?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate capitalize">
                                    {member.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-tight">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                  ID: {member._id.slice(-6).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <RoleBadge role={member.role} />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-50">
                                {member.email || "—"}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                                {member.mobileNumber || "—"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                disabled={
                                  !canManage || member._id === user?._id
                                }
                                onClick={() => handleToggleStatus(member)}
                                className={`relative inline-flex h-5 w-10 shrink-0 cursor-auto items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${member.isActive !== false ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${member.isActive !== false ? "translate-x-5.5" : "translate-x-1"}`}
                                />
                              </button>
                              <span
                                className={`text-[10px] font-bold uppercase ${member.isActive !== false ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                              >
                                {member.isActive !== false
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                              {member.createdAt
                                ? new Date(member.createdAt).toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "—"}
                            </span>
                          </td>

                          {canManage && (
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEdit(member)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                  title="Edit Member"
                                >
                                  <Pencil size={15} />
                                </button>
                                {member._id !== user?._id &&
                                  (user?.role === "admin" ||
                                    member.role !== "owner") && (
                                    <button
                                      onClick={() => openDelete(member)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                      title="Delete Member"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={canManage ? 7 : 6}
                        className="px-6 py-20 text-center"
                      >
                        <span className="text-sm font-medium text-slate-400 dark:text-slate-500 italic">
                          No members found in your organization.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── FOOTER COUNT ── */}
      {!loading && filteredStaff.length > 0 && (
        <div className="rounded-xl px-4 sm:px-6 mt-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Showing {filteredStaff.length} of {visibleStaff.length} team members
          </p>
        </div>
      )}

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Staff"
        subtitle="Create a new account for your team"
        size="sm"
        footer={
          <div className="flex justify-end gap-3 px-5 sm:px-7 py-4 sm:py-5 bg-slate-50">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddStaff}
              disabled={isAdding}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-auto flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isAdding ? "Adding..." : "Add Staff"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label required>Full Name</Label>
            <input
              value={addForm.name}
              onChange={handleInputChange(setAddForm, "name")}
              placeholder="e.g. John Doe"
              className={`${inputCls} capitalize`}
            />
          </div>
          <div className="space-y-1.5">
            <Label required>Email Address</Label>
            <input
              value={addForm.email}
              onChange={handleInputChange(setAddForm, "email")}
              placeholder="e.g. john@example.com"
              type="email"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <input
              value={addForm.mobileNumber}
              onChange={handlePhone(setAddForm)}
              placeholder="e.g. +91 98765 43210"
              className={inputCls}
            />
          </div>
          <div
            className={`grid gap-4 ${addForm.role === "owner" ? "grid-cols-1" : "grid-cols-2"}`}
          >
            <div className="space-y-1.5">
              <Label required>System Role</Label>
              <select
                value={addForm.role}
                onChange={handleInputChange(setAddForm, "role")}
                className={inputCls}
              >
                <option value="mechanic">Mechanic</option>
                <option value="advisor">Advisor</option>
                {user?.role === "admin" && <option value="owner">Owner</option>}
              </select>
            </div>
            {addForm.role !== "owner" && (
              <div className="space-y-1.5">
                <Label required>Password</Label>
                <input
                  value={addForm.password}
                  onChange={handleInputChange(setAddForm, "password")}
                  placeholder="••••••••"
                  type="password"
                  className={inputCls}
                />
              </div>
            )}
          </div>
          {/* Admin must always pick a garage; for owners this is only when role=owner */}
          {(user?.role === "admin" || addForm.role === "owner") && (
            <div className="space-y-1.5">
              <Label required>
                {addForm.role === "owner"
                  ? "Assign to Garage"
                  : "Assign to Garage"}
              </Label>
              {loadingGarages ? (
                <div className={`${inputCls} text-slate-400`}>
                  Loading garages...
                </div>
              ) : (
                <select
                  value={addForm.targetGarageId}
                  onChange={handleInputChange(setAddForm, "targetGarageId")}
                  className={inputCls}
                  required
                >
                  <option value="">-- Select Garage --</option>
                  {Array.from(
                    new Map(garages.map((g) => [g.garageId, g])).values(),
                  ).map((g) => (
                    <option key={g.garageId} value={g.garageId}>
                      {g.garageName} (ID: {g.garageId})
                    </option>
                  ))}
                </select>
              )}

              {/* ✅ Warning shown when admin picks a garage for a co-owner */}
              {addForm.role === "owner" && addForm.targetGarageId && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex gap-2 mt-2">
                  <AlertTriangle
                    size={15}
                    className="text-amber-500 shrink-0 mt-0.5"
                  />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    This co-owner will use their own email but the primary
                    owner's password to login. No separate password needed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={editModalOpen && !!editTarget}
        onClose={() => setEditModalOpen(false)}
        title="Edit Staff Member"
        subtitle={editTarget?.role}
        size="sm"
        footer={
          <div className="flex justify-end gap-3 px-5 sm:px-7 py-4 sm:py-5 bg-slate-50">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-auto flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <input
              value={editForm.name}
              onChange={handleInputChange(setEditForm, "name")}
              placeholder="Full name"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <input
              value={editForm.email}
              onChange={handleInputChange(setEditForm, "email")}
              placeholder="Email"
              type="email"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <input
              value={editForm.mobileNumber}
              onChange={handlePhone(setEditForm)}
              placeholder="e.g. +91 98765 43210"
              className={inputCls}
            />
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl p-3 flex gap-2">
            <ShieldCheck
              size={16}
              className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5"
            />
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Role changes are managed by the system. Only name and email can be
              edited here.
            </p>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen && !!deleteTarget}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Remove Team Member?"
        message={
          deleteTarget
            ? `Are you sure you want to remove "${deleteTarget.name}"? They will lose all access to the garage immediately.`
            : ""
        }
        confirmText={isDeleting ? "Processing..." : "Yes, Remove"}
        cancelText="Stay, Keep"
        type="delete"
        isLoading={isDeleting}
      >
        {deleteTarget?.role === "owner" && (
          <div className="flex items-start gap-3 text-left bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertCircle
              size={18}
              strokeWidth={2.5}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <div className="space-y-1">
              <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">
                Critical Warning
              </p>
              <p className="text-[12px] font-semibold text-amber-800/80 leading-snug">
                Removing an Owner may orphan this garage account. Ensure another
                owner is assigned first.
              </p>
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
