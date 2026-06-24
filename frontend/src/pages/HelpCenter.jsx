import React, { useState, useEffect } from "react";
import EmptyState from "../components/UI/EmptyState";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Wrench,
  ShieldCheck,
  CreditCard,
  FileText,
  ExternalLink,
  X,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
} from "lucide-react";

export default function HelpCenter() {
  const { user } = useAuth();
  const role = (user?.role || "").toLowerCase();

  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [highlightedCategory, setHighlightedCategory] = useState(null);

  const services = [
    { id: 1, status: "completed" },
    { id: 2, status: "pending" },
    { id: 3, status: "completed" },
  ];
  const completedServicesCount = services.filter(
    (s) => s.status === "completed",
  ).length;

  const billings = [
    { id: 1, status: "paid" },
    { id: 2, status: "unpaid" },
  ];
  const paidBillingsCount = billings.filter((b) => b.status === "paid").length;

  const categories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <BookOpen className="text-blue-600" />,
      count: 6,
      description: "Setup guides & onboarding",
    },
    {
      id: "services",
      title: "Service Tracking",
      icon: <Wrench className="text-orange-600" />,
      count: 7,
      description: "Manage & track job cards",
    },
    {
      id: "billing",
      title: "Payments & GST",
      icon: <CreditCard className="text-emerald-600" />,
      count: 6,
      description: "Invoices, GST & receipts",
    },
    {
      id: "security",
      title: "Account Security",
      icon: <ShieldCheck className="text-purple-600" />,
      count: 6,
      description: "Passwords & permissions",
    },
  ];

  // Map which roles should see which categories. Admin sees all.
  const CATEGORY_ROLES = {
    "getting-started": ["owner"],
    services: ["owner", "advisor", "mechanic"],
    billing: ["owner"],
    security: ["owner", "advisor"],
  };

  // Reset active category when role changes to avoid showing unauthorized category
  useEffect(() => {
    setActiveCategory("all");
  }, [role]);

  const categoriesToShow = categories.filter((c) => {
    if (!role || role === "") return true; // show to guests or unknown
    if (role === "admin") return true;
    const allowed = CATEGORY_ROLES[c.id];
    if (!allowed) return true; // if not specified, show to all
    return allowed.includes(role);
  });

  const faqs = [
    // Getting Started
    {
      question: "What happens if an item is low on stock?",
      answer:
        "The system automatically flags items below your set threshold. You will see an alert on your Dashboard and an 'Inventory Alert' badge in the sidebar.",
      category: "getting-started",
    },
    {
      question: "How do I invite a staff member to the app?",
      answer:
        "Go to Staff Members > Team Management and click 'Invite Member'. Enter their email and assign a role (Admin, Technician, or Viewer). They will receive an invite link via email.",
      category: "getting-started",
    },
    {
      question: "How do I set up my garage profile?",
      answer:
        "Go to Profile > Garage Info and fill in your garage name, address, GSTIN, logo, and contact details. This information appears on all generated invoices and reports.",
      category: "getting-started",
    },
    {
      question: "Can I import my existing customer data?",
      answer:
        "Yes. Navigate to Settings > Import & Export and upload a CSV file with columns for customer name, phone, email, and vehicle details. Download the template from the same page to ensure the correct format.",
      category: "getting-started",
    },
    {
      question: "Is there a mobile app available?",
      answer:
        "Not yet, but our web app is fully optimized for mobile browsers. You can access all features from your smartphone or tablet without needing to download anything. As soon as possible our users will be increase then we will launch our mobile app.",
      category: "getting-started",
    },
    {
      question: "How do I set inventory reorder thresholds?",
      answer:
        "Go to Inventory > select an item > click Edit. Set the 'Minimum Stock Level' field. When quantity falls at or below this number, an alert will be triggered on your dashboard.",
      category: "getting-started",
    },
    // Services
    {
      question: "How do I add a new service record?",
      answer:
        "Navigate to the 'Services' tab from the sidebar and click the 'Add New Service' button. Fill in the vehicle details, customer info, and labor tasks to create the record.",
      category: "services",
    },
    {
      question: "Can a service be completed without using any parts?",
      answer:
        "Yes. Some services like inspection, diagnostics, or washing do not require parts. In such cases, only labour charges are applied.",
      category: "services",
    },
    {
      question: "How do I mark a service as completed?",
      answer:
        "Open the service record and click the 'Mark as Completed' button at the top right. This updates the status, triggers an invoice option, and notifies the customer if SMS alerts are enabled.",
      category: "services",
    },
    {
      question: "Can I assign a service to a specific technician?",
      answer:
        "Yes. When creating or editing a service record, use the 'Assign Technician' dropdown to select a team member. Technicians can view their assigned jobs from their own dashboard.",
      category: "services",
    },
    {
      question: "How do I track a vehicle's full service history?",
      answer:
        "Go to Customers, select the customer, and then click on the vehicle registration number. You will see a complete timeline of all past and ongoing service records for that vehicle.",
      category: "services",
    },
    {
      question: "Can I add photos to a service record?",
      answer: "Yes. This feature will be available as soon as possible.",
      category: "services",
    },
    // Billing
    {
      question: "Can I generate GST-compliant invoices?",
      answer:
        "Yes, once a service is marked as 'Completed', you can click 'Generate Invoice'. Ensure your GSTIN is set up in the Settings > Garage Info section.",
      category: "billing",
    },
    {
      question: "How is the total service cost calculated?",
      answer:
        "The total service cost is calculated by adding the labour/service charge entered by the owner and the total cost of parts used (quantity × price at the time of service).",
      category: "billing",
    },
    {
      question: "Can I accept partial payments from customers?",
      answer:
        "Yes. On the invoice screen, click 'Record Payment' and enter the amount received. The invoice will show the remaining balance as 'Due'. You can record multiple payments until the invoice is fully settled.",
      category: "billing",
    },
    {
      question: "How do I apply a discount to an invoice?",
      answer:
        "Open the invoice and click 'Edit'. You will see a discount field where you can enter a flat amount or a percentage. The total will update automatically before you save.",
      category: "billing",
    },
    {
      question: "Can I send invoices directly to customers via WhatsApp?",
      answer:
        "Yes. On any generated invoice, click 'Share' and select WhatsApp. The invoice PDF will open in WhatsApp with the customer's number pre-filled if it is saved in their profile.",
      category: "billing",
    },
    {
      question: "How do I generate a monthly revenue report?",
      answer:
        "Go to Reports > Revenue and select a date range. You can filter by service type, technician, or payment status. Reports can be exported as PDF or Excel.",
      category: "billing",
    },
    // Security
    {
      question: "How do I change my login password?",
      answer:
        "Go to Settings > Security. You will need to enter your current password followed by your new password to save changes.",
      category: "security",
    },
    {
      question: "What are the user roles?",
      answer:
        "Admin & Owner have full access. Technicians and advisors can update services (no billing) and have read-only access.",
      category: "security",
    },
    {
      question: "Is two-factor authentication (2FA) supported?",
      answer:
        "Yes. Go to Settings > Security > Two-Factor Authentication and toggle it on. You can use any authenticator app like Google Authenticator or Authy to scan the QR code and enable 2FA.",
      category: "security",
    },
    {
      question: "What should I do if I forget my password?",
      answer:
        "On the login screen, click 'Forgot Password' and enter your registered email. You will receive a reset link within a few minutes. If the email doesn't arrive, check your spam folder or contact support.",
      category: "security",
    },
    {
      question: "How do I remove or inactive a staff member's access?",
      answer:
        "Go to Staff Members  find the staff member, and click on Trash icon or click on status button which is active in starting .Their account will be inactive or deleted immediately what button you clicked and they will no longer be able to log in.",
      category: "security",
    },
    {
      question: "Is my garage data backed up automatically?",
      answer:
        "Yes. All data is backed up automatically every 24 hours to secure cloud servers. You can also trigger a manual backup anytime from Settings > Data & Privacy > Backup Now.",
      category: "security",
    },
  ];

  const allowedCategoryIds = new Set(categoriesToShow.map((c) => c.id));

  const filteredFaqs = faqs.filter((faq) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query);
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const allowedForRole =
      role === "admin" || allowedCategoryIds.has(faq.category);
    return matchesSearch && matchesCategory && allowedForRole;
  });

  const handleCategoryCardClick = (catId) => {
    setActiveCategory(catId === activeCategory ? "all" : catId);
    setHighlightedCategory(catId);
    setTimeout(() => setHighlightedCategory(null), 600);
    document
      .getElementById("faq-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFeedback = (index, type) => {
    setFeedbackGiven((prev) => ({ ...prev, [index]: type }));
  };

  const clearSearch = () => setSearchQuery("");

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-w-0">
      <div className="max-w-screen-6xl mx-auto">
        {/* --- Hero Section with Search --- */}
        <div className="space-y-4 mb-10">
          <div className="mb-8 pb-5 border-b-3 border-slate-200/80 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.22em] mb-2">
                  HELP & SUPPORT
                </p>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                  Help Center
                </h1>

                <p className="text-sm font-medium text-slate-500 mt-3">
                  Find answers, guides, and support for your garage operations
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions, topics, keywords..."
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Active filter pill */}
          {activeCategory !== "all" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filtered by:</span>
              <button
                onClick={() => setActiveCategory("all")}
                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
              >
                {categories.find((c) => c.id === activeCategory)?.title}
                <X size={11} />
              </button>
            </div>
          )}
        </div>

        {/* --- Categories Grid (clickable to filter) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 bg-gray-100 rounded-xl p-4">
          {categoriesToShow.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryCardClick(cat.id)}
                className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-auto group
                  ${
                    isActive
                      ? "border-blue-400 ring-2 ring-blue-100"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
              >
                <div
                  className={`p-3 rounded-xl w-fit mb-4 transition-colors
                    ${isActive ? "bg-blue-50" : "bg-slate-50 group-hover:bg-blue-50"}`}
                >
                  {cat.icon}
                </div>
                <h3 className="font-bold text-slate-800 mb-0.5">{cat.title}</h3>
                <p className="text-xs text-slate-400 mb-2">{cat.description}</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    {cat.count} articles
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-gray-100 p-4 rounded-xl">
          {/* --- FAQ Accordion --- */}
          <div id="faq-section" className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-blue-600" size={22} />
                Frequently Asked Questions
              </h2>
              {filteredFaqs.length > 0 && (
                <span className="text-xs text-slate-400 font-medium">
                  {filteredFaqs.length} result
                  {filteredFaqs.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Category dot */}
                      <span
                        className={`mt-1.5 shrink-0 w-2 h-2 rounded-full
                          ${
                            faq.category === "services"
                              ? "bg-orange-400"
                              : faq.category === "billing"
                                ? "bg-emerald-400"
                                : faq.category === "security"
                                  ? "bg-purple-400"
                                  : "bg-blue-400"
                          }`}
                      />
                      <span className="font-bold text-slate-700 text-sm">
                        {/* Highlight matched search text */}
                        {searchQuery
                          ? highlightMatch(faq.question, searchQuery)
                          : faq.question}
                      </span>
                    </div>
                    {openFaq === index ? (
                      <ChevronUp
                        size={18}
                        className="shrink-0 text-slate-400 ml-2"
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                        className="shrink-0 text-slate-400 ml-2"
                      />
                    )}
                  </button>

                  {openFaq === index && (
                    <div className="px-5 pb-5 border-t border-slate-50 pt-4">
                      <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <EmptyState
                icon={Search}
                title="No matching questions found"
                description="Try different keywords or browse a category."
                primaryAction={{
                  label: "Clear filters",
                  onClick: () => {
                    clearSearch();
                    setActiveCategory("all");
                  },
                }}
              />
            )}
          </div>

          {/* --- Support Sidebar --- */}
          <div className="space-y-6">
            <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
              <h3 className="font-extrabold text-xl mb-2">Still need help?</h3>
              <p className="text-blue-100 text-sm mb-6">
                <span className="block font-bold">
                  Our support team is available
                </span>
                <span className="block font-mono">Monday to Friday</span>
                <span className="block font-mono">9am–7pm</span>
              </p>
              <div className="space-y-4">
                <a
                  href="tel:+919978972413"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"
                >
                  <Phone size={18} className="shrink-0" />
                  <span className="text-sm font-bold">+91 99789 72413</span>
                </a>
                <a
                  href="mailto:het.bloomittech@gmail.com"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"
                >
                  <Mail size={18} className="shrink-0" />
                  <span className="text-sm font-bold">
                    support@garageapp.com
                  </span>
                </a>
                <button
                  onClick={() =>
                    window.open("https://wa.me/919978972413", "_blank")
                  }
                  className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 py-3 rounded-xl font-black text-sm hover:bg-blue-50 transition-all"
                >
                  <MessageCircle size={18} className="shrink-0" />
                  Live Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility: highlight matching text in questions
function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
