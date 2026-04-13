import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { FullPageLoading } from "@/components";
import { withGuard } from "./utils/guard";
import { useDisplayScale } from "@/hooks/useDisplayScale";

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

function App() {
  // Apply display scaling compensation
  useDisplayScale();

  return (
    <Routes>
      <Route
        path="/auth/*"
        element={
          <Suspense fallback={<FullPageLoading />}>
            <AuthRouter />
          </Suspense>
        }
      />
      <Route path="/a/*" element={<GuardedAppRouter />} />
      <Route path="*" element={<Navigate to="/a/dashboard" replace />} />
    </Routes>
  );
}

export default App;
