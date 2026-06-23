import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { getDashboardRoute, canAccessCustomerPortal } from "./utils/roles";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import OwnerLogin from "./pages/OwnerLogin";
import StaffLogin from "./pages/StaffLogin";
import AdminLogin from "./pages/AdminLogin";
import CustomerLogin from "./pages/CustomerLogin";
import Signup from "./pages/Signup";
import OwnerSignup from "./pages/OwnerSignup";
import OwnerRegister from "./pages/OwnerRegister";
import StaffSignup from "./pages/StaffSignup";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./context/ProtectedRoutes";
import PortalHome from "./pages/portal/PortalHome";
import ResetPassword from "./pages/ResetPassword";

const DashboardLayout = lazy(() => import("./pages/portal/DashboardLayout"));
const PortalDashboardOverview = lazy(() =>
  import("./pages/portal/DashboardLayout").then((module) => ({
    default: module.PortalDashboardOverview,
  })),
);
const PortalDashboardVehicles = lazy(() =>
  import("./pages/portal/DashboardLayout").then((module) => ({
    default: module.PortalDashboardVehicles,
  })),
);
const PortalDashboardJobCards = lazy(() =>
  import("./pages/portal/DashboardLayout").then((module) => ({
    default: module.PortalDashboardJobCards,
  })),
);
const PortalDashboardServices = lazy(() =>
  import("./pages/portal/DashboardLayout").then((module) => ({
    default: module.PortalDashboardServices,
  })),
);
const PortalDashboardInvoices = lazy(() =>
  import("./pages/portal/DashboardLayout").then((module) => ({
    default: module.PortalDashboardInvoices,
  })),
);
const PortalDashboardPreOwnedCars = lazy(() =>
  import("./pages/portal/DashboardLayout").then((module) => ({
    default: module.PortalDashboardPreOwnedCars,
  })),
);

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Inventory = lazy(() => import("./pages/Inventory"));
const JobCards = lazy(() => import("./pages/JobCards"));
const Customers = lazy(() => import("./pages/Customers"));
const RequestedCustomers = lazy(() => import("./pages/RequestedCustomers"));
const Profile = lazy(() => import("./pages/Profile"));
const Billing = lazy(() => import("./pages/Billing"));
const StaffMembers = lazy(() => import("./pages/StaffMembers"));
const Services = lazy(() => import("./pages/Services"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const ServiceReminders = lazy(() => import("./pages/ServiceReminders"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PortalSupport = lazy(() => import("./pages/portal/PortalSupport"));
const PartnershipLeads = lazy(() => import("./pages/PartnershipLeads"));
const MarketplaceListings = lazy(() => import("./pages/MarketplaceListings"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const PortalVehicleDetails = lazy(
  () => import("./pages/portal/PortalVehicleDetails"),
);

import ToastContainer from "./components/UI/ToastContainer";
import GarageLayout from "./components/Layout/GarageLayout";
import AuthHistoryGuard from "./components/AuthHistoryGuard";

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: "easeInOut" }}
    className="max-w-screen max-h-screen mx-auto"
  >
    {children}
  </motion.div>
);

const MarketplaceRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/portal/marketplace/pre-owned-cars/${id}`} replace />;
};

function PublicOnlyRoute({ children }) {
  const { user, token, loading, isVerified } = useAuth();

  // Customer portal session (OTP login) — redirect before auth bootstrap finishes
  const portalToken = sessionStorage.getItem("portal_token");
  if (portalToken) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">
            Initializing…
          </p>
        </div>
      </div>
    );
  }

  if (token && user && isVerified) {
    return <Navigate to={getDashboardRoute(user?.role)} replace />;
  }

  return children;
}

function App() {
  const { user, token, loading, isVerified } = useAuth();
  const location = useLocation();

  const [portalToken, setPortalToken] = useState(
    sessionStorage.getItem("portal_token"),
  );

  useEffect(() => {
    setPortalToken(sessionStorage.getItem("portal_token"));
  }, [location]);

  const hasPortalAccess =
    !!portalToken ||
    (!loading &&
      !!token &&
      !!user &&
      isVerified &&
      canAccessCustomerPortal(user.role));

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">
            Initializing System…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthHistoryGuard />
      <ToastContainer />

      <Suspense
        fallback={
          <div className="fixed inset-0 z-9999 h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 transition-colors">
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                {/* Spinner */}
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-300 dark:border-slate-600"></div>

                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500 dark:border-t-blue-400"></div>
                </div>

                {/* Text */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-white">
                    Loading...
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route
              path="/"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <LandingPage />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <Login />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/owner/login"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <OwnerLogin />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/staff/login"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <StaffLogin />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/admin/login"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <AdminLogin />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <Signup />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/owner/signup"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <OwnerSignup />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/owner/register"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <OwnerRegister />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/staff/signup"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <StaffSignup />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/customer/login"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <CustomerLogin />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PageTransition>
                  <ResetPassword />
                </PageTransition>
              }
            />

            <Route
              path="/unauthorized"
              element={
                <PageTransition>
                  <Unauthorized />
                </PageTransition>
              }
            />

            <Route
              path="/aboutus"
              element={
                <PageTransition>
                  <AboutUs />
                </PageTransition>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <PageTransition>
                  <PrivacyPolicy />
                </PageTransition>
              }
            />
            <Route
              path="/portal/support"
              element={
                <PageTransition>
                  <PortalSupport />
                </PageTransition>
              }
            />

            <Route
              path="/portal"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <PortalHome />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/portal/login"
              element={
                <PublicOnlyRoute>
                  <PageTransition>
                    <CustomerLogin />
                  </PageTransition>
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/portal/dashboard"
              element={
                hasPortalAccess ? (
                  <PageTransition>
                    <DashboardLayout />
                  </PageTransition>
                ) : (
                  <Navigate to="/portal" replace />
                )
              }
            >
              <Route
                index
                element={
                  <PageTransition>
                    <PortalDashboardOverview />
                  </PageTransition>
                }
              />
              <Route
                path="vehicles"
                element={
                  <PageTransition>
                    <PortalDashboardVehicles />
                  </PageTransition>
                }
              />
              <Route
                path="job-cards"
                element={
                  <PageTransition>
                    <PortalDashboardJobCards />
                  </PageTransition>
                }
              />
              <Route
                path="services"
                element={
                  <PageTransition>
                    <PortalDashboardServices />
                  </PageTransition>
                }
              />
              <Route
                path="invoices"
                element={
                  <PageTransition>
                    <PortalDashboardInvoices />
                  </PageTransition>
                }
              />

              <Route
                path="pre-owned-cars"
                element={
                  <PageTransition>
                    <PortalDashboardPreOwnedCars />
                  </PageTransition>
                }
              />
            </Route>

            {/* ✅ Specific route FIRST */}
            <Route
              path="/portal/marketplace/pre-owned-cars/:id"
              element={
                hasPortalAccess ? (
                  <PageTransition>
                    <PortalVehicleDetails />
                  </PageTransition>
                ) : (
                  <Navigate to="/portal" replace />
                )
              }
            />

            <Route
              path="/portal/marketplace/:id"
              element={<MarketplaceRedirect />}
            />

            <Route
              element={
                <ProtectedRoute>
                  <GarageLayout />
                </ProtectedRoute>
              }
            >
              {/* All roles */}
              <Route
                path="/dashboard"
                element={
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                }
              />
              <Route
                path="/customers"
                element={
                  <PageTransition>
                    <Customers />
                  </PageTransition>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute
                    allowedRoles={["owner", "admin", "mechanic", "advisor"]}
                  >
                    <PageTransition>
                      <Vehicles />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/job-cards"
                element={
                  <PageTransition>
                    <JobCards />
                  </PageTransition>
                }
              />
              <Route
                path="/services"
                element={
                  <PageTransition>
                    <Services />
                  </PageTransition>
                }
              />
              <Route
                path="/inventory"
                element={
                  <PageTransition>
                    <Inventory />
                  </PageTransition>
                }
              />
              <Route
                path="/search"
                element={
                  <PageTransition>
                    <SearchPage />
                  </PageTransition>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PageTransition>
                    <Notifications />
                  </PageTransition>
                }
              />
              <Route
                path="/profile"
                element={
                  <PageTransition>
                    <Profile />
                  </PageTransition>
                }
              />

              {/* Owner / Admin only */}
              <Route
                path="/billing"
                element={
                  <ProtectedRoute allowedRoles={["owner", "admin"]}>
                    <PageTransition>
                      <Billing />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff-members"
                element={
                  <ProtectedRoute allowedRoles={["owner", "admin"]}>
                    <PageTransition>
                      <StaffMembers />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requested-customers"
                element={
                  <ProtectedRoute allowedRoles={["owner", "admin"]}>
                    <PageTransition>
                      <RequestedCustomers />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/partnership-leads"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <PageTransition>
                      <PartnershipLeads />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity-log"
                element={
                  <ProtectedRoute allowedRoles={["owner", "admin"]}>
                    <PageTransition>
                      <ActivityLog />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sell-vehicles"
                element={
                  <ProtectedRoute allowedRoles={["owner", "admin"]}>
                    <PageTransition>
                      <MarketplaceListings />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reminders"
                element={
                  <ProtectedRoute allowedRoles={["owner", "admin"]}>
                    <PageTransition>
                      <ServiceReminders />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute
                    allowedRoles={["owner", "admin", "mechanic", "advisor"]}
                  >
                    <PageTransition>
                      <HelpCenter />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={["owner", "admin"]}>
                    <PageTransition>
                      <Settings />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* ── 404 ── */}
            <Route
              path="*"
              element={
                <PageTransition>
                  <div className="h-screen w-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
                    <h1 className="text-6xl font-bold text-gray-800">404</h1>
                    <p className="text-gray-500 text-lg">Page Not Found</p>
                    <button
                      onClick={() => window.history.back()}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl text-sm font-bold text-white transition-all duration-300"
                    >
                      Go Back
                    </button>
                  </div>
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

export default App;
