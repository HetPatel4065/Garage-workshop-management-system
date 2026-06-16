import CustomerCard from "./CustomerCard";
import { Users } from "lucide-react";
import EmptyState from "../UI/EmptyState";

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
      <EmptyState
        icon={Users}
        title="No Customers Found"
        description="There are no customers available at the moment."
        />
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
