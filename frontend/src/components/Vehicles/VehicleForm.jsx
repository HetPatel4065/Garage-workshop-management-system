import React, { useState, useRef } from "react";
import { FormInput, FormSelect, FormRow } from "../layout/Form/forms";
import {
  CAR_MAKE_OPTIONS,
  CAR_MAKES_MODELS,
  YEAR_OPTIONS,
  TRANSMISSION_OPTIONS,
  TRANSMISSION_TYPES,
} from "../../constants/vehicleMarketplaceOptions";

export const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
export const VEHICLE_STATUSES = ["In Garage", "With Owner", "Archived"];

export function createEmptyVehicle() {
  return {
    make: "",
    model: "",
    year: "",
    chassisnumber: "",
    licensePlate: "",
    serviceDate: "",
    engineType: "",
    fuelType: "Petrol",
    transmission: "",
    currentMileage: "",
    nextServiceDate: "",
    status: "With Owner",
    requestedService: "",
  };
}

export const validateVehicle = (vehicle) => {
  const errors = {};
  const plate = (vehicle.licensePlate || "").trim().toUpperCase();

  if (!plate) {
    errors.licensePlate = "License plate is required";
  } else {
    const strictPlateRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
    if (!strictPlateRegex.test(plate)) {
      errors.licensePlate =
        "Format must be exactly AA00AA0000 (ex: GJ01RY7585)";
    }
  }

  if (!vehicle.make?.trim()) errors.make = "Make is required";
  if (!vehicle.model?.trim()) errors.model = "Model is required";

  if (
    vehicle.year &&
    (vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1)
  ) {
    errors.year = "Invalid year";
  }

  if (
    vehicle.chassisnumber &&
    vehicle.chassisnumber.length > 0 &&
    vehicle.chassisnumber.length !== 17
  ) {
    errors.chassisnumber = "Chassis number must be 17 characters";
  }

  return errors;
};

