import React from "react";

function PaymentStatusBadge({ status }) {
  // ✅ Normalize status (prevents bugs from backend casing)
  const normalizedStatus = (status || "").toLowerCase();

  const statusConfig = {
    paid: {
      label: "Paid",
      className: "bg-emerald-100 text-emerald-600 border-emerald-100",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-600 border-amber-100",
    },
    overdue: {
      label: "Overdue",
      className: "bg-red-100 text-red-600 border-red-100",
    },
    draft: {
      label: "Draft",
      className: "bg-gray-100 text-gray-400 border-gray-100",
    },
    finalized: {
      label: "Finalized",
      className: "bg-blue-100 text-blue-600 border-blue-100",
    },
  };

  const current = statusConfig[normalizedStatus] || {
    label: status || "Unknown",
    className: "bg-gray-50 text-gray-500 border-gray-100",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase border flex items-center gap-1.5 shadow-sm ${current.className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${normalizedStatus === "paid" ? "bg-emerald-500" : normalizedStatus === "overdue" ? "bg-red-500" : "bg-current"}`}
      />
      {current.label}
    </span>
  );
}

export default PaymentStatusBadge;
