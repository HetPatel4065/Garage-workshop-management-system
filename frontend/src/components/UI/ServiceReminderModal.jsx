import React from "react";
import { 
  X, 
  Calendar, 
  User, 
  Car, 
  ArrowRight, 
  Bell,
  Clock,
  Phone,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInDays, isPast, isToday } from "date-fns";

export default function ServiceReminderModal({ isOpen, onClose, reminders = [] }) {
  if (!reminders.length) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Header Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600" />

            {/* Content */}
            <div className="p-8 sm:p-10">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                    <Bell size={28} className="animate-swing" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                      Service Reminders
                    </h2>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Action Required: {reminders.length} Urgent Reminders
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Area */}
              <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                {reminders.map((r, idx) => (
                  <div 
                    key={r._id || idx}
                    className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all group"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-xs group-hover:scale-110 transition-transform">
                          <Car size={20} />
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900 leading-tight">
                            {r.licensePlate}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            {r.make} {r.model}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs">
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-xs font-black text-slate-700">
                          {format(new Date(r.nextServiceDate), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                             <User size={16} />
                           </div>
                           <div className="min-w-0">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Customer</p>
                             <p className="text-sm font-bold text-slate-800 truncate">{r.customerId?.name || r.customerName || "N/A"}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                             <Phone size={16} />
                           </div>
                           <div className="min-w-0">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Phone</p>
                             <p className="text-sm font-bold text-slate-800 truncate">{r.customerId?.phone || "N/A"}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                             <Mail size={16} />
                           </div>
                           <div className="min-w-0">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Email</p>
                             <p className="text-sm font-bold text-slate-800 truncate">{r.customerId?.email || "N/A"}</p>
                           </div>
                        </div>
                         <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                             <Calendar size={16} />
                           </div>
                           <div className="min-w-0">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Due Status</p>
                             {(() => {
                               const today = new Date();
                               today.setHours(0, 0, 0, 0);
                               const due = new Date(r.nextServiceDate);
                               due.setHours(0, 0, 0, 0);
                               const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                               
                               let badgeLabel = "";
                               let badgeClass = "";
                               let dotClass = "";
                               let countdownText = "";
                               
                               if (days < 0) {
                                 badgeLabel = "Action Required";
                                 badgeClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
                                 dotClass = "bg-rose-500 animate-pulse";
                                 countdownText = `Overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"}`;
                               } else if (days <= 7) {
                                 badgeLabel = "Due Soon";
                                 badgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
                                 dotClass = "bg-amber-400 animate-pulse";
                                 countdownText = days === 0 ? "Due Today" : `In ${days} ${days === 1 ? "day" : "days"}`;
                               } else {
                                 badgeLabel = "Stable";
                                 badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
                                 dotClass = "bg-emerald-500";
                                 countdownText = `In ${days} ${days === 1 ? "day" : "days"}`;
                               }

                               return (
                                 <div className="flex flex-col items-start gap-1">
                                   <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
                                     <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                                     {badgeLabel}
                                   </span>
                                   <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                     {countdownText}
                                   </span>
                                 </div>
                               );
                             })()}
                           </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-10 flex items-center justify-between gap-4">
                <button
                  onClick={onClose}
                  className="px-8 py-4 rounded-2xl text-[13px] font-black text-slate-500 hover:text-slate-900 transition-all uppercase tracking-widest"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = "/reminders";
                  }}
                  className="flex items-center gap-3 px-10 py-4 rounded-[24px] bg-slate-900 text-white font-black text-[13px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 group"
                >
                  Manage Reminders
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
