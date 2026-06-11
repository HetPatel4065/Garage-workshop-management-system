import React from "react";
import ServiceCard from "./ServiceCard";
import { Wrench } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
// Adjust the import path below based on where your EmptyState component lives
import EmptyState from "../UI/EmptyState";

export default function ServiceList({
  services = [],
  onEdit,
  onDelete,
  onView,
  onGenerate,
}) {
  const { user } = useAuth();
  const role = user?.role || "mechanic";

  if (!services.length) {
    return (
      <EmptyState
        icon={Wrench}
        title="No services found"
        description="Define your garage's labor offerings, standard fix packages, and hourly diagnostic pricing tiers."
      />
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => {
        const isAssignedMechanic =
          (service.mechanicId?._id || service.mechanicId) === user?._id;
        return (
          <ServiceCard
            key={service._id || service.id}
            service={service}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onGenerate={onGenerate}
            user={user}
            isAssignedMechanic={isAssignedMechanic}
          />
        );
      })}
    </div>
  );
}
