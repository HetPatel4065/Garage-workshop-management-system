import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { FaCar } from "react-icons/fa";

// Clean layout configurations split by variants
const VARIANT_CONFIG = {
  portal: {
    wrapper:
      "relative aspect-video w-full overflow-hidden bg-slate-900 group/slider select-none rounded-xl shadow-md border border-slate-200/10",
    btnLeft:
      "absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/80 hover:scale-105 active:scale-95 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 z-30 cursor-pointer backdrop-blur-xs",
    btnRight:
      "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/80 hover:scale-105 active:scale-95 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 z-30 cursor-pointer backdrop-blur-xs",
    chevronSize: "w-4 h-4",
    counter:
      "absolute top-3 right-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-200 rounded-md shadow-sm border border-white/10 tabular-nums",
  },
  listing: {
    wrapper:
      "relative w-full h-full overflow-hidden bg-slate-900 group/slider select-none",
    btnLeft:
      "absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/80 hover:scale-105 active:scale-95 opacity-0 group-hover/slider:opacity-100 transition-all duration-250 z-30 cursor-pointer backdrop-blur-xs",
    btnRight:
      "absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/80 hover:scale-105 active:scale-95 opacity-0 group-hover/slider:opacity-100 transition-all duration-250 z-30 cursor-pointer backdrop-blur-xs",
    chevronSize: "w-3.5 h-3.5",
    counter:
      "absolute top-0 right-0 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-200 rounded-bl-lg border-l border-b border-white/10 tabular-nums",
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
        <div className="w-full aspect-video bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-zinc-600 transition-colors">
          <FaCar className="w-12 h-12 opacity-80" />
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-slate-100 dark:bg-zinc-900 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 border border-slate-200/50 dark:border-zinc-800/50 transition-colors">
        <EmptyIcon className="w-8 h-8 opacity-40 animate-pulse" />
        <span className="text-[10px] font-black mt-2 tracking-widest uppercase">
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
      {/* 1. Underlying Image Layer */}
      <img
        src={imgSrc}
        alt={`${title || "Car Image"} - Photo ${safeIdx + 1}`}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/slider:scale-105 z-10"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src =
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80";
        }}
      />

      {/* 2. Interface Elements Overlay Matrix */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Top-Right Area: Image Counter */}
        {photos.length > 1 && (
          <div className={styles.counter}>
            {safeIdx + 1} / {photos.length}
          </div>
        )}

        {/* Bottom-Left Area: Clear Watermark Pillar */}
        {watermarkText && (
          <div className="absolute left-3 bottom-3 rounded-lg bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-white shadow-xl backdrop-blur-md border border-white/10 max-w-[50%] truncate select-none">
            {watermarkText}
          </div>
        )}
      </div>

      {/* 3. Interactive Navigation Elements Layer */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className={styles.btnLeft}
            aria-label="Previous photo"
          >
            <ChevronLeft className={styles.chevronSize} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className={styles.btnRight}
            aria-label="Next photo"
          >
            <ChevronRight className={styles.chevronSize} />
          </button>
        </>
      )}
    </div>
  );
}
