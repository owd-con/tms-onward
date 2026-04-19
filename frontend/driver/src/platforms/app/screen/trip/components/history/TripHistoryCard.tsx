import { HiArrowRight } from "react-icons/hi2";
import type { Trip } from "@/services/types";
import { statusBadge } from "@/shared/helper";

interface TripHistoryCardProps {
  trip: Trip;
  onTripClick: (tripId: string) => void;
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
}

export const TripHistoryCard = ({
  trip,
  onTripClick,
  formatDate,
  formatTime,
}: TripHistoryCardProps) => {
  return (
    <div
      onClick={() => onTripClick(trip.id)}
      className='bg-white rounded-xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]'
    >
      {/* Trip Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1 flex-wrap'>
            <h3 className='font-bold text-slate-900 truncate'>
              {trip.trip_number}
            </h3>
            {statusBadge(trip.status)}
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <span className='font-medium text-base-content'>
              {trip?.vehicle?.plate_number}
            </span>
            <span className='text-base-content/50'>•</span>
            <span className='text-base-content/70'>{trip?.vehicle?.type}</span>
          </div>
        </div>
        <HiArrowRight size={20} className='text-slate-400 flex-shrink-0 ml-2' />
      </div>

      {/* Date & Time - Combined */}
      <div className='flex items-center gap-2 text-sm text-slate-600'>
        <span>{formatDate(trip.started_at || trip.created_at)}</span>
        <span>•</span>
        <span>
          {formatTime(trip.started_at)} -{" "}
          {trip.completed_at ? formatTime(trip.completed_at) : "N/A"}
        </span>
      </div>
    </div>
  );
};

export default TripHistoryCard;
