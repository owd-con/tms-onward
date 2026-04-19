import type { MouseEvent } from "react";
import { FiMapPin, FiTruck, FiChevronRight } from "react-icons/fi";
import type { Trip } from "@/services/types";
import { Badge } from "@/components/ui/badge";
import { formatStatus, getStatusVariant } from "@/utils/status";
import { statusBadge } from "@/shared/helper";

export interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

/**
 * TripCard - A card component for displaying trip information
 *
 * Features:
 * - Trip number badge with status indicator
 * - Color-coded status badges (In Transit=blue, Dispatched=yellow, Planned=gray)
 * - Vehicle information (plate number, type)
 * - Waypoint summary (e.g., "3 of 5 completed")
 * - Optional customer information
 * - Tap to navigate to trip detail
 * - Mobile-optimized with touch-friendly spacing
 */
export function TripCard({ trip, onPress }: TripCardProps) {
  const handlePress = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    onPress?.();
  };

  // Calculate waypoint progress
  const totalWaypoints = trip.trip_waypoints?.length || 0;
  const completedWaypoints =
    trip.trip_waypoints?.filter(
      (wp: { status: string }) => wp.status === "completed",
    ).length || 0;

  return (
    <div
      onClick={handlePress}
      className='card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transition-transform'
    >
      <div className='card-body p-4'>
        {/* Header: Trip Number and Status */}
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-2 flex-1 min-w-0'>
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0'>
              <FiTruck className='w-5 h-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium text-base-content truncate'>
                {trip.trip_number}
              </p>
              {trip.order?.customer && (
                <p className='text-xs text-base-content/60 truncate'>
                  {trip.order.customer.name}
                </p>
              )}
            </div>
          </div>
          {statusBadge(trip.status)}
        </div>

        {/* Vehicle Info */}
        {trip.vehicle && (
          <div className='flex items-center gap-2 mt-2'>
            <FiTruck className='w-4 h-4 text-base-content/50 flex-shrink-0' />
            <div className='flex items-center gap-2 text-sm'>
              <span className='font-medium text-base-content'>
                {trip.vehicle.plate_number}
              </span>
              <span className='text-base-content/50'>•</span>
              <span className='text-base-content/70'>{trip.vehicle.type}</span>
            </div>
          </div>
        )}

        {/* Waypoint Summary */}
        <div className='flex items-center gap-2 mt-2'>
          <FiMapPin className='w-4 h-4 text-base-content/50 flex-shrink-0' />
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-base-content/70'>
              {totalWaypoints > 0 ? (
                <>
                  <span className='font-medium text-base-content'>
                    {completedWaypoints}
                  </span>{" "}
                  of{" "}
                  <span className='font-medium text-base-content'>
                    {totalWaypoints}
                  </span>{" "}
                  waypoints
                </>
              ) : (
                <span className='text-base-content/50'>No waypoints</span>
              )}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {totalWaypoints > 0 && (
          <div className='mt-3'>
            <div className='w-full bg-base-300 rounded-full h-1.5 overflow-hidden'>
              <div
                className='bg-primary h-full rounded-full transition-all duration-300'
                style={{
                  width: `${(completedWaypoints / totalWaypoints) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer: Tap indicator */}
        <div className='flex items-center justify-end mt-2'>
          <span className='text-xs text-base-content/50 flex items-center gap-1'>
            Tap for details <FiChevronRight className='w-3 h-3' />
          </span>
        </div>
      </div>
    </div>
  );
}

export default TripCard;
