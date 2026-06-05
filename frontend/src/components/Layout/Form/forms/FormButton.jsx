import React from "react";

const SpinnerIcon = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default function FormButton({
  children,
  type = "button",
  loading = false,
  loadingText = "Please wait…",
  disabled,
  icon,
  variant = "primary",
  size = "md",
  fullWidth = true,
  className = "",
  ...props
}) {
  const sizeClasses = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-sm",
  };

  const variantClasses = {
    primary:
      "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-400/25",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-700",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-400/25",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 border border-slate-200",
    dark:
      "bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/25",
    blue:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-400/20",
    emerald:
      "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-400/25",
    violet:
      "bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-400/25",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        active:scale-[0.98] transition-all duration-150
        disabled:opacity-60 disabled:cursor-not-allowed
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <SpinnerIcon />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
