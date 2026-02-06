import { Loading } from "@/components";
import { EmptyState, ErrorState } from "@/platforms/app/components";
import { TripHistoryCard } from "./components/history/TripHistoryCard";
import { useNavigate } from "react-router-dom";
import {
  HiArrowPath,
  HiCalendar,
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
} from "react-icons/hi2";
import { useTrip } from "@/services/driver/hooks";
import { Page } from "@/platforms/app/components/page";
import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { formatDate, formatTime } from "@/shared/utils/formatter";

export const TripHistory = () => {
  const navigate = useNavigate();
  const { getHistory, getHistoryResult } = useTrip();

  // Auto-trigger fetch on mount
  useEffect(() => {
    getHistory({ page: 1, limit: 50 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <HiCheckCircle size={16} className='text-green-600' />;
      case "Cancelled":
        return <HiExclamationCircle size={16} className='text-red-600' />;
      case "InProgress":
        return <HiClock size={16} className='text-yellow-600' />;
      default:
        return null;
    }
  };

  const trips = getHistoryResult.data?.data || [];

  // Memoized sorted trips by date (newest first)
  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [trips]);

  // Memoized handler functions
  const handleRefresh = () => {
    getHistory({ page: 1, limit: 50, status: "Completed" });
    toast.success("Trip history refreshed successfully");
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/a/trips/${tripId}`);
  };

  return (
    <Page>
      <Page.Header
        title='Trip History'
        subtitle='View your completed and past trips'
        action={
          !getHistoryResult.isLoading && (
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
        {getHistoryResult.isLoading && (
          <div className='flex flex-col items-center justify-center py-16'>
            <Loading size='lg' />
            <p className='mt-4 text-slate-600'>Loading trip history...</p>
          </div>
        )}

        {/* Error State */}
        {getHistoryResult.isError && !getHistoryResult.isLoading && (
          <ErrorState
            error={getHistoryResult.error}
            title='Failed to Load Trips'
            message='An error occurred while fetching trip history'
            onRetry={handleRefresh}
          />
        )}

        {/* Empty State */}
        {!getHistoryResult.isLoading &&
          !getHistoryResult.isError &&
          trips.length === 0 && (
            <EmptyState
              icon={<HiCalendar size={32} className='text-slate-400' />}
              title='No Trip History'
              message='Your completed trips will appear here'
            />
          )}

        {/* Trip List */}
        {!getHistoryResult.isLoading &&
          !getHistoryResult.isError &&
          sortedTrips.length > 0 && (
            <div className='space-y-4'>
              {sortedTrips.map((trip) => (
                <TripHistoryCard
                  key={trip.id}
                  trip={trip}
                  onTripClick={handleTripClick}
                  getStatusIcon={getStatusIcon}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
      </Page.Body>

      <Page.Footer isMenu />
    </Page>
  );
};
