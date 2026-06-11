import React, { createContext, useContext, useState, useEffect } from "react";

export const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading...");
  const [networkInfo, setNetworkInfo] = useState({
    type: "unknown",
    effectiveType: "unknown",
    downlink: 0,
    rtt: 0,
  });

  useEffect(() => {
    const updateConnectionInfo = () => {
      const conn =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      if (conn) {
        setNetworkInfo({
          type: conn.type || "unknown",
          effectiveType: conn.effectiveType || "unknown",
          downlink: conn.downlink || 0,
          rtt: conn.rtt || 0,
        });
      }
    };

    updateConnectionInfo();

    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (conn) {
      conn.addEventListener("change", updateConnectionInfo);
      return () => conn.removeEventListener("change", updateConnectionInfo);
    }
  }, []);

  const startLoading = (text = "Loading...") => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingText,
        networkInfo,
        startLoading,
        stopLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};
