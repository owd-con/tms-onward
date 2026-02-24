import type {
  OrderWaypoint,
  TripWaypoint,
  WaypointStatus,
} from "@/services/types";
import { formatStatus } from "@/utils/status";
import { dateFormat, statusBadge } from "@/shared/helper";
import { formatCurrency } from "@/shared/utils/formatter";
import { getDisplayPath } from "@/utils/common";
import { Button } from "@/components";
import { HiArrowUturnLeft } from "react-icons/hi2";

interface WaypointTimelineProps {
  waypoints: OrderWaypoint[] | TripWaypoint[];
  /**
   * Trip number for display (used when order has been rescheduled)
   * Shows progression: Trip 1, Trip 2, etc.
   */
  tripNumber?: number;
  /**
   * Trip status badge (e.g., "Failed" for old trips, "Pending" for new trips)
   */
  tripStatus?: string;
  /**
   * Callback for Return action on failed waypoints
   */
  onReturn?: (waypoint: OrderWaypoint | TripWaypoint) => void;
}

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  pending: {
    color: "text-neutral-content",
    bgColor: "bg-neutral",
  },
  dispatched: {
    color: "text-primary-content",
    bgColor: "bg-primary",
  },
  in_transit: {
    color: "text-info-content",
    bgColor: "bg-info",
  },
  completed: {
    color: "text-success-content",
    bgColor: "bg-success",
  },
  failed: {
    color: "text-error-content",
    bgColor: "bg-error",
  },
  cancelled: {
    color: "text-error-content",
    bgColor: "bg-error",
  },
  returned: {
    color: "text-warning-content",
    bgColor: "bg-warning",
  },
};

/**
 * Type guard to check if waypoint is TripWaypoint
 */
function isTripWaypoint(
  waypoint: OrderWaypoint | TripWaypoint,
): waypoint is TripWaypoint {
  return "order_waypoint" in waypoint;
}

/**
 * TMS Onward - Waypoint Timeline Component
 *
 * Visual display of waypoint progress with status indicators
 * Supports both OrderWaypoint (for order detail) and TripWaypoint (for trip detail)
 *
 * For rescheduled orders, shows trip progression (Trip 1, Trip 2, etc.)
 * and trip status badges.
 */
