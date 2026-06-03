import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  useMemo,
} from "react";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Building,
  Tag,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Calendar,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Fuel,
  Gauge,
  Heart,
  IndianRupee,
  Info,
  MapPin,
  Maximize2,
  MessageCircle,
  Palette,
  Phone,
  Printer,
  RotateCcw,
  Share2,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
  Milestone,
  UserCheck,
  Wrench,
} from "lucide-react";
import { FaCar } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/theme/ThemeToggle";
import Modal from "../../components/UI/Modal";
import WishlistHeart from "../../components/marketplace/WishlistHeart";
import { useWishlist } from "../../context/WishlistContext";
import {
  buildPortalAuthHeaders,
  getStoredPreviewCustomerId,
} from "../../utils/portalPreview";

/* 
   HELPERS
 */
const photoUrl = (path) =>
  !path
    ? ""
    : path.startsWith("http")
      ? path
      : `${import.meta.env.VITE_BASE_URL?.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

const FALLBACK =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80";

// Simple title-case helper for display values (e.g. "maharashtra" -> "Maharashtra")
const upperCase = (val) => {
  // Keeps your safe check for null/undefined while allowing 0
  if (!val && val !== 0) return "";

  return String(val).toUpperCase();
};

/* SECTION HEADER */
const SectionHeader = ({ icon: Icon, title, accent = "blue", action }) => {
  const colors = {
    blue: "bg-blue-50   dark:bg-blue-950/40   text-blue-600   dark:text-blue-400",
    indigo:
      "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
    slate:
      "bg-slate-100 dark:bg-zinc-800      text-slate-500  dark:text-zinc-400",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colors[accent]}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent = false,
  wide = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -1 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className={`relative overflow-hidden capitalize rounded-2xl p-4 border transition-shadow hover:shadow-md cursor-default
      ${wide ? "col-span-2" : ""}
      ${
        accent
          ? "bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-900/40"
          : "bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800/80"
      }`}
  >
    <div className="flex items-center gap-2 mb-2">
      <div
        className={`p-1.5 rounded-lg ${accent ? "bg-blue-100 dark:bg-blue-900/40" : "bg-white dark:bg-zinc-900"}`}
      >
        <Icon
          className={`w-3.5 h-3.5 ${accent ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-zinc-500"}`}
        />
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 leading-none">
        {label}
      </span>
    </div>
    <p
      className={`text-sm font-black leading-tight truncate ${accent ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-zinc-200"}`}
    >
      {value}
    </p>
  </motion.div>
);

