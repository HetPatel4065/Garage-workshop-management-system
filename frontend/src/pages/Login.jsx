import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, HardHat, ShieldCheck, ChevronRight, Info } from "lucide-react";
import { FaCar } from "react-icons/fa";
import { FaUser } from "react-icons/fa";

// ─── Tooltip messages ──
const TOOLTIP_MESSAGES = {
  admin:
    "No sign-up needed. Admin accounts are pre-provisioned by the system. Contact your system administrator for credentials.",
  customer:
    "No sign-up needed. Use your registered email or phone number to log in directly.",
};

// ─── Role card definitions ──
const ROLE_CARDS = [
  {
    id: "owner",
    label: "Garage Owner",
    description: "Manage your garage, staff, billing & reports",
    icon: FaCar,
    route: "/owner/login",
    gradient: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-300 dark:ring-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg:
      "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
    tagColor:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-transparent",
    tag: "Full Access",
    tooltip: null,
  },
  {
    id: "staff",
    label: "Staff Member",
    description: "Service advisors & mechanics workspace",
    icon: HardHat,
    route: "/staff/login",
    gradient: "from-violet-500 to-purple-500",
    ring: "ring-violet-300 dark:ring-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-950/50",
    iconColor: "text-violet-600 dark:text-violet-400",
    badgeBg:
      "bg-violet-50 border-violet-100 dark:bg-violet-950/30 dark:border-violet-900/50",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-700",
    tagColor:
      "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-transparent",
    tag: "Requires Garage ID",
    tooltip: null,
  },
  {
    id: "admin",
    label: "Administrator",
    description: "System-wide control across all garages",
    icon: ShieldCheck,
    route: "/admin/login",
    gradient: "from-orange-500 to-amber-500",
    ring: "ring-orange-300 dark:ring-orange-800",
    iconBg: "bg-orange-100 dark:bg-orange-950/50",
    iconColor: "text-orange-600 dark:text-orange-400",
    badgeBg:
      "bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50",
    hoverBorder: "hover:border-orange-300 dark:hover:border-orange-700",
    tagColor:
      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-transparent",
    tag: "Elevated Access",
    tooltip: TOOLTIP_MESSAGES.admin,
    tooltipColor: "text-orange-500 dark:text-orange-400",
    tooltipBg:
      "bg-orange-50 dark:bg-orange-950/80 border-orange-200 dark:border-orange-800/60",
    tooltipText: "text-orange-800 dark:text-orange-200",
  },
  {
    id: "customer",
    label: "Customer",
    description: "Track your vehicle service history & appointments",
    icon: FaUser,
    route: "/customer/login",
    gradient: "from-blue-500 to-indigo-500",
    ring: "ring-blue-300 dark:ring-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-950/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeBg:
      "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50",
    hoverBorder: "hover:border-blue-300 dark:hover:border-blue-700",
    tagColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-transparent",
    tag: "Customer Portal",
    tooltip: TOOLTIP_MESSAGES.customer,
    tooltipColor: "text-blue-500 dark:text-blue-400",
    tooltipBg:
      "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/60",
    tooltipText: "text-blue-800 dark:text-blue-200",
  },
];

// ─── Animation variants ──
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// ─── Component ───
export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="w-full max-w-2xl">
        {/* ── Brand header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <div
            className="group inline-flex items-center gap-3 mb-5 cursor-auto select-none"
            onClick={() => navigate("/")}
          >
            <div className="bg-blue-600 p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              Garage<span className="text-blue-600">Pro</span>
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Who are you?
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-base">
            Select your role to reach the right login portal
          </p>
        </motion.div>

        {/* ── Role cards grid ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            const hasTooltip = !!card.tooltip;

            return (
              <motion.div
                key={card.id}
                variants={cardVariants}
                className="relative"
              >
                {/* ── Info tooltip trigger (Admin & Customer only) ── */}
                {hasTooltip && (
                  <div className="group/tip absolute top-2.5 right-2.5 z-20">
                    <button
                      type="button"
                      aria-label={`Info about ${card.label} login`}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-5 h-5 flex items-center justify-center rounded-full ${card.tooltipColor} hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none`}
                    >
                      <Info className="w-3.5 h-3.5" strokeWidth={2.2} />
                    </button>

                    {/* Tooltip bubble — pure CSS, instant */}
                    <div
                      className={`
                        pointer-events-none absolute right-0 top-6 w-56 rounded-xl border shadow-lg px-3 py-2.5
                        opacity-0 -translate-y-1 scale-95
                        group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-hover/tip:scale-100
                        transition-[opacity,transform] duration-100 ease-out
                        ${card.tooltipBg}
                      `}
                    >
                      {/* Arrow */}
                      <div
                        className={`absolute -top-1.5 right-1.5 w-3 h-3 rotate-45 border-t border-l ${card.tooltipBg}`}
                      />
                      <p
                        className={`text-[11px] leading-relaxed font-medium ${card.tooltipText}`}
                      >
                        {card.tooltip}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Card button ── */}
                <button
                  onClick={() => navigate(card.route, { replace: true })}
                  id={`role-select-${card.id}`}
                  className={`
                    group relative w-full text-left bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800/80
                    ${card.hoverBorder} shadow-sm hover:shadow-lg dark:hover:shadow-black/30
                    hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99]
                    transition-[transform,box-shadow,border-color] duration-150 ease-out overflow-hidden p-5
                    focus:outline-none focus:ring-2 ${card.ring} focus:ring-offset-2 dark:focus:ring-offset-[#0b0f19]
                  `}
                >
                  {/* Gradient top bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${card.gradient}`}
                  />

                  <div className="flex items-start gap-4">
                    {/* Icon Wrapper */}
                    <div
                      className={`shrink-0 w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${card.iconColor}`} size={20} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-start gap-2">
                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {card.label}
                        </p>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {card.description}
                      </p>

                      {/* Tag */}
                      <span
                        className={`inline-block mt-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${card.tagColor} border ${card.badgeBg}`}
                      >
                        {card.tag}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Footer ── */}
        <footer className="mt-8 text-center space-y-2.5">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            New to our system?{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-4 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
