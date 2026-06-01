import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-12 md:py-24 px-6 relative overflow-hidden">
      {/* Gradient card */}
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden px-6 md:px-10 py-16 md:py-20 text-center"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 40%, #3b82f6 100%)",
            boxShadow: "0 32px 80px rgba(99,102,241,0.38), 0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          {/* Animated blobs inside card */}
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
            className="absolute top-[-20%] right-[-5%] w-80 h-80 rounded-full pointer-events-none hidden md:block"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 16, 0] }}
            transition={{ repeat: Infinity, duration: 11, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-[-15%] left-[-5%] w-64 h-64 rounded-full pointer-events-none hidden md:block"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)",
              filter: "blur(24px)",
            }}
          />

          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.30)",
              }}
            >
              <Sparkles size={13} color="#fff" />
              <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-white">
                Start for Free — No Credit Card Needed
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] md:leading-tight text-white"
            >
              Ready to modernize
              <br />
              your garage?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.22 }}
              className="text-base md:text-lg font-medium mb-10 md:mb-12 max-w-xl mx-auto leading-relaxed px-4"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              Join 500+ workshops already running smarter with GaragePro. Set up takes less than 5 minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.30 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
            >
              <Link
                to="/signup"
                className="group w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all duration-300"
                style={{
                  background: "#fff",
                  color: "#6366f1",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.18)";
                }}
              >
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base font-bold text-center transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  border: "1.5px solid rgba(255,255,255,0.30)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.22)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Sign In to Dashboard
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-12"
            >
              {[
                "✓ Free forever plan",
                "✓ No setup fees",
                "✓ Cancel anytime",
                "✓ 24/7 support",
              ].map((badge) => (
                <span
                  key={badge}
                  className="text-sm font-semibold"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
