import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Store, HardHat, ChevronRight } from "lucide-react";

const SIGNUP_ROLES = [
  {
    id: "owner",
    label: "Garage Owner",
    description:
      "Register your workshop and start managing staff, jobs & billing",
    icon: Store,
    route: "/owner/signup",
    gradient: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-300 dark:ring-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg:
      "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-700",
    tagColor:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-transparent",
    tag: "Create Business",
  },
  {
    id: "staff",
    label: "Staff Member",
    description: "Join an existing garage as a Service Advisor or Mechanic",
    icon: HardHat,
    route: "/staff/signup",
    gradient: "from-violet-500 to-purple-500",
    ring: "ring-violet-300 dark:ring-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-950/50",
    iconColor: "text-violet-600 dark:text-violet-400",
    badgeBg:
      "bg-violet-50 border-violet-100 dark:bg-violet-950/30 dark:border-violet-900/50",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-700",
    tagColor:
      "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-transparent",
    tag: "Join Workshop",
  },
];

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

export default function Signup() {
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
            Create an account
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-base">
            Select your role to register on the right portal
          </p>
        </motion.div>

        {/* ── Role cards grid ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {SIGNUP_ROLES.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                variants={cardVariants}
                className="h-full"
              >
                <button
                  onClick={() => navigate(card.route)}
                  id={`signup-role-select-${card.id}`}
                  className={`
                    group relative w-full h-full text-left bg-white dark:bg-[#121826]
                    border border-slate-200 dark:border-slate-800/80
                    ${card.hoverBorder} shadow-sm hover:shadow-lg dark:hover:shadow-black/30
                    hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99]
                    transition-[transform,box-shadow,border-color] duration-150 ease-out
                    overflow-hidden rounded-xl p-5
                    focus:outline-none focus:ring-2 ${card.ring} focus:ring-offset-2 dark:focus:ring-offset-[#0b0f19]
                  `}
                >
                  {/* Gradient top bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${card.gradient}`}
                  />

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`shrink-0 w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}
                    >
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {card.label}
                        </p>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {card.description}
                      </p>
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
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-400 dark:text-slate-500 mt-10"
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-4 transition-colors"
          >
            Sign in here
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
