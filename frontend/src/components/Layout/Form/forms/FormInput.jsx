import React, { useId } from "react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

const renderIcon = (iconInput) => {
  if (!iconInput) return null;
  if (React.isValidElement(iconInput)) return iconInput;
  const Comp = iconInput;
  return <Comp className="w-4 h-4" />;
};

export default function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  hint,
  required,
  disabled,
  readOnly,
  icon,
  leftIcon,
  rightIcon,
  rightAction,
  className = "",
  inputClassName = "",
  labelClassName = "",
  ...props
}) {
  const reactId = useId();
  const inputId = id || `input-${reactId}`;

  const ActiveIcon = leftIcon || icon;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <FormLabel
          htmlFor={inputId}
          required={required}
          hint={hint}
          error={error}
          className={labelClassName}
        >
          {label}
        </FormLabel>
      )}
      <div className="relative">
        {ActiveIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
            {renderIcon(ActiveIcon)}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={`
            w-full text-sm transition-all outline-none rounded-xl border
            ${ActiveIcon ? "pl-9" : "px-3"}
            ${rightIcon || rightAction ? "pr-9" : "pr-3"}
            ${type === "number" ? "h-9 py-1.5" : "h-9"}
            ${
              error
                ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-red-50/50 text-red-900 placeholder:text-red-300"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#121826] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            }
            ${
              disabled
                ? "bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-100 dark:border-slate-700/50"
                : ""
            }
            ${
              readOnly
                ? "bg-slate-50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 cursor-default border-slate-100 dark:border-slate-700/50"
                : ""
            }
            ${inputClassName}
          `}
          {...props}
        />
        {(rightIcon || rightAction) && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightAction || renderIcon(rightIcon)}
          </div>
        )}
      </div>
      {error && <FormError message={error} />}
    </div>
  );
}
