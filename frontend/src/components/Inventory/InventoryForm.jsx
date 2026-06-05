import React, { useState, useEffect } from "react";
import TextInput from "../../components/UI/TextInput";
import NumberInput from "../../components/UI/NumberInput";
import SelectDropdown from "../../components/UI/SelectDropdown";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { FormTextarea } from "../layout/Form/forms";

const CATEGORY_OPTIONS = [
  "Engine",
  "Brakes",
  "Suspension",
  "Electrical",
  "Fluids",
  "Tires",
  "Body",
  "Filters",
  "Ignition",
  "Cooling",
  "Other",
];

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-[14px] font-bold uppercase tracking-widest text-gray-700">
      {title}
    </h3>
    {children}
  </div>
);

function getInitialState(itemData) {
  return {
    name: itemData?.name || "",
    sku: itemData?.sku || "",
    category: itemData?.category || "",
    carModel: itemData?.carModel || "Universal",
    stock: itemData?.stock ?? "",
    minLimit: itemData?.minLimit ?? "",
    costPrice: itemData?.costPrice ?? "",
    retailPrice: itemData?.retailPrice ?? "",
    supplierName: itemData?.supplier?.name || "",
    supplierContact: itemData?.supplier?.contact || "+91 ",
    location: itemData?.location || "Ahmedabad",
    carYear: itemData?.carYear || "All Years",
    notes: itemData?.notes || "",
  };
}

