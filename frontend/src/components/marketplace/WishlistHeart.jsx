import React, { useState, useMemo } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";

export default function WishlistHeart({
  vehicleId,
  wishlisted: wishlistedProp = false,
  token: tokenProp = "",
  portalPreviewCustomerId = "",
  onChange,
  size = "md",
  className = "",
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);

  // Get token from sessionStorage or prop
  const token = useMemo(() => {
    return (
      sessionStorage.getItem("portal_token") ||
      sessionStorage.getItem("garage_token") ||
      tokenProp
    );
  }, [tokenProp]);

  // Get wishlisted status from context
  const wishlisted = isWishlisted(vehicleId);

  const sizeClasses =
    size === "sm" ? "w-8 h-8" : size === "lg" ? "w-11 h-11" : "w-9 h-9";

  const iconSizes =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  const handleToggle = async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (!token || loading || !vehicleId) return;

    setLoading(true);
    try {
      const result = await toggleWishlist(vehicleId);
      if (result.success) {
        onChange?.(vehicleId, result.wishlisted, result.message);
      } else {
        onChange?.(vehicleId, wishlisted, result.message);
      }
    } catch (err) {
      console.error(err);
      onChange?.(vehicleId, wishlisted, "Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!token || loading}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      className={`${sizeClasses} rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 disabled:opacity-50
        ${
          wishlisted
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60"
            : "bg-white/90 dark:bg-zinc-900/90 border-slate-200/80 dark:border-zinc-700 text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900/40 backdrop-blur-sm"
        } ${loading ? "scale-95" : "hover:scale-105 active:scale-95"} ${className}`}
    >
      <Heart
        className={`${iconSizes} transition-all ${wishlisted ? "fill-current" : ""}`}
      />
    </button>
  );
}
