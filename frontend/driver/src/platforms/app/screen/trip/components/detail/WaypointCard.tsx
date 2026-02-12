import { HiCheck, HiMapPin, HiExclamationTriangle } from "react-icons/hi2";
import { Button } from "@/components";
import { statusBadge } from "@/shared/helper";
import { formatDateTime } from "@/shared/utils/formatter";

interface WaypointCardProps {
  waypoint: any;
  tripStatus: string;
  canStartWaypoint?: boolean;
  onStartWaypoint?: (waypointId: string) => void;
  onViewDetails?: (waypointId: string) => void;
  isLoading?: boolean;
}

/**
 * Get waypoint type from order_waypoint
 */
const getWaypointType = (waypoint: any) => {
  return waypoint.order_waypoint?.type || "pickup";
};

/**
 * WaypointCard - Waypoint item component for trip detail page
 *
 * Displays:
 * - Status indicator with icon
 * - Waypoint type badge (Pickup/Delivery)
 * - Status badge
 * - Sequence number
 * - Notes (if any)
 * - Received by (for completed delivery)
 * - Failed reason (for failed waypoints)
 * - Start Waypoint button (only for pending + trip in_transit + THIS waypoint can start)
 * - Click to view details (for in_transit/completed/failed)
 *
 * Note: Arrive, Complete, and Report Failed actions are handled in waypoint detail page.
 */
export const WaypointCard = ({
  waypoint,
  tripStatus,
  canStartWaypoint,
  onStartWaypoint,
  onViewDetails,
  isLoading,
}: WaypointCardProps) => {
  const waypointType = getWaypointType(waypoint);
  const isPickup = waypointType === "pickup";
  const isClickable = ["completed", "failed", "in_transit"].includes(
    waypoint.status,
  );

  const handleCardClick = () => {
    if (isClickable && onViewDetails) {
      onViewDetails(waypoint.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 ${
        isClickable
          ? "cursor-pointer active:scale-[0.99] transition-transform"
          : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Waypoint Header */}
      <div className='flex items-start gap-3 mb-4'>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            waypoint.status === "completed"
              ? "bg-green-500"
              : waypoint.status === "failed"
                ? "bg-red-500"
                : waypoint.status === "in_transit"
                  ? "bg-blue-500"
                  : "bg-slate-300"
          }`}
        >
          {waypoint.status === "completed" ? (
            <HiCheck size={16} className='text-white' />
          ) : waypoint.status === "failed" ? (
            <HiExclamationTriangle size={16} className='text-white' />
          ) : (
            <span className='text-white font-bold text-sm'>
              {waypoint.sequence_number}
            </span>
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1 flex-wrap'>
            <h3 className='typo-card-title font-semibold text-content-primary'>
              {isPickup ? "Pickup Point" : "Delivery Point"}
            </h3>
            {statusBadge(waypoint.status)}
          </div>
          <div className='flex items-center gap-1 typo-small text-content-secondary'>
            <HiMapPin size={14} />
            <span className='truncate'>
              Waypoint #{waypoint.sequence_number}{" "}
              <span className='capitalize font-semibold'>
                {`(${waypoint.order_waypoint?.address?.name})`}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Waypoint Details */}
      <div className='space-y-3 pl-11'>
        {waypoint.notes && (
          <div className='mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
            <p className='typo-tiny text-amber-800'>
              <strong>Note:</strong> {waypoint.notes}
            </p>
          </div>
        )}

        {/* Show received_by for completed delivery */}
        {waypoint.status === "completed" &&
          !isPickup &&
          waypoint.received_by && (
            <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
              <p className='typo-tiny text-green-800'>
                <strong>Received by:</strong> {waypoint.received_by}
              </p>
            </div>
          )}

        {/* Show failed_reason for failed waypoints */}
        {waypoint.status === "failed" && waypoint.failed_reason && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
            <p className='typo-tiny text-red-800'>
              <strong>Failed reason:</strong> {waypoint.failed_reason}
            </p>
          </div>
        )}

        {waypoint.actual_completion_time && (
          <p className='typo-tiny text-content-secondary'>
            Completed at {formatDateTime(waypoint.actual_completion_time)}
          </p>
        )}
        {waypoint.actual_arrival_time && !waypoint.actual_completion_time && (
          <p className='typo-tiny text-content-secondary'>
            Arrived at {formatDateTime(waypoint.actual_arrival_time)}
          </p>
        )}
      </div>

      {/* Start Waypoint button - Only for pending + trip in_transit + THIS waypoint can start */}
      {waypoint.status === "pending" &&
        tripStatus === "in_transit" &&
        canStartWaypoint && (
          <div className="mt-5 pl-11">
            <Button
              variant="primary"
              size="xs"
              shape="block"
              isLoading={isLoading}
              onClick={() => onStartWaypoint?.(waypoint.id)}
            >
              Start Waypoint
            </Button>
          </div>
        )}
    </div>
  );
};

export default WaypointCard;
