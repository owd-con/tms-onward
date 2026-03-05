/**
 * TMS Onward - Waypoint Logs Timeline Component
 *
 * Timeline component for displaying waypoint tracking history.
 * Fetches its own data using useWaypointLogs hook.
 * Reference: Blueprint v2.10 - Section 3.10
 */

import { memo, useEffect, useState } from "react";
import clsx from "clsx";
import { dateFormat, formatWaypointLogMessage } from "@/shared/helper";
import { useWaypointLogs } from "@/services/waypointLogs/hooks";
import type { WaypointLog } from "@/services/types";

interface OrderLogsTimelineProps {
  orderId: string;
  className?: string;
}

export const OrderLogsTimeline = memo<OrderLogsTimelineProps>(({
  orderId,
  className,
}) => {
  const { getWaypointLogs, getWaypointLogsResult } = useWaypointLogs();
  const [logs, setLogs] = useState<WaypointLog[]>([]);

  // Fetch waypoint logs when orderId changes
  useEffect(() => {
    if (orderId) {
      getWaypointLogs({ order_id: orderId });
    }
  }, [orderId]);

  // Sync logs state with result
  useEffect(() => {
    if (getWaypointLogsResult?.isSuccess) {
      const data = (getWaypointLogsResult?.data as any)?.data;
      setLogs(data || []);
    }
  }, [getWaypointLogsResult]);

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className={clsx("bg-white rounded-xl p-4 lg:p-6 shadow-sm flex flex-col", className)}>
      <h3 className="text-base lg:text-lg font-semibold mb-4">
        Tracking History
      </h3>
      <div className="space-y-3 overflow-y-auto max-h-[400px] -mr-2 pr-2">
        {logs.map((log, index) => (
          <div
            key={log.id || index}
            className="flex gap-3 pb-3 border-b border-base-200 last:border-0 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <div className={clsx(
                "w-2 h-2 rounded-full",
                index === 0 ? "bg-primary" : "bg-base-300"
              )}></div>
              {index < logs.length - 1 && (
                <div className="w-0.5 flex-1 bg-base-200 min-h-[2rem]"></div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-base-content">
                {formatWaypointLogMessage(log.message, log.event_type)}
              </p>
              <p className="text-xs text-base-content/60 mt-1">
                {dateFormat(log.created_at, "DD MMM YYYY, HH:mm")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
