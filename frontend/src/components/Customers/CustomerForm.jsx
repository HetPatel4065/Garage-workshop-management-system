import React, { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { FormInput, FormTextarea, FormLabel, FormRow } from "../layout/Form/forms";

const STATUS_OPTIONS = ["Active", "Inactive", "Blocked"];

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-gray-100 text-gray-500 border-gray-200",
  Blocked: "bg-red-50 text-red-600 border-red-200",
};
const STATUS_DOT = {
  Active: "bg-emerald-400",
  Inactive: "bg-gray-400",
  Blocked: "bg-red-400",
};

const Divider = () => <hr className="border-gray-100" />;

export default function CustomerForm({
  customerData,
  onSubmit,
  onClose,
  isReadOnly,
}) {
  const isEditing = !!customerData;
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "+91 ",
    address: { street: "", city: "", zip: "" },
    status: "Active",
    tags: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!customerData) {
      setFormData({
        name: "",
        email: "",
        phone: "+91 ",
        address: { street: "", city: "", zip: "" },
        status: "Active",
        tags: "",
        notes: "",
      });
      return;
    }

    setFormData({
      name: customerData.name || "",
      email: customerData.email || "",
      phone: customerData.phone || "+91 ",
      address: {
        street: customerData.address?.street || "",
        city: customerData.address?.city || "",
        zip: customerData.address?.zip || "",
      },
      status: customerData.status || "Active",
      notes: customerData.notes || "",
      tags: Array.isArray(customerData.tags)
        ? customerData.tags.join(", ")
        : "",
    });
  }, [customerData]);

  const validateField = (name, value) => {
    let error = "";
    if (name === "name") {
      if (!value.trim()) error = "Full name is required";
      else if (value.trim().length < 3)
        error = "Name must be at least 3 characters";
    } else if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) error = "Email is required";
      else if (!emailRegex.test(value)) error = "Invalid email format";
    } else if (name === "phone") {
      const phoneDigits = value.replace("+91 ", "").replace(/\s/g, "");
      if (!phoneDigits) error = "Phone number is required";
      else if (phoneDigits.length !== 10)
        error = "Phone number must be 10 digits";
    } else if (name === "zip") {
      if (value && !/^\d{6}$/.test(value)) error = "ZIP code must be 6 digits";
    }
    return error;
  };

  const handleInputChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    const error = validateField(field, value);
    setErrors((p) => ({ ...p, [field]: error }));
  };

  const capitalizeWords = (val) => val.replace(/\b\w/g, (c) => c.toUpperCase());

  const setAddress = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "zip" ? value : capitalizeWords(value);

    setFormData((p) => ({
      ...p,
      address: {
        ...p.address,
        [name]: formattedValue,
      },
    }));

    const error = validateField(name, formattedValue);
    setErrors((p) => ({ ...p, [name]: error }));
  };

  const handlePhone = (e) => {
    let v = e.target.value;
    let rawInput = v.startsWith("+91") ? v.slice(4) : v;
    let digitsOnly = rawInput.replace(/\D/g, "");
    let formattedValue = "+91 " + digitsOnly;

    if (formattedValue.length <= 14) {
      handleInputChange("phone", formattedValue);
    }
  };

  const validateAll = () => {
    const newErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      zip: validateField("zip", formData.address.zip),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => !!e);
  };

  const handleSubmit = () => {
    if (!validateAll()) {
      addToast("Please fix the errors in the form", "error");
      return;
    }

    onSubmit({
      ...formData,
      _id: customerData?._id,
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });
  };

  const isInvalid =
    !formData.name ||
    !formData.email ||
    formData.phone === "+91 " ||
    Object.values(errors).some((e) => !!e);

  return (
    <div className="flex flex-col h-[90vh]">
      {/* Internal Header Actions */}
      {!isReadOnly && (
        <div className="px-6 py-3 border-b border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
            {isEditing ? "Modify Record" : "New Entry"}
          </p>

          <div className="flex flex-col items-stretch sm:items-end gap-1.5 w-full sm:w-auto min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left sm:text-right">
              Customer status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((o) => {
                const selected = formData.status === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => handleInputChange("status", o)}
                    aria-pressed={selected}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full border transition-all duration-200 select-none ${
                      selected
                        ? `${STATUS_STYLES[o]} shadow-sm`
                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        STATUS_DOT[o] || "bg-gray-400"
                      } ${selected ? "" : "opacity-50"}`}
                    />
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
        {/* Identity */}
        <div>
          <p className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-3">
            Identity & contact
          </p>
          <FormRow cols={3} gap="gap-3 sm:gap-4" className="bg-gray-100 rounded-xl p-3 sm:p-4">
            <FormInput
              name="name"
              value={formData.name}
              onChange={(e) =>
                handleInputChange("name", capitalizeWords(e.target.value))
              }
              placeholder="Enter your name"
              disabled={isReadOnly}
              error={errors.name}
              label="Full name"
              required
            />
            <FormInput
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="xyz@gmail.com"
              disabled={isReadOnly}
              error={errors.email}
              label="Email"
              required
            />
            <FormInput
              name="phone"
              value={formData.phone}
              onChange={handlePhone}
              placeholder="+91 00000 00000"
              disabled={isReadOnly}
              error={errors.phone}
              label="Phone"
              required
            />
          </FormRow>
        </div>

        <Divider />

        {/* Address */}
        <div>
          <p className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-3">
            Address
          </p>
          <div className="space-y-4 bg-gray-100 rounded-xl p-4">
            <FormInput
              name="street"
              value={formData.address.street}
              onChange={setAddress}
              placeholder="Iskcon"
              disabled={isReadOnly}
              error={errors.street}
              label="Street Address"
            />
            <FormRow cols={2}>
              <FormInput
                name="city"
                value={formData.address.city}
                onChange={setAddress}
                placeholder="Ahmedabad"
                disabled={isReadOnly}
                error={errors.city}
                label="City"
              />
              <FormInput
                name="zip"
                value={formData.address.zip}
                onChange={setAddress}
                placeholder="380001"
                disabled={isReadOnly}
                error={errors.zip}
                label="ZIP / Postal"
              />
            </FormRow>
          </div>
        </div>

        <Divider />

        {/* Notes */}
        <div>
          <p className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-3">
            Notes
          </p>
          <div className="space-y-4 bg-gray-100 rounded-xl p-4">
            <FormTextarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              disabled={isReadOnly}
              rows={4}
              placeholder="Preferences, history, or context..."
              label="Internal notes"
              textareaClassName="border-gray-200 focus:ring-2 focus:ring-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isInvalid && !isReadOnly ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}
          />
          <span
            className={`text-xs sm:text-sm font-medium ${isInvalid && !isReadOnly ? "text-red-500" : "text-emerald-600"}`}
          >
            {isReadOnly
              ? "View Only Mode"
              : isInvalid
                ? "Please fill all required fields correctly"
                : "All systems go! Ready to save"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isReadOnly ? "Close" : "Discard"}
        </button>

        {!isReadOnly && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isInvalid}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-all
            ${
              isInvalid
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-[#0f172a] hover:bg-blue-600 active:scale-95"
            }`}
          >
            {isEditing ? "Save changes" : "Register profile"}
          </button>
        )}
      </div>
    </div>
  );
}
