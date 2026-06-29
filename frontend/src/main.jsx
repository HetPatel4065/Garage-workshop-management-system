import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { LoadingProvider } from "./context/LoadingContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const url = args[0] ? args[0].toString() : "";

  if (!response.ok && url.includes("/api/")) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data.details && Array.isArray(data.details)) {
        errorMsg = data.details.join(", ");
      } else {
        errorMsg = data.error || data.message || data.msg || errorMsg;
      }
    } catch (e) {
      try {
        const text = await response.clone().text();
        if (text) errorMsg = text;
      } catch (err) {
        // Ignore fallback text read failure
      }
    }
    throw new Error(errorMsg);
  }
  return response;
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <LoadingProvider>
            <AuthProvider>
              <SocketProvider>
                <WishlistProvider>
                  <NotificationProvider>
                    <App />
                  </NotificationProvider>
                </WishlistProvider>
              </SocketProvider>
            </AuthProvider>
          </LoadingProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  </StrictMode>,
);
