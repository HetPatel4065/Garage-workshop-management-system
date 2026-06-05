import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { FaCar } from "react-icons/fa";

// Clean layout configurations split by variants
const VARIANT_CONFIG = {
  portal: {
    wrapper:
      "relative aspect-video w-full overflow-hidden bg-slate-900 group/slider",
    btnLeft:
      "absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10 cursor-auto",
    btnRight:
      "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 z-10 cursor-auto",
    chevronSize: "w-4 h-4",
    // Flush counter layout for top right corner
    counter:
      "absolute top-0 right-0 rounded-bl-md bg-black/60 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white backdrop-blur-xs z-10",
  },
  listing: {
    wrapper: "relative w-full h-full overflow-hidden bg-slate-900 group/slider",
    btnLeft:
      "absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-250 z-10 cursor-auto",
    btnRight:
      "absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-250 z-10 cursor-auto",
    chevronSize: "w-3.5 h-3.5",
    // Flush counter layout for top right corner
    counter:
      "absolute top-0 right-0 rounded-bl-md bg-black/60 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white backdrop-blur-xs z-10",
  },
};

export default function CardImageSlider({
  photos = [],
  title,
  watermarkText = "",
  emptyIcon: EmptyIcon = Tag,
  variant = "listing",
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const styles = VARIANT_CONFIG[variant] || VARIANT_CONFIG.listing;

  // Memoize photo values to safely handle reference-change tracking
  const photosKey = useMemo(
    () => (photos || []).map((p) => String(p)).join("|"),
    [photos],
  );

  // Reset slider index when a different set of photos loads
  useEffect(() => {
    setCurrentIdx(0);
  }, [photosKey]);

  // Handle Empty Fallbacks
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

  const safeIdx = Math.max(0, Math.min(currentIdx, photos.length - 1));
  const baseUrl = import.meta.env.VITE_BASE_URL?.replace(/\/$/, "") || "";

  const currentPhoto = photos[safeIdx];
  const imgSrc = currentPhoto?.startsWith("http")
    ? currentPhoto
    : `${baseUrl}/${currentPhoto?.replace(/^\//, "")}`;

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  return (
    <div className={styles.wrapper}>
      {/* Slider Core Image */}
      <img
        src={imgSrc}
        alt={`${title} - Photo ${safeIdx + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover/slider:scale-103"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src =
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80";
        }}
      />

      {/* Watermark Element */}
      {watermarkText && (
        <div className="absolute left-3 bottom-3 rounded-md bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-black/20 backdrop-blur-sm mix-blend-difference">
          {watermarkText}
        </div>
      )}

      {/* Conditional Arrow Controls & Top Corner Image Counter */}
      {photos.length > 1 && (
        <>
          <button type="button" onClick={prevSlide} className={styles.btnLeft}>
            <ChevronLeft className={styles.chevronSize} />
          </button>

          <button type="button" onClick={nextSlide} className={styles.btnRight}>
            <ChevronRight className={styles.chevronSize} />
          </button>

          {/* Numerical Counter Indicator in top right corner */}
          <div className={styles.counter}>
            {safeIdx + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}
