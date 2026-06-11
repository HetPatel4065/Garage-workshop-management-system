import React from "react";
import InventoryItemCard from "./InventoryItemCard";
import { Package } from "lucide-react";
import EmptyState from "../UI/EmptyState";

export default function InventoryList({
  items = [],
  role,
  onView,
  onEdit,
  onDelete,
  onUpdateStock,
  groupBy = "default",
}) {
  if (!items.length) {
    return (
      <EmptyState
        icon={Package}
        title="No inventory items found"
        description="Add new inventory items to your garage's stock."
      />
    );
  }

  if (groupBy === "default") {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <InventoryItemCard
            key={item._id}
            item={item}
            role={role}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateStock={onUpdateStock}
          />
        ))}
      </div>
    );
  }

  // Calculate Groups
  const grouped = items.reduce((acc, item) => {
    let key = "Unknown";
    if (groupBy === "carModel") key = item.carModel || "Universal";
    if (groupBy === "dealer") key = item.supplier?.name || "Unknown Supplier";

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sortedKeys = Object.keys(grouped).sort();

  return (
    <div className="space-y-8">
      {sortedKeys.map((key) => (
        <div key={key} className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[14px] font-bold uppercase tracking-widest text-gray-800 bg-gray-100 px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
              {key}
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-white px-2.5 py-1 rounded-full border">
              {grouped[key].length}{" "}
              {grouped[key].length === 1 ? "Item" : "Items"}
            </span>
          </div>
          <div className="space-y-3 pl-3 sm:pl-4 border-l-[3px] border-gray-100">
            {grouped[key].map((item) => (
              <InventoryItemCard
                key={item._id}
                item={item}
                role={role}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateStock={onUpdateStock}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
