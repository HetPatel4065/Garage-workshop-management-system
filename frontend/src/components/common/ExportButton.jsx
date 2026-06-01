import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Download, FileText, Table } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToPDF, exportToExcel } from "../../utils/exportUtils";

const ExportButton = ({
  title,
  columns,
  data,
  filenamePrefix = "export",
  align = "auto",
}) => {
  const { user } = useAuth();
  const role = (
    user?.role ||
    sessionStorage.getItem("role") ||
    ""
  ).toLowerCase();

  // Only allow admin and owner to access export functionality
  if (role !== "admin" && role !== "owner") return null;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportPDF = () => {
    exportToPDF(
      title,
      columns,
      data,
      `${filenamePrefix}_${new Date().getTime()}.pdf`,
    );
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    exportToExcel(
      title,
      columns,
      data,
      `${filenamePrefix}_${new Date().getTime()}.xlsx`,
    );
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium text-sm"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50 ${
              align === "left"
                ? "left-0"
                : align === "right"
                  ? "right-0"
                  : "left-0 sm:right-0 sm:left-auto"
            }`}
          >
            <div className="p-1">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
              >
                <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md">
                  <FileText className="w-4 h-4" />
                </div>
                Export as PDF
              </button>

              <button
                onClick={handleExportExcel}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors mt-1"
              >
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md">
                  <Table className="w-4 h-4" />
                </div>
                Export as Excel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportButton;
