import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SearchBar from "../components/UI/SearchBar";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";
import VehicleForm, {
  createEmptyVehicle,
  validateVehicle,
  FUEL_TYPES,
  VEHICLE_STATUSES,
} from "../components/Vehicles/VehicleForm";
import { Car, Plus, Filter } from "lucide-react";
import { FaCar, FaUser } from "react-icons/fa";
import VehicleCard from "../components/Vehicles/VehicleCard";
import ExportButton from "../components/common/ExportButton";
import EmptyState from "../components/UI/EmptyState";

export default function Vehicles() {
  const { user, token: authToken } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const token = authToken || sessionStorage.getItem("garage_token");
  const role = user?.role || sessionStorage.getItem("role") || "user";
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get("q") || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeSearch, setActiveSearch] = useState(queryParam);

  // Sync activeSearch with URL on mount or URL change
  useEffect(() => {
    setActiveSearch(queryParam);

    // Only update the input field if the user isn't currently typing in it
    if (!isTyping) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]); // Removed isTyping from deps to prevent cursor jumping

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterFuel, setFilterFuel] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehiclesToCreate, setVehiclesToCreate] = useState([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [customerMode, setCustomerMode] = useState("select");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "+91 ",
  });

  const [loading, setLoading] = useState(true);
  const [vehicleErrors, setVehicleErrors] = useState([{}]);
  const [customerErrors, setCustomerErrors] = useState({});

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const ts = Date.now();
      const [vehRes, custRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/vehicles?t=${ts}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/customers?t=${ts}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!vehRes.ok) throw new Error("Failed to fetch vehicles");
      if (!custRes.ok) throw new Error("Failed to fetch customers");

      const vehData = await vehRes.json();
      const custData = await custRes.json();

      setVehicles(vehData);
      setCustomers(custData);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Count per status for pill badges
  const statusCounts = useMemo(() => {
    return vehicles.reduce((acc, v) => {
      const s = v.status || "Active";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
  }, [vehicles]);

  const filteredFleet = useMemo(() => {
    const effectiveQuery = (
      isTyping ? searchQuery : activeSearch
    ).toLowerCase();

    return vehicles.filter((v) => {
      const custName = v.customerName || v.customerId?.name || "";
      const matchesSearch =
        v.licensePlate?.toLowerCase().includes(effectiveQuery) ||
        v.make?.toLowerCase().includes(effectiveQuery) ||
        v.model?.toLowerCase().includes(effectiveQuery) ||
        custName.toLowerCase().includes(effectiveQuery);

      const matchesStatus = filterStatus === "All" || v.status === filterStatus;
      const matchesFuel = filterFuel === "All" || v.fuelType === filterFuel;

      return matchesSearch && matchesStatus && matchesFuel;
    });
  }, [vehicles, searchQuery, activeSearch, isTyping, filterStatus, filterFuel]);

  const groupedFleet = useMemo(() => {
    const groups = {};
    filteredFleet.forEach((v) => {
      const cid = v.customerId?._id || v.customerId || `unassigned-${v._id}`;
      if (!groups[cid]) {
        groups[cid] = {
          customerId: cid,
          customerName:
            v.customerName || v.customerId?.name || "Unknown Customer",
          vehicles: [],
        };
      }
      groups[cid].vehicles.push(v);
    });
    return Object.values(groups);
  }, [filteredFleet]);

  const handleEdit = (v) => {
    setSelectedVehicle(v);
    setVehiclesToCreate([v]);
    setSelectedCustomerId(v.customerId?._id || v.customerId || "");
    setCustomerMode("select");
    setVehicleErrors([{}]);
    setCustomerErrors({});
    setIsModalOpen(true);
    setIsReadOnly(false);
  };

  const handleAddNew = () => {
    setSelectedVehicle(null);
    setVehiclesToCreate([createEmptyVehicle()]);
    setSelectedCustomerId("");
    setCustomerMode("select");
    setNewCustomer({ name: "", email: "", phone: "+91 " });
    setVehicleErrors([{}]);
    setCustomerErrors({});
    setIsModalOpen(true);
    setIsReadOnly(false);
  };

  const validateNewCustomer = () => {
    const errs = {};
    if (!newCustomer.name?.trim()) errs.name = "Name is required";
    if (!newCustomer.phone?.trim() || newCustomer.phone === "+91 ") {
      errs.phone = "Phone is required";
    } else {
      const digits = newCustomer.phone.replace("+91 ", "").replace(/\s/g, "");
      if (digits.length !== 10) errs.phone = "Phone must be 10 digits";
    }
    if (newCustomer.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newCustomer.email)) errs.email = "Invalid email";
    }
    setCustomerErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    try {
      const isNew = !selectedVehicle;
      let targetCustomerId = selectedCustomerId;

      if (isNew && customerMode === "select" && !selectedCustomerId) {
        addToast("Please select the customer first", "error");
        return;
      }
      if (isNew && customerMode === "create") {
        if (!validateNewCustomer()) {
          addToast("Please check customer details", "error");
          return;
        }
      }

      let hasVehicleErrors = false;
      const vErrsArray = vehiclesToCreate.map((v) => {
        const errs = validateVehicle(v);
        if (Object.keys(errs).length > 0) hasVehicleErrors = true;
        return errs;
      });

      if (hasVehicleErrors) {
        setVehicleErrors(vErrsArray);
        addToast("Please check vehicle details", "error");
        return;
      }

      if (isNew && customerMode === "create") {
        const custRes = await fetch(
          `${import.meta.env.VITE_API_URL}/customers`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newCustomer),
          },
        );
        const custData = await custRes.json();
        if (!custRes.ok)
          throw new Error(custData.error || "Failed to create customer");
        targetCustomerId = custData._id;
      }

      if (!targetCustomerId) {
        addToast("Please select or create a customer", "error");
        return;
      }

      if (isNew) {
        for (const v of vehiclesToCreate) {
          const { serviceDate, nextServiceDate, ...vehiclePayload } = v;
          const payload = {
            ...vehiclePayload,
            licensePlate: (v.licensePlate || "").trim().toUpperCase(),
            customerId: targetCustomerId,
          };

          const res = await fetch(`${import.meta.env.VITE_API_URL}/vehicles`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Creation failed");
        }
        addToast("Vehicles added successfully", "success");
      } else {
        const v = vehiclesToCreate[0];
        const { serviceDate, nextServiceDate, ...vehiclePayload } = v;
        const payload = {
          ...vehiclePayload,
          licensePlate: (v.licensePlate || "").trim().toUpperCase(),
          customerId: targetCustomerId,
        };
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/vehicles/${selectedVehicle._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");

        addToast("Vehicle profile updated", "success");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/vehicles/${itemToDelete}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setVehicles(vehicles.filter((v) => v._id !== itemToDelete));
      addToast("Vehicle deleted successfully", "delete");
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleView = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehiclesToCreate([vehicle]);
    setVehicleErrors([{}]);
    setCustomerErrors({});
    setIsModalOpen(true);
    setIsReadOnly(true);
  };

  // Status pill config — mirrors Active/Inactive/Blocked on Customers page
  const statusPills = [
    {
      label: "Active",
      count: statusCounts["Active"] || 0,
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      inactive: "bg-white text-gray-500 border-gray-200",
    },
    {
      label: "Inactive",
      count: statusCounts["Inactive"] || 0,
      active: "bg-gray-100 text-gray-700 border-gray-300",
      inactive: "bg-white text-gray-500 border-gray-200",
    },
    {
      label: "In Service",
      count: statusCounts["In Service"] || 0,
      active: "bg-blue-50 text-blue-700 border-blue-200",
      inactive: "bg-white text-gray-500 border-gray-200",
    },
  ];

  const exportColumns = [
    { header: "License Plate", accessor: "licensePlate" },
    { header: "Make", accessor: "make" },
    { header: "Model", accessor: "model" },
    { header: "Year", accessor: "year" },
    { header: "Fuel Type", accessor: "fuelType" },
    { header: "Transmission", accessor: "transmission" },
    { header: "Status", accessor: "status" },
    {
      header: "Customer Name",
      accessor: (row) => row.customerName || row.customerId?.name || "N/A",
    },
    {
      header: "Registered Date",
      accessor: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString("en-GB")
          : "N/A",
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-100 dark:bg-slate-950 min-h-screen">
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.22em] mb-2">
              Fleet Management
            </p>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Vehicles
            </h1>

            <p className="text-sm font-medium text-slate-500 mt-3">
              Direct management of all registered vehicles in your garage
            </p>
          </div>

          {role !== "mechanic" && role !== "advisor" && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <ExportButton
                title="Vehicles List"
                columns={exportColumns}
                data={filteredFleet}
                filenamePrefix="vehicles"
              />
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 dark:bg-blue-950/90 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-xl h-10.5"
              >
                <Plus size={17} />
                Add Vehicle
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Search & Filter Bar */}
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

              if (cleanTerm) {
                navigate(`/vehicles?q=${encodeURIComponent(cleanTerm)}`, {
                  replace: true,
                });
              } else {
                navigate("/vehicles", { replace: true });
              }
            }}
            activeSearch={!isTyping && activeSearch}
            onClearActive={() => {
              setActiveSearch("");
              setSearchQuery("");
              setIsTyping(false);
              navigate("/vehicles", { replace: true });
            }}
            placeholder="Search vehicles by plate, model or owner..."
            className="w-full"
          />
        </div>
        <div className="w-full lg:w-64">
          <select
            value={filterFuel}
            onChange={(e) => setFilterFuel(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="All">All Fuel Types</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Total count */}
      <div className="mb-4 ml-1">
        <p className="text-sm font-medium text-slate-500">
          Showing{" "}
          <span className="text-slate-900 font-bold">
            {filteredFleet.length}
          </span>{" "}
          of <span className="text-slate-900 font-bold">{vehicles.length}</span>{" "}
          vehicles
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredFleet.length === 0 && (
            <EmptyState
              icon={Car}
              title="No vehicles found"
              description="Try a different search term or reset filters to locate available vehicles."
              className="mt-10"
            />
          )}

          {groupedFleet.length > 50 && (
            <div className="bg-yellow-50 text-yellow-700 text-sm font-medium px-4 py-3 rounded-xl border border-yellow-200 flex items-center justify-between">
              <span>
                Showing first 50 customer fleets. Use the search bar to find
                specific vehicles.
              </span>
              <span className="font-bold">
                {groupedFleet.length} Fleets Total
              </span>
            </div>
          )}
          {groupedFleet.slice(0, 50).map((group) => {
            if (group.vehicles.length === 1) {
              const v = group.vehicles[0];
              return (
                <VehicleCard
                  key={v._id}
                  vehicle={v}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  role={user?.role}
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
                        <FaUser className="w-4.5 h-4.5" />
                      </span>
                      {group.customerName}
                    </h3>
                    <p className="text-[11px] font-black tracking-widest uppercase text-slate-400 mt-2 ml-10">
                      {group.vehicles.length} Registered Vehicles
                    </p>
                  </div>
                </div>
                <div className="gap-4 relative z-10">
                  {group.vehicles.map((v) => (
                    <div key={v._id} className="h-full">
                      <VehicleCard
                        vehicle={v}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                        role={user?.role}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Add/Edit Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          isReadOnly
            ? "View Vehicle"
            : selectedVehicle?._id
              ? "Edit Vehicle"
              : "Add New Vehicle"
        }
        size="xl"
      >
        {isModalOpen &&
          (() => {
            const selectedCustomer = customers.find(
              (c) => c._id === selectedCustomerId,
            );
            const isBlocked = selectedCustomer?.status === "Blocked";
            const effectivelyReadOnly = isReadOnly || isBlocked;
            const isNew = !selectedVehicle;

            return (
              <div className="space-y-6">
                {!isReadOnly && (
                  <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                    {isBlocked && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-black text-red-900 uppercase tracking-tight">
                            Customer Blocked
                          </p>
                          <p className="text-xs text-red-700 font-medium">
                            This customer is restricted. You cannot modify
                            vehicle details until they are unblocked.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block ml-1">
                        Owner Information
                      </label>
                    </div>
                    {customerMode === "select" ? (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        disabled={!isNew}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100"
                      >
                        <option value="">Select a customer...</option>
                        {customers.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.phone}){" "}
                            {c.status === "Blocked" ? "— BLOCKED" : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <input
                            placeholder="Name"
                            value={newCustomer.name}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                name: e.target.value,
                              })
                            }
                            className={`w-full border ${customerErrors.name ? "border-red-500 bg-red-50" : "border-gray-300"} rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20`}
                          />
                          {customerErrors.name && (
                            <p className="text-[10px] text-red-500 mt-1 ml-1">
                              {customerErrors.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <input
                            placeholder="Phone (+91 xxxx...)"
                            value={newCustomer.phone}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                phone: e.target.value,
                              })
                            }
                            className={`w-full border ${customerErrors.phone ? "border-red-500 bg-red-50" : "border-gray-300"} rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20`}
                          />
                          {customerErrors.phone && (
                            <p className="text-[10px] text-red-500 mt-1 ml-1">
                              {customerErrors.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <input
                            placeholder="Email (Optional)"
                            value={newCustomer.email}
                            onChange={(e) =>
                              setNewCustomer({
                                ...newCustomer,
                                email: e.target.value,
                              })
                            }
                            className={`w-full border ${customerErrors.email ? "border-red-500 bg-red-50" : "border-gray-300"} rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20`}
                          />
                          {customerErrors.email && (
                            <p className="text-[10px] text-red-500 mt-1 ml-1">
                              {customerErrors.email}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Add Another Vehicle Button at the TOP! */}
                  <div className="flex items-center justify-between pb-2 border-b-2 border-gray-100">
                    <h3 className="font-bold text-gray-800 text-base">
                      Vehicle Details
                    </h3>
                    {isNew && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setVehiclesToCreate([
                            ...vehiclesToCreate,
                            createEmptyVehicle(),
                          ]);
                          setVehicleErrors([...vehicleErrors, {}]);
                        }}
                        className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <Plus size={16} strokeWidth={3} />
                        Add Another Vehicle
                      </button>
                    )}
                  </div>

                  <div className="space-y-8">
                    {vehiclesToCreate.map((v, i) => (
                      <div
                        key={i}
                        className="relative bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                          <h4 className="text-sm font-bold text-gray-700">
                            Vehicle {i + 1}
                          </h4>
                          {isNew && vehiclesToCreate.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const arr = [...vehiclesToCreate];
                                arr.splice(i, 1);
                                setVehiclesToCreate(arr);
                                const errs = [...vehicleErrors];
                                errs.splice(i, 1);
                                setVehicleErrors(errs);
                              }}
                              className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 bg-red-50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <VehicleForm
                          vehicle={v}
                          onChange={(updated) => {
                            const arr = [...vehiclesToCreate];
                            arr[i] = updated;
                            setVehiclesToCreate(arr);
                          }}
                          isReadOnly={effectivelyReadOnly}
                          errors={vehicleErrors[i] || {}}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {isReadOnly ? "Close" : "Cancel"}
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={handleSave}
                      disabled={isBlocked}
                      className={`px-8 py-2.5 text-sm font-bold text-white rounded-xl transition-all ${
                        isBlocked
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-950/90 shadow-md shadow-blue-100"
                      }`}
                    >
                      {selectedVehicle?._id
                        ? "Save Changes"
                        : "Register Vehicle" +
                          (vehiclesToCreate.length > 1 ? "s" : "")}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
      </Modal>
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? All service records linked to this chassis number will be permanently removed."
        confirmText="Yes, Delete"
        type="danger"
      />
    </div>
  );
}
