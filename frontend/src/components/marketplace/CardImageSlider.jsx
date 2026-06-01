import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { FaCar } from "react-icons/fa";

/**
 * Isolated image slider — photo index resets when the listing/photos change.
 */
export default function CardImageSlider({
  photos,
  title,
  emptyIcon: EmptyIcon = Tag,
  variant = "listing",
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const photosKey = useMemo(
    () => (photos || []).map((p) => String(p)).join("|"),
    [photos],
  );

  useEffect(() => {
    setCurrentIdx(0);
  }, [photosKey]);

  if (!photos || photos.length === 0) {
    if (variant === "portal") {
      return (
        <div className="w-full aspect-video bg-slate-100 flex items-center justify-center text-slate-400">
          <FaCar className="w-12 h-12" />
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-slate-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-650">
        <EmptyIcon className="w-8 h-8 opacity-45" />
        <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">
          No photos uploaded
        </span>
      </div>
    );
  }

  const safeIdx = Math.min(currentIdx, photos.length - 1);
  const baseUrl = import.meta.env.VITE_BASE_URL?.replace(/\/$/, "") || "";

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const wrapperClass =
    variant === "portal"
      ? "relative aspect-video w-full overflow-hidden bg-slate-900 group/slider"
      : "relative w-full h-full overflow-hidden bg-slate-900 group/slider";

  return (
    <div className={wrapperClass}>
      <img
        src={`${baseUrl}/${photos[safeIdx]?.replace(/^\//, "")}`}
        alt={`${title} - Photo ${safeIdx + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover/slider:scale-103"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src =
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80";
        }}
      />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className={
              variant === "portal"
                ? "absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10 cursor-auto"
                : "absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-250 z-10 cursor-auto"
            }
          >
            <ChevronLeft
              className={variant === "portal" ? "w-4 h-4" : "w-3.5 h-3.5"}
            />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className={
              variant === "portal"
                ? "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10 cursor-auto"
                : "absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-250 z-10 cursor-auto"
            }
          >
            <ChevronRight
              className={variant === "portal" ? "w-4 h-4" : "w-3.5 h-3.5"}
            />
          </button>
          <div
            className={
              variant === "portal"
                ? "absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10"
                : "absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10"
            }
          >
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === safeIdx
                    ? "bg-white scale-125 shadow-xs"
                    : variant === "portal"
                      ? "bg-white/50"
                      : "bg-white/45"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
