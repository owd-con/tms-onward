// 1. React & core libraries
import { memo } from "react";

// 2. Third-party libraries
import { MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";

// 3. Internal imports (gunakan alias @)
import { dateFormat } from "@/utils/common";
import { statusBadge, getWaypointIcon } from "@/shared/helper";
import type { WaypointHistory, WaypointImageInfo } from "@/services/types";

interface WaypointTimelineProps {
  waypointLogs: WaypointHistory[];
  waypointImages?: WaypointImageInfo[];
}

/**
 * Get icon for waypoint type (pickup/delivery)
 */
function getTypeIcon() {
  return MapPinIcon;
}

// 5. Component definition dengan memo untuk performance
const WaypointTimeline = memo(
  ({ waypointLogs, waypointImages = [] }: WaypointTimelineProps) => {
    if (!waypointLogs || waypointLogs.length === 0) {
      return (
        <div className='bg-white rounded-xl border border-gray-200 p-8 text-center'>
          <ClockIcon className='h-12 w-12 mx-auto mb-3 text-gray-400' />
          <p className='text-gray-500'>No tracking updates available yet</p>
        </div>
      );
    }

    // Sort by changed_at descending (newest first)
    const sortedLogs = [...waypointLogs].sort(
      (a, b) =>
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
    );

    // Find POD image for recipient name
    const podImage = waypointImages?.find((img) => img.type === "pod");

    return (
      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Tracking Timeline
          </h2>
        </div>

        <div className='p-6'>
          <div className='relative'>
            {/* Vertical line */}
            <div className='absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200'></div>

            {/* Timeline items */}
            <div className='space-y-6'>
              {sortedLogs.map((log, index) => {
                const { icon: StatusIcon, bgClass } = getWaypointIcon(
                  log.status,
                );
                const TypeIcon = getTypeIcon();

                return (
                  <div
                    key={`${log.waypoint_id}-${index}`}
                    className='relative flex items-start space-x-4 animate-fadeIn'
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Status Icon */}
                    <div
                      className={`relative z-10 flex-shrink-0 rounded-full p-1 ${bgClass}`}
                    >
                      <StatusIcon className='h-4 w-4' />
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        {log.location_name && (
                          <TypeIcon className='h-4 w-4 text-gray-400' />
                        )}
                        <p className='text-sm font-medium text-gray-900'>
                          {log.location_name || log.address}
                        </p>
                        {statusBadge(log.status)}
                      </div>

                      {/* Address - only show if location_name exists */}
                      {log.location_name && (
                        <p className='text-sm text-gray-600 mb-1'>
                          {log.address}
                        </p>
                      )}

                      {/* Notes */}
                      {log.notes && (
                        <p className='mt-1 text-sm text-gray-500'>
                          <span className='font-medium'>Note:</span> {log.notes}
                        </p>
                      )}

                      {/* Recipient name for completed delivery */}
                      {log.status === "completed" &&
                        log.type === "delivery" &&
                        podImage?.recipient_name && (
                          <p className='mt-1 text-sm text-gray-600'>
                            <span className='font-medium'>Received by:</span>{" "}
                            {podImage.recipient_name}
                          </p>
                        )}

                      {/* Timestamp */}
                      <p className='mt-1 text-xs text-gray-500'>
                        {dateFormat(log.changed_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

// Named export
export { WaypointTimeline };
