import React from "react";
import {
  X,
  MapPin,
  Phone,
  User,
  Wrench,
  Navigation,
  ShieldCheck,
  Clock,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OPEN_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WorkshopSchedule = () => (
  <div className="mt-6 w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
    {/* Header */}
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <Clock className="w-4 h-4" />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
        Working Hours
      </p>
    </div>

    {/* Working Days */}
    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase w-full tracking-widest mb-2">
      Working Days
    </p>
    <div className="flex gap-1.5 flex-wrap mb-3">
      {DAYS.map((day) => {
        const isOpen = OPEN_DAYS.includes(day);
        return (
          <span
            key={day}
            className={`px-2.5 py-1 rounded-lg text-[12px] font-semibold ${
              isOpen
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 line-through"
            }`}
          >
            {day}
          </span>
        );
      })}
    </div>

    {/* Divider */}
    <div className="h-px bg-slate-100 dark:bg-slate-800 my-3" />

    {/* Operating Hours */}
    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
      Operating Hours
    </p>
    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
      <div className="text-center">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
          Opens
        </p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          08:00 AM
        </p>
      </div>
      <div className="flex-1 mx-4 border-t-2 border-dashed border-slate-200 dark:border-slate-700" />
      <div className="text-center">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
          Closes
        </p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          08:00 PM
        </p>
      </div>
    </div>
  </div>
);

const GarageDetailsModal = ({ isOpen, onClose, garage, onRegister }) => {
  if (!isOpen || !garage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
      >
        {/* ─── Left Panel: Visuals & Header ─────────────────────── */}
        <div className="w-full md:w-5/12 bg-slate-50 dark:bg-slate-950/40 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 shrink-0">
          {/* Logo */}
          <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-900 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
            {garage.logo ? (
              <img
                src={String(garage.logo).startsWith("http") ? garage.logo : `${import.meta.env.VITE_BASE_URL?.replace(/\/$/, "")}/${String(garage.logo).replace(/^\//, "")}`}
                alt={garage.garageName}
                className="w-full h-full object-contain dark:invert dark:brightness-200"
              />
            ) : (
              <Wrench className="w-12 h-12 text-blue-500" strokeWidth={1.5} />
            )}
          </div>

          {/* Garage Name & Badge */}
          <div className="text-center w-full">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2 break-words">
              {garage.garageName}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified Workshop
            </div>
          </div>

          {/* Timing Block */}
          <WorkshopSchedule />
        </div>

        {/* ─── Right Panel: Information & Actions ───────────────── */}
        <div className="w-full md:w-7/12 p-8 flex flex-col justify-between bg-white dark:bg-slate-900">
          {/* Top Content */}
          <div>
            {/* Header Row */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-[0.2em] mb-1 block">
                  Garage Profile
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Workshop Information
                </h4>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-200 dark:hover:bg-slate-700 text-slate-500 hover:text-red-400 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail List */}
            <div className="space-y-6">
              {/* Owner */}
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                    Owner
                  </p>
                  <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                    {garage.name}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                    Location Address
                  </p>
                  <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {garage.address || "No address provided"}
                  </p>
                </div>
              </div>

              {/* Special Note (conditional) */}
              {garage.note && (
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                      Special Note / Services
                    </p>
                    <p className="text-[13px] italic text-slate-500 dark:text-slate-400 leading-relaxed">
                      "{garage.note}"
                    </p>
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                    Contact Number
                  </p>
                  <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">
                    {garage.mobileNumber}
                  </p>
                </div>
              </div>

              {/* Network Badge */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-[12px] text-blue-800 dark:text-blue-300 font-medium">
                  This workshop is part of the{" "}
                  <strong className="text-blue-900 dark:text-blue-200 font-bold">
                    GaragePro Network
                  </strong>
                  , ensuring quality service and genuine parts.
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                onClose();
                onRegister(garage);
              }}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-98 shadow-lg shadow-blue-600/20"
            >
              Request For Service
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GarageDetailsModal;
