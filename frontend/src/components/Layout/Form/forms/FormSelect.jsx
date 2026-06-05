import React, { useId } from "react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

export default function FormSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  hint,
  required,
  disabled,
  readOnly,
  children,
  className = "",
  selectClassName = "",
  labelClassName = "",
  ...props
}) {
  const reactId = useId();
  const selectId = id || `select-${reactId}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <FormLabel
          htmlFor={selectId}
          required={required}
          hint={hint}
          error={error}
          className={labelClassName}
        >
          {label}
        </FormLabel>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled || readOnly}
          className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none transition-all bg-white text-slate-900
            ${
              error
                ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-red-50/50 text-red-900"
                : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            }
            ${
              disabled || readOnly
                ? "bg-slate-50 text-slate-500 cursor-not-allowed border-slate-100"
                : ""
            }
            ${selectClassName}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children ||
            options.map((opt) => {
              const val = typeof opt === "object" ? opt.value : opt;
              const lbl = typeof opt === "object" ? opt.label : opt;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })}
        </select>
      </div>
      {error && <FormError message={error} />}
    </div>
  );
}
