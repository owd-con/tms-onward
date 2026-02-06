import type { ReactNode } from "react";
import {
  HiArrowRight,
  HiCalendar,
  HiClock,
  HiMapPin,
} from "react-icons/hi2";
import type { Trip } from "@/services/types";
import { statusBadge } from "@/shared/helper";

interface TripHistoryCardProps {
  trip: Trip;
  onTripClick: (tripId: string) => void;
  getStatusIcon: (status: string) => ReactNode;
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
}

export const TripHistoryCard = ({
  trip,
  onTripClick,
  getStatusIcon,
  formatDate,
  formatTime,
}: TripHistoryCardProps) => {
  const totalWaypoints = trip.trip_waypoints?.length || 0;
  const completedWaypoints =
    trip.trip_waypoints?.filter((w) => w.status === "completed").length || 0;

  return (
    <div
      onClick={() => onTripClick(trip.id)}
      className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
    >
      {/* Trip Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-slate-900 truncate">
              {trip.trip_number}
            </h3>
            {statusBadge(trip.status)}
          </div>
          <p className="text-sm text-slate-600 truncate">
            {trip.vehicle?.plate_number || "Vehicle not assigned"}
          </p>
        </div>
        <HiArrowRight size={20} className="text-slate-400 flex-shrink-0 ml-2" />
      </div>

      {/* Trip Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <HiMapPin size={16} className="text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Stops</p>
            <p className="text-sm font-semibold text-slate-800">
              {completedWaypoints}/{totalWaypoints}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HiCalendar size={16} className="text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Date</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatDate(trip.started_at || trip.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <HiClock size={14} className="text-slate-400" />
          <span className="text-xs text-slate-600">
            {formatTime(trip.started_at)} -{" "}
            {trip.completed_at ? formatTime(trip.completed_at) : "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon(trip.status)}
          <span className="text-xs font-medium text-slate-700">
            {trip.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TripHistoryCard;
