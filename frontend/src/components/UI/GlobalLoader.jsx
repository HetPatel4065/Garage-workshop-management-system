import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLoading } from "../../context/LoadingContext";
import { useAuth } from "../../context/AuthContext";
import { Wrench, Wifi, Zap, Signal, Activity } from "lucide-react";

const GlobalLoader = () => {
  const { isLoading, loadingText, networkInfo } = useLoading();
  const { loading: authLoading } = useAuth();

  const isVisible = isLoading || authLoading;
  const currentText = isLoading ? loadingText : "Initializing Secure Session...";

  const getNetworkIcon = (type) => {
    switch (type) {
      case "4g":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "wifi":
        return <Wifi className="w-4 h-4 text-blue-500" />;
      case "3g":
        return <Signal className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getNetworkLabel = (info) => {
    if (info.effectiveType === "unknown") return "Connecting...";
    return `${info.effectiveType.toUpperCase()} Network Detected`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-white"
        >
          {/* Background Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-blue-100 rounded-full blur-[120px]" />

          <div className="relative flex flex-col items-center">
            {/* Main Loader Core */}
            <div className="relative mb-12">
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
                className="w-32 h-32 rounded-full border-2 border-dashed border-blue-500/30 flex items-center justify-center p-2"
              >
                <div className="w-full h-full rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              </motion.div>

              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(59,130,246,0.2)] flex items-center justify-center border border-blue-50">
                  <Wrench className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* Pulsing Outer Rings */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 bg-blue-500/20 rounded-full -z-10"
              />
            </div>

            {/* Loading Info Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white border border-blue-50 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] min-w-75"
            >
              <div className="flex flex-col items-center gap-1">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {currentText}
                </h3>
                <p className="text-blue-600/40 text-xs font-medium uppercase tracking-[0.2em]">
                  Please wait a moment
                </p>
              </div>

              {/* Network Status Badge */}
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
                {getNetworkIcon(networkInfo.effectiveType)}
                <span className="text-blue-900/80 text-sm font-semibold">
                  {getNetworkLabel(networkInfo)}
                </span>
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1 h-3 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-3 bg-blue-500/30 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>

              {/* Detail Stats */}
              <div className="grid grid-cols-2 gap-4 w-full mt-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Latency</span>
                  <span className="text-blue-600 font-mono text-sm font-bold">{networkInfo.rtt}ms</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Bandwidth</span>
                  <span className="text-blue-600 font-mono text-sm font-bold">{networkInfo.downlink} Mbps</span>
                </div>
              </div>
            </motion.div>

            {/* Bottom Tagline */}
            <p className="mt-8 text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">
              Powered by GaragePro Engine
            </p>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLoader;
