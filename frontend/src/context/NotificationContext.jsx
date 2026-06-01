import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import axios from "axios";

const normalizeSocketUrl = (value) => {
  if (!value) return "";
  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(/^http:\/([^/])/, "http://$1")
    .replace(/^https:\/([^/])/, "https://$1");
  return cleaned.startsWith("http://") || cleaned.startsWith("https://")
    ? cleaned
    : `http://${cleaned}`;
};

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data.success) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [token]);

  // Initial fetch and polling fallback
  useEffect(() => {
    if (token && user) {
      fetchNotifications();

      // Polling fallback every 60 seconds
      pollingIntervalRef.current = setInterval(fetchNotifications, 60000);
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [token, user, fetchNotifications]);

  // Socket setup
  useEffect(() => {
    if (
      token &&
      user &&
      (user.role === "owner" ||
        user.role === "admin" ||
        user.role === "advisor")
    ) {
      const ownerId = user.effectiveOwnerId || user._id;

      if (!socketRef.current) {
        const socketUrl =
          normalizeSocketUrl(import.meta.env.VITE_BASE_URL) ||
          "http://localhost:5000";
        socketRef.current = io(socketUrl, {
          query: { token },
          transports: ["websocket"],
        });

        socketRef.current.on("connect", () => {
          console.log("Connected to notification socket");
          socketRef.current.emit("join", ownerId);
        });

        socketRef.current.on("new_notification", (notification) => {
          setNotifications((prev) => [notification, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);

          // Trigger toast
          addToast(
            notification.message,
            notification.type === "error" ? "error" : "info",
          );

          // Play subtle sound if desired (browser permission allowing)
          // try { new Audio('/notification.mp3').play(); } catch(e) {}
        });

        socketRef.current.on("disconnect", () => {
          console.log("Disconnected from notification socket");
        });

        socketRef.current.on("connect_error", (err) => {
          console.warn("Socket connection error:", err.message);
          // Fallback is already handled by polling
        });
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, user, addToast]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/notifications/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const deletedNotif = notifications.find((n) => n._id === id);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      addToast("Notification deleted successfully!", "info");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      addToast("Failed to delete notification.", "error");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/notifications/clear-all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setNotifications([]);
      setUnreadCount(0);
      addToast("All notifications cleared!", "info");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      addToast("Failed to clear notifications.", "error");
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
