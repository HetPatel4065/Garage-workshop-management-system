import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/UI/SearchBar";
import { useToast } from "../context/ToastContext";
import InvoicePreview from "../components/Billing/InvoicePreview";
import UnbilledServiceCard from "../components/Services/UnbilledServiceCard";
import EmptyState from "../components/UI/EmptyState";
import { ClipboardClock, FileText, ReceiptIndianRupee } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ExportButton from "../components/common/ExportButton";

const LoadingIndicator = () => (
  <div className="flex flex-col items-center justify-center py-20 text-blue-600/50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
    <p className="font-black uppercase text-xs tracking-widest">
      Refreshing Ledger...
    </p>
  </div>
);

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [unbilledServices, setUnbilledServices] = useState([]);
  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get("q") || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Remove the sync effect that forces the URL query into the input state
  // This allows the search bar to stay empty after a successful search action.
  const [activeTab, setActiveTab] = useState("current"); // 'current', 'unbilled', or 'history'
  const [sortOrder, setSortOrder] = useState("recent"); // 'recent' or 'oldest'
  const [loading, setLoading] = useState(false);
  const [garageSettings, setGarageSettings] = useState(null);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const { token } = useAuth();

  // 📋 Fetch all existing invoices
  const fetchInvoices = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const response = await fetch("/api/billing", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch invoices");
        const data = await response.json();
        setInvoices(data);
      } catch (err) {
        addToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [token, addToast],
  );

  // 🔧 Fetch services that haven't been billed
  const fetchUnbilledServices = useCallback(async () => {
    try {
      const response = await fetch("/api/services?billingStatus=Unbilled", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch pending services");
      const data = await response.json();
      // Filter for In Progress, Ready for Pickup or Completed
      const filtered = data.filter((s) =>
        ["In Progress", "Completed"].includes(s.status),
      );
      setUnbilledServices(filtered);
    } catch (err) {
      addToast(err.message, "error");
    }
  }, [token, addToast]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setGarageSettings(result);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoices();
    fetchUnbilledServices();
    fetchSettings();
  }, [fetchInvoices, fetchUnbilledServices, fetchSettings]);

  // 💸 Handle generating a new invoice
  const handleGenerateInvoice = async (serviceId) => {
    try {
      const response = await fetch("/api/billing/generate-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ serviceId }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg =
          data.message || data.error || "Failed to generate invoice";
        throw new Error(errorMsg);
      }

      addToast("Invoice draft generated", "success");

      // Refresh both lists
      fetchInvoices();
      fetchUnbilledServices();
      setActiveTab("current"); // Switch to current invoices tab
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // 🔄 Handle status updates (Pay / Finalize)
  const handleUpdateStatus = async (id, status) => {
    try {
      const endpoint = status === "Paid" ? "payment" : "finalize";

      const response = await fetch(`/api/billing/${id}/${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Update failed");
      }

      addToast(`Invoice marked as ${status}`, "success");
      fetchInvoices();
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleDeleteInvoice = async (id) => {
    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setInvoices((prev) => prev.filter((i) => i._id !== id));
        addToast("Invoice deleted", "delete");
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🔍 Sorting Logic
  const sortData = useCallback(
    (data) => {
      return [...data].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
      });
    },
    [sortOrder],
  );

  const filterInvoices = useCallback(
    (list) =>
      list.filter((i) => {
        const query = (
          isTyping ? searchQuery : searchQuery || queryParam
        ).toLowerCase();
        const customerName = (i.customerId?.name || "").toLowerCase();
        const status = (i.status || "").toLowerCase();
        const invoiceNumber = (i.invoiceNumber || "").toLowerCase();
        const dateStr = i.createdAt
          ? new Date(i.createdAt).toLocaleDateString().toLowerCase()
          : "";
        const vehiclePlate = (
          i.serviceId?.vehicle?.licensePlate || ""
        ).toLowerCase();
        const amount = (i.total || "").toString().toLowerCase();

        return (
          customerName.includes(query) ||
          status.includes(query) ||
          invoiceNumber.includes(query) ||
          dateStr.includes(query) ||
          vehiclePlate.includes(query) ||
          amount.includes(query)
        );
      }),
    [searchQuery],
  );

  const currentInvoices = useMemo(
    () => invoices.filter((i) => i.status !== "Paid"),
    [invoices],
  );
  const historyInvoices = useMemo(
    () => invoices.filter((i) => i.status === "Paid"),
    [invoices],
  );

  const filteredCurrent = useMemo(() => {
    return sortData(filterInvoices(currentInvoices));
  }, [currentInvoices, filterInvoices, sortData]);

  const filteredHistory = useMemo(() => {
    return sortData(filterInvoices(historyInvoices));
  }, [historyInvoices, filterInvoices, sortData]);

  const filteredUnbilled = useMemo(() => {
    return unbilledServices.filter((s) => {
      const query = (
        isTyping ? searchQuery : searchQuery || queryParam
      ).toLowerCase();
      const customerName =
        (typeof s.customerId === "object" ? s.customerId?.name : "Unknown") ||
        "";
      const vehiclePlate = (s.vehicle?.licensePlate || "").toLowerCase();

      return (
        customerName.toLowerCase().includes(query) ||
        vehiclePlate.includes(query)
      );
    });
  }, [unbilledServices, searchQuery]);

  const totalReceivables = filteredUnbilled.reduce((acc, curr) => {
    const labor = Number(curr?.labourCost || curr?.labourAtTime || 0);
    const parts = Number(curr?.partsTotal || 0);
    const catalog = Number(curr?.catalogTotal || 0);
    return acc + labor + parts + catalog;
  }, 0);

  const handleSendWhatsApp = async (invoice) => {
    try {
      addToast("Generating Invoice Link...", "info");

      // 1. Call backend to generate PDF and get public URL
      const response = await fetch(`/api/billing/${invoice._id}/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate PDF link");
      }

      const pdfUrl = data.pdfUrl;
      const invNum =
        invoice.invoiceNumber || invoice._id?.slice(-6).toUpperCase();
      const customerName = invoice.customerId?.name || "Customer";

      // 2. Format phone number for WhatsApp
      const phone = invoice.customerId?.phone || "";
      const cleanPhone = phone.replace(/\D/g, "");
      const finalPhone =
        cleanPhone.length >= 10
          ? cleanPhone.startsWith("91")
            ? cleanPhone
            : `91${cleanPhone.slice(-10)}`
          : cleanPhone;

      if (!finalPhone) {
        addToast("Customer phone number is missing or invalid", "error");
        return;
      }

      // 3. Construct WhatsApp Message
      const message = `Hello ${customerName}, your invoice #${invNum} is ready! You can view and download it here: ${pdfUrl}`;
      const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

      // 4. Open WhatsApp
      window.open(waUrl, "_blank");
      addToast("Opened WhatsApp", "success");
    } catch (err) {
      console.error("WhatsApp Share Error:", err);
      addToast(err.message || "Failed to share invoice via WhatsApp", "error");
    }
  };

  const exportColumns =
    activeTab === "unbilled"
      ? [
          {
            header: "Job Card",
            accessor: (row) => row.jobId?.jobCardId || "N/A",
          },
          { header: "Service", accessor: "serviceName" },
          {
            header: "Customer",
            accessor: (row) => row.customerId?.name || "N/A",
          },
          {
            header: "Vehicle",
            accessor: (row) => row.vehicle?.licensePlate || "N/A",
          },
          {
            header: "Cost",
            accessor: (row) =>
              Number(row.labourCost || row.labourAtTime || 0) +
              Number(row.partsTotal || 0) +
              Number(row.catalogTotal || 0),
          },
        ]
      : [
          { header: "Invoice Number", accessor: "invoiceNumber" },
          {
            header: "Date",
            accessor: (row) =>
              row.createdAt
                ? new Date(row.createdAt).toLocaleDateString()
                : "N/A",
          },
          {
            header: "Customer",
            accessor: (row) => row.customerId?.name || "N/A",
          },
          {
            header: "Vehicle",
            accessor: (row) => row.serviceId?.vehicle?.licensePlate || "N/A",
          },
          { header: "Total", accessor: "total" },
          { header: "Status", accessor: "status" },
        ];

  const exportData =
    activeTab === "unbilled"
      ? filteredUnbilled
      : activeTab === "current"
        ? filteredCurrent
        : filteredHistory;

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      {/* 🚀 Header */}
      <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.22em] mb-2">
              Accounts & Ledger
            </p>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Balance & Invoicing
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-3">
              <p className="text-sm font-medium text-slate-500">
                Earnings & Billing Management
              </p>

              {activeTab === "unbilled" && totalReceivables > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full w-fit shadow-sm">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.18em]">
                    Receivables
                  </span>

                  <span className="text-sm font-black text-amber-600">
                    ₹{totalReceivables.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ExportButton
              title={`Billing ${activeTab}`}
              columns={exportColumns}
              data={exportData}
              filenamePrefix={`billing_${activeTab}`}
            />
          </div>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsTyping(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const term = searchQuery.trim();
                setIsTyping(false);
                setSearchQuery("");
                if (term) {
                  navigate(`/billing?q=${encodeURIComponent(term)}`);
                } else {
                  navigate("/billing");
                }
              }
            }}
            placeholder="Search invoices by number, customer, status or vehicle..."
            className="w-full"
          />
        </div>
        <div className="w-full lg:w-64">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          >
            <option value="recent">Recently Added</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* 📑 Tab Switcher */}
      <div className="flex gap-6 mb-8 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {[
          {
            id: "unbilled",
            label: "Unbilled",
            count: unbilledServices.length,
            color: "amber",
          },
          {
            id: "current",
            label: "Current Invoices",
            count: currentInvoices.length,
            color: "blue",
          },
          {
            id: "history",
            label: "History",
            count: historyInvoices.length,
            color: "emerald",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-bold transition-all relative group
              ${
                activeTab === tab.id
                  ? tab.id === "unbilled"
                    ? "text-amber-500"
                    : tab.id === "current"
                      ? "text-blue-500"
                      : "text-emerald-500"
                  : "text-gray-400 hover:text-gray-900"
              }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px]
                ${
                  activeTab === tab.id
                    ? tab.id === "unbilled"
                      ? "bg-amber-100"
                      : tab.id === "current"
                        ? "bg-blue-100"
                        : "bg-emerald-100"
                    : "bg-gray-100"
                }`}
              >
                {tab.count}
              </span>
            </span>
            {activeTab === tab.id && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 rounded-full
                ${tab.id === "unbilled" ? "bg-amber-600" : tab.id === "current" ? "bg-blue-600" : "bg-emerald-600"}`}
              />
            )}
          </button>
        ))}
      </div>

      {/* 📦 Content Area */}
      <div className="p-4">
        {activeTab === "unbilled" ? (
          <div className="space-y-6">
            {filteredUnbilled.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredUnbilled.map((service) => (
                  <UnbilledServiceCard
                    key={service._id}
                    service={service}
                    onGenerate={() => handleGenerateInvoice(service._id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ReceiptIndianRupee className="h-10 w-10" />}
                title="Everything Is Billed Up!"
                description="All active services have been converted into invoices."
              />
            )}
          </div>
        ) : activeTab === "current" ? (
          <div className="space-y-6">
            {loading && invoices.length === 0 ? (
              <LoadingIndicator />
            ) : filteredCurrent.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredCurrent.map((invoice) => (
                  <InvoicePreview
                    key={invoice._id}
                    invoice={invoice}
                    garageSettings={garageSettings}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDeleteInvoice}
                    onSendWhatsApp={() => handleSendWhatsApp(invoice)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText className="h-10 w-10" />}
                title="No current invoices"
                description="There are no unpaid invoices at the moment."
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {loading && invoices.length === 0 ? (
              <LoadingIndicator />
            ) : filteredHistory.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredHistory.map((invoice) => (
                  <InvoicePreview
                    key={invoice._id}
                    invoice={invoice}
                    garageSettings={garageSettings}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDeleteInvoice}
                    onSendWhatsApp={() => handleSendWhatsApp(invoice)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ClipboardClock className="h-10 w-10" />}
                title="No payment history"
                description="Paid invoices will appear here."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
