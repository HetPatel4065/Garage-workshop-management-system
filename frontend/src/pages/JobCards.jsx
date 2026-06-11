import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SearchBar from "../components/UI/SearchBar";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";
import {
  FileText,
  Save,
  Check,
  Clipboard,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Users,
  Filter,
  X,
} from "lucide-react";
import { FaCar } from "react-icons/fa";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("en-GB", opts);
};

const toLocalDateString = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateRange = (type) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (type === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: toLocalDateString(start),
      endDate: toLocalDateString(end),
    };
  }
  if (type === "tomorrow") {
    start.setDate(now.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(now.getDate() + 1);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: toLocalDateString(start),
      endDate: toLocalDateString(end),
    };
  }
  if (type === "this-week") {
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diffToMonday);
    start.setHours(0, 0, 0, 0);

    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: toLocalDateString(start),
      endDate: toLocalDateString(end),
    };
  }
  if (type === "this-month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(now.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return {
      startDate: toLocalDateString(start),
      endDate: toLocalDateString(end),
    };
  }
  return { startDate: "", endDate: "" };
};

import JobCard from "../components/Services/JobCard";
import ExportButton from "../components/common/ExportButton";
import EmptyState from "../components/UI/EmptyState";

export default function JobCards() {
  const { user, token: authToken } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const token = authToken || sessionStorage.getItem("garage_token");
  const role = user?.role || sessionStorage.getItem("role") || "user";

  const [vehicles, setVehicles] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [customers, setCustomers] = useState([]);

  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get("q") || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeSearch, setActiveSearch] = useState(queryParam);

  // Sync activeSearch with URL on mount or URL change
  useEffect(() => {
    if (queryParam !== activeSearch) {
      setActiveSearch(queryParam);
    }
  }, [queryParam]);

  // Persisted Filters State
  const [filterStatus, setFilterStatus] = useState(() => {
    return sessionStorage.getItem("jc_filterStatus") || "All";
  });
  const [filterDateType, setFilterDateType] = useState(() => {
    return sessionStorage.getItem("jc_filterDateType") || "all";
  });
  const [filterStartDate, setFilterStartDate] = useState(() => {
    return sessionStorage.getItem("jc_filterStartDate") || "";
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    return sessionStorage.getItem("jc_filterEndDate") || "";
  });
  const [filterStaff, setFilterStaff] = useState(() => {
    return sessionStorage.getItem("jc_filterStaff") || "All";
  });

  const [showFilters, setShowFilters] = useState(false);

  const [advisors, setAdvisors] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const createEmptyJc = () => ({
    vehicleId: "",
    instructionText: "1. ",
    assignedAdvisor: "",
    assignedMechanic: "",
  });

  const [selectedJcId, setSelectedJcId] = useState(null);
  const [customerId, setCustomerId] = useState("");
  const [jobCardsToCreate, setJobCardsToCreate] = useState([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const textareaRef = useRef(null);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const ts = Date.now();

      // Synchronize with API query-based filtering
      const params = new URLSearchParams();
      params.append("t", ts);

      // We process status filter client-side to keep counts of other status tabs correct,
      // but API supports it, so it's fully synchronized.

      if (filterStaff !== "All") {
        params.append("staff", filterStaff);
      }

      if (filterDateType !== "all" && filterDateType !== "custom") {
        const { startDate, endDate } = getDateRange(filterDateType);
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      } else if (filterDateType === "custom") {
        if (filterStartDate) params.append("startDate", filterStartDate);
        if (filterEndDate) params.append("endDate", filterEndDate);
      }

      const [vehRes, jcRes, custRes, advRes, mechRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/vehicles?t=${ts}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${import.meta.env.VITE_API_URL}/job-cards?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        fetch(`${import.meta.env.VITE_API_URL}/customers?t=${ts}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${import.meta.env.VITE_API_URL}/auth/staff?role=advisor&t=${ts}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
        fetch(
          `${import.meta.env.VITE_API_URL}/auth/staff?role=mechanic&t=${ts}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      if (!vehRes.ok || !jcRes.ok || !custRes.ok)
        throw new Error("Failed to fetch data");

      const vData = await vehRes.json();
      const jcData = await jcRes.json();
      const cData = await custRes.json();

      setVehicles(vData);
      setJobCards(jcData);
      setCustomers(cData);

      if (advRes.ok) {
        const advJson = await advRes.json();
        setAdvisors(advJson.staff || advJson);
      }
      if (mechRes.ok) {
        const mechJson = await mechRes.json();
        setMechanics(mechJson.staff || mechJson);
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("jc_filterStatus", filterStatus);
    sessionStorage.setItem("jc_filterDateType", filterDateType);
    sessionStorage.setItem("jc_filterStartDate", filterStartDate);
    sessionStorage.setItem("jc_filterEndDate", filterEndDate);
    sessionStorage.setItem("jc_filterStaff", filterStaff);
  }, [
    filterStatus,
    filterDateType,
    filterStartDate,
    filterEndDate,
    filterStaff,
  ]);

  // Fetch when token or any active filters change
  useEffect(() => {
    if (token) fetchData();
  }, [token, filterDateType, filterStartDate, filterEndDate, filterStaff]);

  // Count per status for pill badges (calculated dynamically from current staff & date filtered job cards)
  const statusCounts = jobCards.reduce((acc, jc) => {
    const s = jc.status || "pending-inspection";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const filteredJobCards = jobCards
    .filter((jc) => {
      const vIdRaw =
        typeof jc.vehicleId === "object" ? jc.vehicleId?._id : jc.vehicleId;
      const vNative =
        vehicles.find((veh) => String(veh._id) === String(vIdRaw)) || {};
      const v = {
        ...vNative,
        ...(typeof jc.vehicleId === "object" ? jc.vehicleId : {}),
      };

      const cIdRaw =
        typeof v.customerId === "object" ? v.customerId?._id : v.customerId;
      const cNative =
        customers.find((cust) => String(cust._id) === String(cIdRaw)) || {};
      const c = {
        ...cNative,
        ...(typeof v.customerId === "object" ? v.customerId : {}),
      };

      const query = (isTyping ? searchQuery : activeSearch).toLowerCase();
      const matchesSearch =
        (v.licensePlate || "").toLowerCase().includes(query) ||
        (v.make || "").toLowerCase().includes(query) ||
        (v.model || "").toLowerCase().includes(query) ||
        (c.name || c.fullName || v.customerName || "")
          .toLowerCase()
          .includes(query) ||
        (jc.jobCardId || "").toLowerCase().includes(query) ||
        (jc.serviceInstructions || "").toLowerCase().includes(query) ||
        (jc._id || "").toLowerCase().includes(query);

      const jcStatus = jc.status || "pending-inspection";
      const matchesStatus = filterStatus === "All" || jcStatus === filterStatus;

      // Staff/Technician filter (frontend sync)
      let matchesStaff = true;
      if (filterStaff !== "All") {
        if (filterStaff === "unassigned") {
          const hasMechanic =
            typeof jc.mechanicId === "object"
              ? jc.mechanicId?._id
              : jc.mechanicId;
          matchesStaff = !hasMechanic;
        } else {
          const mechId =
            typeof jc.mechanicId === "object"
              ? jc.mechanicId?._id
              : jc.mechanicId;
          const advId =
            typeof jc.advisorId === "object" ? jc.advisorId?._id : jc.advisorId;
          matchesStaff =
            String(mechId) === String(filterStaff) ||
            String(advId) === String(filterStaff);
        }
      }

      // Date Range Filter (frontend sync)
      let matchesDate = true;
      const targetDate = jc.createdAt;
      if (filterDateType !== "all" && targetDate) {
        const itemDate = toLocalDateString(targetDate);
        if (filterDateType === "custom") {
          if (filterStartDate && itemDate < filterStartDate)
            matchesDate = false;
          if (filterEndDate && itemDate > filterEndDate) matchesDate = false;
        } else {
          const { startDate, endDate } = getDateRange(filterDateType);
          if (itemDate < startDate || itemDate > endDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesStaff && matchesDate;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const groupedJobCards = React.useMemo(() => {
    const groups = {};
    filteredJobCards.forEach((jc) => {
      const vIdRaw =
        typeof jc.vehicleId === "object" ? jc.vehicleId?._id : jc.vehicleId;
      const vNative =
        vehicles.find((veh) => String(veh._id) === String(vIdRaw)) || {};
      const v = {
        ...vNative,
        ...(typeof jc.vehicleId === "object" ? jc.vehicleId : {}),
      };

      const cid =
        v.customerId?._id || v.customerId || `unassigned-${vIdRaw || jc._id}`;
      if (!groups[cid]) {
        const cNative =
          customers.find((cust) => String(cust._id) === String(cid)) || {};
        groups[cid] = {
          customerId: cid,
          customerName:
            cNative.name ||
            cNative.fullName ||
            v.customerName ||
            "Unknown Customer",
          jobCards: [],
        };
      }
      groups[cid].jobCards.push(jc);
    });
    return Object.values(groups);
  }, [filteredJobCards, vehicles, customers]);

  const handleAddNew = () => {
    setSelectedJcId(null);
    setCustomerId("");
    setJobCardsToCreate([createEmptyJc()]);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const handleEdit = (jc) => {
    setSelectedJcId(jc._id);
    const vIdRaw =
      typeof jc.vehicleId === "object" ? jc.vehicleId?._id : jc.vehicleId;
    const vNative =
      vehicles.find((veh) => String(veh._id) === String(vIdRaw)) || {};
    const v = {
      ...vNative,
      ...(typeof jc.vehicleId === "object" ? jc.vehicleId : {}),
    };

    const cId =
      typeof v.customerId === "object" ? v.customerId?._id : v.customerId;

    setCustomerId(cId || "");
    setJobCardsToCreate([
      {
        vehicleId: vIdRaw || "",
        instructionText: jc.serviceInstructions || "1. ",
        assignedAdvisor:
          typeof jc.advisorId === "object"
            ? jc.advisorId?._id
            : jc.advisorId || "",
        assignedMechanic:
          typeof jc.mechanicId === "object"
            ? jc.mechanicId?._id
            : jc.mechanicId || "",
        serviceDate: jc.serviceDate
          ? new Date(jc.serviceDate).toISOString().split("T")[0]
          : "",
        nextServiceDate: jc.nextServiceDate
          ? new Date(jc.nextServiceDate).toISOString().split("T")[0]
          : "",
      },
    ]);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const handleView = (jc) => {
    setSelectedJcId(jc._id);
    const vIdRaw =
      typeof jc.vehicleId === "object" ? jc.vehicleId?._id : jc.vehicleId;
    const vNative =
      vehicles.find((veh) => String(veh._id) === String(vIdRaw)) || {};
    const v = {
      ...vNative,
      ...(typeof jc.vehicleId === "object" ? jc.vehicleId : {}),
    };

    const cId =
      typeof v.customerId === "object" ? v.customerId?._id : v.customerId;

    setCustomerId(cId || "");
    setJobCardsToCreate([
      {
        vehicleId: vIdRaw || "",
        instructionText: jc.serviceInstructions || "",
        assignedAdvisor:
          typeof jc.advisorId === "object"
            ? jc.advisorId?._id
            : jc.advisorId || "",
        assignedMechanic:
          typeof jc.mechanicId === "object"
            ? jc.mechanicId?._id
            : jc.mechanicId || "",
        serviceDate: jc.serviceDate
          ? new Date(jc.serviceDate).toISOString().split("T")[0]
          : "",
        nextServiceDate: jc.nextServiceDate
          ? new Date(jc.nextServiceDate).toISOString().split("T")[0]
          : "",
      },
    ]);
    setIsReadOnly(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/job-cards/${itemToDelete}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Delete failed");

      setJobCards(jobCards.filter((jc) => jc._id !== itemToDelete));
      addToast("Job Card deleted", "delete");
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleSaveRequest = async () => {
    if (!customerId) {
      addToast("Please select a customer", "error");
      return;
    }

    const hasErrors = jobCardsToCreate.some((jc) => {
      const trimmed = jc.instructionText.trim();
      return !jc.vehicleId || !trimmed || trimmed === "1.";
    });

    if (hasErrors) {
      addToast(
        "Please ensure all job cards have a vehicle and instructions selected",
        "error",
      );
      return;
    }

    try {
      setIsSaving(true);
      const isNew = !selectedJcId;

      if (isNew) {
        for (const jc of jobCardsToCreate) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/job-cards`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              vehicleId: jc.vehicleId,
              serviceInstructions: jc.instructionText.trim(),
              advisorId: jc.assignedAdvisor || null,
              mechanicId: jc.assignedMechanic || null,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Creation failed");
        }
        addToast("Job Cards added successfully", "success");
      } else {
        const jc = jobCardsToCreate[0];
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/job-cards/${selectedJcId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              vehicleId: jc.vehicleId,
              serviceInstructions: jc.instructionText.trim(),
              advisorId: jc.assignedAdvisor || null,
              mechanicId: jc.assignedMechanic || null,
            }),
          },
        );
        if (!res.ok) throw new Error("Update failed");
        addToast("Job Card updated", "success");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const arr = [...jobCardsToCreate];
      const jc = arr[i];
      const lines = jc.instructionText.split("\n");
      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/^(\d+)\.\s/);
      const nextNumber = match ? parseInt(match[1]) + 1 : 1;
      jc.instructionText = jc.instructionText + `\n${nextNumber}. `;
      setJobCardsToCreate(arr);
    }
  };

  // Status pill config — derived from dynamic statuses
  const statusTabs = [
    "All",
    "pending-inspection",
    "inspection-complete",
    "work-assigned",
    "in-progress",
    "completed",
    "ready-for-delivery",
    "closed",
  ];

  const exportColumns = [
    { header: "Job Card ID", accessor: "jobCardId" },
    { header: "Status", accessor: "status" },
    {
      header: "Vehicle Plate",
      accessor: (row) =>
        typeof row.vehicleId === "object"
          ? row.vehicleId?.licensePlate
          : vehicles.find((v) => v._id === row.vehicleId)?.licensePlate ||
            "N/A",
    },
    {
      header: "Customer",
      accessor: (row) => {
        const vId =
          typeof row.vehicleId === "object"
            ? row.vehicleId?._id
            : row.vehicleId;
        const v = vehicles.find((veh) => String(veh._id) === String(vId)) || {};
        const cId =
          typeof v.customerId === "object" ? v.customerId?._id : v.customerId;
        return (
          customers.find((c) => String(c._id) === String(cId))?.name ||
          v.customerName ||
          "N/A"
        );
      },
    },
    {
      header: "Advisor",
      accessor: (row) =>
        typeof row.advisorId === "object"
          ? row.advisorId?.name
          : advisors.find((a) => a._id === row.advisorId)?.name || "N/A",
    },
    {
      header: "Mechanic",
      accessor: (row) =>
        typeof row.mechanicId === "object"
          ? row.mechanicId?.name
          : mechanics.find((m) => m._id === row.mechanicId)?.name || "N/A",
    },
    {
      header: "Created At",
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    { header: "Instructions", accessor: "serviceInstructions" },
  ];

  const availableCarsForCustomer = vehicles.filter(
    (v) => v.customerId === customerId || v.customerId?._id === customerId,
  );

  const isEditing = !!selectedJcId;
  const isInvalid =
    !customerId ||
    jobCardsToCreate.some(
      (jc) =>
        !jc.vehicleId ||
        !jc.instructionText?.trim() ||
        jc.instructionText.trim() === "1.",
    );

  const hasActiveFilters =
    filterStatus !== "All" || filterDateType !== "all" || filterStaff !== "All";

  const clearAllFilters = () => {
    setFilterStatus("All");
    setFilterDateType("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterStaff("All");
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 dark:bg-slate-950 min-h-screen">
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">
              Job Card Management
            </p>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Job Cards
            </h1>

            <p className="text-sm font-medium text-slate-500 mt-3">
              Manage workshop instructions and job cards directly
            </p>
          </div>

          {role !== "mechanic" && role !== "advisor" && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <ExportButton
                title="Job Cards List"
                columns={exportColumns}
                data={filteredJobCards}
                filenamePrefix="job_cards"
              />
              <button
                onClick={handleAddNew}
                className="
                flex items-center gap-2
                px-5 py-3
                bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700
                text-white
                rounded-2xl
                text-sm font-bold
                transition-all duration-300
                shadow-md hover:shadow-xl
                h-10.5
              "
              >
                <Plus size={17} />
                Add Job Card
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
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
                navigate(`/job-cards?q=${encodeURIComponent(cleanTerm)}`, {
                  replace: true,
                });
              } else {
                navigate("/job-cards", { replace: true });
              }
            }}
            activeSearch={!isTyping && activeSearch}
            onClearActive={() => {
              setActiveSearch("");
              navigate("/job-cards", { replace: true });
            }}
            placeholder="Search job cards by ID, vehicle plate or owner..."
            className="w-full"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center justify-center gap-2
            px-4 py-2.5
            rounded-xl border shadow-sm cursor-auto transition-all duration-300
            ${
              showFilters
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }
          `}
          title="Date & Staff Filters"
        >
          <Filter size={18} />
          <span className="text-sm font-semibold">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          )}
        </button>
      </div>
      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 transition-all duration-300 animate-fade-in">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Date Filters */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Date Range
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: "all", label: "All Time" },
                    { value: "today", label: "Today" },
                    { value: "tomorrow", label: "Tomorrow" },
                    { value: "this-week", label: "This Week" },
                    { value: "this-month", label: "This Month" },
                    { value: "custom", label: "Custom" },
                  ].map((opt) => {
                    const isActive = filterDateType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFilterDateType(opt.value)}
                        className={`
                          py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-auto
                          ${
                            isActive
                              ? "bg-slate-900 text-white shadow-sm"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }
                        `}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Range Picker */}
                {filterDateType === "custom" && (
                  <div className="flex items-center gap-2 mt-3 animate-fade-in">
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-auto h-9"
                    />
                    <span className="text-slate-400 text-xs font-semibold">
                      to
                    </span>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 cursor-auto h-9"
                    />
                  </div>
                )}
              </div>

              {/* Staff / Technician Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Assigned Staff & Technicians
                  </label>
                </div>
                <select
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 capitalize cursor-auto h-9"
                >
                  <option value="All">All Staff Members</option>
                  <option value="unassigned">Unassigned Jobs</option>

                  {advisors.length > 0 && (
                    <optgroup label="Service Advisors">
                      {advisors.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name || s.email} (Advisor)
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {mechanics.length > 0 && (
                    <optgroup label="Technicians & Mechanics">
                      {mechanics.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name || s.email} (Mechanic)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                  Active Filters:
                </span>

                {filterStatus !== "All" && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-bold transition-all duration-300">
                    <span className="capitalize">
                      Status: {filterStatus.replace("-", " ")}
                    </span>
                    <button
                      onClick={() => setFilterStatus("All")}
                      className="hover:bg-blue-100 rounded-full p-0.5 transition-colors cursor-auto"
                      title="Remove filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {filterDateType !== "all" && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold transition-all duration-300">
                    <span className="capitalize">
                      Date:{" "}
                      {filterDateType === "custom"
                        ? `${filterStartDate || "?"} to ${filterEndDate || "?"}`
                        : filterDateType.replace("-", " ")}
                    </span>
                    <button
                      onClick={() => {
                        setFilterDateType("all");
                        setFilterStartDate("");
                        setFilterEndDate("");
                      }}
                      className="hover:bg-indigo-100 rounded-full p-0.5 transition-colors cursor-auto"
                      title="Remove filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {filterStaff !== "All" && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-bold transition-all duration-300">
                    <span className="capitalize">
                      Staff:{" "}
                      {filterStaff === "unassigned"
                        ? "Unassigned"
                        : advisors.find((a) => a._id === filterStaff)?.name ||
                          mechanics.find((m) => m._id === filterStaff)?.name ||
                          "Selected Staff"}
                    </span>
                    <button
                      onClick={() => setFilterStaff("All")}
                      className="hover:bg-emerald-100 rounded-full p-0.5 transition-colors cursor-auto"
                      title="Remove filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline ml-auto cursor-auto transition-all duration-200"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-4 border-t border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-600">
          Total Job Card Items:{" "}
          <span className="text-gray-900 font-bold">
            {filteredJobCards.length}
          </span>
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupedJobCards.length === 0 ? (
            <EmptyState
              icon={Clipboard}
              title="No job cards found"
              description="Try adjusting your filters or search terms to find matching job cards."
              className="mt-10"
            />
          ) : (
            <>
              {groupedJobCards.length > 50 && (
                <div className="bg-yellow-50 text-yellow-700 text-sm font-medium px-4 py-3 rounded-xl border border-yellow-200 flex items-center justify-between">
                  <span>
                    Showing first 50 customer fleets. Use the search bar to find
                    specific job cards.
                  </span>
                  <span className="font-bold">
                    {groupedJobCards.length} Fleets Total
                  </span>
                </div>
              )}
              {groupedJobCards.slice(0, 50).map((group) => {
                if (group.jobCards.length === 1) {
                  const jc = group.jobCards[0];
                  const vId =
                    typeof jc.vehicleId === "object"
                      ? jc.vehicleId?._id
                      : jc.vehicleId;
                  const v =
                    vehicles.find((veh) => String(veh._id) === String(vId)) ||
                    {};
                  return (
                    <JobCard
                      key={jc._id}
                      jc={jc}
                      v={v}
                      ownerName={group.customerName}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={handleView}
                      role={user?.role}
                      userId={user?._id}
                      formatDate={formatDate}
                    />
                  );
                }

                return (
                  <div
                    key={group.customerId}
                    className="bg-white rounded-3xl p-5 mb-4 border border-slate-200 shadow-sm relative overflow-hidden"
                  >
                    <div className="mb-4 relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span className="w-8.5 h-8.5 rounded-full bg-blue-100 text-blue-600 dark:text-black flex items-center justify-center text-sm">
                            <Clipboard className="w-4.5 h-4.5" />
                          </span>
                          {group.customerName}
                        </h3>
                        <p className="text-[11px] font-black tracking-widest uppercase text-slate-400 mt-2 ml-10">
                          {group.jobCards.length} Job Cards
                        </p>
                      </div>
                    </div>
                    <div className="gap-4 relative z-10">
                      {group.jobCards.map((jc) => {
                        const vId =
                          typeof jc.vehicleId === "object"
                            ? jc.vehicleId?._id
                            : jc.vehicleId;
                        const v =
                          vehicles.find(
                            (veh) => String(veh._id) === String(vId),
                          ) || {};
                        return (
                          <div key={jc._id} className="h-full">
                            <JobCard
                              jc={jc}
                              v={v}
                              ownerName={group.customerName}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onView={handleView}
                              role={user?.role}
                              userId={user?._id}
                              formatDate={formatDate}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          isReadOnly
            ? "View Job Card"
            : selectedJcId
              ? "Edit Job Card"
              : "New Job Card"
        }
        size="xl"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
            <label className="text-sm font-bold text-gray-700 w-24">
              Customer
            </label>
            <select
              disabled={isReadOnly || selectedJcId}
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setJobCardsToCreate(
                  jobCardsToCreate.map((jc) => ({ ...jc, vehicleId: "" })),
                );
              }}
              className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-200 font-medium"
            >
              <option value="">-- Select Customer First --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pb-2 border-b-2 border-gray-100 mt-6">
            <h3 className="font-bold text-gray-800 text-base">
              Job Card Details
            </h3>
            {!selectedJcId && !isReadOnly && (
              <button
                type="button"
                onClick={() =>
                  setJobCardsToCreate([...jobCardsToCreate, createEmptyJc()])
                }
                className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={16} strokeWidth={3} />
                Add Another Job Card
              </button>
            )}
          </div>

          <div className="space-y-6">
            {jobCardsToCreate.map((jc, i) => {
              const selectedVehicle = availableCarsForCustomer.find(
                (v) => v._id === jc.vehicleId,
              );
              const vehicleLabel = selectedVehicle
                ? `${selectedVehicle.licensePlate} - ${selectedVehicle.make} ${selectedVehicle.model}`
                : "No vehicle assigned";

              return (
                <div
                  key={jc.id || i}
                  className="relative bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                    <h4 className="text-sm font-bold text-gray-700">
                      Job Card {i + 1}
                    </h4>
                    {!selectedJcId && jobCardsToCreate.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setJobCardsToCreate((prev) =>
                            prev.filter((_, index) => index !== i),
                          );
                        }}
                        className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                        Vehicle
                      </label>
                      {["mechanic", "advisor"].includes(user?.role) ? (
                        <input
                          type="text"
                          disabled
                          value={vehicleLabel}
                          className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                        />
                      ) : (
                        <select
                          disabled={isReadOnly || !customerId}
                          value={jc.vehicleId || ""}
                          onChange={(e) => {
                            const vId = e.target.value;
                            const vData = vehicles.find(
                              (veh) => veh._id === vId,
                            );
                            setJobCardsToCreate((prev) =>
                              prev.map((item, idx) =>
                                idx === i
                                  ? {
                                      ...item,
                                      vehicleId: vId,
                                      serviceDate: vData?.serviceDate
                                        ? new Date(vData.serviceDate)
                                            .toISOString()
                                            .split("T")[0]
                                        : "",
                                      nextServiceDate: vData?.nextServiceDate
                                        ? new Date(vData.nextServiceDate)
                                            .toISOString()
                                            .split("T")[0]
                                        : "",
                                    }
                                  : item,
                              ),
                            );
                          }}
                          className="w-full bg-white border capitalize border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="">-- Choose Vehicle --</option>
                          {availableCarsForCustomer.map((v) => (
                            <option key={v._id} value={v._id}>
                              {v.licensePlate} - {v.make} {v.model}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {(user?.role === "owner" || user?.role === "admin") && (
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                          Assigned Advisor
                        </label>
                        <select
                          disabled={isReadOnly}
                          value={jc.assignedAdvisor || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJobCardsToCreate((prev) =>
                              prev.map((item, idx) =>
                                idx === i
                                  ? { ...item, assignedAdvisor: val }
                                  : item,
                              ),
                            );
                          }}
                          className="w-full bg-white border capitalize border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="">-- Choose Advisor --</option>
                          {advisors.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name || s.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {["owner", "admin", "advisor"].includes(user?.role) && (
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                          Assigned Mechanic
                        </label>
                        <select
                          disabled={isReadOnly}
                          value={jc.assignedMechanic || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJobCardsToCreate((prev) =>
                              prev.map((item, idx) =>
                                idx === i
                                  ? { ...item, assignedMechanic: val }
                                  : item,
                              ),
                            );
                          }}
                          className="w-full bg-white border capitalize border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="">-- Choose Mechanic --</option>
                          {mechanics.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name || s.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col h-48 mt-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2.5">
                      Service Instructions
                    </label>
                    <textarea
                      value={jc.instructionText || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setJobCardsToCreate((prev) =>
                          prev.map((item, idx) =>
                            idx === i
                              ? { ...item, instructionText: val }
                              : item,
                          ),
                        );
                      }}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      readOnly={isReadOnly}
                      placeholder="1. Oil Change..."
                      className={`w-full flex-1 capitalize bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 resize-none ${isReadOnly ? "bg-gray-800" : ""}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {selectedJcId && (
            <div className="pt-4 border-t border-gray-100 flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-3">
                To assign tasks, track parts, or bill for this job card, go to
                Services.
              </p>
              <button
                onClick={() => {
                  navigate(`/services?jobId=${selectedJcId}`);
                }}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl shadow-sm text-sm font-bold w-full sm:w-auto"
              >
                Manage Services & Tasks
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl"
            >
              {isReadOnly ? "Close" : "Cancel"}
            </button>
            {!isReadOnly && (
              <button
                onClick={handleSaveRequest}
                disabled={isSaving}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 dark:bg-blue-950/90 rounded-xl shadow-sm"
              >
                {isSaving ? "Saving..." : "Save Job Card"}
              </button>
            )}
          </div>
        </div>
      </Modal>
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Job Card"
        message="This action cannot be undone."
        confirmText="Yes, Delete"
        type="danger"
      />
    </div>
  );
}
