import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-24 md:pt-36 pb-24 md:pb-36 px-6 overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <div
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 60%, rgba(59,130,246,0.13) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(139,92,246,0.10) 0%, transparent 70%), var(--bg-primary)",
          }}
          className="absolute inset-0"
        />
        {/* Animated floating blobs */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-24 right-[8%] w-72 h-72 rounded-full hidden md:block"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-[6%] w-64 h-64 rounded-full hidden md:block"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto text-center relative">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 md:mb-10 shadow-md"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.10) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </span>
          <span className="text-[10px] md:text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            GaragePro System &nbsp;·&nbsp; Your Garage Friend
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.05] md:leading-[0.93]"
          style={{ color: "var(--text-heading)" }}
        >
          The operating system{" "}
          <br className="hidden sm:block" />
          <span
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 60%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            for modern garages.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-base md:text-xl mb-10 md:mb-14 max-w-3xl mx-auto leading-relaxed font-medium px-4 md:px-0"
          style={{ color: "var(--text-body)" }}
        >
          Say goodbye to messy paperwork. GaragePro helps you manage job cards,
          track inventory, and automate billing — all in one beautiful dashboard.
        </motion.p>

        {/* CTA Buttons — plain <a> tags, no SPA routing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 md:px-0"
        >
          <Link
            to="/signup"
            className="group w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold flex items-center justify-center gap-2 transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(99,102,241,0.32)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,0.48)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.32)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started Free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/portal"
            className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold text-center transition-all duration-300"
            style={{
              background: "rgba(99,102,241,0.08)",
              color: "#6366f1",
              border: "1.5px solid rgba(99,102,241,0.22)",
              boxShadow: "0 2px 16px rgba(99,102,241,0.08)",
              backdropFilter: "blur(8px)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.12)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.14)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99,102,241,0.08)";
              e.currentTarget.style.boxShadow = "0 2px 16px rgba(99,102,241,0.08)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Find a Garage
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg font-bold text-center transition-all duration-300"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-body)",
              border: "1.5px solid var(--border-color)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.02)",
              backdropFilter: "blur(8px)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-secondary)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-tertiary)";
              e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.02)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Explore Features
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="mt-16 md:mt-20 pt-8 md:pt-10 border-t flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-10"
          style={{ borderColor: "rgba(99,102,241,0.10)" }}
        >
          {[
            { label: "Workshops using GaragePro", value: "500+" },
            { label: "Jobs Managed Monthly", value: "12K+" },
            { label: "Avg. time saved per day", value: "2 hrs" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl font-extrabold"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </div>
              <div
                className="text-[11px] uppercase tracking-widest font-bold mt-1"
                style={{ color: "#94a3b8" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
