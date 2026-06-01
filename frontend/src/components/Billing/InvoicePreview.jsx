import React, { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PaymentStatusBadge from "./PaymentStatusBadge";

import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../../components/UI/ConfirmModal";

export default memo(function InvoicePreview({
  invoice,
  garageSettings,
  onUpdateStatus,
  onDelete,
  onSendWhatsApp,
  currentUser,
}) {
  const { addToast } = useToast();
  const { token } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const currentYear = new Date().getFullYear();

  // Role-based access control
  const canSeeAdvisor =
    currentUser?.role === "Owner" || currentUser?.role === "Admin";

  const partsList = invoice?.parts || [];
  const servicesList = invoice?.services || [];
  const labourItem = invoice?.labor || {
    typeOfWork: "Labour",
    priceSnapshot: 0,
  };

  const subTotal = Number(invoice?.subTotal || 0);
  const tax = Number(invoice?.gst || 0);
  const total = Number(invoice?.total || 0);

  const [showPaymentOptions, setShowPaymentOptions] = React.useState(false);
  const [selectedMethod, setSelectedMethod] = React.useState(
    invoice.paymentMethod || "Cash",
  );
  const [amtToPay, setAmtToPay] = React.useState(
    invoice.total - (invoice.amountPaid || 0),
  );

  const vehicle = invoice.serviceId?.vehicleId || invoice.serviceId?.vehicle;

  const ispayed = invoice.status === "Paid";

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white border-2 border-slate-200 rounded-4xl  flex flex-col h-full overflow-hidden cursor-auto"
    >
      {/* 1. Header Section */}
      <div className="p-6 pb-4 flex items-start gap-4 cursor-auto">
        <div className="relative shrink-0">
          {garageSettings?.logo ? (
            <img
              src={`${import.meta.env.VITE_BASE_URL}/${garageSettings.logo}`}
              alt="Logo"
              className="w-14 h-14 rounded-2xl object-cover border border-white shadow-md"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-200">
              {garageSettings?.garageName?.charAt(0) || "G"}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1.5 w-5 h-5 bg-white rounded-full p-0.5 shadow-sm">
            <div
              className={`w-full h-full rounded-full ${invoice.status === "Paid" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
            />
          </div>
        </div>

        <div className="flex-1 flex justify-between items-start min-w-0">
          <div className="min-w-0">
            <h3 className="font-black text-gray-900 text-lg tracking-tight leading-tight pr-2">
              {garageSettings?.garageName || "Garage Name"}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <PaymentStatusBadge status={invoice.status} />
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-950/90 px-2 py-0.5 rounded-full">
                  ID:{" "}
                  {invoice.invoiceNumber ||
                    invoice._id?.slice(-6).toUpperCase()}
                </span>
                <span className="text-[10.5px] font-bold text-gray-400 whitespace-nowrap">
                  • {new Date(invoice.createdAt).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 -mr-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 shrink-0"
            title="Delete Invoice"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete?.(invoice._id);
          setShowDeleteModal(false);
        }}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoice.invoiceNumber || invoice._id?.slice(-6).toUpperCase()}? This action is permanent.`}
        confirmText="Yes, Delete"
        type="danger"
      />

      {/* 2. Customer & Vehicle Context */}
      <div className="px-6 py-5 bg-white border-y border-gray-300">
        <div className="flex flex-col gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">
              Customer
            </p>
            <p className="text-base font-bold text-gray-900">
              {invoice.customerId?.name || "Customer Name"}
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">
                  Vehicle Details
                </p>
                <p className="text-base font-bold text-gray-900">
                  {vehicle ? `${vehicle.make} ${vehicle.model}` : "N/A"}
                </p>
              </div>
              <div className="mt-5">
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-[12.5px] font-mono font-bold rounded border border-gray-200 uppercase shadow-sm">
                  {vehicle?.licensePlate || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* ADVISOR SECTION - Only visible to Owner/Admin */}
          {canSeeAdvisor && (
            <div className="pt-4 border-y border-dashed border-gray-300">
              <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest mb-1">
                Assigned Advisor
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100">
                  {invoice.advisorId?.name?.charAt(0) || "A"}
                </div>
                <p className="text-sm font-bold text-gray-700">
                  {invoice.advisorId?.name || "Not Assigned"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Items Summary */}
      <div className="px-6 py-5 grow flex flex-col gap-5 ">
        {(servicesList.length > 0 || labourItem.priceSnapshot > 0) && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">
              Services Performed
            </p>
            {servicesList.map((s, i) => (
              <div
                key={i}
                className="flex justify-between text-sm font-bold text-gray-700"
              >
                <span className="capitalize">{s.name}</span>
                <span>₹{s.total?.toLocaleString()}</span>
              </div>
            ))}

            {partsList.length > 0 && (
              <div className="flex flex-col gap-2.5 pt-2 border-t border-gray-300">
                <p className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">
                  Inventory Used
                </p>
                {partsList.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm capitalize font-bold text-gray-700"
                  >
                    <span>
                      {p.name}{" "}
                      <span className="text-gray-700 font-medium text-xs">
                        x{p.quantity}
                      </span>
                    </span>
                    <span>₹{p.total?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {labourItem.priceSnapshot > 0 && (
              <div className="flex justify-between text-sm font-bold text-gray-700">
                <span>Labour Charges</span>
                <span>₹{labourItem.priceSnapshot.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-300 space-y-2">
          <div className="flex justify-between text-sm font-bold text-gray-700">
            <span className="uppercase tracking-wider">Subtotal</span>
            <span>₹{subTotal.toLocaleString()}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-xs font-bold text-emerald-600">
              <span className="uppercase tracking-wider">
                Discount ({invoice.discountPercent}%)
              </span>
              <span>- ₹{invoice.discountAmount.toLocaleString()}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>GST (18%)</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Totals & Actions */}
      <div className="p-6 pt-4 bg-white mt-auto rounded-b-[2.5rem]">
        {/* 1. Header: Total & Status */}
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-1">
            <p
              className={`text-[11px] font-black uppercase tracking-widest leading-none ${ispayed ? "text-gray-400" : "text-blue-600"}`}
            >
              {ispayed ? "Total Amount Paid" : "Balance Amount Due"}
            </p>
            <h4 className="text-3xl font-black text-gray-900 tracking-tighter flex items-baseline gap-1">
              <span className="text-xl font-bold opacity-50">₹</span>
              {Math.floor(total).toLocaleString()}
            </h4>
          </div>

          {invoice.amountPaid > 0 && invoice.status !== "Paid" && (
            <div className="text-right pb-1 group">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                Received
              </p>
              <p className="text-sm font-black text-emerald-700">
                ₹{invoice.amountPaid.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* 2. Action Container */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="wait">
            {showPaymentOptions ? (
              <motion.div
                key="payment-drawer"
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="space-y-4 p-4 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-sm rounded-3xl border border-gray-100 mb-2 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-gray-400 dark:text-white uppercase tracking-widest">
                    Collect Payment
                  </span>
                  <button
                    onClick={() => setShowPaymentOptions(false)}
                    className="text-[10px] font-black text-red-400 hover:text-red-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    {/* Currency Symbol */}
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                      ₹
                    </span>

                    {/* Static Value Container */}
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-8 pr-4 py-3 text-sm font-black text-gray-900">
                      {Number(amtToPay).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateStatus(
                        invoice._id,
                        Number(amtToPay) >= total - (invoice.amountPaid || 0)
                          ? "Paid"
                          : "Partially Paid",
                        {
                          paymentMethod: selectedMethod,
                          amountPaid:
                            (invoice.amountPaid || 0) + Number(amtToPay),
                        },
                      );
                      setShowPaymentOptions(false);
                    }}
                    className="bg-gray-900 dark:bg-emerald-600 text-white px-6 rounded-2xl text-xs font-black hover:bg-black dark:hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="primary-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 w-full"
              >
                {invoice.status !== "Paid" ? (
                  <button
                    onClick={() => setShowPaymentOptions(true)}
                    className="flex-[2.5] bg-blue-600 text-white py-4 rounded-3xl text-sm font-black hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Collect Payment
                  </button>
                ) : (
                  <div className="flex-[2.5] py-4 rounded-3xl bg-emerald-50 text-emerald-600 text-sm font-black flex items-center justify-center gap-2 border border-emerald-100">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Settled in Full
                  </div>
                )}

                <button
                  onClick={() => onSendWhatsApp?.(invoice)}
                  className="flex-1 flex items-center justify-center bg-emerald-500 dark:bg-emerald-700/50 text-white py-4 rounded-3xl transition-all  hover:bg-emerald-600 active:scale-95"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.431 5.628 1.432h.007c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={async () => {
              try {
                addToast("Generating your premium invoice...", "info");

                const response = await fetch(
                  `/api/billing/${invoice._id}/generate-pdf`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );

                // 1. If your API returns a JSON with a URL, we need that data first
                const data = await response.json();
                if (!response.ok)
                  throw new Error(data.error || "Failed to generate PDF");

                // 2. Fetch the actual PDF file from the returned URL as a blob
                const pdfResponse = await fetch(data.pdfUrl);
                const blob = await pdfResponse.blob();

                // 3. Create a temporary local URL for the blob
                const downloadUrl = window.URL.createObjectURL(blob);

                // 4. Create a hidden <a> tag and programmatically click it to force download
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.download = `Invoice-${invoice._id}.pdf`; // You can name the file here
                document.body.appendChild(link);
                link.click();

                // 5. Clean up the DOM and memory
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);

                addToast("Invoice ready!", "success");
              } catch (err) {
                console.error("PDF Download Error:", err);
                addToast(err.message, "error");
              }
            }}
            className="w-full py-4 flex items-center justify-center gap-2 border rounded-3xl border-gray-200 text-gray-400 hover:text-gray-600 text-[13px] font-bold transition-colors group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Digital PDF Receipt
          </button>
        </div>
      </div>
    </motion.div>
  );
});
