export const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
export const TRANSMISSION_TYPES = ["Automatic", "Manual"];
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
    transmission: "Automatic",
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
    // Standard Indian Vehicle Plate Regex (e.g., GJ01AB1234)
    const plateRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
    if (!plateRegex.test(plate)) {
      errors.licensePlate = "Format error (ex: GJ01AB1234)";
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

// Helper to format date strings specifically for HTML date inputs (YYYY-MM-DD)
const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};

/* ─── Shared primitives ─────────────── */
const Label = ({ children, hint, required, error }) => (
  <label
    className={`block text-sm font-medium mb-1.5 ${error ? "text-red-600" : "text-gray-700"}`}
  >
    {children}
    {required && <span className="text-red-500 text-xs ml-1">*</span>}
    {hint && (
      <span className="text-gray-400 text-xs ml-1 font-normal">({hint})</span>
    )}
  </label>
);

const FieldInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  required,
  name,
  className = "",
  maxLength,
  error,
  min,
}) => (
  <div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      name={name}
      required={required}
      maxLength={maxLength}
      min={min}
      className={`w-full bg-white border ${error ? "border-red-500 bg-red-100 focus:ring-red-200" : "border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500"} rounded-md px-3 py-2 text-sm text-gray-900 
        focus:outline-none focus:ring-1 
        disabled:bg-gray-100 disabled:text-gray-900 placeholder:text-gray-400 transition-all ${className}`}
    />
    {error && (
      <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
    )}
  </div>
);

const StyledSelect = ({ value, onChange, children, disabled, error }) => (
  <div>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full bg-white border ${error ? "border-red-500 bg-red-50" : "border-gray-300"} rounded-md px-3 py-2 text-sm text-gray-900 
        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-100 disabled:text-gray-900 transition-all`}
    >
      {children}
    </select>
    {error && (
      <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>
    )}
  </div>
);

export default function VehicleForm({
  vehicle,
  onChange,
  isReadOnly,
  onRemove,
  showRemove,
  errors = {},
  onClose,
  handleSubmit,
  isEditing = false,
}) {
  const handleChange = (field, value) => {
    let processedValue = value;

    if (field === "licensePlate") {
      const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

      processedValue = cleaned.substring(0, 10);
    }

    // ... rest of your logic
    onChange({ ...vehicle, [field]: processedValue });
  };

  const capitalizeWords = (value) => {
    if (!value) return "";
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (
    (vehicle?.licensePlate?.length ?? 0) > 0 &&
    (vehicle?.licensePlate?.length ?? 0) < 9
  ) {
    errors.licensePlate =
      "Plate must be at least 10 characters (e.g., GJ01AB123)";
  }

  const isInvalid = Object.keys(errors).length > 0;

  return (
    <>
      {/* Scrollable form content */}
      <div className="space-y-6">
        {/* SECTION: Linked Customer Info (Visible in View Mode) */}
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

        {/* SECTION: Identity */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Registration Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-100 rounded-xl p-4">
            <div>
              <Label required error={errors.licensePlate}>
                Licence Plate
              </Label>
              <FieldInput
                value={vehicle.licensePlate}
                onChange={(e) => handleChange("licensePlate", e.target.value)}
                placeholder="GJ01AB1234"
                className="uppercase"
                disabled={isReadOnly}
                required
                error={errors.licensePlate}
              />
            </div>
            <div>
              <Label required error={errors.chassisnumber}>
                Chassis No. (VIN)
              </Label>
              <FieldInput
                value={vehicle.chassisnumber}
                onChange={(e) => handleChange("chassisnumber", e.target.value)}
                placeholder="17 Digit Number"
                className="uppercase"
                disabled={isReadOnly}
                maxLength={17}
                error={errors.chassisnumber}
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION: Specifications */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Technical Specifications
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-100 rounded-xl">
            <div>
              <Label required error={errors.make}>
                Make
              </Label>
              <FieldInput
                value={vehicle.make}
                onChange={(e) =>
                  handleChange("make", capitalizeWords(e.target.value))
                }
                placeholder="Toyota"
                disabled={isReadOnly}
                error={errors.make}
              />
            </div>
            <div>
              <Label required error={errors.model}>
                Model
              </Label>
              <FieldInput
                value={vehicle.model}
                onChange={(e) =>
                  handleChange("model", capitalizeWords(e.target.value))
                }
                placeholder="Camry"
                disabled={isReadOnly}
                error={errors.model}
              />
            </div>
            <div>
              <Label error={errors.year}>Year</Label>
              <FieldInput
                value={vehicle.year}
                onChange={(e) => handleChange("year", e.target.value)}
                placeholder="2022"
                disabled={isReadOnly}
                error={errors.year}
              />
            </div>
            <div>
              <Label>Engine Type</Label>
              <FieldInput
                value={vehicle.engineType}
                onChange={(e) => handleChange("engineType", e.target.value)}
                placeholder="2.0L V4"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <Label>Fuel Type</Label>
              <StyledSelect
                value={vehicle.fuelType}
                onChange={(e) => handleChange("fuelType", e.target.value)}
                disabled={isReadOnly}
              >
                {FUEL_TYPES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </StyledSelect>
            </div>
            <div>
              <Label>Transmission</Label>
              <StyledSelect
                value={vehicle.transmission}
                onChange={(e) => handleChange("transmission", e.target.value)}
                disabled={isReadOnly}
              >
                {TRANSMISSION_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </StyledSelect>
            </div>
          </div>
        </div>

        {/* SECTION: Status */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Maintenance Status
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-100 rounded-xl p-4">
            <div>
              <Label>Current KM</Label>
              <FieldInput
                value={vehicle.currentMileage}
                onChange={(e) => handleChange("currentMileage", e.target.value)}
                placeholder="45000"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <Label>Garage Status</Label>
              <StyledSelect
                value={vehicle.status}
                onChange={(e) => handleChange("status", e.target.value)}
                disabled={isReadOnly}
              >
                {VEHICLE_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </StyledSelect>
            </div>
          </div>
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

      {/* Footer — outside scrollable area, stays fixed at bottom */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
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

        <div className="flex items-center gap-2">
          {!isReadOnly && handleSubmit && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isInvalid}
              className={`px-5 py-2 text-sm font-medium rounded-lg text-white transition
                ${isInvalid ? "bg-gray-200 cursor-not-allowed" : "bg-gray-900 hover:bg-black "}`}
            >
              {isEditing ? "Save changes" : "Register profile"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
