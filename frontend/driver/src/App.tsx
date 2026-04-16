import { lazy, Suspense, useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { FullPageLoading } from "@/components";
import { withGuard } from "./utils/guard";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";

// Lazy load routers
const AuthRouter = lazy(() => import("@/platforms/auth/router"));
const AppRouter = lazy(() => import("@/platforms/app/router"));

const GuardedAppRouter = withGuard(
  () => (
    <Suspense fallback={<FullPageLoading />}>
      <AppRouter />
    </Suspense>
  ),
  "/auth/login"
);

/**
 * ScanRedirect - Component to handle order_id from URL query param
 * - If user is not logged in → redirect to login with order_id stored in localStorage
 * - If user is logged in → redirect to /scan page
 */
const ScanRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.authenticated
  );

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      if (!isAuthenticated) {
        // Store order_id in localStorage for use after login
        localStorage.setItem("pending_order_id", orderId);
        // Redirect to login with fallback to scan page
        navigate(`/auth/login?fallback=${encodeURIComponent("/a/scan")}`, {
          replace: true,
        });
      } else {
        // User is logged in, redirect to scan page
        navigate(`/a/scan?order_id=${orderId}`, { replace: true });
      }
    }
  }, [orderId, isAuthenticated, navigate]);

  // Show loading while redirecting
  return <FullPageLoading />;
};

/**
 * App Root Component
 * Handles routing and order_id query parameter for scan functionality
 */
function App() {
  return (
    <Routes>
      {/* Handle scan order_id as query param (/scan?order_id=xxx) */}
      <Route
        path="/scan"
        element={
          <Suspense fallback={<FullPageLoading />}>
            <ScanRedirect />
          </Suspense>
        }
      />

      
      {/* Auth routes */}
      <Route
        path="/auth/*"
        element={
          <Suspense fallback={<FullPageLoading />}>
            <AuthRouter />
          </Suspense>
        }
      />

      {/* Protected app routes */}
      <Route path="/a/*" element={<GuardedAppRouter />} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/a/" replace />} />
    </Routes>
  );
}

export default App;