// ─── Main VehicleForm ─────────────────────────────────────────────────────────
export default function VehicleForm({
  vehicle,
  onChange,
  isReadOnly,
  onRemove,
  showRemove,
  errors = {},
  handleSubmit,
  isEditing = false,
  chassisPhoto, // base64 string — controlled by parent
  onChassisPhotoChange, // (base64 | null) => void
}) {
  const fileInputRef = useRef(null);

  const [transmissionCategory, setTransmissionCategory] = useState(() => {
    return (
      Object.entries(TRANSMISSION_OPTIONS).find(([_, types]) =>
        types.includes(vehicle.transmission),
      )?.[0] ?? ""
    );
  });

  const handleChange = (field, value) => {
    let processedValue = value;
    if (field === "licensePlate") {
      const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      processedValue = cleaned.substring(0, 10);
    }
    onChange({ ...vehicle, [field]: processedValue });
  };

  const handleTransmissionCategoryChange = (category) => {
    setTransmissionCategory(category);
    handleChange("transmission", "");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChassisPhotoChange?.(reader.result);
    reader.readAsDataURL(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  const currentPlateLength = vehicle?.licensePlate?.length ?? 0;
  if (currentPlateLength > 0 && currentPlateLength < 10) {
    errors.licensePlate =
      "Plate must be exactly 10 characters (e.g., GJ01RY7585)";
  }

  const isInvalid = Object.keys(errors).length > 0;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="space-y-6">
        {/* SECTION: Linked Customer Info */}
        {isReadOnly && vehicle.customerId && (
          <div className="bg-gray-100 p-6 rounded-2xl border border-blue-100 cusr">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Registered Owner Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Customer Name
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {vehicle.customerId.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Mobile Number
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {vehicle.customerId.phone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                  Email Address
                </p>
                <p className="text-sm font-bold text-gray-900 lowercase truncate">
                  {vehicle.customerId.email || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: Registration Details */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Registration Details
          </h4>
          <FormRow cols={2} className="bg-gray-100 rounded-xl p-4">
            <FormInput
              label="License Plate"
              value={vehicle.licensePlate}
              placeholder="GJ01RR1111"
              maxLength={10}
              readOnly={isReadOnly}
              disabled={isReadOnly}
              error={errors.licensePlate}
              required
              onChange={(e) => {
                const value = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "");
                let formattedValue = "";
                for (let i = 0; i < value.length; i++) {
                  const char = value[i];
                  if (i === 0 || i === 1 || i === 4 || i === 5) {
                    if (/[A-Z]/.test(char)) formattedValue += char;
                  } else {
                    if (/[0-9]/.test(char)) formattedValue += char;
                  }
                }
                handleChange("licensePlate", formattedValue);
              }}
              inputClassName="w-full uppercase py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none text-base font-semibold tracking-wider"
            />

            {/* Chassis No. + upload button */}
            <div>
              <div style={{ position: "relative" }}>
                <FormInput
                  value={vehicle.chassisnumber}
                  onChange={(e) =>
                    handleChange("chassisnumber", e.target.value)
                  }
                  placeholder="17 Digit Number"
                  inputClassName="uppercase pr-12"
                  disabled={isReadOnly}
                  maxLength={17}
                  error={errors.chassisnumber}
                  required
                  label="Chassis No. (VIN)"
                  hint="Found on the driver-side door frame"
                />
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload chassis photo"
                    style={{
                      position: "absolute",
                      right: "10px",
                      bottom: errors.chassisnumber ? "32px" : "2px",
                      background: "#1e3a5f",
                      border: "none",
                      borderRadius: "8px",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 2,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#2563eb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#1e3a5f")
                    }
                  >
                    {/* Upload icon */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Chassis photo thumbnail */}
              {chassisPhoto && (
                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <img
                    src={chassisPhoto}
                    alt="Chassis plate"
                    style={{
                      width: "72px",
                      height: "44px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(chassisPhoto, "_blank")}
                    title="Click to view full photo"
                  />
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#16a34a",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      ✓ Photo uploaded
                    </p>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onChassisPhotoChange?.(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </FormRow>
        </div>

        {/* SECTION: Technical Specifications */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Technical Specifications
          </h4>
          <FormRow cols={3} className="p-4 bg-gray-100 rounded-xl">
            <FormSelect
              value={vehicle.make}
              onChange={(e) => handleChange("make", e.target.value)}
              disabled={isReadOnly}
              error={errors.make}
              label="Make"
              required
            >
              <option value="">Select Make</option>
              {CAR_MAKE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              value={vehicle.model}
              onChange={(e) => handleChange("model", e.target.value)}
              disabled={isReadOnly}
              error={errors.model}
              label="Model"
              required
            >
              <option value="">Select Model</option>
              {(vehicle.make && CAR_MAKES_MODELS[vehicle.make]
                ? CAR_MAKES_MODELS[vehicle.make]
                : Object.values(CAR_MAKES_MODELS).flat()
              ).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              value={vehicle.year}
              onChange={(e) => handleChange("year", e.target.value)}
              disabled={isReadOnly}
              error={errors.year}
              label="Year"
            >
              <option value="">Select Year</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </FormSelect>

            <FormInput
              value={vehicle.engineType}
              onChange={(e) => handleChange("engineType", e.target.value)}
              placeholder="2.0L V4"
              disabled={isReadOnly}
              label="Engine Type"
            />

            <FormSelect
              value={vehicle.fuelType}
              onChange={(e) => handleChange("fuelType", e.target.value)}
              disabled={isReadOnly}
              label="Fuel Type"
            >
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              value={transmissionCategory}
              onChange={(e) => handleTransmissionCategoryChange(e.target.value)}
              disabled={isReadOnly}
              label="Transmission Type"
            >
              <option value="">Select Category</option>
              {TRANSMISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </FormSelect>

            {transmissionCategory && (
              <FormSelect
                value={vehicle.transmission}
                onChange={(e) => handleChange("transmission", e.target.value)}
                disabled={isReadOnly}
                label={`${transmissionCategory} Subtype`}
              >
                <option value="">Select Subtype</option>
                {TRANSMISSION_OPTIONS[transmissionCategory].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </FormSelect>
            )}
          </FormRow>
        </div>

        {/* SECTION: Maintenance Status */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Maintenance Status
          </h4>
          <FormRow cols={4} className="bg-gray-100 rounded-xl p-4">
            <FormInput
              value={vehicle.currentMileage}
              onChange={(e) => handleChange("currentMileage", e.target.value)}
              placeholder="45000"
              disabled={isReadOnly}
              label="Current KM"
            />
            <FormSelect
              value={vehicle.status}
              onChange={(e) => handleChange("status", e.target.value)}
              disabled={isReadOnly}
              label="Garage Status"
            >
              {VEHICLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FormSelect>
          </FormRow>
        </div>

        {showRemove && !isReadOnly && (
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onRemove}
              className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
            >
              Remove Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isInvalid && !isReadOnly
                ? "bg-red-500 animate-pulse"
                : "bg-emerald-500"
            }`}
          />
          <span
            className={`text-xs sm:text-sm font-medium ${
              isInvalid && !isReadOnly ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {isReadOnly
              ? "View Only Mode"
              : isInvalid
                ? "Please fill all required fields correctly"
                : "All systems go! Ready to save"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && handleSubmit && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isInvalid}
              className={`px-5 py-2 text-sm font-medium rounded-lg text-white transition ${
                isInvalid
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-black"
              }`}
            >
              {isEditing ? "Save changes" : "Register profile"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
