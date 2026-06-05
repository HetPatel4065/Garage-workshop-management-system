import React, { useState, useEffect, Suspense } from "react";
import { Outlet, useLocation, useOutlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import GarageNavbar from "./Navbar/GarageNavbar";
import GarageSidebar from "./Sidebar/GarageSidebar";
import ServiceReminderModal from "../UI/ServiceReminderModal";
import { useAuth } from "../../context/AuthContext";

// ─── Constants ───

const ADMIN_NAVBAR_HIDDEN_PATHS = ["/dashboard", "/partnership-leads"];

const REMINDER_SESSION_KEY = "service_reminder_shown";

const REMINDER_THRESHOLD_DAYS = 3;

// ─── Helpers ───

function isDueWithinThreshold(nextServiceDate, today, days) {
  const nextDate = new Date(nextServiceDate);
  nextDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

function filterUrgentReminders(vehicles) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return vehicles.filter(
    (v) =>
      v.serviceDate &&
      v.nextServiceDate &&
      v.reminderStatus !== "Completed" &&
      isDueWithinThreshold(v.nextServiceDate, today, REMINDER_THRESHOLD_DAYS),
  );
}

// ─── Loading fallback ───

function PageLoadingFallback() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-zinc-900 transition-colors">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-300 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-2 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest animate-pulse">
          Loading View...
        </p>
      </div>
    </div>
  );
}

// ─── Admin preview banner ───

function AdminPreviewBanner({ garage, onExit }) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-2.5 shadow-sm text-xs sm:text-sm font-medium tracking-wide transition-colors duration-200 
      bg-linear-to-r from-slate-50 via-indigo-50/30 to-slate-50 text-slate-700 border-b border-slate-200/80 
      dark:bg-linear-to-r dark:from-slate-900 dark:via-indigo-900/40 dark:to-slate-900 dark:text-slate-100 dark:border-slate-800"
    >
      {/* Left Side: Status & Info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
        <span className="truncate text-slate-600 dark:text-slate-300">
          Viewing:{" "}
          {/* FIXED: Changed text-amber-100 to an elegant amber-600 in light mode and amber-400 in dark mode */}
          <strong className="font-bold text-amber-600 dark:text-amber-400">
            {garage.garageName}{" "}
          </strong>{" "}
          <span className="text-slate-700 dark:text-slate-200 mx-1">
            &bull;(ID: {garage.garageId})
          </span>
          Owner:{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-300">
            {garage.name}
          </span>
        </span>
      </div>

      {/* Right Side: Action Button */}
      <button
        onClick={onExit}
        /* FIXED: Adjusted white transparent background to dark/light adaptive variants and cursor-pointer */
        className="px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 uppercase tracking-wider shrink-0 self-start sm:self-auto cursor-pointer border
      bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm
      dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        Exit Preview
      </button>
    </div>
  );
}

// ─── Main component ───

export default function GarageLayout({ children }) {
  const { user, token, selectedGarage, exitGaragePreview } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();

  const role = user?.role?.toLowerCase();

  // ── Derived values ───
  const hideNavbar =
    role === "admin" &&
    !selectedGarage &&
    ADMIN_NAVBAR_HIDDEN_PATHS.some((path) =>
      location.pathname.startsWith(path),
    );

  // ── Local state ───

  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );

  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem("sidebar_collapsed") === "true",
  );

  const [showNotifications, setShowNotifications] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [urgentReminders, setUrgentReminders] = useState([]);

  // ── Side effects ───

  // Check for urgent service reminders (once per session)
  useEffect(() => {
    if (!token || !user || !["owner", "admin"].includes(role)) return;
    if (sessionStorage.getItem(REMINDER_SESSION_KEY) === "true") return;

    async function checkReminders() {
      try {
        const { data: vehicles } = await axios.get(
          `${import.meta.env.VITE_API_URL}/vehicles`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const urgent = filterUrgentReminders(vehicles);

        if (urgent.length > 0) {
          setUrgentReminders(urgent);
          setReminderModalOpen(true);
          sessionStorage.setItem(REMINDER_SESSION_KEY, "true");
        }
      } catch (err) {
        console.error("Failed to check reminders:", err);
      }
    }

    checkReminders();
  }, [token, user]);

  // Suppress CSS transitions while the window is being resized
  useEffect(() => {
    let resizeTimer;

    const handleResize = () => {
      document.body.classList.add("resizing");
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => document.body.classList.remove("resizing"),
        100,
      );
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Open sidebar automatically when viewport becomes desktop-width
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => {
      if (e.matches) setSidebarOpen(true);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Render ───

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-zinc-900 transition-colors duration-300">
      {/* Desktop sidebar spacer */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-70"
        }`}
      />

      <GarageSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        showNotifications={showNotifications}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* ── Main content column ── */}
      <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden relative">
        {!hideNavbar && (
          <GarageNavbar
            role={user?.role ?? ""}
            userName={user?.name ?? "User"}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
          />
        )}

        {user?.role === "admin" && selectedGarage && (
          <AdminPreviewBanner
            garage={selectedGarage}
            onExit={exitGaragePreview}
          />
        )}

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-zinc-900 transition-colors duration-300 relative min-w-0">
          <div className="h-full w-full min-w-0 font-sans">
            <Suspense fallback={<PageLoadingFallback />}>
              <AnimatePresence mode="wait">
                {outlet
                  ? React.cloneElement(outlet, { key: location.pathname })
                  : children}
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
      </div>

      {/* ── Reminder modal ── */}
      <ServiceReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        reminders={urgentReminders}
      />
    </div>
  );
}