/* COLLAPSIBLE CARD */
const CollapsibleCard = ({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-zinc-950/25 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
            {title}
          </h3>
        </div>

        <div className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Kept padding inside an inner wrapper. 
               Framer Motion struggles with height calculations if padding is on the motion.div itself.
            */}
            <div className="px-6 pb-6 border-t border-slate-100 dark:border-zinc-800/60 text-slate-600 dark:text-zinc-300">
              <div className="pt-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* CONTACT ROW */
const ContactRow = ({
  icon: Icon,
  label,
  value,
  highlight = false,
  copyable = false,
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-slate-100 dark:border-zinc-800/60 last:border-0">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
        ${highlight ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500"}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 mt-0.5">
          {value}
        </p>
      </div>
      {copyable && (
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 border border-slate-100 hover:border-slate-300 
           transition-colors"
        >
          {copied ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
};

/* LIGHTBOX */
const Lightbox = ({ photos, activeIdx, onClose, onNext, onPrev }) => {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [constraints, setConstraints] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });
  const containerRef = useRef(null);
  const lastTap = useRef(0);

  useEffect(() => {
    setZoom(1);
  }, [activeIdx]);

  const updateConstraints = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const imgEl = containerRef.current.querySelector("img");
    if (!imgEl) return;
    const img = imgEl.getBoundingClientRect();

    const xMax = Math.max(0, (img.width - container.width) / 2);
    const yMax = Math.max(0, (img.height - container.height) / 2);

    setConstraints({
      left: -xMax,
      right: xMax,
      top: -yMax,
      bottom: yMax,
    });
  }, []);

  // Update bounds when zoom, activeIdx, or photo changes
  useEffect(() => {
    const timer = setTimeout(updateConstraints, 60);
    return () => clearTimeout(timer);
  }, [zoom, activeIdx, updateConstraints]);

  // Update bounds on window resize
  useEffect(() => {
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, [updateConstraints]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "+" || e.key === "=" || e.code === "KeyZ") {
        setZoom((z) => Math.min(z + 0.25, 4));
      }
      if (e.key === "-" || e.key === "_" || e.code === "KeyX") {
        setZoom((z) => Math.max(z - 0.25, 1));
      }
      if (e.key === "0" || e.key === "r" || e.code === "KeyR") {
        setZoom(1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNext, onPrev]);

  const handleWheel = (e) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 0.25, 4));
    } else {
      setZoom((z) => Math.max(z - 0.25, 1));
    }
  };

  const handleImageTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      setZoom((z) => (z > 1 ? 1 : 2.5));
    }
    lastTap.current = now;
  }, []);

  const cursorStyle = React.useMemo(() => {
    if (zoom > 1) {
      return isDragging ? "grabbing" : "grab";
    }
    return "zoom-in";
  }, [zoom, isDragging]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 bg-black/95 backdrop-blur-sm flex flex-col"
        onClick={onClose}
      >
        {/* Top Bar */}
        <div
          className="
        absolute top-0 inset-x-0 z-20
        flex flex-wrap items-center justify-between
        gap-3
        px-3 sm:px-4 md:px-6
        py-3
        bg-linear-to-b from-black/70 to-transparent
      "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm sm:text-base font-bold">
              {activeIdx + 1} / {photos.length}
            </span>

            <span
              className="
            text-white/90
            bg-white/10
            px-2 py-1
            rounded-lg
            text-[10px] sm:text-xs
            font-black
            uppercase
          "
            >
              Zoom: {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
              className="
            w-9 h-9
            sm:w-10 sm:h-10
            rounded-full
            bg-white/10
            hover:bg-white/20
            text-white
            flex items-center justify-center
            transition-colors
          "
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
              className="
            w-9 h-9
            sm:w-10 sm:h-10
            rounded-full
            bg-white/10
            hover:bg-white/20
            text-white
            flex items-center justify-center
            transition-colors
          "
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => setZoom(1)}
              className="
            w-9 h-9
            sm:w-10 sm:h-10
            rounded-full
            bg-white/10
            hover:bg-white/20
            text-white
            flex items-center justify-center
            transition-colors
          "
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onClose}
              className="
            w-9 h-9
            sm:w-10 sm:h-10
            rounded-full
            bg-white/10
            hover:bg-white/20
            text-white
            flex items-center justify-center
            transition-colors
          "
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Image Area */}
        <div
          ref={containerRef}
          className="
        flex-1
        flex
        items-center
        justify-center
        overflow-hidden
        relative
        w-full
        h-full
        px-2 sm:px-4
      "
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: zoom,
                ...(zoom === 1 ? { x: 0, y: 0 } : {}),
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={photoUrl(photos[activeIdx]) || FALLBACK}
              className="
            max-w-full
            max-h-[80vh]
            sm:max-h-[85vh]
            md:max-h-[90vh]
            object-contain
            select-none
          "
              style={{ cursor: cursorStyle }}
              drag={zoom > 1}
              dragConstraints={constraints}
              dragElastic={0.15}
              dragMomentum={false}
              onLoad={updateConstraints}
              onDragStart={() => {
                updateConstraints();
                setIsDragging(true);
              }}
              onDragEnd={() => setIsDragging(false)}
              onTap={handleImageTap}
              onError={(e) => {
                e.currentTarget.src = FALLBACK;
              }}
            />
          </AnimatePresence>
        </div>

        {/* Prev Button */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="
            absolute
            left-2 sm:left-4 md:left-6
            top-1/2
            -translate-y-1/2
            w-9 h-9
            sm:w-11 sm:h-11
            rounded-full
            bg-white/10
            hover:bg-white/20
            backdrop-blur-sm
            text-white
            flex items-center justify-center
            transition-all
          "
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="
            absolute
            right-2 sm:right-4 md:right-6
            top-1/2
            -translate-y-1/2
            w-9 h-9
            sm:w-11 sm:h-11
            rounded-full
            bg-white/10
            hover:bg-white/20
            backdrop-blur-sm
            text-white
            flex items-center justify-center
            transition-all
          "
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Bottom Indicators */}
        {photos.length > 1 && (
          <div
            className="
          absolute bottom-0 inset-x-0
          flex justify-center flex-wrap
          gap-2
          px-4 py-4
          bg-linear-to-t from-black/70 to-transparent
        "
            onClick={(e) => e.stopPropagation()}
          >
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const diff = i - activeIdx;

                  if (diff > 0) {
                    for (let j = 0; j < diff; j++) onNext();
                  } else if (diff < 0) {
                    for (let j = 0; j < -diff; j++) onPrev();
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/*  SHARE MODAL */
const ShareModal = ({ vehicle, onClose }) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const whatsappShare = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Check out this vehicle: ${vehicle.title} at ₹${vehicle.price.toLocaleString("en-IN")}\n${url}`)}`,
      "_blank",
    );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-slate-200 dark:border-zinc-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-500" /> Share Listing
            </h4>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-4 bg-slate-50 dark:bg-zinc-950 rounded-xl px-3 py-2.5 border border-slate-100 dark:border-zinc-800 truncate">
            {url}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copyLink}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-black transition-all
                ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
            >
              {copied ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={whatsappShare}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20BD5C] text-white text-sm font-black transition-all"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* 
   PRICE INSIGHT BADGE
 */
const PriceInsight = ({ price, year, kmDriven }) => {
  const insight = useMemo(() => {
    // Dynamically tracks vehicle age safely based on current year
    const currentYear = new Date().getFullYear();
    const age = currentYear - (year || currentYear);
    const kilometers = kmDriven || 0;

    // Default configuration: Fair Price
    let tag = "Fair Price";
    let colorClasses =
      "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40";

    if (age <= 3 && kilometers < 40000) {
      tag = "Excellent Value";
      colorClasses =
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40";
    } else if (age >= 8 || kilometers > 120000) {
      tag = "High Usage";
      colorClasses =
        "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40";
    }

    return { tag, colorClasses };
  }, [year, kmDriven]);

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      {/* Insight Badge */}
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${insight.colorClasses}`}
        role="status"
      >
        {insight.tag}
      </span>
    </div>
  );
};

/* 
   MAIN COMPONENT
 */
const PortalVehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [bookingRequest, setBookingRequest] = useState(null);
  const [bookingType, setBookingType] = useState("booking");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // ── USE GLOBAL WISHLIST CONTEXT ──────────────────────────

  const { isWishlisted } = useWishlist();
  const wishlistCountRef = useRef(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [specsExpanded, setSpecsExpanded] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const token =
    sessionStorage.getItem("portal_token") ||
    sessionStorage.getItem("garage_token");
  const isPortalCustomer = !!sessionStorage.getItem("portal_token");
  const portalPreviewCustomerId = sessionStorage.getItem("portal_token")
    ? ""
    : getStoredPreviewCustomerId();

  const authHeaders = useCallback(
    () => buildPortalAuthHeaders(token, portalPreviewCustomerId),
    [token, portalPreviewCustomerId],
  );

  /* ── FETCH VEHICLE DETAILS ─────────────────────────────────
     This is the single source of truth for wishlisted state.
     Every page load / reload hits the API and reads the server's
     record of whether this customer has wishlisted the vehicle.
  ──────────────────────────────────────────────────────────── */
  const fetchVehicleDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/vehicle-sales/marketplace/${id}`,
        { headers: authHeaders() },
      );
      if (res.data.success) {
        const v = res.data.vehicle;
        setVehicle(v);
        setWhatsappLink(res.data.whatsappLink);
        setBookingRequest(res.data.bookingRequest || null);

        // Don't set wishlisted here — it comes from WishlistContext
        // which syncs with all components

        // Sync count from server on initial load
        const count = v.wishlistCount ?? 0;
        wishlistCountRef.current = count;
        setWishlistCount(count);
      } else {
        setError("Failed to retrieve vehicle details.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error loading vehicle details.");
    } finally {
      setLoading(false);
    }
  }, [id, authHeaders]);

  /* ── POLL WISHLIST COUNT ───────────────────────────────────
     Every 30 seconds silently re-fetch just the count so other
     users' wishlist actions are visible without a full reload.
     This hits a lightweight endpoint; if you don't have one,
     it falls back to a re-fetch of the full vehicle.
  ──────────────────────────────────────────────────────────── */
  const pollWishlistCount = useCallback(async () => {
    // Skip polling if tab is hidden (battery / network friendly)
    if (document.hidden) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/vehicle-sales/marketplace/${id}/wishlist-count`,
        { headers: authHeaders() },
      );
      if (res.data.success && typeof res.data.count === "number") {
        // Only update React state if value actually changed
        if (res.data.count !== wishlistCountRef.current) {
          wishlistCountRef.current = res.data.count;
          setWishlistCount(res.data.count);
        }
      }
    } catch {
      // Polling failures are silent — stale count is acceptable
    }
  }, [id, authHeaders]);

  useEffect(() => {
    if (!token) {
      navigate("/portal");
      return;
    }
    fetchVehicleDetails();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── START / STOP POLLING ─────────────────────────────────── */
  useEffect(() => {
    // Only poll once the vehicle is loaded
    if (!vehicle) return;

    const interval = setInterval(pollWishlistCount, 30_000);

    // Also update count when user returns to this tab
    const handleVisibility = () => {
      if (!document.hidden) pollWishlistCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [vehicle, pollWishlistCount]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const handleBookingRequest = async (requestType) => {
    if (!vehicle) return;
    setBookingSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/bookings/vehicle/${id}`,
        {
          requestType,
          note: bookingNote.trim(),
        },
        { headers: authHeaders() },
      );

      if (res.data.success) {
        showToast(
          requestType === "test-drive"
            ? "Test drive request sent"
            : "Booking request sent",
        );
        setBookingNote("");
        fetchVehicleDetails();
      } else {
        throw new Error(res.data.error || "Unable to submit request");
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || err.message || "Request failed");
    } finally {
      setBookingSubmitting(false);
    }
  };

  /* ── WISHLIST CHANGE HANDLER ───────────────────────────────
     The WishlistContext handles the toggle, we just update count
  ──────────────────────────────────────────────────────────── */
  const handleWishlistChange = useCallback(
    (_vehicleId, nextWishlisted, message) => {
      // Show toast immediately; counts are updated via global events
      showToast(
        message ||
          (nextWishlisted ? "Added to wishlist" : "Removed from wishlist"),
      );

      // Ensure server-side count sync after a short delay
      setTimeout(async () => {
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/vehicle-sales/marketplace/${id}/wishlist-count`,
            { headers: authHeaders() },
          );
          if (res.data.success && typeof res.data.count === "number") {
            wishlistCountRef.current = res.data.count;
            setWishlistCount(res.data.count);
          }
        } catch {
          // silent — optimistic/event-based value is fine as a fallback
        }
      }, 1200);
    },
    [id, authHeaders],
  );

  // Listen for global wishlist changes and update local count reactively
  useEffect(() => {
    const handler = (e) => {
      try {
        const { vehicleId, wishlisted } = e.detail || {};
        if (!vehicleId || vehicleId !== id) return;

        const prev = wishlistCountRef.current || 0;
        const next = wishlisted ? prev + 1 : Math.max(0, prev - 1);
        wishlistCountRef.current = next;
        setWishlistCount(next);
      } catch (err) {
        // ignore malformed events
      }
    };

    window.addEventListener("wishlist:changed", handler);
    return () => window.removeEventListener("wishlist:changed", handler);
  }, [id]);

  /* ── LOADING ── */
  if (loading)
    return (
      <div className="min-h-screen bg-[#f6f8ff] dark:bg-zinc-950 flex flex-col items-center justify-center gap-5">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/40" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <div className="absolute inset-3 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <FaCar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-slate-800 dark:text-zinc-200 font-black text-sm">
            Loading Vehicle
          </p>
          <p className="text-slate-400 dark:text-zinc-500 font-medium text-xs mt-1">
            Fetching listing details…
          </p>
        </div>
      </div>
    );

  /* ── ERROR ── */
  if (error || !vehicle)
    return (
      <div className="min-h-screen bg-[#f6f8ff] dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-xl text-center"
        >
          <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Listing Not Found
          </h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium mt-2 leading-relaxed">
            {error || "This vehicle listing could not be retrieved."}
          </p>
          <button
            onClick={() => navigate("/portal/dashboard")}
            className="mt-6 w-full py-3 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </motion.div>
      </div>
    );

  /* ── DERIVED ── */
  const photos = vehicle.photos?.length > 0 ? vehicle.photos : [];
  const isAvailable = ["Available", "Active"].includes(
    String(vehicle.status || "Available").trim(),
  );
  const isGarage = !!vehicle.ownerId && !vehicle.customerId;
  const prevPhoto = () =>
    setActivePhotoIdx((p) => (p === 0 ? photos.length - 1 : p - 1));
  const nextPhoto = () =>
    setActivePhotoIdx((p) => (p === photos.length - 1 ? 0 : p + 1));

  const SPEC_LIMIT = 6;
  const visibleSpecs = specsExpanded
    ? vehicle.specifications
    : vehicle.specifications?.slice(0, SPEC_LIMIT);

  return (
    <div className="min-h-screen bg-[#f6f8ff] dark:bg-zinc-950 transition-colors duration-300 pb-24 selection:bg-blue-100 dark:selection:bg-blue-900/50">
      {/* ── TOAST ── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX ── */}
      {lightboxOpen && photos.length > 0 && (
        <Lightbox
          photos={photos}
          activeIdx={activePhotoIdx}
          onClose={() => setLightboxOpen(false)}
          onNext={nextPhoto}
          onPrev={prevPhoto}
        />
      )}

      {/* ── SHARE MODAL ── */}
      {shareOpen && (
        <ShareModal vehicle={vehicle} onClose={() => setShareOpen(false)} />
      )}

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/92 dark:bg-zinc-900/92 backdrop-blur-xl border-b border-slate-200/70 dark:border-zinc-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/portal/dashboard")}
              className="shrink-0 w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Marketplace
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white truncate leading-tight">
                {vehicle.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* ── WISHLIST COUNT BADGE ── always reads from `wishlistCount` state ── */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-800 text-slate-650 dark:text-zinc-400">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
              <motion.span
                key={wishlistCount}
                initial={{ scale: 1.3, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-xs font-black leading-none tabular-nums"
              >
                {wishlistCount}
              </motion.span>
            </div>

            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Share listing"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <ThemeToggle variant="compact" />
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* LEFT */}
          <div className="lg:col-span-7 space-y-5">
            {/* ── PHOTO GALLERY ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="relative bg-zinc-950 aspect-video overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activePhotoIdx}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    src={
                      photos[activePhotoIdx]
                        ? photoUrl(photos[activePhotoIdx])
                        : FALLBACK
                    }
                    alt={vehicle.title}
                    className="w-full h-full object-contain cursor-auto"
                    onClick={() => setLightboxOpen(true)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK;
                    }}
                  />
                </AnimatePresence>

                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <WishlistHeart
                    vehicleId={id}
                    wishlisted={isWishlisted(id)}
                    token={token}
                    portalPreviewCustomerId={portalPreviewCustomerId}
                    onChange={handleWishlistChange}
                    size="sm"
                  />
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="w-8 h-8 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
                    title="View fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-sm text-white flex items-center justify-center transition-all hover:scale-110"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-0 inset-x-0 h-16 bg-linear-to-t from-black/65 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-blue-400" />₹
                    {(vehicle.price || 0).toLocaleString("en-IN")}
                  </span>
                  {photos.length > 1 && (
                    <span className="bg-black/60 backdrop-blur-sm text-white/80 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Eye className="w-3 h-3" /> {activePhotoIdx + 1}/
                      {photos.length}
                    </span>
                  )}
                </div>
              </div>

              {photos.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none bg-slate-50 dark:bg-zinc-950/60 border-t border-slate-100 dark:border-zinc-800">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`relative shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all
                        ${
                          idx === activePhotoIdx
                            ? "border-blue-500 ring-2 ring-blue-500/20 scale-95"
                            : "border-transparent opacity-55 hover:opacity-100 hover:border-slate-300 dark:hover:border-zinc-700"
                        }`}
                    >
                      <img
                        src={photoUrl(photo)}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── DESCRIPTION ── */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <SectionHeader
                icon={FileText}
                title="Description"
                accent="blue"
              />
              <p className="text-slate-600 dark:text-zinc-400 text-sm font-medium leading-relaxed whitespace-pre-line">
                {vehicle.description?.trim() ||
                  "No description provided for this listing."}
              </p>
            </div>

            {/* ── ENGINE & PERFORMANCE ── */}
            <CollapsibleCard title="Engine & Performance" icon={Zap}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full auto-rows-fr">
                <StatCard
                  icon={Zap}
                  label="Engine Capacity"
                  value={vehicle.engineCapacity || "N/A"}
                />
                <StatCard
                  icon={Gauge}
                  label="Mileage"
                  value={vehicle.mileage || "N/A"}
                />
                <StatCard
                  icon={Zap}
                  label="Max Power"
                  value={vehicle.power || "N/A"}
                />
                <StatCard
                  icon={Zap}
                  label="Max Torque"
                  value={vehicle.torque || "N/A"}
                />
                {vehicle.drivetrain && (
                  <StatCard
                    icon={TrendingUp}
                    label="Drivetrain"
                    value={vehicle.drivetrain}
                  />
                )}
                {vehicle.topSpeed && (
                  <StatCard
                    icon={Gauge}
                    label="Top Speed"
                    value={vehicle.topSpeed}
                  />
                )}
              </div>
            </CollapsibleCard>

            {/* ── CONDITION DETAILS ── */}
            <CollapsibleCard title="Condition Details" icon={ShieldCheck}>
              <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800">
                {[
                  {
                    label: "Accident History",
                    value: vehicle.accidentHistory || "No Accidents",
                    icon: ShieldCheck,
                  },
                  {
                    label: "Service History",
                    value: vehicle.serviceHistory || "Yes (Authorized)",
                    icon: Wrench,
                  },
                  {
                    label: "Number of Keys",
                    value: vehicle.noOfKeys || "2",
                    icon: Tag,
                  },
                  {
                    label: "Tyre Condition",
                    value: vehicle.tyreCondition || "Good",
                    icon: Gauge,
                  },
                  {
                    label: "Battery Condition",
                    value: vehicle.batteryCondition || "Good",
                    icon: Zap,
                  },
                  {
                    label: "Scratch/Dent Status",
                    value: vehicle.scratchDent || "None",
                    icon: Palette,
                  },
                  {
                    label: "Flood Damage Check",
                    value: vehicle.floodDamage || "No Damage",
                    icon: ShieldCheck,
                  },
                  {
                    label: "Paint Condition",
                    value: vehicle.paintCondition || "Original Paint",
                    icon: Palette,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-5 py-3.5 text-sm
                      ${i % 2 === 0 ? "bg-slate-50/70 dark:bg-zinc-950/50" : "bg-white dark:bg-zinc-900"}
                      ${i < 7 ? "border-b border-slate-100 dark:border-zinc-800" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-400 dark:text-zinc-500">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-bold text-slate-850 dark:text-zinc-200">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleCard>

            {/* ── FEATURES & COMFORT ── */}
            <CollapsibleCard title="Features & Comfort" icon={Users}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(vehicle.features || {}).map(([key, val]) => {
                  if (!val) return null;
                  const labels = {
                    sunroof: "Sunroof",
                    touchscreen: "Touchscreen Display",
                    androidAuto: "Android Auto",
                    appleCarPlay: "Apple CarPlay",
                    reverseCamera: "Reverse Camera",
                    parkingSensors: "Parking Sensors",
                    cruiseControl: "Cruise Control",
                    automaticClimateControl: "Auto Climate Control",
                    leatherSeats: "Leather Seats",
                    alloyWheels: "Alloy Wheels",
                    abs: "ABS",
                    airbags: "Airbags",
                    pushStartButton: "Push Start Button",
                  };
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-xs font-black uppercase tracking-wider shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {labels[key] || key}
                    </span>
                  );
                })}
                {(!vehicle.features ||
                  Object.values(vehicle.features).every((v) => !v)) && (
                  <span className="text-slate-400 text-xs font-medium">
                    No custom features listed for this vehicle.
                  </span>
                )}
              </div>
            </CollapsibleCard>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5 space-y-5">
            {/* ── TITLE + PRICE ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/40">
                  {vehicle.brand}
                </span>
                <span
                  className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border
                  ${
                    isAvailable
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                      : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                  />
                  {vehicle.status}
                </span>
                {/* ── WISHLIST COUNT IN TITLE CARD — live, animated ── */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/40">
                  <Heart className="w-3 h-3 fill-pink-500 text-pink-500 shrink-0" />
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 1.4, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="tabular-nums"
                  >
                    {wishlistCount}
                  </motion.span>{" "}
                  Wishlisted
                </span>
              </div>

              <div className="flex flex-col gap-3 w-full border-b border-slate-100 dark:border-zinc-800/60 pb-5">
                {/* Row 1: Full-Width Title Area */}
                <h1 className="text-3xl font-black text-slate-900 capitalize dark:text-white leading-tight tracking-tight">
                  {vehicle.title}
                </h1>

                {/* Row 2: Sub-Header Actions & Details Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  {/* Left Side: Status / Availability Badges */}
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {vehicle.testDriveAvailable && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs">
                        <CheckCircle
                          className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Available for Test Drive</span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Price Insight Block (Isolated completely from title boundaries) */}
                  <div className="flex shrink-0 items-center justify-start sm:justify-end">
                    <PriceInsight
                      price={vehicle.price}
                      year={vehicle.year}
                      kmDriven={vehicle.kmDriven}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">
                    Asking Price
                  </p>
                  <p className="text-3xl font-black bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent leading-none">
                    ₹{(vehicle.price || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1">
                    Total KM Driven
                  </p>
                  <p className="text-base font-black text-slate-700 dark:text-zinc-300">
                    {(vehicle.kmDriven || 0).toLocaleString()} KM
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── OVERVIEW ── */}
            <CollapsibleCard title="Overview" icon={FaCar}>
              {/* Standardized breakpoints for absolute responsiveness across all screen dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full auto-rows-fr">
                {[
                  { icon: Milestone, label: "Brand", value: vehicle.brand },
                  { icon: FaCar, label: "Model", value: vehicle.model },
                  vehicle.variant && {
                    icon: TrendingUp,
                    label: "Variant",
                    value: vehicle.variant,
                  },
                  { icon: Calendar, label: "Mfg Year", value: vehicle.year },
                  vehicle.regYear && {
                    icon: Calendar,
                    label: "Reg Year",
                    value: vehicle.regYear,
                  },
                  vehicle.regState && {
                    icon: MapPin,
                    label: "Reg State",
                    value: upperCase(vehicle.regState),
                  },
                  { icon: Fuel, label: "Fuel Type", value: vehicle.fuelType },
                  {
                    icon: Wrench,
                    label: "Transmission",
                    value: vehicle.transmission,
                  },
                  vehicle.ownership && {
                    icon: UserCheck,
                    label: "Ownership",
                    value: vehicle.ownership,
                    accent: true,
                  },
                  {
                    icon: Gauge,
                    label: "KM Driven",
                    value: `${(vehicle.kmDriven || 0).toLocaleString()} km`,
                  },
                  { icon: Palette, label: "Color", value: vehicle.color },
                  vehicle.bodyType && {
                    icon: TrendingUp,
                    label: "Body Type",
                    value: vehicle.bodyType,
                  },
                  vehicle.seats && {
                    icon: Users,
                    label: "Seating",
                    value: `${vehicle.seats} Seats`,
                  },
                  vehicle.insuranceValidity && {
                    icon: ShieldCheck,
                    label: "Insurance Valid",
                    value: vehicle.insuranceValidity,
                  },
                  vehicle.insuranceType && {
                    icon: ShieldCheck,
                    label: "Insurance Type",
                    value: vehicle.insuranceType,
                  },
                  vehicle.rcAvailability && {
                    icon: FileText,
                    label: "RC Availability",
                    value: vehicle.rcAvailability,
                  },
                ]
                  .filter(Boolean)
                  .map((stat, index) => (
                    <StatCard
                      key={index}
                      icon={stat.icon}
                      label={stat.label}
                      value={stat.value}
                      accent={stat.accent}
                    />
                  ))}

                {/* RTO Info - Spans across grid columns intelligently based on screen size */}
                {(vehicle.rtoCode || vehicle.rtoState) &&
                  (vehicle.rtoState || vehicle.regState) && (
                    <div className="col-span-1 sm:col-span-2">
                      <StatCard
                        icon={MapPin}
                        accent={true}
                        label="RTO Info"
                        value={[
                          vehicle.rtoCode ? upperCase(vehicle.rtoCode) : null,
                          vehicle.rtoState || vehicle.regState
                            ? upperCase(vehicle.rtoState || vehicle.regState)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" – ")}
                      />
                    </div>
                  )}
              </div>
            </CollapsibleCard>

            {/* ── SELLER INFORMATION ── */}
            <CollapsibleCard title="Seller Information" icon={Building}>
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/60">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-sm shrink-0 bg-linear-to-br from-indigo-500 to-blue-600">
                    {(
                      vehicle.sellerName ||
                      vehicle.ownerId?.garageName ||
                      vehicle.customerId?.name ||
                      "GS"
                    ).charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      {vehicle.sellerType ||
                        (isGarage ? "Garage Dealer" : "Private Seller")}
                    </p>
                    <h4 className="font-black text-slate-800 dark:text-zinc-100 text-base flex items-center gap-1.5 mt-0.5 leading-tight">
                      {vehicle.sellerName ||
                        (isGarage
                          ? vehicle.ownerId.garageName
                          : vehicle.customerId?.name)}
                      {(vehicle.verifiedSeller ||
                        vehicle.ownerId?.verificationStatus === "Verified" ||
                        vehicle.customerId?.isVerified) && (
                        <span
                          className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0"
                          title="Verified Seller"
                        >
                          <CheckCircle className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </h4>
                    {(vehicle.sellerLocation || vehicle.ownerId?.city) && (
                      <p className="text-xs font-medium text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{" "}
                        {vehicle.sellerLocation || vehicle.ownerId.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <ContactRow
                    icon={Phone}
                    label="Mobile Number"
                    value={
                      vehicle.sellerPhone ||
                      (isGarage
                        ? vehicle.ownerId.mobileNumber
                        : vehicle.customerId?.phone) ||
                      "Available on Request"
                    }
                    highlight
                    copyable
                  />
                  {isGarage && (
                    <ContactRow
                      icon={MapPin}
                      label="Garage Address"
                      value={`${vehicle.ownerId.address || "Available on request"}${vehicle.ownerId.city ? `, ${vehicle.ownerId.city}` : ""}`}
                    />
                  )}
                </div>

                <div className="rounded-3xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 p-4 space-y-3">
                  {bookingRequest ? (
                    <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <p className="mb-2">
                        Your{" "}
                        {bookingRequest.requestType === "test-drive"
                          ? "test drive"
                          : "booking"}{" "}
                        request is currently{" "}
                        <span className="font-black uppercase">
                          {bookingRequest.status}
                        </span>
                        .
                      </p>
                      {bookingRequest.status === "rejected" &&
                        bookingRequest.responseNote && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Reason: {bookingRequest.responseNote}
                          </p>
                        )}
                    </div>
                  ) : vehicle.status === "Sold" ? (
                    <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-sm font-bold text-red-700 dark:text-red-200">
                      This vehicle is sold. Booking and test drive requests are
                      disabled.
                    </div>
                  ) : vehicle.status === "Hidden" ? (
                    <div className="rounded-2xl bg-slate-50 dark:bg-zinc-950/30 border border-slate-200 dark:border-zinc-800 p-4 text-sm font-bold text-slate-600 dark:text-slate-300">
                      This listing is hidden from public search. You can still
                      contact the garage directly.
                    </div>
                  ) : vehicle.status === "Booked" ? (
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 text-sm font-bold text-amber-700 dark:text-amber-200">
                      This vehicle is already booked and cannot accept new
                      requests right now.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={bookingSubmitting}
                          onClick={() => setBookingType("booking")}
                          className={`w-full py-3 rounded-2xl text-sm font-bold transition-all ${bookingType === "booking" ? "bg-emerald-600 text-white" : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}
                        >
                          Booking Request
                        </button>
                        {vehicle.testDriveAvailable && (
                          <button
                            type="button"
                            disabled={bookingSubmitting}
                            onClick={() => setBookingType("test-drive")}
                            className={`w-full py-3 rounded-2xl text-sm font-bold transition-all ${bookingType === "test-drive" ? "bg-blue-600 text-white" : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900"}`}
                          >
                            Test Drive Request
                          </button>
                        )}
                      </div>
                      <textarea
                        value={bookingNote}
                        onChange={(e) => setBookingNote(e.target.value)}
                        rows={3}
                        placeholder="Message to garage (optional)"
                        className="w-full resize-none rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-slate-900 dark:text-zinc-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                      />
                      <button
                        type="button"
                        disabled={bookingSubmitting}
                        onClick={() => handleBookingRequest(bookingType)}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-md shadow-emerald-500/20"
                      >
                        {bookingSubmitting
                          ? "Sending request..."
                          : bookingType === "test-drive"
                            ? "Request Test Drive"
                            : "Request Booking"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2.5 space-y-2.5">
                  {whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5C] active:scale-[0.99] text-white font-black text-sm shadow-lg shadow-green-500/20 hover:shadow-xl transition-all"
                    >
                      <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  ) : (
                    <div className="text-center py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">
                        Seller contact unavailable
                      </p>
                    </div>
                  )}

                  {(vehicle.sellerPhone ||
                    (isGarage
                      ? vehicle.ownerId?.mobileNumber
                      : vehicle.customerId?.phone)) && (
                    <a
                      href={`tel:${vehicle.sellerPhone || (isGarage ? vehicle.ownerId.mobileNumber : vehicle.customerId?.phone)}`}
                      className="flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-black text-sm transition-all"
                    >
                      <Phone className="w-4 h-4 text-slate-500 dark:text-zinc-400" />{" "}
                      Call Seller
                    </a>
                  )}
                </div>
              </div>
            </CollapsibleCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortalVehicleDetails;
