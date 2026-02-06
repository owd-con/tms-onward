import { EmptyState, ErrorState } from "@/platforms/app/components";
import { TripCardSkeleton } from "./components/TripCardSkeleton";
import { useNavigate } from "react-router-dom";
import { HiArrowPath, HiArrowRight, HiMapPin } from "react-icons/hi2";
import { useTrip } from "@/services/driver/hooks";
import { formatStatus, getStatusColor } from "@/utils/status";
import { Page } from "@/platforms/app/components/page";
import type { Trip } from "@/services/types";
import { useMemo, useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Calculate waypoint progress
 */
const calculateProgress = (trip: Trip) => {
  const totalWaypoints = trip.trip_waypoints?.length || 0;
  const completedWaypoints =
    trip.trip_waypoints?.filter((wp) => wp.status === "completed").length || 0;

  return {
    total: totalWaypoints,
    completed: completedWaypoints,
    percentage:
      totalWaypoints > 0 ? (completedWaypoints / totalWaypoints) * 100 : 0,
  };
};

/**
 * Get current waypoint (first non-completed waypoint or last completed)
 */
const getCurrentWaypoint = (trip: Trip): string | null => {
  if (!trip.trip_waypoints || trip.trip_waypoints.length === 0) {
    return null;
  }

  // Find first non-completed waypoint
  const nextWaypoint = trip.trip_waypoints.find(
    (wp) => wp.status !== "completed",
  );

  if (nextWaypoint?.order_waypoint) {
    const type = nextWaypoint.order_waypoint.type || "Waypoint";
    return `${type} in progress`;
  }

  // If all completed, show last waypoint
  const lastWaypoint = trip.trip_waypoints[trip.trip_waypoints.length - 1];
  if (lastWaypoint?.order_waypoint) {
    const type = lastWaypoint.order_waypoint.type || "Waypoint";
    return `${type} completed`;
  }

  return null;
};

/**
 * Active Trips Screen
 * Displays all active trips for the current driver (Planned, Dispatched, In Transit)
 */
export const ActiveTrips = () => {
  const navigate = useNavigate();
  const { get, getResult } = useTrip();

  const trips = (getResult.data?.data as Trip[]) || [];
  const totalCount: number =
    (getResult.data?.meta?.total as number | undefined) ?? trips.length ?? 0;

  // Auto-fetch on mount
  useEffect(() => {
    get();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Memoized sorted trips by status priority
   */
  const sortedTrips = useMemo(() => {
    const statusPriority: Record<string, number> = {
      in_transit: 0,
      dispatched: 1,
      planned: 2,
    };
    return [...trips].sort((a: Trip, b: Trip) => {
      const priorityA = statusPriority[a.status] ?? 999;
      const statusB = statusPriority[b.status] ?? 999;
      return priorityA - statusB;
    });
  }, [trips]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = () => {
    get();
    toast.success("Trips refreshed successfully");
  };

  /**
   * Handle trip card click
   */
  const handleTripClick = (tripId: string) => {
    navigate(`/a/trips/${tripId}`);
  };

  return (
    <Page>
      <Page.Header
        title='Active Trips'
        subtitle={
          !getResult.isLoading && !getResult.isError
            ? `${totalCount} trip${totalCount !== 1 ? "s" : ""} in progress`
            : undefined
        }
        action={
          !getResult.isLoading && (
            <button
              onClick={handleRefresh}
              className='p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors'
              aria-label='Refresh'
            >
              <HiArrowPath size={20} />
            </button>
          )
        }
      />

      <Page.Body className='px-4 py-4 max-w-screen-md'>
        {/* Loading State */}
        {getResult.isLoading && (
          <div className='space-y-4'>
            <TripCardSkeleton />
            <TripCardSkeleton />
          </div>
        )}

        {/* Error State */}
        {getResult.isError && !getResult.isLoading && (
          <ErrorState
            error={getResult.error}
            title='Failed to Load Trips'
            message='An error occurred while fetching your trips'
            onRetry={handleRefresh}
            isRetrying={getResult.isFetching}
          />
        )}

        {/* Empty State */}
        {!getResult.isLoading && !getResult.isError && trips.length === 0 && (
          <EmptyState
            title='No Active Trips'
            message="You don't have any active trips at the moment"
          />
        )}

        {/* Trip List */}
        {!getResult.isLoading &&
          !getResult.isError &&
          sortedTrips.length > 0 && (
            <div className='space-y-4'>
              {sortedTrips.map((trip) => {
                const progress = calculateProgress(trip);
                const currentWaypoint = getCurrentWaypoint(trip);
                const vehiclePlate =
                  trip.vehicle?.plate_number || "Vehicle not assigned";

                return (
                  <div
                    key={trip.id}
                    onClick={() => handleTripClick(trip.id)}
                    className='bg-white rounded-xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex-1'
                  >
                    {/* Trip Header */}
                    <div className='flex items-start justify-between mb-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='typo-card-title font-semibold text-content-primary'>
                            {trip.trip_number}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(trip.status)}`}
                          >
                            {formatStatus(trip.status)}
                          </span>
                        </div>
                        <p className='typo-small text-content-secondary'>
                          {vehiclePlate}
                        </p>
                      </div>
                      <HiArrowRight
                        size={20}
                        className='text-content-tertiary flex-shrink-0'
                      />
                    </div>

                    {/* Current Waypoint */}
                    {currentWaypoint && (
                      <div className='flex items-start gap-2 mb-4'>
                        <HiMapPin
                          size={18}
                          className='text-blue-600 mt-0.5 flex-shrink-0'
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='typo-tiny text-content-secondary mb-0.5'>
                            Current Status
                          </p>
                          <p className='typo-small font-medium text-content-primary truncate'>
                            {currentWaypoint}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div>
                      <div className='flex items-center justify-between mb-1.5'>
                        <span className='typo-tiny text-content-secondary'>
                          Progress
                        </span>
                        <span className='typo-tiny font-semibold text-content-primary'>
                          {progress.completed}/{progress.total} stop
                          {progress.total !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className='w-full bg-slate-200 rounded-full h-2'>
                        <div
                          className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </Page.Body>

      <Page.Footer isMenu />
    </Page>
  );
};
