// src/components/UI/NumberInput.jsx
import React from "react";

export default function NumberInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  hint,
  required,
  disabled,
  readOnly,
  error,
  className = "",
  inputClassName = "",
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
      <input
        id={id}
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        required={required}
        disabled={disabled || readOnly}
        aria-invalid={!!error}
        aria-describedby={describedById}
        className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-all bg-white text-gray-900 placeholder:text-gray-400
          ${error ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400" : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
            ${disabled || readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
          ${inputClassName}`}
      />
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
