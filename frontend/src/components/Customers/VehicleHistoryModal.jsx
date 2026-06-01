import React, { useState, useEffect } from "react";
import ServiceCard from "../Services/ServiceCard";
import Modal from "../../components/UI/Modal";
import ServiceForm from "../Services/ServiceForm";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export default function VehicleHistoryModal({
  isOpen,
  onClose,
  vehicle,
  customerId,
}) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const { addToast } = useToast();
  const { user, token } = useAuth();

  useEffect(() => {
    if (isOpen && vehicle?._id) {
      fetchHistory();
    }
  }, [isOpen, vehicle]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_AUTH_ADDRESS}/services?vehicleId=${vehicle._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok) {
        setServices(data);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (service) => {
    setSelectedService(service);
    setIsReadOnly(true);
    setFormOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setIsReadOnly(false);
    setFormOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      const url = `${import.meta.env.VITE_AUTH_ADDRESS}/services/${data._id}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        addToast("Service updated", "success");
        fetchHistory();
        setFormOpen(false);
      } else {
        const err = await res.json();
        throw new Error(err.message || "Update failed");
      }
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Service History: ${vehicle?.make} ${vehicle?.model} (${vehicle?.licensePlate})`}
      size="xl"
    >
      <div className="p-6 overflow-y-auto max-h-[70vh]">
        {loading ? (
          <p className="text-center text-gray-500 py-10">Loading history...</p>
        ) : services.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">
              No service records found for this vehicle.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((s) => {
              const isAssignedMechanic =
                (s.mechanicId?._id || s.mechanicId) === user?._id;
              return (
                <ServiceCard
                  key={s._id}
                  service={s}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={() => {}} // Could implement delete if needed
                  user={user}
                  isAssignedMechanic={isAssignedMechanic}
                />
              );
            })}
          </div>
        )}
      </div>

      {formOpen && (
        <Modal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          title={isReadOnly ? "View Service" : "Edit Service"}
          size="xl"
        >
          <ServiceForm
            serviceData={selectedService}
            onSubmit={handleSubmit}
            onClose={() => setFormOpen(false)}
            readOnly={isReadOnly}
          />
        </Modal>
      )}
    </Modal>
  );
}
