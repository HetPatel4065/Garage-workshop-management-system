import React, { createContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { buildPortalAuthHeaders } from "../utils/portalPreview";
import { getStoredPreviewCustomerId } from "../utils/portalPreview";

export const WishlistContext = createContext();

// Helper to get current token from sessionStorage
const getToken = () => {
  return (
    sessionStorage.getItem("portal_token") ||
    sessionStorage.getItem("garage_token")
  );
};

// Helper to get portal preview customer ID
const getPortalPreviewId = () => {
  return sessionStorage.getItem("portal_token")
    ? ""
    : getStoredPreviewCustomerId?.();
};

export const WishlistProvider = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch wishlist IDs from API
  const fetchWishlistIds = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setWishlistIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/wishlist/ids`,
        {
          headers: buildPortalAuthHeaders(token, getPortalPreviewId()),
        },
      );

      if (res.data.success) {
        setWishlistIds(new Set(res.data.vehicleIds || []));
      }
    } catch (err) {
      console.error("Failed to fetch wishlist IDs:", err);
      setWishlistIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize wishlist on mount or when token changes
  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  // Refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchWishlistIds();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchWishlistIds]);

  // Check if a vehicle is wishlisted
  const isWishlisted = useCallback(
    (vehicleId) => {
      return wishlistIds.has(vehicleId);
    },
    [wishlistIds],
  );

  // Toggle wishlist for a vehicle
  const toggleWishlist = useCallback(
    async (vehicleId) => {
      const token = getToken();
      if (!token) return { success: false };

      try {
        // Optimistically update UI
        const isCurrentlyWishlisted = wishlistIds.has(vehicleId);
        const newWishlistIds = new Set(wishlistIds);

        if (isCurrentlyWishlisted) {
          newWishlistIds.delete(vehicleId);
        } else {
          newWishlistIds.add(vehicleId);
        }
        setWishlistIds(newWishlistIds);
        // Broadcast optimistic change so other components can update counts
        try {
          window.dispatchEvent(
            new CustomEvent("wishlist:changed", {
              detail: {
                vehicleId,
                wishlisted: !isCurrentlyWishlisted,
                source: "optimistic",
              },
            }),
          );
        } catch (e) {
          /* ignore on older browsers */
        }

        // Make API call
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/wishlist/toggle`,
          { vehicleId },
          {
            headers: buildPortalAuthHeaders(token, getPortalPreviewId()),
          },
        );

        if (res.data.success) {
          // 🔍 FIXED: Always include count in confirmed response
          // Broadcast confirmed server response with count
          try {
            window.dispatchEvent(
              new CustomEvent("wishlist:changed", {
                detail: {
                  vehicleId,
                  wishlisted: res.data.wishlisted,
                  source: "confirmed",
                  count:
                    typeof res.data.count === "number"
                      ? res.data.count
                      : undefined,
                },
              }),
            );
          } catch (e) {
            /* ignore */
          }
          return {
            success: true,
            wishlisted: res.data.wishlisted,
            message: res.data.message,
            count: res.data.count,
          };
        } else {
          // Rollback on API error
          setWishlistIds(wishlistIds);
          // 🔍 FIXED: Keep old state for rollback
          try {
            window.dispatchEvent(
              new CustomEvent("wishlist:changed", {
                detail: {
                  vehicleId,
                  wishlisted: isCurrentlyWishlisted,
                  source: "rollback",
                },
              }),
            );
          } catch (e) {}
          return { success: false, message: "Failed to update wishlist" };
        }
      } catch (err) {
        console.error("Toggle wishlist error:", err);
        // Rollback on API error
        setWishlistIds(wishlistIds);
        try {
          window.dispatchEvent(
            new CustomEvent("wishlist:changed", {
              detail: {
                vehicleId,
                wishlisted: wishlistIds.has(vehicleId),
                source: "rollback",
              },
            }),
          );
        } catch (e) {}
        return {
          success: false,
          message: err.response?.data?.error || "Failed to update wishlist",
        };
      }
    },
    [wishlistIds],
  );

  // Add multiple vehicle IDs to wishlist
  const addWishlistIds = useCallback((ids) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  // Remove multiple vehicle IDs from wishlist
  const removeWishlistIds = useCallback((ids) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  // Replace entire wishlist
  const setWishlistIdsData = useCallback((ids) => {
    setWishlistIds(new Set(ids || []));
  }, []);

  const value = {
    wishlistIds,
    isLoading,
    isWishlisted,
    toggleWishlist,
    addWishlistIds,
    removeWishlistIds,
    setWishlistIdsData,
    refetch: fetchWishlistIds,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook to use WishlistContext
export const useWishlist = () => {
  const context = React.useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
