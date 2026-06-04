import React from "react";
import { Search } from "lucide-react";

const EmptyState = ({
  icon: Icon = Search,
  title = "Nothing to show",
  description = "There are no items available right now.",
  primaryAction,
  secondaryAction,
  className = "",
}) => {
  const iconElement = React.isValidElement(Icon) ? (
    Icon
  ) : (
    <Icon className="h-10 w-10 text-slate-400 dark:text-zinc-500" />
  );

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-5 rounded-4xl border border-dashed border-slate-700/50 bg-slate-950/90 px-8 py-16 text-center text-slate-100 shadow-[0_40px_120px_rgba(15,23,42,0.24)] transition-colors dark:border-slate-600/70 dark:bg-slate-950 ${className}`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900/90 border border-slate-700/70">
        {iconElement}
      </div>
      <div className="space-y-3 max-w-xl">
        {title && (
          <p className="text-xl font-black tracking-tight text-white">
            {title}
          </p>
        )}
        {description && (
          <p className="mx-auto text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-200 border border-slate-700 shadow-sm transition hover:bg-slate-700"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
