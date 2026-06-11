// src/pages/Services.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/UI/SearchBar";
import Modal from "../components/UI/Modal";
import { useToast } from "../context/ToastContext";
import ServiceForm from "../components/Services/ServiceForm";
import ServiceList from "../components/Services/ServiceList";
import ConfirmModal from "../components/UI/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { Plus } from "lucide-react";
import ExportButton from "../components/common/ExportButton";

export default function Services() {
  const { user, token } = useAuth();
  const role = user?.role || "mechanic";
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [services, setServices] = useState([]);
  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get("q") || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeSearch, setActiveSearch] = useState(queryParam);

  useEffect(() => {
    if (queryParam !== activeSearch) {
      setActiveSearch(queryParam);
    }
  }, [queryParam]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const { addToast } = useToast();

  // Fetch services
  const fetchServices = async () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const jobId = urlParams.get("jobId");

      let fetchUrl = `${import.meta.env.VITE_API_URL}/services`;
      if (jobId) {
        fetchUrl += `?jobId=${jobId}`;
      }

      const res = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch services");

      setServices(data);
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    }
  };

  useEffect(() => {
    fetchServices();
  }, [location.search]);

  // Filter
  const filteredServices = services
    .filter((s) => {
      const query = (isTyping ? searchQuery : activeSearch).toLowerCase();
      const serviceName = (s.serviceName || s.name || "").toLowerCase();
      const customerName = (
        s.customer?.name ||
        s.customerId?.name ||
        ""
      ).toLowerCase();
      const vehiclePlate = (s.vehicle?.licensePlate || "").toLowerCase();
      const status = (s.status || "").toLowerCase();
      const serviceDescription = (s.description || "").toLowerCase();
      const serviceId = (s._id || "").toLowerCase();

      const matchesSearch =
        serviceName.includes(query) ||
        customerName.includes(query) ||
        vehiclePlate.includes(query) ||
        status.includes(query) ||
        serviceDescription.includes(query) ||
        serviceId.includes(query);

      if (activeTab === "All") return matchesSearch;
      if (activeTab === "Pending")
        return matchesSearch && s.status === "Pending";
      if (activeTab === "In-progress")
        return matchesSearch && s.status === "In-progress";
      if (activeTab === "Completed")
        return matchesSearch && s.status === "Completed";
      if (activeTab === "Cancelled")
        return matchesSearch && s.status === "Cancelled";

      return matchesSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleView = (service) => {
    setSelectedService(service);
    setIsReadOnly(true); // Set to true for viewing
    setModalOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setIsReadOnly(false); // Set to false for editing
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedService(null);
    setIsReadOnly(false); // Set to false for new entries
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/services/${itemToDelete}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Delete failed");

      setServices((prev) => prev.filter((s) => s._id !== itemToDelete));
      addToast("Service deleted", "delete");
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
      addToast(err.message, "error");
    }
  };

  const handleSubmit = async (data) => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const urlJobId = urlParams.get("jobId");

      if (
        !urlJobId &&
        !data.jobId &&
        (!data.vehicle || !data.vehicle.licensePlate)
      ) {
        addToast("Please select a vehicle", "error");
        return;
      }

      if (!data._id && urlJobId) {
        data.jobId = urlJobId;
      }

      console.log("Submitting data:", data); // DEBUG

      const url = data._id
        ? `${import.meta.env.VITE_API_URL}/services/${data._id}`
        : `${import.meta.env.VITE_API_URL}/services`;

      const method = data._id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Backend error:", result);

        throw new Error(
          result.details ||
            result.error ||
            result.message ||
            "Something went wrong",
        );
      }

      if (data._id) {
        setServices((prev) =>
          prev.map((s) => (s._id === result._id ? result : s)),
        );
        addToast("Service updated", "success");
      } else {
        setServices((prev) => [...prev, result]);
        addToast("Service added", "success");
      }

      fetchServices(); // 🔥 Force fetch to get populated data
      setModalOpen(false);
    } catch (err) {
      console.error("Submit error:", err.message);

      addToast(err.message, "error");
    }
  };

  const handleGenerateInvoice = async (serviceId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/billing/generate-draft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ serviceId }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        const errorMsg =
          data.message || data.error || "Failed to generate invoice";
        throw new Error(errorMsg);
      }

      addToast(
        "Invoice draft generated. View it in the Billing tab.",
        "success",
      );
      fetchServices(); // Refresh to update billingStatus
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const exportColumns = [
    {
      header: "Service ID",
      accessor: (row) =>
        row.serviceId || row._id?.slice(-6)?.toUpperCase() || "N/A",
    },
    {
      header: "Customer",
      accessor: (row) => row.customer?.name || row.customerId?.name || "N/A",
    },
    {
      header: "Vehicle Plate",
      accessor: (row) => row.vehicle?.licensePlate || "N/A",
    },
    { header: "Status", accessor: "status" },
    {
      header: "Tasks Done",
      accessor: (row) => {
        const done = (row.requestedServices || [])
          .filter((r) => r.status === "Done")
          .map((r) => r.description);
        return done.length > 0 ? done.join(", ") : row.serviceName || "N/A";
      },
    },
    {
      header: "Parts Used",
      accessor: (row) =>
        Array.isArray(row.partsUsed) && row.partsUsed.length > 0
          ? row.partsUsed.map((p) => p.name || p.partName).join(", ")
          : "None",
    },
    {
      header: "Cost",
      accessor: (row) => {
        let total = 0;
        if (row.labourCost) total += Number(row.labourCost);
        if (row.labourCharges)
          total += row.labourCharges.reduce(
            (sum, lc) => sum + Number(lc.labourCost || 0),
            0,
          );
        if (row.partsUsed)
          total += row.partsUsed.reduce(
            (sum, p) =>
              sum +
              Number(p.priceAtTime || p.priceAtTimeOfService || p.price || 0) *
                Number(p.quantity || p.qty || 1),
            0,
          );
        if (row.selectedServices)
          total += row.selectedServices.reduce(
            (sum, s) => sum + Number(s.priceAtTimeOfService || 0),
            0,
          );
        return total > 0 ? total : "N/A";
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-100 dark:bg-slate-950 min-h-screen">
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">
              Service Management
            </p>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Services
            </h1>

            <p className="text-sm font-medium text-slate-500 mt-3">
              Track active maintenance records and service history
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ExportButton
              title="Services List"
              columns={exportColumns}
              data={filteredServices}
              filenamePrefix="services"
            />
            <button
              onClick={handleAdd}
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
              Add Service
            </button>
          </div>
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
              setSearchQuery("");
              if (cleanTerm) {
                navigate(`/services?q=${encodeURIComponent(cleanTerm)}`, {
                  replace: true,
                });
              } else {
                navigate("/services", { replace: true });
              }
            }}
            activeSearch={!isTyping && activeSearch}
            onClearActive={() => {
              setActiveSearch("");
              navigate("/services", { replace: true });
            }}
            placeholder="Search services by name, customer, vehicle or ID..."
            className="w-full"
          />
        </div>
        <div className="w-full lg:w-64">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm capitalize"
          >
            {["All", "Pending", "In-progress", "Completed", "Cancelled"].map(
              (tab) => (
                <option key={tab} value={tab}>
                  {tab.replace(/-/g, " ")} Status
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-600">
          Total Services:{" "}
          <span className="text-gray-900">{filteredServices.length}</span>
        </p>
      </div>

      <ServiceList
        services={filteredServices}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGenerate={(s) => handleGenerateInvoice(s._id)}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedService(null);
          setIsReadOnly(false);
        }}
        title={
          isReadOnly
            ? "View Service"
            : selectedService
              ? "Edit Service"
              : "New Service"
        }
        size="xl"
      >
        <ServiceForm
          serviceData={selectedService}
          onSubmit={handleSubmit}
          onClose={() => {
            setModalOpen(false);
            setSelectedService(null);
            setIsReadOnly(false);
          }}
          readOnly={isReadOnly}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service record? This action cannot be undone."
        confirmText="Delete Now"
      />
    </div>
  );
}
