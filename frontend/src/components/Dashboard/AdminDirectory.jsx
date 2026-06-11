import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useLoading } from "../../context/LoadingContext";
import { useToast } from "../../context/ToastContext";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormButton,
} from "../layout/Form/forms";
import {
  Search,
  Filter,
  Trash2,
  Megaphone,
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Mail,
  User,
  Users,
  Wrench,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { motion } from "framer-motion";
import Modal from "../UI/Modal";
import ConfirmModal from "../UI/ConfirmModal";

export default function AdminDirectory() {
  const { token, selectGarage } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  const { addToast } = useToast();

  const [garages, setGarages] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "active" | "suspended"
  const [verificationFilter, setVerificationFilter] = useState(""); // "" | "Pending" | "Verified" | "Rejected"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Announcement Modal State
  const [announcementModal, setAnnouncementModal] = useState({
    isOpen: false,
    garageId: null,
    garageName: "",
    title: "",
    message: "",
    type: "warning",
  });

  // New Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "", // "status" | "reset" | "delete"
    garageId: null,
    garageName: "",
    currentActive: false,
    title: "",
    message: "",
    requireInput: false,
    expectedInput: "",
  });

  // Fetch Garages from backend admin API
  const fetchGarages = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/garages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            search,
            status: statusFilter,
            verification: verificationFilter,
            limit: 6,
          },
        },
      );
      setGarages(res.data.garages);
      setTotalPages(res.data.pagination.pages);
      setTotalItems(res.data.pagination.total);
    } catch (err) {
      console.error("Failed to load garages:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchGarages();
    }
  }, [token, page, search, statusFilter, verificationFilter]);

  // Open Confirmation Modal for Status Change
  const openStatusModal = (id, garageName, currentActive) => {
    setConfirmModal({
      isOpen: true,
      type: "status",
      garageId: id,
      garageName,
      currentActive,
      title: currentActive ? "Suspend Garage?" : "Activate Garage?",
      message: `Are you sure you want to ${currentActive ? "suspend" : "activate"} "${garageName}"?`,
      requireInput: false,
      expectedInput: "",
    });
  };

  // Open Confirmation Modal for Reset Data
  const openResetModal = (id, garageName) => {
    setConfirmModal({
      isOpen: true,
      type: "reset",
      garageId: id,
      garageName,
      title: "CRITICAL WARNING: Wipe Data",
      message: `This will permanently delete ALL customer entries, vehicles, job cards, services, and billing invoices for "${garageName}". This action CANNOT be undone.`,
      requireInput: true,
      expectedInput: "RESET",
      userInput: "",
    });
  };

  // Open Confirmation Modal for Delete Garage
  const openDeleteModal = (id, garageName) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      garageId: id,
      garageName,
      title: "DANGER ZONE: Cascade Delete",
      message: `This will permanently delete "${garageName}", including the owner account, staff credentials, and all settings. The garage will be entirely removed from the platform.`,
      requireInput: true,
      expectedInput: "DELETE",
      userInput: "",
    });
  };

  // Execute Confirmed Actions
  const handleConfirmAction = async () => {
    const { type, garageId, garageName, currentActive } = confirmModal;

    // Close modal first
    setConfirmModal((m) => ({ ...m, isOpen: false }));

    if (type === "status") {
      startLoading(
        currentActive ? "Suspending Garage..." : "Activating Garage...",
      );
      try {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/admin/garages/${garageId}/status`,
          { isActive: !currentActive },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        addToast(
          currentActive
            ? "Garage suspended successfully"
            : "Garage activated successfully",
          "success",
        );
        fetchGarages();
      } catch (err) {
        addToast(err.response?.data?.error || "Operation failed", "error");
      } finally {
        stopLoading();
      }
    } else if (type === "reset") {
      startLoading("Wiping operational records...");
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/garages/${garageId}/reset`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        addToast(
          res.data.message || "Garage data reset successfully.",
          "success",
        );
        fetchGarages();
      } catch (err) {
        addToast(err.response?.data?.error || "Reset failed", "error");
      } finally {
        stopLoading();
      }
    } else if (type === "delete") {
      startLoading("Deleting entire garage...");
      try {
        const res = await axios.delete(
          `${import.meta.env.VITE_API_URL}/admin/garages/${garageId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        addToast(res.data.message || "Garage deleted successfully.", "success");
        fetchGarages();
      } catch (err) {
        addToast(err.response?.data?.error || "Deletion failed", "error");
      } finally {
        stopLoading();
      }
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    const { garageId, title, message, type } = announcementModal;
    if (!title || !message) {
      addToast("Title and message are required", "info");
      return;
    }
    startLoading("Sending alert...");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/garages/${garageId}/announcement`,
        { title, message, type },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      addToast("Announcement successfully dispatched", "success");
      setAnnouncementModal({
        isOpen: false,
        garageId: null,
        garageName: "",
        title: "",
        message: "",
        type: "warning",
      });
    } catch (err) {
      addToast(
        err.response?.data?.error || "Failed to dispatch alert",
        "error",
      );
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-6 rounded-xl">
      {/* Directory Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
              Central Command
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Garages Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor, verification status, reset, or impersonate all registered
            workshop accounts ({totalItems} total)
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search garage name, owner, email, city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-11 pl-10 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Verification Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 bg-slate-50 rounded-xl border border-slate-200 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 outline-none focus:ring-2 focus:ring-orange-400/20 cursor-auto"
          >
            <option value="">Verification: All</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 w-full md:w-auto bg-slate-50 rounded-xl border border-slate-200 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 outline-none focus:ring-2 focus:ring-orange-400/20 cursor-auto"
          >
            <option value="">Status: All</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Grid of Garages */}
      {garages.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-orange-50 text-orange-500 rounded-2xl mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Garages Found</h3>
          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria or filter attributes to display
            registered workshops.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {garages.map((garage) => (
            <motion.div
              key={garage._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 border-b border-slate-50 relative flex-1">
                <div className="flex justify-between items-start mb-3.5 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${garage.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                    />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      {garage.isActive ? "Active" : "Suspended"}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      garage.verificationStatus === "Verified"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : garage.verificationStatus === "Rejected"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {garage.verificationStatus || "Pending"}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {garage.garageName}
                </h3>

                <div className="space-y-2 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700">
                      {garage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{garage.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{garage.address || "Address not set"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3.5 mt-5">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">
                      Staff
                    </p>
                    <div className="flex items-center justify-center gap-1 text-slate-700">
                      <Users className="w-3 h-3" />
                      <span className="font-bold text-sm">
                        {garage.totalStaff || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">
                      Services
                    </p>
                    <div className="flex items-center justify-center gap-1 text-slate-700">
                      <Wrench className="w-3 h-3" />
                      <span className="font-bold text-sm">
                        {garage.totalAppointments || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">
                      ID
                    </p>
                    <span className="font-mono text-xs font-black text-slate-700">
                      {garage.garageId || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="bg-slate-50/50 p-4 border-t border-slate-100 space-y-2 shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => selectGarage(garage)}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-auto"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Garage</span>
                  </button>

                  <button
                    onClick={() =>
                      setAnnouncementModal({
                        isOpen: true,
                        garageId: garage._id,
                        garageName: garage.garageName,
                        title: "",
                        message: "",
                        type: "warning",
                      })
                    }
                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white text-blue-600 transition-all cursor-auto"
                    title="Send Alert Announcement"
                  >
                    <Megaphone className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">
                  <button
                    onClick={() =>
                      openStatusModal(
                        garage._id,
                        garage.garageName,
                        garage.isActive,
                      )
                    }
                    className="flex items-center gap-1 font-bold text-slate-600 hover:text-orange-600 cursor-auto"
                  >
                    {garage.isActive ? (
                      <>
                        <ToggleRight className="w-4.5 h-4.5 text-emerald-500" />
                        <span>Suspend</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4.5 h-4.5 text-slate-400" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        openResetModal(garage._id, garage.garageName)
                      }
                      className="text-slate-400 hover:text-amber-600 font-bold cursor-auto uppercase text-[10px] tracking-wider"
                      title="Reset operational data"
                    >
                      Reset Data
                    </button>
                    <button
                      onClick={() =>
                        openDeleteModal(garage._id, garage.garageName)
                      }
                      className="text-slate-400 hover:text-rose-600 cursor-auto"
                      title="Cascade Delete Garage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8 bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="h-9 px-4 flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-auto"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="h-9 px-4 flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-auto"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <Modal
        isOpen={announcementModal.isOpen}
        onClose={() =>
          setAnnouncementModal({
            isOpen: false,
            garageId: null,
            garageName: "",
            title: "",
            message: "",
            type: "warning",
          })
        }
        size="sm"
        headerTone="colored"
        headerColor="blue"
        title="Send Announcement Alert"
        subtitle={
          <>
            Dispatching dashboard notification to
            <strong>{announcementModal.garageName}</strong>
          </>
        }
        icon={<Megaphone className="w-5 h-5 shrink-0" />}
        showCloseButton={false}
        closeOnBackdrop={false}
      >
        <form onSubmit={handleSendAnnouncement} className="space-y-4">
          <FormSelect
            value={announcementModal.type}
            onChange={(e) =>
              setAnnouncementModal((m) => ({
                ...m,
                type: e.target.value,
              }))
            }
            label="Notification Type"
            labelClassName="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
            selectClassName="w-full h-11 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="info">Info (Blue)</option>
            <option value="success">Success (Green)</option>
            <option value="warning">Warning (Yellow)</option>
            <option value="error">Error (Red)</option>
          </FormSelect>

          <FormInput
            type="text"
            required
            value={announcementModal.title}
            onChange={(e) =>
              setAnnouncementModal((m) => ({
                ...m,
                title: e.target.value,
              }))
            }
            placeholder="e.g. Scheduled System Upgrade"
            label="Alert Title"
            labelClassName="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
            inputClassName="w-full h-11 px-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all"
          />

          <FormTextarea
            required
            rows={4}
            value={announcementModal.message}
            onChange={(e) =>
              setAnnouncementModal((m) => ({
                ...m,
                message: e.target.value,
              }))
            }
            placeholder="Provide details of the announcement here..."
            label="Message Body"
            labelClassName="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
            textareaClassName="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all resize-none"
          />

          <div className="flex gap-3 pt-2">
            <FormButton
              type="button"
              onClick={() =>
                setAnnouncementModal({
                  isOpen: false,
                  garageId: null,
                  garageName: "",
                  title: "",
                  message: "",
                  type: "warning",
                })
              }
              variant="secondary"
              className="flex-1 text-xs uppercase tracking-wider font-bold"
              fullWidth={false}
            >
              Cancel
            </FormButton>
            <FormButton
              type="submit"
              variant="blue"
              className="flex-1 text-xs uppercase tracking-wider font-bold"
              fullWidth={false}
            >
              Dispatch Alert
            </FormButton>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((m) => ({ ...m, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={
          confirmModal.type === "delete"
            ? "delete"
            : confirmModal.type === "reset"
              ? "reset"
              : "status"
        }
        requireInput={confirmModal.requireInput}
        expectedInput={confirmModal.expectedInput}
        confirmText="Confirm & Execute"
      />
    </div>
  );
}
