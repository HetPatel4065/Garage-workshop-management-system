import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { getLoginRoute, getDashboardRoute, isGarageRole } from "../utils/roles";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isVerified } = useAuth();
  const location = useLocation();

  // ── 1. Still verifying token with backend ───────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-gray-400 text-sm font-medium animate-pulse">
          Verifying session…
        </p>
      </div>
    );
  }

  // ── 2. Not authenticated at all — send to correct login page ────────────
  if (!user || !isVerified) {
    // Preserve where the user wanted to go
    const role = null;
    return (
      <Navigate
        to={getLoginRoute(role)}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  const role = user.role?.toLowerCase();

  // ── 3. Customer tried to hit a garage route → portal ───────────────────
  if (role === "customer") {
    return <Navigate to="/portal/dashboard" replace />;
  }

  // ── 4. Non-garage role somehow (safety net) ─────────────────────────────
  if (!isGarageRole(role)) {
    return <Navigate to={getDashboardRoute(role)} replace />;
  }

  // ── 5. Role is authenticated but not in the allowed list ───────────────
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location.pathname, requiredRoles: allowedRoles }}
        replace
      />
    );
  }

  // ── 6. All checks passed ────────────────────────────────────────────────
  return children;
}
