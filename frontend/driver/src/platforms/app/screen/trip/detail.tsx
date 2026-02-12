import { useParams, useNavigate } from "react-router-dom";
import { Loading } from "@/components";
import { ErrorState } from "@/platforms/app/components";
import { TripStatsCard, TripInfoCard, WaypointList } from "./components/detail";
import { Page } from "@/platforms/app/components/page";
import { useTrip } from "@/services/driver/hooks";
import { useEffect, useState } from "react";
import type { Trip } from "@/services/types";

export const TripDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch trip detail
  const { show, showResult } = useTrip();

  const [trip, setTrip] = useState<Trip | null>(null);

  // Auto-fetch when id changes
  useEffect(() => {
    if (id) {
      show({ id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Update trip state when showResult.data changes
  useEffect(() => {
    setTrip(showResult?.data?.data as Trip | null);
  }, [showResult]);

  // Handle refetch
  const handleRefetch = () => {
    if (id) {
      show({ id });
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(`/a/trips`);
  };

  // Handle waypoint click (for navigation to detail page)
  const handleWaypointClick = (waypointId: string) => {
    navigate(`/a/trips/${id}/waypoints/${waypointId}`);
  };

  // Loading state
  if (showResult.isLoading) {
    return (
      <Page>
        <Page.Body className='flex items-center justify-center'>
          <Loading size='lg' variant='spinner' />
        </Page.Body>
      </Page>
    );
  }

  // Error state
  if (showResult.isError || !trip) {
    return (
      <Page>
        <Page.Header title='Trip Detail' withBack onBack={handleBack} />
        <Page.Body className='flex items-center justify-center px-4'>
          <ErrorState
            error={showResult.error}
            title='Failed to Load Trip'
            message={
              showResult.error instanceof Error
                ? showResult.error.message
                : "Failed to load trip details. Please check your connection."
            }
            onRetry={handleRefetch}
            isRetrying={showResult.isLoading}
            retryText={showResult.isLoading ? "Retrying..." : "Try Again"}
            secondaryAction={{
              label: "Go Back",
              onClick: handleBack,
            }}
          />
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page>
      <Page.Header
        title={trip?.trip_number || "Trip Detail"}
        withBack
        onBack={handleBack}
      />
      <Page.Body className='px-4 py-4 max-w-screen-md mx-auto'>
        {/* Trip Stats Card */}
        <TripStatsCard trip={trip} />

        {/* Trip Info Card */}
        <TripInfoCard tripId={id} trip={trip} onRefetch={handleRefetch} />

        {/* Waypoints Section */}
        <WaypointList
          tripId={id}
          trip={trip}
          onRefetch={handleRefetch}
          onViewDetails={handleWaypointClick}
        />
      </Page.Body>
    </Page>
  );
};
