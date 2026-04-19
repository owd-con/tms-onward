import { EmptyState, ErrorState } from "@/platforms/app/components";
import { TripCardSkeleton } from "./components/TripCardSkeleton";
import { useNavigate } from "react-router-dom";
import { HiArrowPath } from "react-icons/hi2";
import { useTrip } from "@/services/driver/hooks";
import { Page } from "@/platforms/app/components/page";
import type { Trip } from "@/services/types";
import { useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import TripCard from "./components/TripCard";

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
                return (
                  <div key={trip.id} onClick={() => handleTripClick(trip.id)}>
                    <TripCard trip={trip} />
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
