import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardRoute } from "../utils/roles";
import {
  HISTORY_SEEDED_KEY,
  isPublicAuthPath,
  seedSessionHistory,
} from "../utils/authHistory";


export default function AuthHistoryGuard() {
  const { user, token, isVerified, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const routerPathRef = useRef(location.pathname);

  const portalToken = sessionStorage.getItem("portal_token");
  const garageAuthed = !loading && token && user && isVerified;

  const sessionHome = useMemo(() => {
    if (portalToken) return "/portal/dashboard";
    if (garageAuthed) return getDashboardRoute(user?.role);
    return null;
  }, [portalToken, garageAuthed, user?.role]);

  routerPathRef.current = location.pathname;

  useEffect(() => {
    if (!sessionHome || location.pathname !== sessionHome) return;
    if (sessionStorage.getItem(HISTORY_SEEDED_KEY) === sessionHome) return;
    seedSessionHistory(sessionHome);
  }, [sessionHome, location.pathname]);

  useEffect(() => {
    if (!sessionHome) return;

    const onPopState = () => {
      const path = window.location.pathname;
      if (!isPublicAuthPath(path)) return;

      window.history.pushState({ appSession: true }, "", sessionHome);

      if (routerPathRef.current !== sessionHome) {
        navigate(sessionHome, { replace: true });
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [sessionHome, navigate]);

  return null;
}
