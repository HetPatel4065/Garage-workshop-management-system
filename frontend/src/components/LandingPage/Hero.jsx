import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative px-6 pt-24 pb-24 md:pt-36 md:pb-36 overflow-hidden">
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
          className="absolute top-24 right-[8%] hidden md:block w-72 h-72 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [0, -4, 0] }}
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-20 left-[6%] hidden md:block w-64 h-64 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Dot grid pattern matrix */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #6366f1 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-8 md:mb-10 px-4 py-2 rounded-full shadow-md"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(59,130,246,0.10) 100%)",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          <span className="text-[10px] md:text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            GaragePro System &nbsp;·&nbsp; Your Garage Friend
          </span>
        </motion.div>

        {/* Display Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.05] md:leading-[0.93]"
          style={{ color: "var(--text-heading)" }}
        >
          The operating system <br className="hidden sm:block" />
          <span
            style={{
              background:
                "linear-gradient(135deg, #6366f1 0%, #3b82f6 60%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            for modern garages.
          </span>
        </motion.h1>

        {/* Deck Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="max-w-3xl mx-auto px-4 md:px-0 mb-10 md:mb-14 text-base md:text-xl font-medium leading-relaxed"
          style={{ color: "var(--text-body)" }}
        >
          Say goodbye to messy paperwork. GaragePro helps you manage job cards,
          track inventory, and automate billing — all in one beautiful
          dashboard.
        </motion.p>

        {/* CTA Buttons Action Layer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 md:px-0"
        >
          <Link
            to="/signup"
            className="group w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 flex items-center justify-center gap-2 font-bold text-base md:text-lg text-white rounded-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.32)",
            }}
          >
            <span>Get Started Free</span>
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <Link
            to="/portal"
            className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 font-bold text-center text-base md:text-lg rounded-2xl border backdrop-blur-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
            style={{
              background: "rgba(99,102,241,0.08)",
              color: "#6366f1",
              borderColor: "rgba(99,102,241,0.22)",
              boxShadow: "0 2px 16px rgba(99,102,241,0.08)",
            }}
          >
            Find a Garage
          </Link>

          <a
            href="#features"
            className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 font-bold text-center text-base md:text-lg rounded-2xl border backdrop-blur-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-body)",
              borderColor: "var(--border-color)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.02)",
            }}
          >
            Explore Features
          </a>
        </motion.div>

        {/* Numerical Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-10 mt-16 md:mt-20 pt-8 md:pt-10 border-t"
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
                className="mt-1 text-[11px] font-bold uppercase tracking-widest"
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
