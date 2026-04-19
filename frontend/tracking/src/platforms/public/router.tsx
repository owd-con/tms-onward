/**
 * Public Tracking Router
 * Handles public-facing tracking pages (no authentication required)
 */

import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { FullPageLoading } from '@/components';

// Lazy load pages for better performance
const TrackingPage = lazy(
  () => import('@/platforms/public/screen/TrackingPage')
);
const TrackingResultPage = lazy(
  () => import('@/platforms/public/screen/TrackingResultPage')
);
const NotFoundPage = lazy(
  () => import('@/platforms/public/screen/NotFoundPage')
);

export function PublicRouter() {
  return (
    <Suspense fallback={<FullPageLoading />}>
      <Routes>
        {/* Home / Tracking Form Page */}
        <Route
          path="/"
          element={
            <Suspense fallback={<FullPageLoading />}>
              <TrackingPage />
            </Suspense>
          }
        />

        {/* Tracking Result Page */}
        <Route
          path="/tracking/:code"
          element={
            <Suspense fallback={<FullPageLoading />}>
              <TrackingResultPage />
            </Suspense>
          }
        />

        {/* 404 Not Found Page */}
        <Route
          path="*"
          element={
            <Suspense fallback={<FullPageLoading />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default PublicRouter;
