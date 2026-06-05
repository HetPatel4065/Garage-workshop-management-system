import React from "react";

const colClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export default function FormRow({
  children,
  cols = 2,
  gap = "gap-4",
  className = "",
}) {
  return (
    <div className={`grid ${colClasses[cols] || colClasses[2]} ${gap} ${className}`}>
      {children}
    </div>
  );
}