export default function InventoryForm({
  itemData,
  onSubmit,
  onClose,
  readOnly,
}) {
  const isEditing = !!itemData;
  const { addToast } = useToast();
  const { user } = useAuth();
  const role = (
    user?.role ||
    sessionStorage.getItem("role") ||
    ""
  ).toLowerCase();

  const [formData, setFormData] = useState(getInitialState(itemData));
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    setFormData(getInitialState(itemData));
    setErrors({});
  }, [itemData]);

  const validateField = (name, value) => {
    let error = "";
    if (name === "name") {
      if (!value.toString().trim()) error = "Part name is required";
    } else if (name === "sku") {
      if (!value.toString().trim()) error = "SKU / Part Number is required";
    } else if (name === "costPrice") {
      if (value === "" || value === null) error = "Cost price is required";
      else if (Number(value) < 0) error = "Cost price cannot be negative";
    } else if (name === "retailPrice") {
      if (value === "" || value === null) error = "Retail price is required";
      else if (Number(value) < 0) error = "Retail price cannot be negative";
      else if (formData.costPrice && Number(value) < Number(formData.costPrice))
        error = "Retail price should be higher than cost price";
    } else if (name === "supplierContact") {
      const phoneDigits = value.replace("+91 ", "").replace(/\s/g, "");
      if (phoneDigits && phoneDigits.length !== 10)
        error = "Phone number must be 10 digits";
    }
    return error;
  };

  const set = (field, value) => {
    if (readOnly) return;
    setFormData((p) => ({ ...p, [field]: value }));
    const error = validateField(field, value);
    setErrors((p) => ({ ...p, [field]: error }));
  };

  const capitalizeWords = (value) => {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const validateAll = () => {
    const newErrors = {
      name: validateField("name", formData.name),
      sku: validateField("sku", formData.sku),
      costPrice: validateField("costPrice", formData.costPrice),
      retailPrice: validateField("retailPrice", formData.retailPrice),
      supplierContact: validateField(
        "supplierContact",
        formData.supplierContact,
      ),
    };
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (readOnly) return;

    const currentErrors = validateAll();
    if (Object.values(currentErrors).some((e) => !!e)) {
      addToast("Please fix errors in the form", "error");
      // Switch to relevant tab if error is there
      if (
        currentErrors.name ||
        currentErrors.sku ||
        currentErrors.supplierContact
      )
        setActiveTab("details");
      else if (currentErrors.costPrice || currentErrors.retailPrice)
        setActiveTab("stock");
      return;
    }

    onSubmit({
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      carModel: formData.carModel,
      stock: formData.stock ? Number(formData.stock) : 0,
      minLimit: formData.minLimit ? Number(formData.minLimit) : 0,
      costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
      retailPrice: formData.retailPrice ? Number(formData.retailPrice) : 0,
      supplier: {
        name: formData.supplierName,
        contact: formData.supplierContact || "",
      },
      carYear: formData.carYear,
      location: formData.location,
      notes: formData.notes,
      _id: itemData?._id,
    });
  };

  const isInvalid =
    !formData.name ||
    !formData.sku ||
    formData.costPrice === "" ||
    formData.retailPrice === "" ||
    Object.values(errors).some((e) => !!e);

  const tabs = [
    { id: "details", label: "Details" },
    { id: "stock", label: "Stock" },
    { id: "notes", label: "Notes" },
  ];

  const profitPerUnit =
    (Number(formData.retailPrice) - Number(formData.costPrice)) *
      Number(formData.stock) || 0;

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden h-full">
      <div className="px-3 sm:px-5 border-b">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <input
              value={formData.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Part name..."
              readOnly={readOnly}
              className={`text-lg font-extrabold capitalize text-gray-900 bg-transparent border-none outline-none w-full placeholder:text-gray-400 ${readOnly ? "cursor-default" : ""}`}
            />
            <p className="text-[12px] font-medium text-gray-700 mt-1">
              {readOnly
                ? "Viewing Details"
                : isEditing
                  ? `Editing #${itemData?._id?.slice(-6).toUpperCase()}`
                  : "New inventory item"}
            </p>
          </div>

          <div className="shrink-0">
            {formData.stock === "" ? (
              <span className="text-sm font-bold px-3 py-1 rounded-full border text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700">
                Fill Stock
              </span>
            ) : formData.stock === 0 ? (
              <span className="text-sm font-bold px-3 py-1 rounded-full border text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800">
                Out of Stock
              </span>
            ) : formData.stock <= formData.minLimit ? (
              <span className="text-sm font-bold px-3 py-1 rounded-full border text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800">
                Low Stock
              </span>
            ) : (
              <span className="text-sm font-bold px-3 py-1 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800">
                In Stock
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`relative text-sm sm:text-base font-semibold pb-3 border-b-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === t.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {t.label}

              {((t.id === "details" &&
                (errors.name || errors.sku || errors.supplierContact)) ||
                (t.id === "stock" &&
                  (errors.costPrice || errors.retailPrice))) && (
                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-5 space-y-5 sm:space-y-6">
        {activeTab === "details" && (
          <Section title="Item Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4">
              <div>
                <TextInput
                  id="inventory-name"
                  label="Part Name"
                  required
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  error={errors.name}
                  readOnly={readOnly}
                />
              </div>
              <div>
                <TextInput
                  id="inventory-sku"
                  label="SKU / Part Number"
                  required
                  value={formData.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  error={errors.sku}
                  readOnly={readOnly}
                />
              </div>

              <div>
                <SelectDropdown
                  id="inventory-category"
                  label="Category"
                  value={formData.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Select category"
                  options={CATEGORY_OPTIONS.map((c) => ({
                    label: c,
                    value: c,
                  }))}
                  disabled={readOnly}
                />
              </div>

              <div>
                <TextInput
                  id="inventory-carModel"
                  label="Compatible Car"
                  value={formData.carModel}
                  onChange={(e) =>
                    set("carModel", capitalizeWords(e.target.value))
                  }
                  required
                  placeholder="e.g. Universal or Honda City"
                  readOnly={readOnly}
                />
              </div>

              <div>
                <TextInput
                  id="inventory-carYear"
                  label="Compatible Year"
                  value={formData.carYear}
                  onChange={(e) => set("carYear", e.target.value)}
                  placeholder="e.g. 2015-2022 or All Years"
                  readOnly={readOnly}
                />
              </div>

              <div>
                <TextInput
                  id="inventory-supplierName"
                  label="Supplier Name"
                  value={formData.supplierName}
                  onChange={(e) =>
                    set("supplierName", capitalizeWords(e.target.value))
                  }
                  readOnly={readOnly}
                />
              </div>

              <div>
                <TextInput
                  id="inventory-supplierContact"
                  label="Phone"
                  type="tel"
                  value={formData.supplierContact}
                  onChange={(e) => {
                    if (readOnly) return;
                    let v = e.target.value;
                    if (!v.startsWith("+91 "))
                      v = "+91 " + v.replace("+91", "").trim();
                    if (v.length <= 14) set("supplierContact", v);
                  }}
                  error={errors.supplierContact}
                  placeholder="+91 9000000000"
                  hint="Format: +91 9000000000"
                  readOnly={readOnly}
                />
              </div>

              <div>
                <TextInput
                  id="inventory-location"
                  label="Location"
                  value={formData.location}
                  onChange={(e) =>
                    set("location", capitalizeWords(e.target.value))
                  }
                  readOnly={readOnly}
                />
              </div>
            </div>
          </Section>
        )}

        {activeTab === "stock" && (
          <Section title="Stock & Pricing">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4">
              <div>
                <NumberInput
                  id="inventory-stock"
                  label="Current Stock"
                  required
                  min={0}
                  value={formData.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  readOnly={readOnly}
                />
              </div>

              <div>
                <NumberInput
                  id="inventory-minLimit"
                  label="Min Stock Alert Level"
                  required
                  min={0}
                  value={formData.minLimit}
                  onChange={(e) => set("minLimit", e.target.value)}
                  readOnly={readOnly}
                />
              </div>

              <div>
                <NumberInput
                  id="inventory-costPrice"
                  label="Cost Price (₹)"
                  required
                  min={0}
                  value={formData.costPrice}
                  onChange={(e) => set("costPrice", e.target.value)}
                  error={errors.costPrice}
                  readOnly={readOnly}
                />
              </div>
              <div>
                <NumberInput
                  id="inventory-retailPrice"
                  label="Retail Price (₹)"
                  required
                  min={0}
                  value={formData.retailPrice}
                  onChange={(e) => set("retailPrice", e.target.value)}
                  error={errors.retailPrice}
                  readOnly={readOnly}
                />
              </div>
            </div>
            {role !== "mechanic" && role !== "advisor" && (
              <div
                className={`text-sm font-bold p-3 rounded-lg border flex justify-between ${profitPerUnit < 0 ? "text-red-600 bg-red-50 border-red-100" : "text-blue-600 bg-blue-50 border-blue-100"}`}
              >
                <span>Potential Profit per Unit:</span>
                <span>₹{profitPerUnit}</span>
              </div>
            )}
          </Section>
        )}

        {activeTab === "notes" && (
          <Section title="Notes">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <FormTextarea
                value={formData.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={6}
                readOnly={readOnly}
                disabled={readOnly}
                textareaClassName={`w-full rounded-xl p-3 text-sm outline-none transition resize-none
                border border-slate-300 dark:border-slate-600
              bg-white dark:bg-slate-900
              text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${readOnly ? "cursor-default bg-slate-100 dark:bg-slate-800" : ""}`}
              />
            </div>
          </Section>
        )}
      </div>

      <div className="px-3 sm:px-5 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isInvalid && !readOnly ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}
          />
          <span
            className={`text-xs sm:text-sm font-medium ${isInvalid && !readOnly ? "text-red-500" : "text-emerald-600"}`}
          >
            {readOnly
              ? "View Only Mode"
              : isInvalid
                ? "Please fill all required fields correctly"
                : "All systems go! Ready to save"}
          </span>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 active:scale-95 transition-all duration-200 text-center"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>

          {!readOnly && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isInvalid}
              className={`flex-1 sm:flex-none group px-4 sm:px-6 py-2.5 text-sm font-bold rounded-xl text-white flex items-center justify-center gap-2 transition-all duration-200 ${
                isInvalid
                  ? "bg-gray-200 cursor-not-allowed shadow-none"
                  : "bg-gray-900 hover:bg-black hover:shadow-xl hover:shadow-gray-900/25 active:scale-[0.97]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 transition-transform duration-200 ${!isInvalid ? "group-hover:scale-110" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {isEditing ? "Update Item" : "Create Item"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
