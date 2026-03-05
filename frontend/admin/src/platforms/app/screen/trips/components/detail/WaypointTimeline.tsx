import type { TripWaypoint, WaypointStatus } from "@/services/types";
import { dateFormat, statusBadge, shipmentStatusBadge } from "@/shared/helper";
import { Link } from "react-router-dom";
import { WaypointEvidence } from "./WaypointEvidence";

interface WaypointTimelineProps {
  waypoints: TripWaypoint[];
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
 * TMS Onward - Waypoint Timeline Component
 *
 * Visual display of trip waypoints progress with status indicators.
 * Shows TripWaypoints (physical stops) with associated shipments.
 */
const WaypointTimeline = ({ waypoints }: WaypointTimelineProps) => {
  if (!waypoints || waypoints.length === 0) {
    return (
      <div className='text-center py-8 text-base-content/60'>
        No waypoints available
      </div>
    );
  }

  const sortedWaypoints = [...waypoints].sort((a, b) => {
    return a.sequence_number - b.sequence_number;
  });

  return (
    <div className='relative'>
      {/* Vertical line */}
      <div className='absolute left-[19px] top-0 bottom-0 w-0.5 bg-base-300' />

      <div className='space-y-4'>
        {sortedWaypoints.map((waypoint) => {
          const config = statusConfig[waypoint.status as WaypointStatus];
          const isPickup = waypoint.type === "pickup";

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
                {/* Top Section: Info (Left) + Photos (Right) */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
                  {/* Left: Waypoint Info */}
                  <div>
                    {/* Header */}
                    <div className='flex items-center gap-2 mb-2'>
                      <h4 className='font-semibold text-base-content capitalize'>
                        {waypoint.type} Waypoint
                        {waypoint.sequence_number !== 0 &&
                          ` #${waypoint.sequence_number}`}
                      </h4>
                      {statusBadge(waypoint.status)}
                    </div>

                    {/* Location */}
                    <div className='space-y-1 text-sm'>
                      {waypoint.location_name && (
                        <div className='font-medium text-base-content'>
                          {waypoint.location_name}
                        </div>
                      )}
                      {waypoint.address && (
                        <div className='text-base-content/70'>
                          {waypoint.address}
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    {(waypoint.contact_name || waypoint.contact_phone) && (
                      <div className='mt-2 text-sm text-base-content/70'>
                        {waypoint.contact_name && (
                          <div>Contact: {waypoint.contact_name}</div>
                        )}
                        {waypoint.contact_phone && (
                          <div>Phone: {waypoint.contact_phone}</div>
                        )}
                      </div>
                    )}

                    {/* Execution timestamps */}
                    {(waypoint.actual_arrival_time ||
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

                    {/* Received by - for completed delivery waypoints */}
                    {waypoint.received_by && (
                      <div className='mt-2 text-sm'>
                        <span className='font-medium text-success'>
                          Received by:{" "}
                        </span>
                        <span className='text-base-content'>
                          {waypoint.received_by}
                        </span>
                      </div>
                    )}

                    {/* Failed reason - for failed waypoints */}
                    {waypoint.failed_reason && (
                      <div className='mt-2 text-sm'>
                        <span className='font-medium text-error'>
                          Failed reason:{" "}
                        </span>
                        <span className='text-base-content'>
                          {waypoint.failed_reason}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Photos & Evidence */}
                  <WaypointEvidence waypointId={waypoint.id} />
                </div>

                {/* Shipments */}
                {waypoint.shipments && waypoint.shipments.length > 0 && (
                  <div className='mt-3 pt-3 border-t border-base-300/50'>
                    <div className='text-sm font-medium text-base-content/70 mb-2'>
                      Shipments ({waypoint.shipments.length}):
                    </div>
                    <div className='space-y-2'>
                      {waypoint.shipments.map((shipment) => (
                        <div
                          key={shipment.id}
                          className='p-2 bg-base-100 rounded-lg border border-base-300 text-sm'
                        >
                          <div className='flex items-center justify-between mb-1'>
                            <Link
                              to={`/a/orders/${shipment.order_id}`}
                              className='font-medium text-primary hover:underline'
                            >
                              {shipment.shipment_number}
                            </Link>
                            {shipmentStatusBadge(shipment.status)}
                          </div>
                          <div className='text-base-content/70 flex items-center gap-1'>
                            <span>
                              ▲{" "}
                              {shipment.origin_location_name ||
                                shipment.origin_address}
                            </span>
                            <span className='text-base-content/40'>→</span>
                            <span>
                              ▼{" "}
                              {shipment.dest_location_name ||
                                shipment.dest_address}
                            </span>
                          </div>
                          {shipment.failed_reason && (
                            <div className='text-error text-xs mt-1'>
                              ⚠️ {shipment.failed_reason}
                            </div>
                          )}
                        </div>
                      ))}
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
