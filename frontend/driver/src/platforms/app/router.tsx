import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { FullPageLoading } from "@/components";

// Lazy load app screens
const Home = lazy(() =>
  import("./screen/home").then((m) => ({ default: m.ActiveTrips }))
);
const TripHistory = lazy(() =>
  import("./screen/trip/history").then((m) => ({ default: m.TripHistory }))
);
const Profile = lazy(() =>
  import("./screen/profile").then((m) => ({ default: m.Profile }))
);
const TripDetail = lazy(() =>
  import("./screen/trip/detail").then((m) => ({ default: m.TripDetail }))
);
const WaypointDetail = lazy(() =>
  import("./screen/trip/waypoint-detail").then((m) => ({ default: m.WaypointDetail }))
);
const ScanPage = lazy(() =>
  import("./screen/scan").then((m) => ({ default: m.ScanPage }))
);

const AppRouter = () => {
  return (
    <Suspense fallback={<FullPageLoading />}>
      <Routes>
        {/* Default route - Home */}
        <Route index element={<Home />} />

        {/* Trip History */}
        <Route path="history" element={<TripHistory />} />

        {/* Profile */}
        <Route path="profile" element={<Profile />} />

        {/* Trip Detail */}
        <Route path="trips/:id" element={<TripDetail />} />

        {/* Waypoint Detail */}
        <Route path="trips/:id/waypoints/:waypointId" element={<WaypointDetail />} />

        {/* Scan Order - Protected route */}
        <Route path="scan" element={<ScanPage />} />

        {/* Fallback - redirect to active trips */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
