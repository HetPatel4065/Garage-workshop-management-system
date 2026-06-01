import React from "react";
import { motion } from "motion/react";
import {
  Wrench,
  Package,
  BarChart,
  Smartphone,
  Clock,
  Shield,
  Tag,
} from "lucide-react";

const iconColors = [
  {
    bg: "rgba(99,102,241,0.10)",
    text: "#6366f1",
    hover: "rgba(99,102,241,0.18)",
  },
  {
    bg: "rgba(59,130,246,0.10)",
    text: "#3b82f6",
    hover: "rgba(59,130,246,0.18)",
  },
  {
    bg: "rgba(139,92,246,0.10)",
    text: "#8b5cf6",
    hover: "rgba(139,92,246,0.18)",
  },
  {
    bg: "rgba(16,185,129,0.10)",
    text: "#10b981",
    hover: "rgba(16,185,129,0.18)",
  },
  {
    bg: "rgba(245,158,11,0.10)",
    text: "#f59e0b",
    hover: "rgba(245,158,11,0.18)",
  },
  {
    bg: "rgba(239,68,68,0.10)",
    text: "#ef4444",
    hover: "rgba(239,68,68,0.18)",
  },
  {
    bg: "rgba(230, 60, 65, 0.1)",
    text: "#1d4ed8",
    hover: "rgba(230, 60, 65, 0.2)",
  },
];

const FeatureItem = ({
  icon: Icon,
  title,
  description,
  delay = 0,
  colorScheme,
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group p-8 rounded-3xl flex flex-col transition-all duration-300 cursor-default"
      style={{
        background: hovered ? "var(--bg-secondary)" : "var(--bg-tertiary)",
        border: hovered
          ? `1.5px solid ${colorScheme.text}33`
          : "1.5px solid var(--border-color)",
        boxShadow: hovered
          ? `0 16px 48px ${colorScheme.text}18, 0 2px 8px rgba(0,0,0,0.04)`
          : "0 2px 12px rgba(0,0,0,0.04)",
        backdropFilter: "blur(8px)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300"
        style={{
          background: hovered ? colorScheme.hover : colorScheme.bg,
          color: colorScheme.text,
        }}
      >
        <Icon size={22} />
      </div>
      <h3
        className="text-lg font-bold mb-2"
        style={{ color: "var(--text-heading)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed font-medium"
        style={{ color: "var(--text-body)" }}
      >
        {description}
      </p>
    </motion.div>
  );
};

export const Features = () => {
  const features = [
    {
      icon: Wrench,
      title: "Digital Job Cards",
      description:
        "Track vehicle history, technician notes, and job status in real-time. Go paperless in minutes.",
    },
    {
      icon: Package,
      title: "Smart Inventory",
      description:
        "Automated stock alerts, low-quantity notifications, and seamless parts management.",
    },
    {
      icon: BarChart,
      title: "Business Insights",
      description:
        "Detailed daily, weekly, and monthly reports on revenue, expenses, and profitability.",
    },
    {
      icon: Smartphone,
      title: "WhatsApp Integration",
      description:
        "Send professional invoices, service reminders, and updates directly to customers.",
    },
    {
      icon: Shield,
      title: "Secure Backups",
      description:
        "Your data is encrypted and backed up daily. Never worry about losing customer records.",
    },
    {
      icon: Tag,
      title: "Pre-Owned Cars",
      description:
        "Browse pre-owned cars sold by garage owners. Customers must log in to their assigned garage to view available vehicles.",
    },
  ];

  return (
    <section
      id="features"
      className="px-6 relative overflow-hidden"
      style={{
        background: "var(--bg-primary)",
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #6366f1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 -z-10"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.20)",
            }}
          >
            <span
              className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest"
              style={{ color: "#6366f1" }}
            >
              Powerful Capabilities
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl mx-auto leading-[1.1] md:leading-tight"
            style={{ color: "var(--text-heading)" }}
          >
            Everything you need to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              grow your business.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto font-medium text-base md:text-lg leading-relaxed px-4 md:px-0"
            style={{ color: "var(--text-body)" }}
          >
            Stop juggling apps and spreadsheets. GaragePro brings every part of
            your workshop together.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureItem
              key={index}
              {...feature}
              delay={index * 0.08}
              colorScheme={iconColors[index % iconColors.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
