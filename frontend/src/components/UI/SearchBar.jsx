import React from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  onKeyDown,
  onSearch,
  activeSearch,
  onClearActive,
  placeholder = "Search...",
  className = "",
}) {
  const handleClear = () => {
    onChange({ target: { value: "" } });
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(value);
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        className="group flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full shadow-sm 
                   hover:border-blue-300
                   focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 
                   transition-all duration-300 ease-in-out cursor-text"
      >
        <button
          onClick={handleSearchClick}
          className="mr-2.5 shrink-0 flex items-center justify-center p-1 rounded-lg hover:bg-blue-50 transition-colors group-focus-within:text-blue-500"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </button>

        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none ring-0 shadow-none text-sm font-medium text-gray-700 placeholder:text-gray-400"
        />

        <div className="flex items-center gap-1.5 ml-1.5 shrink-0">
          {value && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          
          <button
            onClick={handleSearchClick}
            className="px-3 py-1 bg-blue-600 dark:bg-blue-950/50 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors uppercase tracking-wider"
          >
            Search
          </button>
        </div>
      </div>

      {activeSearch && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-slate-500">Active Search:</span>
          <button
            onClick={onClearActive}
            className="inline-flex items-center capitalize gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            "{activeSearch}" <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
