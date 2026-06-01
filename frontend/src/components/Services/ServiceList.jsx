import ServiceCard from "./ServiceCard";
import { Wrench } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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
      <div className="text-gray-500 text-center mt-2 flex flex-col items-center gap-2 py-25 bg-white rounded-2xl border-2 border-dashed border-gray-300">
        <Wrench className="w-8 h-8 text-gray-300" />
        <p className="font-medium">No Service found</p>
      </div>
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
