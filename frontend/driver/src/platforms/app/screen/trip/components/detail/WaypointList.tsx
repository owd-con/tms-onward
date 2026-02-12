import { HiMapPin } from "react-icons/hi2";
import { useEffect } from "react";
import { useTrip } from "@/services/driver/hooks";
import type { Trip } from "@/services/types";
import { WaypointCard } from "./WaypointCard";

interface WaypointListProps {
  tripId?: string;
  trip: Trip | null;
  onRefetch?: () => void;
  onViewDetails?: (waypointId: string) => void;
}

/**
 * WaypointList - Waypoints section component for trip detail page
 *
 * Features:
 * - Manages start waypoint operation internally
 * - Start Waypoint button ONLY shown for the FIRST pending waypoint (no in_transit/dispatch after it)
 * - Section header with empty state
 * - Sorted waypoint cards by sequence_number
 * - Auto-refetch after successful start waypoint
 * - View Details button navigates to waypoint detail page for full actions
 *
 * Logic: Waypoints must be started in sequence. Only the first pending waypoint
 * that has no in_transit/dispatch waypoints after it can be started.
 *
 * @example
 * ```tsx
 * <WaypointList
 *   tripId={id}
 *   trip={trip}
 *   onRefetch={handleRefetch}
 *   onViewDetails={handleWaypointClick}
 * />
 * ```
 */
export const WaypointList = ({
  trip,
  onRefetch,
  onViewDetails,
}: WaypointListProps) => {
  // Hook for start waypoint mutation
  const { startWaypoint, startWaypointResult } = useTrip();

  // Sorted waypoints by sequence_number
  const sortedWaypoints = [...(trip?.trip_waypoints || [])].sort(
    (a, b) => a.sequence_number - b.sequence_number
  );

  // Check if there are any in_transit or dispatch waypoints
  // If yes, no new waypoints can be started
  const hasAnyInProgress = sortedWaypoints.some(
    (w) => w.status === "in_transit" || w.status === "dispatch"
  );

  const getCanStartWaypoint = (index: number) => {
    // Must be a pending waypoint
    if (sortedWaypoints[index].status !== "pending") return false;

    // Only allow starting if NO waypoints are in_transit/dispatch
    return !hasAnyInProgress;
  };

  // Auto-refetch after successful start waypoint
  useEffect(() => {
    if (startWaypointResult?.isSuccess) {
      onRefetch?.();
    }
  }, [startWaypointResult?.isSuccess]);

  // Handler
  const handleStartWaypoint = (waypointId: string) => {
    startWaypoint({ id: waypointId });
  };

  const isLoading = startWaypointResult?.isLoading;

  return (
    <>
      {/* Section Header */}
      <h2 className="typo-section-title font-semibold text-content-primary mb-4">
        Waypoints
      </h2>

      {/* Empty State */}
      {sortedWaypoints.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <HiMapPin size={32} className="text-slate-400" />
          </div>
          <h3 className="typo-section-title font-semibold text-content-primary mb-2">
            No Waypoints
          </h3>
          <p className="typo-body text-content-secondary">
            No waypoints assigned to this trip
          </p>
        </div>
      ) : (
        /* Waypoint List */
        <div className="space-y-4 mb-4">
          {sortedWaypoints.map((waypoint, index) => (
            <WaypointCard
              key={waypoint.id}
              waypoint={waypoint}
              tripStatus={trip?.status || ""}
              canStartWaypoint={getCanStartWaypoint(index)}
              onStartWaypoint={handleStartWaypoint}
              onViewDetails={onViewDetails}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default WaypointList;
