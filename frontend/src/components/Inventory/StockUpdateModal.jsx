import React, { useState, useEffect } from "react";
import Modal from "../../components/UI/Modal";
import { Minus, Plus, Check } from "lucide-react";
import { FormSelect, FormButton, FormLabel } from "../layout/Form/forms";

export default function StockUpdateModal({
  isOpen,
  onClose,
  itemData,
  onSubmit, // This should handle the API call and show the Toast
}) {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("Manual Adjustment");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount(0);
      setReason("Manual Adjustment");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const currentStock = itemData?.stock ?? 0;
  const newStock = currentStock + amount;
  const isInvalid = amount === 0 || newStock < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isInvalid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...itemData,
        adjustmentType: amount > 0 ? "add" : "remove",
        quantity: Math.abs(amount),
        reason,
        newTotal: newStock,
        timestamp: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error("Failed to update stock:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Stock" size="sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl  border border-gray-100 overflow-hidden max-w-md mx-auto"
      >
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 border-b bg-gray-800">
          <h2 className="text-lg font-bold capitalize text-gray-850 truncate">
            {itemData?.name || "Select Item"}
          </h2>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500">Current Inventory</p>
            <span className="text-sm font-bold text-gray-700 bg-gray-500 px-2 py-0.5 rounded-lg">
              {currentStock} Units
            </span>
          </div>
        </div>

        {/* Adjustment Controls */}
        <div className="p-6 space-y-5">
          <div>
            <FormLabel className="block text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-3">
              Adjustment Quantity
            </FormLabel>

            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl p-2 shadow-inner">
              <button
                type="button"
                onClick={() => setAmount((prev) => prev - 1)}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white  border border-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 active:scale-90 transition-all"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-20 text-center text-3xl font-black bg-transparent outline-none text-gray-800"
                />
              </div>

              <button
                type="button"
                onClick={() => setAmount((prev) => prev + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 active:scale-90 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {newStock < 0 && (
              <p className="text-[11px] text-red-500 mt-2 font-medium flex items-center gap-1">
                ⚠️ Error: Cannot reduce stock below zero.
              </p>
            )}
          </div>

          {/* Reason Selection */}
          <FormSelect
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            label="Reason for Change"
            labelClassName="block text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2"
            selectClassName="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
          >
            <option value="Manual Adjustment">Manual Adjustment</option>
            <option value="Restock">New Shipment / Restock</option>
            <option value="Damaged Goods">Damaged / Scrapped</option>
            <option value="Correction">Inventory Correction</option>
          </FormSelect>

          {/* New Stock Preview */}
          <div
            className={`rounded-2xl p-4 flex justify-between items-center transition-all duration-500 ${
              newStock < 5 ? "bg-orange-500" : "bg-slate-900"
            } text-white`}
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">After update</span>
            </div>
            <span className="text-3xl font-black">{newStock}</span>
          </div>
        </div>

        {/* Form Footer Actions */}
        <div className="flex p-2 gap-2 bg-gray-50 border-t">
          <FormButton
            type="button"
            onClick={onClose}
            variant="secondary"
            className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-950/50 hover:text-gray-700 rounded-xl transition-all"
            fullWidth={false}
          >
            Cancel
          </FormButton>
          <button
            type="submit"
            disabled={isInvalid || isSubmitting}
            className={`flex-2 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
              isInvalid
                ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                : amount > 0
                  ? "bg-emerald-500 text-white  hover:bg-emerald-600"
                  : "bg-red-500 text-white hover:bg-red-600"
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                {amount === 0
                  ? "Enter Amount"
                  : amount > 0
                    ? `Add ${amount} Units`
                    : `Remove ${Math.abs(amount)} Units`}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
