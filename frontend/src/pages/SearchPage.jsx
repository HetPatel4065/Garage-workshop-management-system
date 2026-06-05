import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/UI/EmptyState";
import { Search } from "lucide-react";

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const query = new URLSearchParams(location.search).get("q") || "";
  const currentYear = new Date().getFullYear();
  const [results, setResults] = useState({
    customers: [],
    vehicles: [],
    services: [],
    inventory: [],
    staff: [],
    jobCards: [],
    invoices: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) return;

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("garage_token") || "";
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // Fetch all data in parallel
        const [custRes, servRes, invRes, staffRes, vehRes, jcRes, billRes] =
          await Promise.all([
            fetch("/api/customers", { headers })
              .then((r) => r.json())
              .catch(() => []),
            fetch("/api/services", { headers })
              .then((r) => r.json())
              .catch(() => []),
            fetch("/api/inventory", { headers })
              .then((r) => r.json())
              .catch(() => []),
            fetch("/api/auth/staff", { headers })
              .then((r) => r.json())
              .catch(() => []),
            fetch("/api/vehicles", { headers })
              .then((r) => r.json())
              .catch(() => []),
            fetch("/api/job-cards", { headers })
              .then((r) => r.json())
              .catch(() => []),
            fetch("/api/billing", { headers })
              .then((r) => r.json())
              .catch(() => []),
          ]);

        const keywords = query
          .toLowerCase()
          .split(/\s+/)
          .filter((k) => k.length > 0);

        const matches = (obj, fields) => {
          return keywords.every((kw) =>
            fields.some((field) => {
              const val = field.split(".").reduce((o, i) => o?.[i], obj);
              return String(val || "")
                .toLowerCase()
                .includes(kw);
            }),
          );
        };

        // 1. Filter Customers
        const filteredCustomers = (Array.isArray(custRes) ? custRes : [])
          .filter((c) =>
            matches(c, [
              "name",
              "phone",
              "email",
              "address.street",
              "address.city",
              "address.zip",
            ]),
          )
          .slice(0, 10);

        // 2. Filter Vehicles
        const filteredVehicles = (Array.isArray(vehRes) ? vehRes : [])
          .filter((v) =>
            matches(v, [
              "model",
              "licensePlate",
              "make",
              "year",
              "customerName",
            ]),
          )
          .slice(0, 10);

        // 3. Filter Services
        const filteredServices = (Array.isArray(servRes) ? servRes : [])
          .filter((s) =>
            matches(s, [
              "serviceName",
              "description",
              "status",
              "_id",
              "vehicle.licensePlate",
              "customerId.name",
            ]),
          )
          .slice(0, 10);

        // 4. Filter Inventory
        const filteredInventory = (Array.isArray(invRes) ? invRes : [])
          .filter((i) =>
            matches(i, [
              "name",
              "sku",
              "carModel",
              "category",
              "supplier.name",
            ]),
          )
          .slice(0, 10);

        // 5. Filter Staff
        const staffList = Array.isArray(staffRes) ? [...staffRes] : [];

        if (
          user &&
          !staffList.some((s) => s._id === user._id || s.id === user.id)
        ) {
          staffList.push({ ...user, type: user.role || "owner" });
        }

        const ROLE_ORDER = {
          owner: 1,
          admin: 2,
          advisor: 3,
          mechanic: 4,
          user: 5,
        };

        const filteredStaff = staffList
          .filter((s) => matches(s, ["name", "email", "role", "type"]))
          .sort(
            (a, b) =>
              (ROLE_ORDER[a.role || a.type] || 99) -
              (ROLE_ORDER[b.role || b.type] || 99),
          )
          .slice(0, 10);

        // 6. Filter Job Cards
        const filteredJobCards = (Array.isArray(jcRes) ? jcRes : [])
          .filter((jc) =>
            matches(jc, [
              "jobCardId",
              "serviceInstructions",
              "status",
              "licensePlate",
              "customerName",
            ]),
          )
          .slice(0, 10);

        // 7. Filter Invoices
        const filteredInvoices = (Array.isArray(billRes) ? billRes : [])
          .filter((i) =>
            matches(i, ["invoiceNumber", "status", "customerId.name"]),
          )
          .slice(0, 10);

        setResults({
          customers: filteredCustomers,
          vehicles: filteredVehicles,
          services: filteredServices,
          inventory: filteredInventory,
          staff: filteredStaff,
          jobCards: filteredJobCards,
          invoices: filteredInvoices,
        });
      } catch (err) {
        console.error("Search error:", err);
        setError(
          "Failed to fetch search results. Ensure the server is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [query]);

  if (!query) {
    return (
      <div className="p-6 text-slate-900 dark:text-slate-100">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <p className="text-gray-500 dark:text-zinc-400">
          Please enter a search query in the top navigation bar.
        </p>
      </div>
    );
  }

  const hasResults = Object.values(results).some((arr) => arr.length > 0);

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-100 dark:bg-zinc-900 rounded-xl transition-colors duration-200">
      {/* Header Container */}
      <div className="mb-8 pb-5 border-b-3  border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
            Global Search
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none">
            Search Results
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
              Showing results for:{" "}
              <span className="font-bold text-gray-900 dark:text-zinc-100 underline underline-offset-4 decoration-blue-500/30">
                "{query}"
              </span>
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg uppercase tracking-wider transition-colors"
            >
              Reset Global Search
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-4 rounded-md border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      ) : !hasResults ? (
        <EmptyState
          icon={Search}
          title="No item or person found"
          description={`We couldn't find any customers, vehicles, services, or inventory matching "${query}". Try adjusting your search.`}
          className="px-4 py-12"
        />
      ) : (
        <div className="space-y-8">
          {/* Customers Section */}
          {results.customers.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2 flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span>Customers</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                  {results.customers.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.customers.map((customer) => (
                  <div
                    key={customer._id}
                    onClick={() =>
                      navigate(
                        `/customers?q=${encodeURIComponent(customer.name)}`,
                      )
                    }
                    className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700/60 hover:shadow-md dark:hover:border-zinc-600 transition-all cursor-auto group"
                  >
                    <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400 group-hover:underline">
                      {customer.name}
                    </h3>
                    {customer.phone && (
                      <p className="text-gray-600 dark:text-zinc-300 text-sm mt-1">
                        📞 {customer.phone}
                      </p>
                    )}
                    {customer.email && (
                      <p className="text-gray-600 dark:text-zinc-300 text-sm">
                        ✉️ {customer.email}
                      </p>
                    )}
                    <p className="text-gray-400 dark:text-zinc-500 text-[10px] mt-2 font-medium uppercase tracking-wider">
                      Added On:{" "}
                      {customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString(
                            "en-GB",
                          )
                        : new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Vehicles Section */}
          {results.vehicles.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2 flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span>Vehicles</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                  {results.vehicles.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.vehicles.map((vehicle) => (
                  <div
                    key={vehicle._id}
                    onClick={() =>
                      navigate(
                        `/vehicles?q=${encodeURIComponent(vehicle.licensePlate)}`,
                      )
                    }
                    className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700/60 hover:shadow-md dark:hover:border-zinc-600 transition-all cursor-auto group"
                  >
                    <h3 className="font-bold text-lg capitalize text-blue-600 dark:text-blue-400 group-hover:underline">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-300 text-sm mt-1">
                      Plate:{" "}
                      <span className="font-mono bg-gray-100 dark:bg-zinc-900 px-1 rounded text-slate-800 dark:text-zinc-200">
                        {vehicle.licensePlate}
                      </span>
                    </p>
                    {vehicle.year && (
                      <p className="text-gray-600 dark:text-zinc-300 text-sm">
                        Year: {vehicle.year}
                      </p>
                    )}
                    {vehicle.customerName && (
                      <p className="text-gray-600 dark:text-zinc-300 text-sm">
                        Owner: {vehicle.customerName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Services Section */}
          {results.services.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2 flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span>Services</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                  {results.services.length}
                </span>
              </h2>
              <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-wrap gap-3">
                  {results.services.flatMap((service) => {
                    const separatedServices = service.serviceName
                      .split(/(?=\d+\.)|(?<=[a-z])(?=[A-Z])|\n/)
                      .map((s) => s.replace(/^\d+\.\s*/, "").trim())
                      .filter((s) => s.length > 0);

                    return separatedServices.map((name, index) => (
                      <div
                        key={`${service._id}-${index}`}
                        onClick={() =>
                          navigate(`/services?q=${encodeURIComponent(name)}`)
                        }
                        className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-900 transition-all cursor-auto group"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold text-slate-700 dark:text-zinc-300 capitalize">
                          {name}
                        </span>
                      </div>
                    ));
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Staff Section */}
          {results.staff && results.staff.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2 flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span>Staff Members</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                  {results.staff.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.staff.map((member) => (
                  <div
                    key={member._id || member.id}
                    onClick={() =>
                      navigate(
                        `/staff-members?q=${encodeURIComponent(member.name)}`,
                      )
                    }
                    className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700/60 hover:shadow-md dark:hover:border-zinc-600 transition-all cursor-auto group"
                  >
                    <h3 className="font-bold capitalize text-lg text-blue-600 dark:text-blue-400 group-hover:underline">
                      {member.name}
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-300 text-sm mt-1 capitalize">
                      Role: {member.type || member.role}
                    </p>
                    {member.email && (
                      <p className="text-gray-600 dark:text-zinc-300 text-sm">
                        ✉️ {member.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Inventory Section */}
          {results.inventory.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2 flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span>Inventory</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                  {results.inventory.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.inventory.map((item) => (
                  <div
                    key={item._id}
                    onClick={() =>
                      navigate(`/inventory?q=${encodeURIComponent(item.name)}`)
                    }
                    className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700/60 hover:shadow-md dark:hover:border-zinc-600 transition-all cursor-auto group"
                  >
                    <h3 className="font-bold capitalize text-lg text-blue-600 dark:text-blue-400 group-hover:underline">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-300 text-sm mt-1">
                      SKU:{" "}
                      <span className="font-mono bg-gray-100 dark:bg-zinc-900 px-1 rounded text-slate-800 dark:text-zinc-200">
                        {item.sku}
                      </span>
                    </p>
                    {item.carModel && (
                      <p className="text-gray-600 dark:text-zinc-300 text-sm mt-1">
                        Car Model: {item.carModel}
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-zinc-300 text-sm mt-1">
                      Stock:{" "}
                      <span
                        className={
                          (item.stock ?? item.quantity) > 5
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400 font-medium"
                        }
                      >
                        {item.stock ?? item.quantity}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Job Cards Section */}
          {results.jobCards.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2 flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span>Job Cards</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                  {results.jobCards.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.jobCards.map((jc) => (
                  <div
                    key={jc._id}
                    onClick={() =>
                      navigate(
                        `/job-cards?q=${encodeURIComponent(jc.jobCardId || jc._id)}`,
                      )
                    }
                    className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-gray-200 dark:border-zinc-700/60 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all cursor-auto group"
                  >
                    <h3 className="font-bold text-base text-blue-600 dark:text-blue-400 group-hover:underline">
                      {jc.jobCardId || "Job Card"}
                    </h3>
                    <p className="text-gray-700 dark:text-zinc-300 text-sm mt-1 line-clamp-1">
                      {jc.vehicleId?.make || "—"} {jc.vehicleId?.model || ""}
                    </p>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm mt-2 line-clamp-2">
                      {jc.serviceInstructions || "No instructions provided"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Invoices Section */}
          {results.invoices.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2 flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span>Invoices</span>
                <span className="text-sm bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                  {results.invoices.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.invoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    onClick={() =>
                      navigate(
                        `/billing?q=${encodeURIComponent(invoice.invoiceNumber || invoice._id)}`,
                      )
                    }
                    className="bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700/60 hover:shadow-md dark:hover:border-zinc-600 transition-all cursor-auto group"
                  >
                    <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400 group-hover:underline">
                      {currentYear}-{invoice.invoiceNumber || "Invoice"}
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-300 text-sm mt-1 capitalize">
                      Status: {invoice.status}
                    </p>
                    <p className="text-gray-900 dark:text-zinc-100 font-bold mt-2">
                      ₹{invoice.total?.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
