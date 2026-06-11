import React, { useId } from "react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

export default function FormTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required,
  disabled,
  readOnly,
  rows = 3,
  className = "",
  textareaClassName = "",
  labelClassName = "",
  ...props
}) {
  const reactId = useId();
  const textareaId = id || `textarea-${reactId}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <FormLabel
          htmlFor={textareaId}
          required={required}
          hint={hint}
          error={error}
          className={labelClassName}
        >
          {label}
        </FormLabel>
      )}
      <textarea
        id={textareaId}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled || readOnly}
        rows={rows}
        className={`w-full p-3.5 rounded-xl border text-sm outline-none transition-all bg-white text-slate-900 resize-none
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
          ${textareaClassName}`}
        {...props}
      />
      {error && <FormError message={error} />}
    </div>
  );
}