const WaypointTimeline = ({
  waypoints,
  tripNumber,
  tripStatus,
  onReturn,
}: WaypointTimelineProps) => {
  if (!waypoints || waypoints.length === 0) {
    return (
      <div className='text-center py-8 text-base-content/60'>
        No waypoints available
      </div>
    );
  }

  // Trip badge configuration
  const getTripBadge = () => {
    if (!tripNumber) return null;

    let badgeColor = "badge-neutral";
    let badgeLabel = `Trip ${tripNumber}`;

    if (tripStatus === "failed" || tripStatus === "cancelled") {
      badgeColor = "badge-error";
    } else if (tripStatus === "completed") {
      badgeColor = "badge-success";
    } else if (tripStatus === "in_transit") {
      badgeColor = "badge-info";
    } else if (tripStatus === "planned" || tripStatus === "pending") {
      badgeColor = "badge-warning";
    }

    return (
      <div className={`badge badge-sm ${badgeColor} mb-4`}>
        {badgeLabel}
        {tripStatus && ` - ${formatStatus(tripStatus)}`}
      </div>
    );
  };

  const sortedWaypoints = [...waypoints].sort((a, b) => {
    if (a.sequence_number !== undefined && b.sequence_number !== undefined) {
      return a.sequence_number - b.sequence_number;
    }
    // Fallback to created_at if no sequence
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Determine container styling based on trip status
  const getContainerClassName = () => {
    if (tripStatus === "failed" || tripStatus === "cancelled") {
      return "relative border-l-4 border-error pl-6 py-2 mb-4 bg-error/5 rounded-r-lg";
    }
    return "relative";
  };

  // Adjust vertical line position based on container
  const getLineStyle = () => {
    if (tripStatus === "failed" || tripStatus === "cancelled") {
      return "absolute left-[23px] top-0 bottom-0 w-0.5 bg-base-300";
    }
    return "absolute left-[19px] top-0 bottom-0 w-0.5 bg-base-300";
  };

  return (
    <div className={getContainerClassName()}>
      {/* Trip Badge (for rescheduled orders) */}
      {getTripBadge()}

      {/* Vertical line */}
      <div className={getLineStyle()} />

      <div className='space-y-4'>
        {sortedWaypoints.map((waypoint) => {
          // Handle both OrderWaypoint and TripWaypoint
          const isTripWp = isTripWaypoint(waypoint);
          const status = isTripWp ? waypoint.status : waypoint.dispatch_status;
          const wpData = isTripWp ? waypoint.order_waypoint : waypoint;

          // Guard: if TripWaypoint but no nested order_waypoint data, skip
          if (isTripWp && !wpData) {
            return null;
          }

          const config = statusConfig[status as WaypointStatus];
          console.log(
            "Rendering waypoint with status:",
            status,
            "config:",
            config,
          ); // Debug log
          const isPickup = wpData?.type === "pickup";

          return (
            <div key={waypoint.id} className='relative flex gap-4'>
              {/* Status Badge */}
              <div className='relative z-10 flex-shrink-0'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${config.bgColor} ${config.color}`}
                >
                  {waypoint.sequence_number !== 0
                    ? waypoint.sequence_number
                    : isPickup
                      ? "P"
                      : "D"}
                </div>
              </div>

              {/* Content */}
              <div
                className={`flex-1 p-4 rounded-lg border-2 ${
                  isPickup
                    ? "border-success/30 bg-success/5"
                    : "border-info/30 bg-info/5"
                }`}
              >
                {/* Header */}
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-semibold text-base-content capitalize'>
                      {wpData?.type} Waypoint
                      {waypoint.sequence_number !== 0 &&
                        ` #${waypoint.sequence_number}`}
                    </h4>
                    {statusBadge(status)}
                  </div>
                </div>

                {/* Location */}
                <div className='space-y-1 text-sm'>
                  {wpData?.location_name && (
                    <div className='font-medium text-base-content'>
                      {wpData.location_name}
                    </div>
                  )}
                  {wpData?.address ? (
                    <div className='text-base-content/70'>
                      {wpData.address.address}
                      {wpData.address.region?.administrative_area
                        ? `, ${getDisplayPath(wpData.address.region.administrative_area)}`
                        : wpData.address.region?.name
                          ? `, ${wpData.address.region.name}`
                          : ""}
                    </div>
                  ) : (
                    wpData?.location_address && (
                      <div className='text-base-content/70'>
                        {wpData.location_address}
                      </div>
                    )
                  )}
                </div>

                {/* Contact Info */}
                {(wpData?.contact_name || wpData?.contact_phone) && (
                  <div className='mt-2 text-sm text-base-content/70'>
                    {wpData.contact_name && (
                      <div>Contact: {wpData.contact_name}</div>
                    )}
                    {wpData.contact_phone && (
                      <div>Phone: {wpData.contact_phone}</div>
                    )}
                  </div>
                )}

                {/* Schedule */}
                <div className='mt-3 pt-3 border-t border-base-300/50'>
                  <div className='text-sm text-base-content/70'>
                    <div className='flex flex-wrap gap-x-4 gap-y-1'>
                      <span>
                        <span className='font-medium'>Date:</span>{" "}
                        {dateFormat(wpData?.scheduled_date, "DD/MM/YYYY")}
                      </span>
                      {wpData?.scheduled_time && (
                        <span>
                          <span className='font-medium'>Time:</span>{" "}
                          {wpData.scheduled_time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Execution timestamps (only for TripWaypoint) */}
                {isTripWp &&
                  (waypoint.actual_arrival_time ||
                    waypoint.actual_completion_time) && (
                    <div className='mt-2 pt-2 border-t border-base-300/50'>
                      <div className='text-xs text-base-content/60 space-y-1'>
                        {waypoint.actual_arrival_time && (
                          <div>
                            <span className='font-medium'>Arrived:</span>{" "}
                            {dateFormat(
                              waypoint.actual_arrival_time,
                              "DD/MM/YYYY, HH:mm",
                            )}
                          </div>
                        )}
                        {waypoint.actual_completion_time && (
                          <div>
                            <span className='font-medium'>Completed:</span>{" "}
                            {dateFormat(
                              waypoint.actual_completion_time,
                              "DD/MM/YYYY, HH:mm",
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Received by (v2.10) - for completed delivery waypoints */}
                {isTripWp && waypoint.received_by && (
                  <div className='mt-2 text-sm'>
                    <span className='font-medium text-success'>
                      Received by:{" "}
                    </span>
                    <span className='text-base-content'>
                      {waypoint.received_by}
                    </span>
                  </div>
                )}

                {/* Failed reason (v2.10) - for failed waypoints */}
                {isTripWp && waypoint.failed_reason && (
                  <div className='mt-2 text-sm'>
                    <span className='font-medium text-error'>
                      Failed reason:{" "}
                    </span>
                    <span className='text-base-content'>
                      {waypoint.failed_reason}
                    </span>
                  </div>
                )}

                {/* Returned note - for returned waypoints */}
                {status === "returned" && (waypoint as any).returned_note && (
                  <div className='mt-2 text-sm p-2 bg-warning/10 border border-warning/30 rounded-lg'>
                    <div className='flex items-start gap-2'>
                      <HiArrowUturnLeft className='w-4 h-4 text-warning flex-shrink-0 mt-0.5' />
                      <div className='flex-1'>
                        <span className='font-medium text-warning'>
                          Returned note:{" "}
                        </span>
                        <span className='text-base-content'>
                          {(waypoint as any).returned_note}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Return button - for failed waypoints */}
                {status === "failed" && onReturn && (
                  <div className='mt-3 pt-3 border-t border-base-300/50'>
                    <Button
                      variant='warning'
                      size='sm'
                      onClick={() => onReturn(waypoint)}
                      className='gap-2'
                    >
                      <HiArrowUturnLeft className='w-4 h-4' />
                      Return to Origin
                    </Button>
                  </div>
                )}

                {/* Price for Delivery - only for OrderWaypoint (not TripWaypoint) */}
                {!isTripWp && wpData && wpData.price && wpData.price > 0 && (
                  <div className='mt-2 text-sm'>
                    <span className='font-medium text-base-content/70'>
                      Price:{" "}
                    </span>
                    <span className='font-semibold text-success'>
                      {formatCurrency(wpData.price)}
                    </span>
                  </div>
                )}

                {/* Items */}
                {wpData?.items &&
                  Array.isArray(wpData.items) &&
                  wpData.items.length > 0 && (
                    <div className='mt-3 pt-3 border-t border-base-300/50'>
                      <div className='text-sm font-medium text-base-content/70 mb-1'>
                        Items:
                      </div>
                      <div className='space-y-1'>
                        {wpData.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className='text-sm flex gap-2 text-base-content/80'
                          >
                            <span>{item.name}</span>
                            <span className='text-base-content/50'>x</span>
                            <span>{item.quantity}</span>
                            {item.weight && item.weight > 0 && (
                              <span className='text-base-content/50'>
                                ({item.weight} kg)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* POD Status */}
                {wpData?.pods && (
                  <div className='mt-3 pt-3 border-t border-base-300/50'>
                    <div className='text-sm'>
                      <span className='flex items-center gap-1 text-success'>
                        <span>POD Submitted</span>
                      </span>
                      {wpData.pods.notes && (
                        <div className='text-base-content/70 mt-1'>
                          Note: {wpData.pods.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WaypointTimeline;
