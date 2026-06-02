import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Wrench,
  Tag,
  PieChart,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { buildPortalAuthHeaders } from "../../../utils/portalPreview";

const InvoiceRow = ({
  invoice,
  isOpen,
  toggleExpand,
  getStatusColor,
  onRefresh,
  token,
  portalPreviewCustomerId = "",
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const hasParts = (invoice.parts || []).length > 0;
  const hasServices = (invoice.services || []).length > 0;

  const downloadUrl = invoice.pdfUrl
    ? invoice.pdfUrl.startsWith("http")
      ? invoice.pdfUrl
      : `${import.meta.env.VITE_API_URL.replace("/api", "")}${invoice.pdfUrl.startsWith("/") ? "" : "/"}${invoice.pdfUrl}`
    : null;

  const handleDownloadPdf = async () => {
    if (!token) return;
    setIsDownloading(true);

    try {
      // 1. Ensure the PDF has been generated first
      await axios.get(
        `${import.meta.env.VITE_API_URL}/portal/invoices/${invoice._id}/pdf`,
        {
          headers: buildPortalAuthHeaders(token, portalPreviewCustomerId),
        },
      );

      // 2. Fetch the PDF through the secure customer portal download endpoint
      const pdfUrl = `${import.meta.env.VITE_API_URL}/portal/invoices/${invoice._id}/download-pdf`;

      const response = await axios.get(pdfUrl, {
        responseType: "blob",
        headers: buildPortalAuthHeaders(token, portalPreviewCustomerId),
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = invoice.invoiceId
        ? `${invoice.invoiceId}.pdf`
        : `Invoice-${invoice._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Invoice download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "finalized":
      case "completed":
        return <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
      case "pending":
      case "sent":
        return <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
      default:
        return <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
    }
  };

  const handleGeneratePDF = async () => {
    if (!token) return;
    setIsGenerating(true);
    try {
      await axios.get(
        `${import.meta.env.VITE_API_URL}/portal/invoices/${invoice._id}/pdf`,
        {
          headers: buildPortalAuthHeaders(token, portalPreviewCustomerId),
        },
      );
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border border-slate-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-colors duration-300 w-full">
      {/* ── Summary Row ── */}
      <button
        type="button"
        onClick={() => toggleExpand(invoice._id)}
        className="w-full flex items-start sm:items-center justify-between p-4 sm:px-5 py-4 hover:bg-slate-50 dark:hover:bg-zinc-850/30 transition-colors text-left gap-3 min-w-0"
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <FileText className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base sm:text-lg md:text-xl capitalize text-slate-900 dark:text-white line-clamp-2 pr-1 leading-snug">
              {(invoice.services || []).map((s) => s.name).join(" - ") ||
                "Service Invoice"}
            </h3>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-1.5">
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 shrink-0">
                {invoice.invoiceId}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 shrink-0">
                {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {invoice.vehicleMake && invoice.vehicleModel && (
                <span className="text-xs font-bold font-mono text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded-md shrink-0">
                  {invoice.vehicleMake} {invoice.vehicleModel}
                </span>
              ) }
              {invoice.licensePlate && (
                <span className="text-xs font-bold font-mono text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded-md shrink-0">
                  {invoice.licensePlate}
                </span>
              )}
              
              {/* ✅ FIXED MOBILE VIEW STATUS BADGE */}
              <span
                className={`sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${getStatusColor(invoice.status)}`}
              >
                {getStatusIcon(invoice.status)}
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Price and Desktop Actions */}
        <div className="flex items-center gap-3 shrink-0 self-center">
          <div className="text-right hidden sm:block">
            {/* ✅ FIXED DESKTOP VIEW STATUS BADGE */}
            <span
              className={`inline-flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusColor(invoice.status)}`}
            >
              {getStatusIcon(invoice.status)}
              {invoice.status}
            </span>
            <p className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-100">
              ₹{Number(invoice.totalAmount || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {/* ── Expanded Detail Panel ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`invoice-detail-${invoice._id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 pt-2 bg-slate-50/70 dark:bg-zinc-950/20 border-t border-slate-100 dark:border-zinc-800 space-y-5">
              {/* Mobile Only: Total Payable Banner */}
              <div className="sm:hidden flex justify-between items-center p-3 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                  Total Amount
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                  ₹{Number(invoice.totalAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Layout Content Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* LEFT COLUMN: CHARGES BREAKDOWN */}
                <div className="space-y-5">
                  {/* Service Charges */}
                  {hasServices && (
                    <div className="w-full">
                      <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-blue-500" /> Service
                        Charges
                      </h4>
                      <div className="rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 px-4 py-2 border-b border-slate-100 dark:border-zinc-800 text-[10px] sm:text-xs font-black text-slate-500 dark:text-zinc-450 uppercase tracking-wider">
                          <span className="w-2/3">Description</span>
                          <span className="w-1/3 text-right">Amount</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {invoice.services.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors"
                            >
                              <span className="w-2/3 capitalize font-bold text-slate-700 dark:text-zinc-300 wrap-break-word pr-2">
                                {s.name}
                              </span>
                              <span className="w-1/3 font-black text-slate-800 dark:text-zinc-200 text-right whitespace-nowrap">
                                ₹
                                {Number(
                                  s.priceSnapshot || s.total,
                                ).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Labour Charges */}
                  {invoice.labor && invoice.labor.priceSnapshot > 0 && (
                    <div className="w-full">
                      <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Wrench className="w-3 h-3 text-orange-500" /> Labour
                        Charges
                      </h4>
                      <div className="rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 px-4 py-2 border-b border-slate-100 dark:border-zinc-800 text-[10px] sm:text-xs font-black text-slate-500 dark:text-zinc-450 uppercase tracking-wider">
                          <span className="w-2/3">Work Details</span>
                          <span className="w-1/3 text-right">Amount</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm">
                          <span className="w-2/3 font-bold text-slate-700 dark:text-zinc-300 capitalize truncate pr-2">
                            {invoice.labor.typeOfWork || "General Labour"}
                          </span>
                          <span className="w-1/3 font-black text-slate-800 dark:text-zinc-200 text-right whitespace-nowrap">
                            ₹
                            {Number(invoice.labor.priceSnapshot).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parts & Inventory Layout */}
                  {hasParts && (
                    <div className="w-full">
                      <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Package className="w-3 h-3 text-emerald-500" /> Parts &
                        Inventory
                      </h4>
                      <div className="rounded-xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                        <div className="hidden sm:grid grid-cols-12 gap-2 bg-slate-50/50 dark:bg-zinc-900/50 px-4 py-2 border-b border-slate-100 dark:border-zinc-800 text-[10px] sm:text-xs font-black text-slate-500 dark:text-zinc-450 uppercase tracking-wider">
                          <span className="col-span-6">Part</span>
                          <span className="col-span-2 text-center">Qty</span>
                          <span className="col-span-4 text-right">Total</span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {invoice.parts.map((p, i) => (
                            <div
                              key={i}
                              className="hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors"
                            >
                              <div className="block sm:hidden p-3 space-y-1.5">
                                <div className="font-bold text-slate-700 dark:text-zinc-300 text-xs capitalize wrap-break-word">
                                  {p.name}
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                                  <div>
                                    Qty:{" "}
                                    <span className="text-slate-800 dark:text-zinc-200 font-bold">
                                      {p.quantity}
                                    </span>
                                  </div>
                                  <div className="text-xs font-black text-slate-900 dark:text-white">
                                    ₹
                                    {Number(
                                      p.total || p.priceSnapshot * p.quantity,
                                    ).toLocaleString("en-IN")}
                                  </div>
                                </div>
                              </div>

                              <div className="hidden sm:grid grid-cols-12 gap-2 items-center px-4 py-2.5 text-xs sm:text-sm">
                                <span className="col-span-6 capitalize font-bold text-slate-700 dark:text-zinc-300 wrap-break-word pr-1">
                                  {p.name}
                                </span>
                                <span className="col-span-2 font-bold text-slate-600 dark:text-zinc-400 text-center">
                                  {p.quantity}
                                </span>
                                <span className="col-span-4 font-black text-slate-800 dark:text-zinc-200 text-right whitespace-nowrap">
                                  ₹
                                  {Number(
                                    p.total || p.priceSnapshot * p.quantity,
                                  ).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: PAYMENT SUMMARY & EXPORTS */}
                <div className="space-y-5">
                  <div className="bg-slate-900 dark:bg-zinc-950 border dark:border-zinc-850 rounded-2xl p-5 text-white shadow-md">
                    <h4 className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-blue-400" /> Payment
                      Summary
                    </h4>

                    <div className="space-y-3 text-xs sm:text-sm">
                      <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                        <span className="font-bold text-slate-400">
                          Subtotal
                        </span>
                        <span className="font-black">
                          ₹
                          {Number(invoice.subTotal || 0).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>

                      {invoice.discountAmount > 0 && (
                        <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                          <span className="font-bold text-emerald-400">
                            Discount ({invoice.discountPercent}%)
                          </span>
                          <span className="font-black text-emerald-400">
                            -₹
                            {Number(invoice.discountAmount).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                        <span className="font-bold text-slate-400">
                          Tax (GST)
                        </span>
                        <span className="font-black">
                          ₹{Number(invoice.gst || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1.5">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            Grand Total
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-white mt-0.5">
                            ₹
                            {Number(invoice.totalAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                        {invoice.amountPaid > 0 && (
                          <div className="text-right">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                              Paid
                            </span>
                            <span className="block text-base sm:text-lg font-black text-emerald-400 mt-0.5">
                              ₹
                              {Number(invoice.amountPaid).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm space-y-3">
                    <h4 className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                      Actions
                    </h4>

                    {downloadUrl ? (
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-95 shadow-md shadow-blue-200 dark:shadow-none ${
                          isDownloading
                            ? "bg-slate-200 text-slate-500 border border-slate-200 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        {isDownloading
                          ? "Downloading..."
                          : "Download Official PDF"}
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-4 bg-slate-50/50 dark:bg-zinc-850/20 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                        <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 text-center">
                          Get Your official invoice PDF
                        </p>
                        <button
                          onClick={handleGeneratePDF}
                          disabled={isGenerating}
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:text-blue-500 rounded-lg font-black text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5" /> Generate PDF
                              Now
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(InvoiceRow);
