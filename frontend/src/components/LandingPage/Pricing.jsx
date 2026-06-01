import React, { useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

export const Pricing = () => {
  const [annual, setAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("Pro");

  const plans = [
    {
      name: "Starter",
      price: "0",
      description: "Perfect for sole traders just getting started.",
      features: [
        "Up to 30 jobs per month",
        "Digital Invoices",
        "Basic stock tracking",
      ],
      cta: "Get Started Free",
      path: "/signup",
      gradient: "linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%)",
      accent: "#6366f1",
    },
    {
      name: "Pro",
      price: annual ? "1599" : "149",
      description: "For busy workshops that want to scale fast.",
      features: [
        "Unlimited everything",
        "WhatsApp alerts",
        "Financial reporting",
        "Priority support",
      ],
      cta: "Try Pro Version",
      popular: true,
      path: "/signup",
      gradient: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
      accent: "#fff",
    },
  ];

  return (
    <section
      id="pricing"
      className="py-24 md:py-32 px-6 relative overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-50 z-0"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-16">
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
              Pricing Plans
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-8"
            style={{ color: "var(--text-heading)" }}
          >
            Fair pricing.
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              No surprises.
            </span>
          </motion.h2>

          {/* Toggle */}
          <div
            className="inline-flex items-center p-1 rounded-2xl"
            style={{
              background: "var(--pricing-toggle-bg)",
              border: "1px solid rgba(99,102,241,0.12)",
            }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="px-6 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200"
              style={{
                background: !annual ? "var(--pricing-btn-bg)" : "transparent",
                color: !annual ? "var(--pricing-btn-text)" : "#94a3b8",
                boxShadow: !annual
                  ? "0 2px 10px rgba(99,102,241,0.12)"
                  : "none",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="px-6 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 flex items-center gap-2"
              style={{
                background: annual ? "var(--pricing-btn-bg)" : "transparent",
                color: annual ? "var(--pricing-btn-text)" : "#94a3b8",
                boxShadow: annual ? "0 2px 10px rgba(99,102,241,0.12)" : "none",
              }}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto px-4 sm:px-0">
          {plans.map((plan, i) => {
            const isSelected = selectedPlan === plan.name;
            const isPro = plan.popular;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                onClick={() => setSelectedPlan(plan.name)}
                className="relative p-8 md:p-10 rounded-3xl flex flex-col cursor-auto transition-all duration-300"
                style={
                  isPro
                    ? {
                        background: plan.gradient,
                        boxShadow: isSelected
                          ? "0 24px 64px rgba(99,102,241,0.38)"
                          : "0 8px 32px rgba(99,102,241,0.18)",
                        transform: isSelected
                          ? "translateY(-6px)"
                          : "translateY(0)",
                        border: "none",
                      }
                    : {
                        background: "var(--bg-secondary)",
                        border: isSelected
                          ? "2px solid rgba(99,102,241,0.40)"
                          : "2px solid var(--border-color)",
                        boxShadow: isSelected
                          ? "0 16px 48px rgba(99,102,241,0.12)"
                          : "0 2px 12px rgba(0,0,0,0.04)",
                        transform: isSelected
                          ? "translateY(-4px)"
                          : "translateY(0)",
                      }
                }
              >
                {isPro && (
                  <div
                    className="absolute top-4 right-4 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.22)",
                      color: "#fff",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h4
                    className="font-extrabold text-xl mb-2"
                    style={{ color: isPro ? "#fff" : "var(--text-heading)" }}
                  >
                    {plan.name}
                  </h4>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span
                      className="text-5xl font-extrabold"
                      style={{ color: isPro ? "#fff" : "var(--text-heading)" }}
                    >
                      ₹{plan.price}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isPro ? "rgba(255,255,255,0.65)" : "#94a3b8",
                      }}
                    >
                      {annual && plan.price !== "0" ? "/year" : "/month"}
                    </span>
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: isPro
                        ? "rgba(255,255,255,0.75)"
                        : "var(--text-body)",
                    }}
                  >
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: isPro
                            ? "rgba(255,255,255,0.22)"
                            : "rgba(99,102,241,0.10)",
                        }}
                      >
                        <Check
                          size={12}
                          style={{ color: isPro ? "#fff" : "#6366f1" }}
                        />
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: isPro
                            ? "rgba(255,255,255,0.88)"
                            : "var(--text-muted)",
                        }}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.path}
                  className="w-full py-5 rounded-2xl text-base font-bold text-center transition-all duration-300"
                  style={
                    isPro
                      ? {
                          background: "rgba(255,255,255,0.22)",
                          color: "#fff",
                          border: "1.5px solid rgba(255,255,255,0.35)",
                          backdropFilter: "blur(8px)",
                        }
                      : {
                          background:
                            "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                          color: "#fff",
                          boxShadow: "0 4px 16px rgba(99,102,241,0.28)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (isPro) {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.30)";
                    } else {
                      e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(99,102,241,0.40)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isPro) {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.22)";
                    } else {
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(99,102,241,0.28)";
                    }
                  }}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
