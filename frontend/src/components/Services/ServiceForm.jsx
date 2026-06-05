import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const statusOptions = ["Pending", "In-progress", "Completed", "Cancelled"];
const priorityOptions = ["Low", "Medium", "High", "Urgent"];

const STATUS_META = {
  Pending: {
    color:
      "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-700",
    dot: "bg-amber-500",
  },
  "In-progress": {
    color:
      "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700",
    dot: "bg-blue-500",
  },
  Completed: {
    color:
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700",
    dot: "bg-emerald-500",
  },
  Cancelled: {
    color:
      "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700",
    dot: "bg-red-500",
  },
};

const PRIORITY_META = {
  Low: {
    color:
      "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600",
    dot: "bg-gray-400",
  },
  Medium: {
    color:
      "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700",
    dot: "bg-blue-400",
  },
  High: {
    color:
      "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700",
    dot: "bg-orange-500",
  },
  Urgent: {
    color:
      "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700",
    dot: "bg-red-500",
  },
};

const cleanServiceItem = (str) => {
  if (!str) return "";
  return str.replace(/^[\s\d\.\-\)\*]+/, "").trim();
};

const parseServiceDate = (dateStr) => {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-");
    const date = new Date(`${year}-${month}-${day}`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calculateNextServiceDate = (serviceDateStr) => {
  if (!serviceDateStr) return "";
  const date = new Date(serviceDateStr);
  if (isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().split("T")[0];
};

/* ─── Shared primitives ───────────────────────────────────── */
const Label = ({ children, required, hint, error }) => (
  <label
    className={`flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest mb-1.5 ${error ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
  >
    {children}
    {required && <span className="text-red-500 font-black ml-0.5">*</span>}
    {hint && (
      <span className="normal-case font-normal text-gray-500 dark:text-gray-400 text-[11px] ml-1">
        ({hint})
      </span>
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
  className = "",
  min,
  max,
  error,
}) => (
  <div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      min={min}
      max={max}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm transition placeholder:text-gray-400 dark:placeholder:text-gray-600
        focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-900 dark:disabled:bg-gray-800 dark:disabled:text-gray-300
        ${error ? "border-red-500 bg-red-100 focus:ring-red-100 dark:border-red-500 dark:bg-red-900/20 dark:focus:ring-red-900/30" : "border-gray-200 bg-white text-gray-900 focus:ring-gray-900 focus:border-transparent dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-400"} 
        ${className}`}
    />
    {error && (
      <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 font-bold italic uppercase tracking-tighter">
        {error}
      </p>
    )}
  </div>
);

const StyledSelect = ({ value, onChange, children, disabled, error }) => (
  <div>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full capitalize border rounded-lg px-3 py-2.5 text-sm transition
        focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-900 dark:disabled:bg-gray-800 dark:disabled:text-gray-300
        ${error ? "border-red-500 bg-red-100 focus:ring-red-100 dark:border-red-500 dark:bg-red-900/20 dark:focus:ring-red-900/30" : "border-gray-200 bg-white text-gray-900 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-400"}`}
    >
      {children}
    </select>
    {error && (
      <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 font-bold italic uppercase tracking-tighter">
        {error}
      </p>
    )}
  </div>
);

const Section = ({ title, subtitle, action, children }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-gray-800">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
    {children}
  </div>
);

/*MAIN COMPONENT*/

export default function ServiceForm({
  serviceData,
  onSubmit,
  onClose,
  customerData,
  isMechanic,
  readOnly,
}) {
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [garageSettings, setGarageSettings] = useState({
    gstRate: 18,
  });
  const { addToast } = useToast();
  const { user, token } = useAuth();

  const isOwner = ["owner", "admin", "advisor", "mechanic"].includes(
    user?.role,
  );
  const isEditing = !!serviceData;
  const showConfig = !isEditing || isOwner;

  /* ── Form state ── */
  const canEditEverything = true;
  const [serviceName, setServiceName] = useState("");
  const [status, setStatus] = useState("Pending");
  const [priority, setPriority] = useState("Medium");
  const [notes, setNotes] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [requestedServices, setRequestedServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [partsUsed, setPartsUsed] = useState([]);
  const [labourCharges, setLabourCharges] = useState([]);
  const [errors, setErrors] = useState({});
  const [mechanicId, setMechanicId] = useState("");
  const [advisorId, setAdvisorId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [jobId, setJobId] = useState("");
  const [availableMechanics, setAvailableMechanics] = useState([]);
  const [availableAdvisors, setAvailableAdvisors] = useState([]);
  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    licensePlate: "",
    chassisnumber: "",
    mileage: "",
    year: "",
    fuelType: "",
  });

  useEffect(() => {
    if (!serviceDate) return;
    const calculatedNext = calculateNextServiceDate(serviceDate);
    if (calculatedNext) {
      setNextServiceDate(calculatedNext);
    }
  }, [serviceDate]);

  /* ── Active tab ── */
  const [activeTab, setActiveTab] = useState("info");
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  /* ── Fetch data ── */
  const [allVehicles, setAllVehicles] = useState([]);
  const [allJobCards, setAllJobCards] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token) {
          addToast(
            "Authentication token missing. Please log in again.",
            "error",
          );
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const ts = Date.now();

        const [
          custRes,
          invRes,
          catalogRes,
          settingsRes,
          vehRes,
          jcRes,
          mechRes,
          advRes,
        ] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/customers?t=${ts}`, {
            headers,
          }),
          fetch(`${import.meta.env.VITE_API_URL}/inventory?t=${ts}`, {
            headers,
          }),
          fetch(`${import.meta.env.VITE_API_URL}/service-catalog?t=${ts}`, {
            headers,
          }),
          fetch(`${import.meta.env.VITE_API_URL}/v1/settings?t=${ts}`, {
            headers,
          }),
          fetch(`${import.meta.env.VITE_API_URL}/vehicles?t=${ts}`, {
            headers,
          }),
          fetch(`${import.meta.env.VITE_API_URL}/job-cards?t=${ts}`, {
            headers,
          }),
          fetch(
            `${import.meta.env.VITE_API_URL}/auth/staff?role=mechanic&t=${ts}`,
            { headers },
          ),
          fetch(
            `${import.meta.env.VITE_API_URL}/auth/staff?role=advisor&t=${ts}`,
            { headers },
          ),
        ]);

        const responses = [
          custRes,
          invRes,
          catalogRes,
          settingsRes,
          vehRes,
          jcRes,
          mechRes,
          advRes,
        ];
        const checkUnauthorized = responses.some((res) => res.status === 401);

        if (checkUnauthorized) {
          addToast(
            "Session expired or unauthorized access. Please re-login.",
            "error",
          );
          return;
        }

        if (custRes.ok) setCustomers(await custRes.json());
        if (invRes.ok) setInventory(await invRes.json());
        if (catalogRes.ok) setServiceCatalog(await catalogRes.json());
        if (settingsRes.ok) setGarageSettings(await settingsRes.json());
        if (vehRes.ok) setAllVehicles(await vehRes.json());
        if (jcRes.ok) setAllJobCards(await jcRes.json());

        if (mechRes.ok) {
          const mJson = await mechRes.json();
          setAvailableMechanics(mJson.staff || mJson);
        }
        if (advRes.ok) {
          const aJson = await advRes.json();
          setAvailableAdvisors(aJson.staff || aJson);
        }
      } catch (err) {
        console.error("Fetch dependencies root error:", err);
        addToast("Failed to fetch dependencies", "error");
      }
    };

    fetchData();
  }, [user?.role, user?._id, token]);

  /* ── Role-based data filtering ── */
  const filteredCustomers = useMemo(() => {
    if (user?.role !== "mechanic" && user?.role !== "advisor") return customers;

    const roleKey = user?.role === "mechanic" ? "mechanicId" : "advisorId";

    const myCustomerIds = new Set(
      allJobCards
        .filter((jc) => {
          const mId = jc[roleKey]?._id || jc[roleKey];
          return mId === user?._id;
        })
        .map((jc) => jc.customerId?._id || jc.customerId)
        .filter(Boolean)
        .map((id) => String(id)),
    );

    return customers.filter((c) => myCustomerIds.has(String(c._id)));
  }, [customers, allJobCards, user]);

  const filteredAllVehicles = useMemo(() => {
    if (user?.role !== "mechanic" && user?.role !== "advisor")
      return allVehicles;

    const roleKey = user?.role === "mechanic" ? "mechanicId" : "advisorId";

    const myVehicleIds = new Set(
      allJobCards
        .filter((jc) => {
          const mId = jc[roleKey]?._id || jc[roleKey];
          return mId === user?._id;
        })
        .map((jc) => jc.vehicleId?._id || jc.vehicleId)
        .filter(Boolean)
        .map((id) => String(id)),
    );

    return allVehicles.filter((v) => myVehicleIds.has(String(v._id)));
  }, [allVehicles, allJobCards, user]);

  /* ── Auto-prepopulate for single assignment (Mechanics) ── */
  useEffect(() => {
    const myAssignments = allJobCards.filter(
      (jc) =>
        jc.mechanicId === user?._id ||
        jc.mechanicId?._id === user?._id ||
        jc.advisorId === user?._id ||
        jc.advisorId?._id === user?._id,
    );

    if (
      !isEditing &&
      user?.role === "mechanic" &&
      myAssignments.length === 1 &&
      !customerId &&
      !vehicle.licensePlate
    ) {
      const jc = myAssignments[0];
      const cId = jc.customerId?._id || jc.customerId;
      const vId = jc.vehicleId?._id || jc.vehicleId;

      if (cId && vId) {
        const v = filteredAllVehicles.find(
          (x) => x._id === vId || x.id === vId,
        );
        if (v) {
          setCustomerId(cId);
          setAvailableVehicles([v]);
          setVehicle({
            _id: v._id || v.id,
            make: v.make || "",
            model: v.model || "",
            licensePlate: v.licensePlate || "",
            chassisnumber: String(v.chassisnumber || ""),
            mileage: String(v.currentMileage || v.mileage || ""),
            year: String(v.year || ""),
            fuelType: String(v.fuelType || ""),
          });

          if (jc.serviceInstructions) {
            const raw = jc.serviceInstructions
              .split("\n")
              .filter(Boolean)
              .map(cleanServiceItem);
            setRequestedServices(
              raw.map((d) => ({
                description: d,
                status: "Pending",
                notes: "",
              })),
            );
          }

          setJobId(jc._id);
          if (jc.mechanicId)
            setMechanicId(
              typeof jc.mechanicId === "object"
                ? jc.mechanicId._id
                : jc.mechanicId,
            );
          if (jc.advisorId)
            setAdvisorId(
              typeof jc.advisorId === "object"
                ? jc.advisorId._id
                : jc.advisorId,
            );
        }
      }
    }
  }, [isEditing, user?.role, allJobCards, customerId, allVehicles]);

  /* ── Populate for edit ── */
  useEffect(() => {
    if (
      !serviceData ||
      !filteredCustomers.length ||
      !filteredAllVehicles.length
    )
      return;
    const selId =
      typeof serviceData.customerId === "object"
        ? serviceData.customerId._id
        : serviceData.customerId;

    const cVehicles = filteredAllVehicles.filter(
      (v) => v.customerId === selId || v.customerId?._id === selId,
    );
    setAvailableVehicles(cVehicles);
    setCustomerId(
      serviceData.customerId && typeof serviceData.customerId === "object"
        ? serviceData.customerId._id
        : serviceData.customerId || "",
    );
    setMechanicId(
      (serviceData.mechanicId && typeof serviceData.mechanicId === "object"
        ? serviceData.mechanicId._id
        : serviceData.mechanicId) ||
        (serviceData.jobId &&
          allJobCards.find((jc) => jc._id === serviceData.jobId)?.mechanicId
            ?._id) ||
        (serviceData.jobId &&
          allJobCards.find((jc) => jc._id === serviceData.jobId)?.mechanicId) ||
        "",
    );
    setAdvisorId(
      (serviceData.advisorId && typeof serviceData.advisorId === "object"
        ? serviceData.advisorId._id
        : serviceData.advisorId) ||
        (serviceData.jobId &&
          allJobCards.find((jc) => jc._id === serviceData.jobId)?.advisorId
            ?._id) ||
        (serviceData.jobId &&
          allJobCards.find((jc) => jc._id === serviceData.jobId)?.advisorId) ||
        "",
    );
    setJobId(serviceData.jobId || "");
    setStatus(serviceData.status || "Pending");
    setPriority(serviceData.priority || "Medium");
    if (serviceData.labourCharges && serviceData.labourCharges.length > 0) {
      setLabourCharges(serviceData.labourCharges);
    } else if (serviceData.labourCost || serviceData.labourAtTime) {
      setLabourCharges([
        {
          laborType: serviceData.laborType || "",
          labourCost: serviceData.labourCost ?? serviceData.labourAtTime ?? 0,
        },
      ]);
    } else {
      setLabourCharges([]);
    }
    setNotes(serviceData.notes || "");
    setRequestedServices(serviceData.requestedServices || []);
    setSelectedServices(serviceData.selectedServices || []);
    setVehicle({
      make: serviceData.vehicle?.make || serviceData.vehicleId?.make || "",
      model: serviceData.vehicle?.model || serviceData.vehicleId?.model || "",
      licensePlate:
        serviceData.vehicle?.licensePlate ||
        serviceData.vehicleId?.licensePlate ||
        "",
      chassisnumber: String(
        serviceData.vehicle?.chassisnumber ||
          serviceData.vehicleId?.chassisnumber ||
          "",
      ),
      mileage: String(
        serviceData.vehicle?.mileage ||
          serviceData.vehicleId?.currentMileage ||
          "",
      ),
      year: String(
        serviceData.vehicle?.year || serviceData.vehicleId?.year || "",
      ),
      fuelType:
        serviceData.vehicle?.fuelType || serviceData.vehicleId?.fuelType || "",
    });

    setServiceDate(
      serviceData.serviceDate
        ? new Date(serviceData.serviceDate).toISOString().split("T")[0]
        : serviceData.vehicleId?.serviceDate
          ? new Date(serviceData.vehicleId.serviceDate)
              .toISOString()
              .split("T")[0]
          : "",
    );
    setNextServiceDate(
      serviceData.nextServiceDate
        ? new Date(serviceData.nextServiceDate).toISOString().split("T")[0]
        : serviceData.vehicleId?.nextServiceDate
          ? new Date(serviceData.vehicleId.nextServiceDate)
              .toISOString()
              .split("T")[0]
          : "",
    );

    if (inventory.length) {
      setPartsUsed(
        (serviceData.partsUsed || []).map((item) => {
          const rawId = item.partId?._id || item.partId;
          const partId = rawId ? String(rawId) : "manual_entry";
          const inv = inventory.find((p) => String(p._id) === partId);
          return {
            partId,
            name: item.name || inv?.name || "",
            quantity: item.quantity,
            priceAtTime:
              item.priceAtTime ||
              item.priceAtTimeOfService ||
              inv?.price ||
              inv?.retailPrice ||
              0,
          };
        }),
      );
    }
    if (serviceCatalog.length) {
      setSelectedServices(
        (serviceData.selectedServices || []).map((item) => {
          const rawId = item.serviceCatalogId?._id || item.serviceCatalogId;
          const serviceCatalogId = rawId ? String(rawId) : "manual_entry";
          const catalog = serviceCatalog.find(
            (s) => String(s._id) === serviceCatalogId,
          );
          return {
            serviceCatalogId,
            name: item.name || catalog?.name || "Service",
            priceAtTimeOfService:
              item.priceAtTime ||
              item.priceAtTimeOfService ||
              catalog?.defaultPrice ||
              0,
          };
        }),
      );
    }
  }, [serviceData, customers, inventory, serviceCatalog]);

  /* ── Populate from customerData prop ── */
  useEffect(() => {
    if (
      !customerData ||
      isEditing ||
      !filteredAllVehicles.length ||
      !allJobCards.length
    )
      return;
    setCustomerId(customerData._id);

    const cVehicles = filteredAllVehicles.filter(
      (v) =>
        v.customerId === customerData._id ||
        v.customerId?._id === customerData._id,
    );

    if (cVehicles.length > 0) {
      setAvailableVehicles(cVehicles);
      const v = cVehicles[0];
      setVehicle({
        make: v.make || "",
        model: v.model || "",
        licensePlate: v.licensePlate || "",
        chassisnumber: String(v.chassisnumber || ""),
        mileage: String(v.currentMileage || v.mileage || ""),
        year: String(v.year || ""),
        fuelType: String(v.fuelType || ""),
      });

      const matchingJc = allJobCards.find(
        (jc) => jc.vehicleId?._id === v._id || jc.vehicleId === v._id,
      );
      if (matchingJc?.serviceInstructions) {
        const vTasks = matchingJc.serviceInstructions
          .split("\n")
          .filter(Boolean)
          .map(cleanServiceItem);
        setRequestedServices(
          vTasks.map((d) => ({ description: d, status: "Pending", notes: "" })),
        );
        setServiceName(vTasks.join("\n"));
      }
    }
  }, [customerData, isEditing, allVehicles, allJobCards]);

  /* ── Handlers ── */
  const handleCustomerChange = (e) => {
    const id = e.target.value;
    setCustomerId(id);
    const c = filteredCustomers.find((x) => x._id === id);
    if (!c) {
      setRequestedServices([]);
      setAvailableVehicles([]);
      setLabourCharges([]);
      setPartsUsed([]);
      if (!isEditing) setServiceName("");
      return;
    }

    const cVehicles = filteredAllVehicles.filter(
      (v) => v.customerId === id || v.customerId?._id === id,
    );

    if (cVehicles.length > 0) {
      setAvailableVehicles(cVehicles);
      const v = cVehicles[0];
      setVehicle({
        _id: v._id || v.id,
        make: v.make || "",
        model: v.model || "",
        licensePlate: v.licensePlate || "",
        chassisnumber: String(v.chassisnumber || ""),
        mileage: String(v.currentMileage || v.mileage || ""),
        year: String(v.year || ""),
        fuelType: String(v.fuelType || ""),
      });

      setServiceDate(
        v.serviceDate
          ? new Date(v.serviceDate).toISOString().split("T")[0]
          : "",
      );
      setNextServiceDate(
        v.nextServiceDate
          ? new Date(v.nextServiceDate).toISOString().split("T")[0]
          : "",
      );

      const matchingJc = allJobCards.find(
        (jc) => jc.vehicleId?._id === v._id || jc.vehicleId === v._id,
      );

      if (matchingJc) {
        if (matchingJc.serviceInstructions) {
          const raw = matchingJc.serviceInstructions
            .split("\n")
            .filter(Boolean)
            .map(cleanServiceItem);
          if (!isEditing) {
            setRequestedServices(
              raw.map((d) => ({
                description: d,
                status: "Pending",
                notes: "",
              })),
            );
          }
        }

        if (!isEditing) {
          setJobId(matchingJc._id);
          if (matchingJc.mechanicId) {
            setMechanicId(
              typeof matchingJc.mechanicId === "object"
                ? matchingJc.mechanicId._id
                : matchingJc.mechanicId,
            );
          }
          if (matchingJc.advisorId) {
            setAdvisorId(
              typeof matchingJc.advisorId === "object"
                ? matchingJc.advisorId._id
                : matchingJc.advisorId,
            );
          }
        }
      } else {
        if (!isEditing) {
          setRequestedServices([]);
          setServiceName("");
          setMechanicId("");
          setAdvisorId("");
          setJobId("");
        }
      }
    } else {
      setAvailableVehicles([]);
      setLabourCharges([]);
      setPartsUsed([]);
      setVehicle({
        make: "",
        model: "",
        licensePlate: "",
        chassisnumber: "",
        mileage: "",
        year: "",
        fuelType: "",
      });
      if (!isEditing) {
        setRequestedServices([]);
        setServiceName("");
      }
    }
  };

  const handleVehicleSelectChange = (e) => {
    const v = availableVehicles.find((x) => x.licensePlate === e.target.value);
    if (v) {
      setVehicle({
        _id: v._id || v.id,
        make: v.make || "",
        model: v.model || "",
        licensePlate: v.licensePlate || "",
        chassisnumber: v.chassisnumber || "",
        mileage: v.currentMileage || v.mileage || "",
        year: v.year || "",
        fuelType: v.fuelType || "",
      });

      setServiceDate(
        v.serviceDate
          ? new Date(v.serviceDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      );
      setNextServiceDate(
        v.nextServiceDate
          ? new Date(v.nextServiceDate).toISOString().split("T")[0]
          : "",
      );

      const matchingJc = allJobCards.find(
        (jc) => jc.vehicleId?._id === v._id || jc.vehicleId === v._id,
      );
      if (matchingJc) {
        if (matchingJc.serviceInstructions) {
          const raw = matchingJc.serviceInstructions
            .split("\n")
            .filter(Boolean)
            .map(cleanServiceItem);
          setRequestedServices(
            raw.map((d) => ({ description: d, status: "Pending", notes: "" })),
          );
        }

        if (!isEditing) {
          setJobId(matchingJc._id);
          if (matchingJc.mechanicId) {
            setMechanicId(
              typeof matchingJc.mechanicId === "object"
                ? matchingJc.mechanicId._id
                : matchingJc.mechanicId,
            );
          }
          if (matchingJc.advisorId) {
            setAdvisorId(
              typeof matchingJc.advisorId === "object"
                ? matchingJc.advisorId._id
                : matchingJc.advisorId,
            );
          }
        }
      } else {
        setRequestedServices([]);
        if (!isEditing) {
          setServiceName("");
          setMechanicId("");
          setAdvisorId("");
          setJobId("");
        }
      }
    } else {
      setVehicle({
        make: "",
        model: "",
        licensePlate: "",
        chassisnumber: "",
        mileage: "",
        year: "",
        fuelType: "",
      });
    }
  };

  const handleVehicleField = (f, val) =>
    setVehicle((p) => ({ ...p, [f]: val }));
  const toggleTaskStatus = (i) => {
    const u = [...requestedServices];
    u[i].status = u[i].status === "Done" ? "Pending" : "Done";
    setRequestedServices(u);
  };

  const handlePartSelection = (i, partId) => {
    const u = [...partsUsed];
    if (partId === "manual_entry") {
      u[i] = {
        partId: "manual_entry",
        name: "",
        quantity: 1,
        priceAtTime: 0,
      };
    } else {
      const p = inventory.find((x) => x._id === partId);
      u[i] = p
        ? {
            partId: p._id,
            name: p.name,
            quantity: 1,
            priceAtTime: p.retailPrice,
          }
        : { partId: "", name: "", quantity: 1, priceAtTime: 0 };
    }
    setPartsUsed(u);
  };

  const handleCatalogSelection = (i, catalogId) => {
    const u = [...selectedServices];

    if (catalogId === "manual_entry") {
      u[i] = {
        serviceCatalogId: "manual_entry",
        name: "",
        priceAtTimeOfService: 0,
      };
    } else {
      const item = serviceCatalog.find((x) => x._id === catalogId);
      u[i] = item
        ? {
            serviceCatalogId: item._id,
            name: item.name,
            priceAtTimeOfService: item.defaultPrice,
          }
        : { serviceCatalogId: "", name: "", priceAtTimeOfService: 0 };
    }

    setSelectedServices(u);
  };

  /* ── Totals ── */
  const partsTotal = partsUsed.reduce(
    (s, p) => s + Math.floor(Number(p.quantity) * Number(p.priceAtTime || 0)),
    0,
  );
  const catalogServicesTotal = selectedServices.reduce(
    (s, item) =>
      s +
      Math.floor(Number(item.priceAtTime || item.priceAtTimeOfService || 0)),
    0,
  );
  const laborTotal = labourCharges.reduce(
    (s, l) => s + (l.labourCost !== "" ? Math.floor(Number(l.labourCost)) : 0),
    0,
  );

  const validateAll = () => {
    const errs = {};
    if (!customerId) errs.customerId = "Customer is required";

    const plate = (vehicle.licensePlate || "").trim().toUpperCase();
    if (!plate) {
      errs.licensePlate = "Vehicle registration is required";
    } else {
      const plateRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
      if (!plateRegex.test(plate)) {
        errs.licensePlate = "Invalid Format (ex: GJ01AB1234)";
      }
    }

    if (!serviceName) errs.serviceName = "Service title is required";

    if (vehicle.chassisnumber && vehicle.chassisnumber.length !== 17) {
      errs.chassisnumber = "VIN must be 17 characters";
    }

    selectedServices.forEach((s, i) => {
      if (s.serviceCatalogId === "manual_entry" && !s.name?.trim()) {
        errs[`service_${i}`] = "Service name required";
      }
    });

    partsUsed.forEach((p, i) => {
      if (p.partId === "manual_entry" && !p.name?.trim()) {
        errs[`part_${i}`] = "Part name required";
      }
    });

    if (selectedServices.length === 0 && requestedServices.length === 0) {
      errs.serviceName = "At least one service or task is required";
      addToast(
        "Please select at least one service to create a record",
        "error",
      );
    }

    setErrors(errs);
    return errs;
  };

  /* ── Submit ── */
  const handleSubmit = (e) => {
    e.preventDefault();

    const currentErrors = validateAll();
    if (Object.keys(currentErrors).length > 0) {
      addToast("Please fix the errors in the form", "error");

      const errKeys = Object.keys(currentErrors);
      if (
        errKeys.some((k) =>
          ["customerId", "licensePlate", "chassisnumber"].includes(k),
        )
      ) {
        setActiveTab("info");
      } else if (errKeys.some((k) => k.startsWith("service_"))) {
        setActiveTab("tasks");
      } else if (errKeys.some((k) => k.startsWith("part_"))) {
        setActiveTab("parts");
      }
      return;
    }

    let finalNextServiceDate = "";
    if (serviceDate) {
      finalNextServiceDate = calculateNextServiceDate(serviceDate);
      if (!finalNextServiceDate) {
        const d = new Date(serviceDate);
        d.setMonth(d.getMonth() + 6);
        finalNextServiceDate = d.toISOString().split("T")[0];
      }
    }

    const payload = {
      serviceName,
      customerId,
      status,
      priority,
      labourCharges: labourCharges.map((l) => ({
        laborType: l.laborType,
        customName: l.customName || "",
        labourCost: l.labourCost !== "" ? Number(l.labourCost) : 0,
      })),
      notes,
      requestedServices,
      selectedServices: selectedServices.map((s) => ({
        serviceCatalogId:
          s.serviceCatalogId === "manual_entry" ? null : s.serviceCatalogId,
        name: s.name,
        priceAtTime: Number(s.priceAtTime || s.priceAtTimeOfService || 0),
      })),
      vehicle: {
        ...vehicle,
        licensePlate: (vehicle.licensePlate || "").trim().toUpperCase(),
      },
      partsUsed: partsUsed
        .filter((p) => p.partId)
        .map((p) => ({
          partId: p.partId === "manual_entry" ? null : p.partId,
          name: p.name,
          quantity: Number(p.quantity),
          priceAtTime: Number(p.priceAtTime),
        })),
      mechanicId: mechanicId || null,
      advisorId: advisorId || null,
      jobId: jobId || null,
      serviceDate,
      nextServiceDate: finalNextServiceDate,
    };
    if (serviceData?._id) payload._id = serviceData._id;
    onSubmit(payload);
  };

  const selectedCustomerObj = filteredCustomers.find(
    (c) => c._id === customerId,
  );
  const isBlocked = selectedCustomerObj?.status === "Blocked";

  const isInvalidServices = selectedServices.some(
    (s) => s.serviceCatalogId === "manual_entry" && !s.name?.trim(),
  );

  const isInvalidParts = partsUsed.some(
    (p) => p.partId === "manual_entry" && !p.name?.trim(),
  );

  const hasTickedTask = requestedServices.some(
    (s) => s.description && s.status === "Done",
  );
  const hasCatalogItem = selectedServices.some(
    (s) => s.serviceCatalogId || s.name,
  );
  const hasLabourCost = labourCharges.some((l) => Number(l.labourCost) > 0);

  /* ── Sync serviceName with Ticked Tasks ── */
  useEffect(() => {
    const ticked = requestedServices
      .filter((s) => s.status === "Done" && s.description?.trim())
      .map((s) => s.description.trim());
    setServiceName(ticked.join("\n"));
  }, [requestedServices]);

  const isServiceEmpty = !hasTickedTask || !hasCatalogItem || !hasLabourCost;

  const isDisabled =
    !serviceName ||
    !customerId ||
    !vehicle.licensePlate ||
    isBlocked ||
    isInvalidServices ||
    isInvalidParts ||
    isServiceEmpty;

  /* ── Tabs ── */
  const tabs = [
    {
      id: "info",
      label: "Vehicle and Owner Info",
      hasError: !!(
        errors.customerId ||
        errors.licensePlate ||
        errors.chassisnumber
      ),
    },
    {
      id: "tasks",
      label: "Tasks & Service",
      badge: requestedServices.length + selectedServices.length || null,
      hasError: Object.keys(errors).some((k) => k.startsWith("service_")),
    },
    {
      id: "parts",
      label: "Parts",
      badge: partsUsed.filter((p) => p.partId).length || null,
      hasError: Object.keys(errors).some((k) => k.startsWith("part_")),
    },
  ];

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const services = useMemo(() => {
    return (
      Array.isArray(serviceName) ? serviceName : (serviceName || "").split("\n")
    ).filter(Boolean);
  }, [serviceName]);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/*TOP BAR*/}
      <div className="shrink-0 bg-white dark:bg-gray-950 px-3 border-b border-gray-100 dark:border-gray-800 sm:px-5">
        {/* Row 1: Title + Status/Priority Badges */}
        <div className="w-full pb-5 border-b border-gray-100/80 dark:border-gray-800/80">
          <div className="flex flex-col gap-4 justify-between items-start lg:flex-row lg:items-center">
            {/* Left Column: Title & Subtitle */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 wrap-break-words leading-tight">
                {services.length > 0 ? (
                  services.map((s, i) => (
                    <span key={i}>
                      {capitalizeWords(s.trim())}
                      {i < services.length - 1 && (
                        <span className="mx-2 font-light text-gray-300 dark:text-gray-600">
                          +
                        </span>
                      )}
                    </span>
                  ))
                ) : !readOnly ? (
                  <span className="text-base font-normal italic text-gray-400 dark:text-gray-600">
                    Unnamed Service Record
                  </span>
                ) : null}
              </h2>

              <p className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500 font-mono">
                {isEditing && serviceData._id
                  ? `ID: ${serviceData._id.slice(-8).toUpperCase()}`
                  : "Draft Record"}
              </p>
            </div>

            {/* Right Column: Clean, Interactive Popover Controls */}
            <div
              ref={dropdownRef}
              className="flex flex-wrap items-center gap-3 w-full sm:w-auto relative"
            >
              {/* Status Field Dropdown */}
              <div className="relative">
                {!readOnly ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === "status" ? null : "status",
                        )
                      }
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-95"
                    >
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                        Status:
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${STATUS_META[status]?.dot || "bg-gray-400"}`}
                      />
                      <span className="text-gray-900 dark:text-gray-100">
                        {status}
                      </span>
                      <svg
                        className={`w-3 h-3 text-gray-400 dark:text-gray-500 transition-transform ${activeDropdown === "status" ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {activeDropdown === "status" && (
                      <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl dark:shadow-black/40 z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {statusOptions
                          .filter(
                            (o) =>
                              canEditEverything ||
                              ["In-progress", "Completed"].includes(o),
                          )
                          .map((o) => (
                            <button
                              key={o}
                              type="button"
                              onClick={() => {
                                setStatus(o);
                                setActiveDropdown(null);
                              }}
                              className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                                status === o
                                  ? "bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-gray-100 font-semibold"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${STATUS_META[o]?.dot || "bg-gray-400"}`}
                                />
                                {o}
                              </div>
                              {status === o && (
                                <svg
                                  className="w-3.5 h-3.5 text-slate-900 dark:text-gray-100"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 ${STATUS_META[status]?.color || "border-gray-200 dark:border-gray-700"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_META[status]?.dot}`}
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {status}
                    </span>
                  </div>
                )}
              </div>

              {/* Priority Field Dropdown */}
              <div className="relative">
                {!(readOnly || !canEditEverything) ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === "priority" ? null : "priority",
                        )
                      }
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-95"
                    >
                      <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                        Priority:
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${PRIORITY_META[priority]?.dot || "bg-gray-400"}`}
                      />
                      <span className="text-gray-900 dark:text-gray-100">
                        {priority}
                      </span>
                      <svg
                        className={`w-3 h-3 text-gray-400 dark:text-gray-500 transition-transform ${activeDropdown === "priority" ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {activeDropdown === "priority" && (
                      <div className="absolute right-0 mt-1.5 w-42 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl dark:shadow-black/40 z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {priorityOptions.map((o) => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => {
                              setPriority(o);
                              setActiveDropdown(null);
                            }}
                            className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                              priority === o
                                ? "bg-amber-50/60 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 font-semibold"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[o]?.dot || "bg-gray-400"}`}
                              />
                              {o}
                            </div>
                            {priority === o && (
                              <svg
                                className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 ${PRIORITY_META[priority]?.color || "border-gray-200 dark:border-gray-700"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[priority]?.dot}`}
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {priority}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Quick-Info Chips */}
        {(vehicle.licensePlate || customerId) && (
          <div className="flex flex-wrap gap-2 items-center mb-3 mt-3">
            {vehicle.licensePlate && (
              <span className="text-sm font-mono uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-1 rounded-md">
                {vehicle.licensePlate}
              </span>
            )}
            {vehicle.make && (
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-1 rounded-md">
                {vehicle.make} {vehicle.model}
              </span>
            )}
          </div>
        )}

        {/* Row 3: Tab Navigation */}
        <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap relative sm:gap-1.5 sm:px-4 sm:py-2.5 sm:text-sm focus-visible:outline-none focus-visible:text-slate-900 dark:focus-visible:text-slate-100 ${
                  isActive
                    ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
                    : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <span>{tab.label}</span>

                {tab.hasError && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ SCROLLABLE BODY ══════════════════════════════ */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 sm:px-5 py-4 sm:py-5 space-y-5 sm:space-y-6 bg-white dark:bg-gray-950">
        {/* ═══ TAB: SERVICE INFO ═══════════════════════ */}
        {activeTab === "info" && (
          <>
            {showConfig && (
              <Section title="Customer & Vehicle">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-100 dark:bg-gray-900">
                  <div>
                    <Label required error={errors.customerId}>
                      Customer
                    </Label>
                    <StyledSelect
                      value={customerId}
                      onChange={(e) => {
                        if (!readOnly && canEditEverything)
                          handleCustomerChange(e);
                        if (errors.customerId)
                          setErrors((prev) => ({ ...prev, customerId: "" }));
                      }}
                      disabled={readOnly || !canEditEverything}
                      error={errors.customerId}
                    >
                      <option value="">Select customer…</option>
                      {filteredCustomers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}{" "}
                          {c.status === "Blocked" ? "🔴 (BLOCKED)" : ""} —{" "}
                          {c.phone}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                  <div>
                    <Label required error={errors.licensePlate}>
                      Vehicle
                    </Label>
                    <StyledSelect
                      value={vehicle.licensePlate}
                      onChange={(e) => {
                        if (!readOnly && !isMechanic)
                          handleVehicleSelectChange(e);
                        if (errors.licensePlate)
                          setErrors((prev) => ({ ...prev, licensePlate: "" }));
                      }}
                      disabled={
                        readOnly || isMechanic || !availableVehicles.length
                      }
                      error={errors.licensePlate}
                    >
                      <option value="">
                        {availableVehicles.length
                          ? "Select vehicle…"
                          : "No vehicles on file"}
                      </option>
                      {availableVehicles.map((v) => (
                        <option key={v.licensePlate} value={v.licensePlate}>
                          {v.make} {v.model} · {v.licensePlate}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                </div>

                {isBlocked && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-black text-red-900 dark:text-red-300 uppercase tracking-tight">
                        Customer Blocked
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                        This customer has been restricted. You cannot create or
                        edit services for them until they are unblocked.
                      </p>
                    </div>
                  </div>
                )}

                {vehicle.licensePlate && (
                  <div className="mt-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-3">
                      Vehicle Details
                    </p>
                    {readOnly ? (
                      /* ── READ-ONLY: Clean info panel ── */
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {[
                          { label: "Make", value: vehicle.make },
                          { label: "Model", value: vehicle.model },
                          { label: "Year", value: vehicle.year },
                          { label: "Fuel Type", value: vehicle.fuelType },
                          {
                            label: "Chassis No.",
                            value: vehicle.chassisnumber || "—",
                          },
                          {
                            label: "KMDriven",
                            value: vehicle.mileage
                              ? `${vehicle.mileage} km`
                              : "—",
                          },
                          {
                            label: "Last Service",
                            value: serviceDate
                              ? new Date(serviceDate).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—",
                          },
                          {
                            label: "Next Service",
                            value: nextServiceDate
                              ? new Date(nextServiceDate).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—",
                          },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                              {label}
                            </p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">
                              {value || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* ── EDIT MODE: Editable inputs ── */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {[
                          { label: "Make", field: "make" },
                          { label: "Model", field: "model" },
                          { label: "Year", field: "year" },
                          { label: "Fuel Type", field: "fuelType" },
                          { label: "Chassis No.", field: "chassisnumber" },
                          { label: "KMDriven", field: "mileage" },
                          {
                            label: "Service Date",
                            field: "serviceDate",
                            type: "date",
                          },
                          {
                            label: "Next Service",
                            field: "nextServiceDate",
                            type: "date",
                          },
                        ].map(({ label, field, type }) => (
                          <div key={field}>
                            <Label error={errors[field]}>{label}</Label>
                            <FieldInput
                              type={type || "text"}
                              value={
                                field === "serviceDate"
                                  ? serviceDate
                                  : field === "nextServiceDate"
                                    ? nextServiceDate
                                    : vehicle[field]
                              }
                              onChange={(e) => {
                                if (field === "serviceDate") {
                                  const newServiceDate = e.target.value;
                                  setServiceDate(newServiceDate);
                                } else if (!isMechanic) {
                                  handleVehicleField(field, e.target.value);
                                  if (errors[field])
                                    setErrors((prev) => ({
                                      ...prev,
                                      [field]: "",
                                    }));
                                }
                              }}
                              disabled={
                                field === "serviceDate"
                                  ? false
                                  : field === "nextServiceDate"
                                    ? true
                                    : isMechanic
                              }
                              error={errors[field]}
                              maxLength={
                                field === "chassisnumber" ? 17 : undefined
                              }
                              min={
                                field === "serviceDate"
                                  ? new Date().toISOString().split("T")[0]
                                  : undefined
                              }
                              max={field === "serviceDate" ? 0 : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Staff Assignment Section */}
                {(advisorId || mechanicId || !jobId) && (
                  <Section
                    title="Staff Assignment"
                    subtitle={
                      jobId
                        ? "Staff assigned from Job Card"
                        : "Assign staff members to this service"
                    }
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                      <div>
                        <Label>Assigned Advisor</Label>
                        {jobId ? (
                          <div className="px-4 py-2.5 bg-white dark:bg-gray-800 capitalize border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {availableAdvisors.find((a) => a._id === advisorId)
                              ?.name || "Not Assigned"}
                          </div>
                        ) : (
                          <StyledSelect
                            value={advisorId}
                            onChange={(e) => setAdvisorId(e.target.value)}
                            disabled={
                              readOnly ||
                              !["owner", "admin", "advisor"].includes(
                                user?.role,
                              )
                            }
                          >
                            <option value="">-- No Advisor --</option>
                            {availableAdvisors.map((a) => (
                              <option key={a._id} value={a._id}>
                                {a.name || a.email}
                              </option>
                            ))}
                          </StyledSelect>
                        )}
                      </div>
                      <div>
                        <Label>Assigned Mechanic</Label>
                        {jobId ? (
                          <div className="px-4 py-2.5 bg-white dark:bg-gray-800 border capitalize border-gray-100 dark:border-gray-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            {availableMechanics.find(
                              (m) => m._id === mechanicId,
                            )?.name || "Not Assigned"}
                          </div>
                        ) : (
                          <StyledSelect
                            value={mechanicId}
                            onChange={(e) => setMechanicId(e.target.value)}
                            disabled={
                              readOnly ||
                              !["owner", "admin", "advisor"].includes(
                                user?.role,
                              )
                            }
                          >
                            <option value="">-- No Mechanic --</option>
                            {availableMechanics.map((m) => (
                              <option key={m._id} value={m._id}>
                                {m.name || m.email}
                              </option>
                            ))}
                          </StyledSelect>
                        )}
                      </div>
                    </div>
                  </Section>
                )}
              </Section>
            )}
          </>
        )}

        {/* ═══ TAB: TASKS & CATALOG ════════════════════ */}
        {activeTab === "tasks" && (
          <>
            <Section
              title="Service Tasks"
              subtitle={`${requestedServices.filter((t) => t.status === "Done").length} / ${requestedServices.length} completed`}
              action={
                !readOnly &&
                canEditEverything && (
                  <button
                    type="button"
                    onClick={() =>
                      setRequestedServices([
                        { description: "", status: "Pending", notes: "" },
                        ...requestedServices,
                      ])
                    }
                    /* Updated className to perfectly match your catalog service button styling */
                    className="text-[12px] font-bold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 hover:shadow-lg transition-all flex items-center gap-1.5 rounded-lg px-3 py-2 active:scale-95 duration-200"
                  >
                    <svg
                      /* Added text-zinc-100 class directly to the SVG */
                      className="w-3.5 h-3.5 text-zinc-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Add task</span>
                  </button>
                )
              }
            >
              <div className="space-y-2">
                {!requestedServices.length && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      No tasks added yet
                    </p>
                    <p className="text-[11px] text-gray-300 dark:text-gray-600">
                      Click "Add task" above to get started
                    </p>
                  </div>
                )}
                {requestedServices.map((task, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      task.status === "Done"
                        ? "bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                        : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={
                        !readOnly ? () => toggleTaskStatus(idx) : undefined
                      }
                      disabled={readOnly}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        task.status === "Done"
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400"
                      } ${readOnly ? "cursor-default" : ""}`}
                    >
                      {task.status === "Done" && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      value={task.description}
                      onChange={(e) => {
                        if (!readOnly && canEditEverything) {
                          const u = [...requestedServices];
                          u[idx].description = e.target.value;
                          setRequestedServices(u);
                        }
                      }}
                      placeholder="Describe task…"
                      disabled={readOnly || !canEditEverything}
                      className={`flex-1 bg-transparent border-none outline-none text-sm capitalize font-medium placeholder:text-gray-300 dark:placeholder:text-gray-600 ${
                        task.status === "Done"
                          ? "line-through text-gray-400 dark:text-gray-500"
                          : "text-gray-800 dark:text-gray-200"
                      } ${readOnly || !canEditEverything ? "cursor-not-allowed" : ""}`}
                    />
                    {!readOnly && canEditEverything && (
                      <button
                        type="button"
                        onClick={() =>
                          setRequestedServices(
                            requestedServices.filter((_, i) => i !== idx),
                          )
                        }
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 transition-all duration-150 shrink-0"
                        title="Remove task"
                      >
                        <svg
                          className="w-3.5 h-3.5"
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
                    )}
                  </div>
                ))}
              </div>
            </Section>
            <hr className="border-gray-100 dark:border-gray-800" />
            {/* Catalog services */}
            <Section
              title="Service Catalog Items"
              subtitle="Fixed price items from your garage settings"
              action={
                !readOnly &&
                canEditEverything && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedServices([
                        ...selectedServices,
                        {
                          serviceCatalogId: "",
                          name: "",
                          priceAtTimeOfService: 0,
                        },
                      ])
                    }
                    /* Removed dark: text overrides to ensure it's always high contrast */
                    className="text-[12px] font-bold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 hover:shadow-lg transition-all flex items-center gap-1.5 rounded-lg px-3 py-2 active:scale-95 duration-200"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-zinc-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Add catalog service</span>
                  </button>
                )
              }
            >
              <div className="space-y-3">
                {!selectedServices.length && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      No catalog services selected
                    </p>
                  </div>
                )}

                {selectedServices.map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 bg-gray-100 dark:bg-gray-900 rounded-xl relative p-4"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        {readOnly ? (
                          <div className="w-full bg-gray-50 dark:bg-gray-800 capitalize border border-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-gray-800 dark:text-gray-200">
                            {item.name || "Service"}
                          </div>
                        ) : (
                          <StyledSelect
                            value={item.serviceCatalogId}
                            onChange={(e) => {
                              if (!readOnly && canEditEverything)
                                handleCatalogSelection(idx, e.target.value);
                              if (errors[`service_${idx}`])
                                setErrors((prev) => ({
                                  ...prev,
                                  [`service_${idx}`]: "",
                                }));
                            }}
                            disabled={readOnly || !canEditEverything}
                            error={errors[`service_${idx}`]}
                          >
                            <option value="">Select from catalog…</option>
                            {serviceCatalog.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name} (₹{s.defaultPrice})
                              </option>
                            ))}
                            <option
                              value="manual_entry"
                              className="text-blue-600 dark:text-blue-400 font-bold"
                            >
                              + Custom / Other Service
                            </option>
                          </StyledSelect>
                        )}
                      </div>

                      {!readOnly && canEditEverything && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedServices(
                              selectedServices.filter((_, i) => i !== idx),
                            )
                          }
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 active:scale-90 transition-all duration-200"
                          title="Remove service"
                        >
                          <svg
                            className="w-4 h-4"
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
                      )}
                    </div>
                    {item.serviceCatalogId === "manual_entry" && (
                      <div className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-stone-300" />
                        <input
                          type="text"
                          placeholder="Enter custom service name..."
                          value={item.name}
                          onChange={(e) => {
                            if (!readOnly && canEditEverything) {
                              const u = [...selectedServices];
                              u[idx].name = e.target.value;
                              setSelectedServices(u);
                            }
                          }}
                          disabled={readOnly || !canEditEverything}
                          className={`w-full text-sm py-1 outline-none bg-transparent capitalize text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 ${
                            readOnly || !canEditEverything
                              ? "border-b border-transparent text-gray-700 dark:text-gray-300 font-semibold cursor-default"
                              : "border-b border-dashed border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500"
                          }`}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2 sm:gap-3 items-start sm:items-center">
                      <div className="hidden sm:block" />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={item.priceAtTimeOfService || 0}
                          onChange={(e) => {
                            if (!readOnly && canEditEverything) {
                              const u = [...selectedServices];
                              u[idx].priceAtTimeOfService = Number(
                                e.target.value,
                              );
                              setSelectedServices(u);
                            }
                          }}
                          disabled={readOnly || !canEditEverything}
                          className="border border-gray-100 dark:border-gray-700 rounded-lg pl-7 pr-3 py-2 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 transition disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <hr className="border-gray-100 dark:border-gray-800" />
            {/*Labour charge */}
            <Section
              title="Labour & Notes"
              subtitle="Add labour price of your garage"
              action={
                !readOnly &&
                canEditEverything && (
                  <button
                    type="button"
                    onClick={() =>
                      setLabourCharges([
                        ...labourCharges,
                        { laborType: "", labourCost: 0 },
                      ])
                    }
                    /* Applied the reliable high-contrast dark style */
                    className="text-[12px] font-bold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 hover:shadow-lg transition-all flex items-center gap-1.5 rounded-lg px-3 py-2 active:scale-95 duration-200"
                  >
                    <svg
                      /* Set icon text color to match */
                      className="w-3.5 h-3.5 text-zinc-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Add labour charge</span>
                  </button>
                )
              }
            >
              <div className="space-y-3">
                {!labourCharges.length && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 bg-gray-100 dark:bg-gray-900 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      No labour charges added
                    </p>
                  </div>
                )}

                {labourCharges.map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 bg-gray-100 dark:bg-gray-900 rounded-xl relative p-4 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g. Clutch Repair/Wheel Alignment/Oil Change etc."
                            value={item.laborType}
                            onChange={(e) => {
                              if (!readOnly && canEditEverything) {
                                const u = [...labourCharges];
                                u[idx].laborType = e.target.value;
                                setLabourCharges(u);
                              }
                            }}
                            disabled={readOnly || !canEditEverything}
                            className="border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 transition capitalize font-bold disabled:opacity-60"
                          />
                        </div>
                      </div>

                      {!readOnly && canEditEverything && (
                        <button
                          type="button"
                          onClick={() =>
                            setLabourCharges(
                              labourCharges.filter((_, i) => i !== idx),
                            )
                          }
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 active:scale-90 transition-all duration-200"
                          title="Remove labour"
                        >
                          <svg
                            className="w-4 h-4"
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
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2 sm:gap-3 items-start sm:items-center">
                      <div className="hidden sm:block" />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={item.labourCost || 0}
                          onChange={(e) => {
                            if (!readOnly && canEditEverything) {
                              const u = [...labourCharges];
                              u[idx].labourCost = Number(e.target.value);
                              setLabourCharges(u);
                            }
                          }}
                          disabled={readOnly || !canEditEverything}
                          className="border border-gray-100 dark:border-gray-700 rounded-lg pl-7 pr-3 py-2 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 transition disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Footer: Total & Notes */}
                <div className="mt-4 space-y-4">
                  {labourCharges.length > 0 && (
                    <div className="flex justify-between items-center bg-zinc-800 text-zinc-100 p-4 rounded-xl shadow-lg">
                      {" "}
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                          Total Labour
                        </span>
                      </div>
                      <span className="text-xl font-black">
                        ₹
                        {labourCharges.reduce(
                          (sum, l) => sum + Number(l.labourCost || 0),
                          0,
                        )}
                      </span>
                    </div>
                  )}

                  <hr className="border-gray-100 dark:border-gray-800" />

                  <Section
                    title="Mechanic Notes"
                    subtitle="Internal observations and recommendations"
                    action={
                      !readOnly &&
                      notes && (
                        <button
                          type="button"
                          onClick={() => setNotes("")}
                          className="text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          Clear Notes
                        </button>
                      )
                    }
                  >
                    <div className="space-y-3">
                      <div className="space-y-2 bg-gray-100 dark:bg-gray-900 rounded-xl relative p-4">
                        <div className="flex flex-col gap-2">
                          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                            Internal Comments
                          </label>

                          <div className="relative group">
                            <textarea
                              value={notes}
                              onChange={(e) =>
                                !readOnly && setNotes(e.target.value)
                              }
                              disabled={readOnly}
                              placeholder="Describe any additional work done or parts that may need replacement soon..."
                              rows={4}
                              className={`w-full border rounded-lg px-4 py-3 text-sm font-medium 
                              outline-none transition-all resize-none leading-relaxed
                              placeholder:text-gray-400 dark:placeholder:text-gray-600
                              ${
                                readOnly
                                  ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-default border-transparent shadow-none"
                                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-100 dark:border-gray-700 shadow-sm focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent"
                              }`}
                            />

                            {!readOnly && (
                              <div className="absolute right-3 bottom-3 opacity-20 pointer-events-none">
                                <svg
                                  className="w-4 h-4 text-gray-900 dark:text-gray-100"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M21.707 13.293l-5-5a.999.999 0 00-1.414 0l-11 11A1 1 0 004 20v3a1 1 0 001 1h3a1 1 0 00.707-.293l11-11a.999.999 0 000-1.414zM7.586 22H6v-1.586l10-10L17.586 12l-10 10z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {readOnly && !notes && (
                        <div className="py-4 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            No notes recorded for this service.
                          </p>
                        </div>
                      )}
                    </div>
                  </Section>
                </div>
              </div>
            </Section>
          </>
        )}

        {/* ═══ TAB: PARTS ══════════════════════════════ */}
        {activeTab === "parts" && (
          <Section
            title="Parts & Materials"
            subtitle={`${partsUsed.filter((p) => p.partId).length} part(s) selected`}
            action={
              !readOnly && (
                <button
                  type="button"
                  onClick={() =>
                    setPartsUsed([
                      ...partsUsed,
                      { partId: "", name: "", quantity: 1, priceAtTime: 0 },
                    ])
                  }
                  className="text-[12px] font-bold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 hover:shadow-lg transition-all flex items-center gap-1.5 rounded-lg px-3 py-2 active:scale-95 duration-200"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add part
                </button>
              )
            }
          >
            <div className="space-y-2 bg-gray-100 dark:bg-gray-900 rounded-xl p-4">
              {!partsUsed.length && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-gray-300 dark:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    No parts added yet
                  </p>
                  <p className="text-[11px] text-gray-300 dark:text-gray-600">
                    Add parts from your inventory
                  </p>
                </div>
              )}
              {partsUsed.map((item, idx) => {
                const selPart = inventory.find((p) => p._id === item.partId);
                return (
                  <>
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <StyledSelect
                            value={item.partId}
                            onChange={(e) => {
                              if (!readOnly)
                                handlePartSelection(idx, e.target.value);
                              if (errors[`part_${idx}`])
                                setErrors((prev) => ({
                                  ...prev,
                                  [`part_${idx}`]: "",
                                }));
                            }}
                            disabled={readOnly}
                            error={errors[`part_${idx}`]}
                          >
                            <option value="">Select part…</option>
                            {inventory.map((p) => (
                              <option
                                key={p._id}
                                value={p._id}
                                className="capitalize"
                              >
                                {p.name} (Stock: {p.stock}) (Car:{" "}
                                {p.carModel || "Universal"})
                              </option>
                            ))}
                            <option
                              value="manual_entry"
                              className="text-blue-600 dark:text-blue-400 font-bold"
                            >
                              + Custom / Other Part
                            </option>
                          </StyledSelect>
                        </div>

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              setPartsUsed(
                                partsUsed.filter((_, i) => i !== idx),
                              )
                            }
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 active:scale-90 transition-all duration-200"
                            title="Remove part"
                          >
                            <svg
                              className="w-4 h-4"
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
                        )}
                      </div>
                      {item.partId === "manual_entry" && (
                        <div className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md mb-2 p-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                          <input
                            type="text"
                            placeholder="Enter custom part name..."
                            value={item.name}
                            onChange={(e) => {
                              if (!readOnly) {
                                const u = [...partsUsed];
                                u[idx].name = e.target.value;
                                setPartsUsed(u);
                              }
                            }}
                            disabled={readOnly}
                            className="w-full text-sm py-1 outline-none bg-transparent capitalize text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 border-b border-dashed border-gray-200 dark:border-gray-500 focus:border-blue-400 dark:focus:border-blue-400"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-[100px_1fr] gap-3 items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase sm:hidden">
                            Qty:
                          </span>
                          <FieldInput
                            type="number"
                            min="1"
                            max={
                              item.partId === "manual_entry"
                                ? undefined
                                : selPart?.stock || 1
                            }
                            value={item.quantity}
                            onChange={(e) => {
                              if (!readOnly) {
                                const u = [...partsUsed];
                                u[idx].quantity = Number(e.target.value);
                                setPartsUsed(u);
                              }
                            }}
                            disabled={readOnly}
                            className="text-center"
                          />
                        </div>

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-200 dark:text-gray-600 text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={Math.round(
                              (item.priceAtTime || 0) * (item.quantity || 1),
                            )}
                            onChange={(e) => {
                              if (!readOnly && item.quantity > 0) {
                                const u = [...partsUsed];
                                u[idx].priceAtTime =
                                  Number(e.target.value) / item.quantity;
                                setPartsUsed(u);
                              }
                            }}
                            disabled={readOnly}
                            className={`border border-gray-200 dark:border-gray-600 rounded-lg pl-6 pr-3 py-2.5 text-sm w-full bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold outline-none transition disabled:opacity-60 ${
                              item.partId === "manual_entry"
                                ? "ring-1 ring-blue-100 dark:ring-blue-900"
                                : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                );
              })}
            </div>
          </Section>
        )}

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              !isDisabled && !readOnly
                ? "bg-emerald-500 animate-pulse"
                : "hidden"
            }`}
          />
          <p
            className={`text-sm font-medium transition-colors duration-200 ${
              isBlocked
                ? "text-red-600 dark:text-red-400 font-bold"
                : isDisabled && !readOnly
                  ? "text-red-500 dark:text-red-400"
                  : !isDisabled && !readOnly
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {readOnly
              ? "Read-only view"
              : isBlocked
                ? "Cannot save: Customer is BLOCKED"
                : isDisabled
                  ? isInvalidParts
                    ? "Custom part name is required"
                    : isInvalidServices
                      ? "Custom service name is required"
                      : !hasTickedTask
                        ? "Tick at least one task"
                        : "Please complete required fields"
                  : "All systems go! Ready to save"}
          </p>
        </div>
      </div>

      {/* ══ FIXED FOOTER ═════════════════════════════════ */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            {readOnly ? "Close" : "Discard"}
          </button>

          {!readOnly && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isDisabled}
              className={`group relative flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border select-none transition-all duration-200 shadow-sm h-10 min-w-35 ${
                isDisabled
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200/60 dark:border-slate-700/60 cursor-not-allowed"
                  : "bg-slate-800 text-slate-100 border-transparent hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
              }`}
            >
              <div
                className={`flex items-center justify-center transition-all duration-200 ${
                  isDisabled
                    ? "w-0 opacity-0 scale-75 overflow-hidden"
                    : "w-4 h-4 opacity-100 scale-100"
                }`}
              >
                <svg
                  className="w-4 h-4 shrink-0 stroke-current group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <span className="whitespace-nowrap font-medium tracking-wide">
                {isEditing ? "Save changes" : "Save Service Records"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
