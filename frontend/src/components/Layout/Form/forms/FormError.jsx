import React from "react";

export default function FormError({ message, className = "", isBanner = false, ...props }) {
  if (!message) return null;

  if (isBanner) {
    return (
      <div
        className={`flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 ${className}`}
        {...props}
      >
        <svg
          className="w-4 h-4 mt-0.5 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
  }

  return (
    <p
      className={`text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium ${className}`}
      {...props}
    >
      {message}
    </p>
  );
}
