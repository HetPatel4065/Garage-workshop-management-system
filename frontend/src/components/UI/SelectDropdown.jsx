// src/components/UI/SelectDropdown.jsx
import React from "react";

export default function SelectDropdown({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  hint,
  required,
  disabled,
  error,
  className = "",
  selectClassName = "",
}) {
  const describedById = hint || error ? `${id}-help` : undefined;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block mb-1.5 text-[13px] font-semibold text-gray-800"
        >
          {label}
          {required && <span className="text-red-500 font-black ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedById}
        className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-all bg-white text-gray-900
          ${error ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
          ${disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
          ${selectClassName}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {(hint || error) && (
        <p
          id={describedById}
          className={`text-xs mt-1.5 ${error ? "text-red-600 font-semibold" : "text-gray-500"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
