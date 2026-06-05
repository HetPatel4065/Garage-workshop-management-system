import React from "react";

export default function FormLabel({
  children,
  required,
  hint,
  error,
  className = "",
  ...props
}) {
  return (
    <label
      className={`block text-sm font-medium mb-1.5 ${
        error
          ? "text-red-600 dark:text-red-400"
          : "text-slate-700 dark:text-zinc-300"
      } ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {hint && (
        <span className="text-slate-400 dark:text-zinc-500 text-xs ml-1 font-normal">
          ({hint})
        </span>
      )}
    </label>
  );
}
