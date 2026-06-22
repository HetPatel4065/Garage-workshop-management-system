import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Wrench,
  Package,
  BarChart,
  Smartphone,
  Shield,
  Tag,
} from "lucide-react";

// Accent style themes mapped sequentially across feature items
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
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group p-8 flex flex-col rounded-3xl backdrop-blur-md cursor-default transition-all duration-300"
      style={{
        background: hovered ? "var(--bg-secondary)" : "var(--bg-tertiary)",
        border: hovered
          ? `1.5px solid ${colorScheme.text}33`
          : "1.5px solid var(--border-color)",
        boxShadow: hovered
          ? `0 16px 48px ${colorScheme.text}18, 0 2px 8px rgba(0,0,0,0.04)`
          : "0 2px 12px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      {/* Icon Frame */}
      <div
        className="w-12 h-12 flex items-center justify-center mb-6 rounded-2xl transition-all duration-300"
        style={{
          background: hovered ? colorScheme.hover : colorScheme.bg,
          color: colorScheme.text,
        }}
      >
        <Icon size={22} />
      </div>

      {/* Copy Context */}
      <h3
        className="text-lg font-bold mb-2"
        style={{ color: "var(--text-heading)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm font-medium leading-relaxed"
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
      className="relative px-4 xs:px-6 py-16 md:py-24 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Ambient Radial Mesh Background Art */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #6366f1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-150 h-75"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-7xl mx-auto 3xl:max-w-[1600px] 4xl:max-w-[2000px]">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
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
            className="max-w-3xl mx-auto mb-4 xs:mb-6 text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] md:leading-tight"
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
            className="max-w-2xl mx-auto px-2 xs:px-4 md:px-0 text-sm xs:text-base md:text-lg font-medium leading-relaxed"
            style={{ color: "var(--text-body)" }}
          >
            Stop juggling apps and spreadsheets. GaragePro brings every part of
            your workshop together.
          </motion.p>
        </div>

        {/* Feature Grid Container */}
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-3 gap-4 xs:gap-6 md:gap-8">
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
