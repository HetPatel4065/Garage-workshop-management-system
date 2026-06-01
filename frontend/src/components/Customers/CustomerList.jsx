import CustomerCard from "./CustomerCard";
import { Users } from "lucide-react";

export default function CustomerList({
  customers = [],
  onEdit,
  onDelete,
  onView,
  role,
  onVehicleHistory,
  onApprove,
  onReject,
}) {
  if (!customers.length) {
    return (
      <div className="text-gray-500 text-center mt-2 flex flex-col items-center gap-2 py-25 bg-white rounded-2xl border-2 border-dashed border-gray-300">
        <Users className="w-8 h-8 text-gray-300" />
        <p className="font-medium">No customers found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {customers.map((customer) => (
        <CustomerCard
          key={customer._id}
          customer={customer}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onVehicleHistory={onVehicleHistory}
          onApprove={onApprove}
          onReject={onReject}
          role={role}
        />
      ))}
    </div>
  );
}
