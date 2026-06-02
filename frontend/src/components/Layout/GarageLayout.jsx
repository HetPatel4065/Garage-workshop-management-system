import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import GarageNavbar from "./Navbar/GarageNavbar";
import GarageSidebar from "./Sidebar/GarageSidebar";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ServiceReminderModal from "../UI/ServiceReminderModal";

export default function GarageLayout({ children }) {
  const { user, token, selectedGarage, exitGaragePreview } = useAuth();
  const location = useLocation();
  const hideNavbar =
    user?.role?.toLowerCase() === "admin" &&
    !selectedGarage &&
    ["/dashboard", "/partnership-leads"].some((path) =>
      location.pathname.startsWith(path),
    );

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Sidebar collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    return sessionStorage.getItem("sidebar_collapsed") === "true";
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [urgentReminders, setUrgentReminders] = useState([]);

  // =========================================================
  // CHECK SERVICE REMINDERS
  // =========================================================
  useEffect(() => {
    const checkReminders = async () => {
      if (
        !token ||
        !user ||
        !["owner", "admin"].includes(user.role?.toLowerCase())
      ) {
        return;
      }

      if (sessionStorage.getItem("service_reminder_shown") === "true") {
        return;
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/vehicles`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const urgent = res.data.filter((v) => {
          // Only show reminders for vehicles that have completed a service
          if (
            !v.serviceDate ||
            !v.nextServiceDate ||
            v.reminderStatus === "Completed"
          ) {
            return false;
          }

          const nextDate = new Date(v.nextServiceDate);
          nextDate.setHours(0, 0, 0, 0);

          const diffDays = Math.ceil(
            (nextDate - today) / (1000 * 60 * 60 * 24),
          );

          return diffDays >= 0 && diffDays <= 3;
        });

        if (urgent.length > 0) {
          setUrgentReminders(urgent);
          setReminderModalOpen(true);

          sessionStorage.setItem("service_reminder_shown", "true");
        }
      } catch (err) {
        console.error("Failed to check reminders:", err);
      }
    };

    checkReminders();
  }, [token, user]);

  // =========================================================
  // DISABLE TRANSITIONS DURING RESIZE
  // =========================================================
  useEffect(() => {
    let resizeTimer;

    const handleResize = () => {
      document.body.classList.add("resizing");

      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        document.body.classList.remove("resizing");
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // =========================================================
  // HANDLE DESKTOP / MOBILE
  // =========================================================
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleMediaChange = (e) => {
      if (e.matches) {
        setSidebarOpen(true);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  // =========================================================
  // SYNC SIDEBAR COLLAPSE STATE
  // =========================================================
  useEffect(() => {
    const syncSidebarState = () => {
      const currentState =
        sessionStorage.getItem("sidebar_collapsed") === "true";

      setCollapsed(currentState);
    };

    // Initial sync
    syncSidebarState();

    // Polling for instant updates
    const interval = setInterval(syncSidebarState, 50);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-zinc-900 transition-colors duration-300">
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-65"
        }`}
      />

      <GarageSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        showNotifications={showNotifications}
      />

      {/* ========================================================= */}
      {/* MAIN CONTENT */}
      {/* ========================================================= */}

      <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden relative">
        {/* Navbar */}

        {!hideNavbar && (
          <GarageNavbar
            role={user?.role || ""}
            userName={user?.name || "User"}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
          />
        )}

        {/* ========================================================= */}
        {/* ADMIN PREVIEW BANNER */}
        {/* ========================================================= */}

        {user?.role === "admin" && selectedGarage && (
          <div className="bg-linear-to-r from-amber-600 via-orange-600 to-red-600 text-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-md text-xs sm:text-sm font-semibold tracking-wide border-b border-orange-500/30">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />

              <span className="truncate">
                Viewing:{" "}
                <strong className="font-bold text-amber-100">
                  {selectedGarage.garageName}
                </strong>{" "}
                &bull; Owner: {selectedGarage.name}
              </span>
            </div>

            <button
              onClick={exitGaragePreview}
              className="bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-auto shadow-inner uppercase tracking-wider shrink-0 self-start sm:self-auto"
            >
              Exit Preview
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE CONTENT */}
        {/* ========================================================= */}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-zinc-900 transition-colors duration-300 relative min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              className="h-full w-full min-w-0"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ========================================================= */}
      {/* REMINDER MODAL */}
      {/* ========================================================= */}

      <ServiceReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        reminders={urgentReminders}
      />
    </div>
  );
}
