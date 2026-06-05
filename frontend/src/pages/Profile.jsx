import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Upload,
  X,
  Save,
  Percent,
  Tag,
  Image as ImageIcon,
  CreditCard,
  MessageSquare,
  Hash,
  Copy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  icon,
  placeholder = "",
  disabled = false,
  required = false,
}) {
  return (
    <div className="space-y-2 p-3">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 font-black">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
            {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all ${icon ? "pl-14" : "px-6"} ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : "hover:border-slate-300 bg-white"}`}
        />
      </div>
    </div>
  );
}
export default function Profile({ isAdvisor }) {
  const { user, refreshUser, token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Access Control: Only owners can access profile
  useEffect(() => {
    if (user && user.role !== "owner") {
      navigate("/dashboard");
    }
  }, [user]);

  // States
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [garageId, setGarageId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    garageName: "",
    address: "",
    note: "",
    gstNumber: "",
    upiId: "",
    whatsappNumber: "",
    logo: "",
    invoiceLogo: "",
    defaultDiscountPercent: 0,
    gstRate: 18,
  });

  const [logoFile, setLogoFile] = useState(null);
  const [invoiceLogoFile, setInvoiceLogoFile] = useState(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const logoInputRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setCanEdit(data.canEdit ?? true);
        setGarageId(data.garageId || "");
        setFormData({
          name: data.name || "",
          email: data.email || "",
          mobileNumber: data.mobileNumber || "",
          garageName: data.garageName || "",
          address: data.address || "",
          note: data.note || "",
          gstNumber: data.gstNumber || "",
          upiId: data.upiId || "",
          whatsappNumber: data.whatsappNumber || "",
          logo: data.logo || "",
          invoiceLogo: data.invoiceLogo || "",
          defaultDiscountPercent: data.defaultDiscountPercent || 0,
          gstRate: data.gstRate || 18,
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    if (!e || !e.target) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("logoRemoved", logoRemoved ? "true" : "false");

      if (logoFile) data.append("logo", logoFile);
      if (invoiceLogoFile) data.append("invoiceLogo", invoiceLogoFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/settings`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (res.ok) {
        setHasChanges(false);
        addToast("Profile updated successfully!");
        await refreshUser();
        setLogoFile(null);
        setInvoiceLogoFile(null);
        setLogoRemoved(false);
        fetchProfile();
      } else {
        const err = await res.json();
        addToast(
          `Error: ${err.message || "Failed to update profile"}`,
          "error",
        );
      }
    } catch (err) {
      console.error("Save error:", err);
      addToast("Failed to save changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhone = (e) => {
    const { value } = e.target;

    if (!value.startsWith("+91 ")) {
      setFormData((prev) => ({ ...prev, mobileNumber: "+91 " }));
      return;
    }

    const phoneNumberPart = value.slice(4);
    const digitsOnly = phoneNumberPart.replace(/\D/g, "");

    if (digitsOnly.length <= 10) {
      setFormData((prev) => ({
        ...prev,
        mobileNumber: "+91 " + digitsOnly,
      }));
      setHasChanges(true);
    }
  };

  // ✅ Separate handler for WhatsApp — no +91 prefix
  const handleWhatsApp = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, whatsappNumber: digitsOnly }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const tabs = [
    { id: "personal", label: "Personal Details", icon: <User size={18} /> },
    {
      id: "business",
      label: "Business Branding",
      icon: <Building2 size={18} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 bg-gray-100">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2">
            Account Management
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            Account Profile
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Account Settings
          </p>
          {/* Garage ID Badge — owner only */}
          {garageId && (
            <div className="mt-4 flex flex-wrap items-center gap-2 w-fit">
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Garage ID
                </span>
                <code className="text-xs font-black text-slate-900 tracking-wide bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  {garageId}
                </code>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(garageId);
                  addToast("Garage ID copied successfully!", "info");
                }}
                className="p-2.5 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 active:scale-100"
                title="Copy Garage ID"
              >
                <Copy size={15} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="self-start sm:self-auto flex items-center gap-2 px-6 py-2.5 bg-blue-600 dark:bg-blue-950/90 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm shrink-0"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-row items-center justify-start gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-3.5 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-blue-600 dark:bg-blue-950/90  text-white shadow-md shadow-blue-600/10"
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                }`}
              >
                <span
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-400 dark:text-slate-500"
                  }
                >
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 2. MAIN UNIFIED CARD CONTAINER */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 md:p-10">
            {activeTab === "personal" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="max-w-3xl mx-auto p-0.5 space-y-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full" />
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Personal Information
                      </h3>
                    </div>

                    {/* Grid Layout Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!canEdit}
                        icon={
                          <User
                            size={16}
                            className="text-black dark:text-white"
                          />
                        }
                        required
                      />
                      <InputField
                        label="Email Address"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!canEdit}
                        icon={
                          <Mail
                            size={16}
                            className="text-black dark:text-white"
                          />
                        }
                        required
                      />
                      <InputField
                        label="Mobile Number"
                        name="mobileNumber"
                        value={formData.mobileNumber || "+91 "}
                        onChange={handlePhone}
                        disabled={!canEdit}
                        icon={
                          <Phone
                            size={16}
                            className="text-black dark:text-white"
                          />
                        }
                        placeholder="+91 XXXXX XXXXX"
                        required
                      />
                    </div>
                  </section>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  {/* Notes Field Block */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full" />
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Owner Notes
                      </h3>
                    </div>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      disabled={!canEdit}
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl px-5 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 disabled:bg-slate-100 dark:disabled:bg-slate-900/50"
                      placeholder="Add a short note about yourself..."
                    />
                  </section>
                </div>
              </div>
            )}

            {activeTab === "business" && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="max-w-3xl mx-auto p-0.5 space-y-12">
                  {/* --- BRANDING LOGO SECTION --- */}
                  <section className="space-y-6">
                    <div className="flex flex-col mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full" />
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                          Business Branding
                        </h3>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed ml-4.5 max-w-lg">
                        This logo will appear on your dashboard and
                        professionally generated PDF invoices. Use a
                        high-resolution transparent background for best results.
                      </p>
                    </div>

                    {/* Logo Presentation Frame */}
                    <div className="relative group">
                      <div className="flex flex-col items-center gap-6 p-6 bg-slate-50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-4xl transition-all duration-300 hover:bg-white dark:hover:bg-slate-900/40 hover:border-blue-300 dark:hover:border-blue-900/60 hover:shadow-xl hover:shadow-blue-500/5">
                        <div className="relative">
                          {logoFile || formData.logo ? (
                            <div className="w-40 h-40 md:w-44 md:h-44 rounded-2xl md:rounded-3xl bg-white overflow-hidden flex items-center justify-center p-4 border border-slate-100 dark:border-slate-800 transition-transform duration-500 group-hover:scale-[1.02] shadow-sm">
                              <img
                                src={
                                  logoFile
                                    ? URL.createObjectURL(logoFile)
                                    : formData.logo.startsWith("http")
                                      ? formData.logo
                                      : `${import.meta.env.VITE_BASE_URL}/${formData.logo}`
                                }
                                alt="Business Logo"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-44 h-44 rounded-3xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 shadow-inner">
                              <ImageIcon size={48} strokeWidth={1.5} />
                              <span className="text-[10px] font-bold mt-2 uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                No Logo Set
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions Row Elements */}
                        <div className="flex flex-col items-center gap-3">
                          {canEdit && (
                            <div className="flex flex-wrap justify-center gap-3">
                              <label className="cursor-auto bg-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 text-white dark:text-slate-900 hover:text-white dark:hover:text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2">
                                <Upload size={14} />
                                Upload New Logo
                                <input
                                  ref={logoInputRef}
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      setLogoFile(e.target.files[0]);
                                      setLogoRemoved(false);
                                      setHasChanges(true);
                                    }
                                  }}
                                />
                              </label>
                              {(logoFile || formData.logo) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLogoFile(null);
                                    setLogoRemoved(true);
                                    if (logoInputRef.current) {
                                      logoInputRef.current.value = "";
                                    }
                                    if (formData.logo) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        logo: "",
                                      }));
                                    }
                                    setHasChanges(true);
                                  }}
                                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all text-xs font-bold uppercase tracking-widest"
                                >
                                  <X size={14} />
                                  Remove Logo
                                </button>
                              )}
                            </div>
                          )}

                          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-200/40 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                            Recommended: Square PNG/JPG • Max 3MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  {/* --- IDENTITY DETAILS FORM SECTION --- */}
                  <section className="space-y-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full" />
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Garage Identity & Documentation
                      </h3>
                    </div>

                    {/* Functional Fields Matching Structure Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Garage Name"
                        name="garageName"
                        value={formData.garageName}
                        onChange={handleChange}
                        disabled={!canEdit}
                        icon={
                          <Building2
                            size={18}
                            className="text-black dark:text-white"
                          />
                        }
                        required
                      />

                      <InputField
                        label="GSTIN Number"
                        value={formData.gstNumber}
                        icon={
                          <Hash
                            size={18}
                            className="text-black dark:text-white"
                          />
                        }
                        placeholder="24ABCDE1234F1Z5"
                        onChange={(e) => {
                          const value = e.target.value
                            .toUpperCase()
                            .replace(/[^0-9A-Z]/g, "")
                            .slice(0, 15);
                          setFormData((prev) => ({
                            ...prev,
                            gstNumber: value,
                          }));
                          setHasChanges(true);
                        }}
                        disabled={isAdvisor}
                        required
                      />

                      <div className="md:col-span-2">
                        <InputField
                          label="Full Business Address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          disabled={!canEdit}
                          icon={
                            <MapPin
                              size={18}
                              className="text-black dark:text-white"
                            />
                          }
                          required
                        />
                      </div>

                      <InputField
                        label="WhatsApp Number"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleWhatsApp}
                        disabled={!canEdit}
                        icon={
                          <MessageSquare
                            size={18}
                            className="text-black dark:text-white"
                          />
                        }
                        placeholder="WhatsApp Number"
                        required
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="Default GST (%)"
                          name="gstRate"
                          type="number"
                          value={formData.gstRate}
                          onChange={handleInputChange}
                          icon={
                            <Percent
                              size={16}
                              className="text-black dark:text-white"
                            />
                          }
                        />
                        <InputField
                          label="Discount (%)"
                          name="defaultDiscountPercent"
                          type="number"
                          value={formData.defaultDiscountPercent}
                          onChange={handleInputChange}
                          icon={
                            <Tag
                              size={16}
                              className="text-black dark:text-white"
                            />
                          }
                        />
                      </div>

                      <InputField
                        label="UPI ID for Payments"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleChange}
                        disabled={!canEdit}
                        icon={
                          <CreditCard
                            size={18}
                            className="text-black dark:text-white"
                          />
                        }
                        placeholder="garage@upi"
                        required
                      />
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
