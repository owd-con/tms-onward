/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components";
import config from "@/services/table/const";

/**
 * Failed Waypoint Item Component (for display in table cell)
 */
const FailedWaypointsCell = ({ failedWaypoints }: { failedWaypoints?: any[] }) => {
  const [expanded, setExpanded] = useState(false);

  if (!failedWaypoints || failedWaypoints.length === 0) {
    return <span className="text-base-content/60">-</span>;
  }

  return (
    <div className="text-xs">
      {failedWaypoints.length === 1 ? (
        // Single waypoint - show directly without expand
        <div>
          <span className="font-medium">{failedWaypoints[0].type}</span>
          <div className="text-base-content/70 mt-1">
            {failedWaypoints[0].location_name || failedWaypoints[0].location_address || "-"}
          </div>
        </div>
      ) : (
        // Multiple waypoints - expandable
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-base-content hover:text-base-content/80 transition-colors"
          >
            <span className="font-medium">
              {failedWaypoints.length} waypoint{failedWaypoints.length > 1 ? "s" : ""}
            </span>
            <span className="text-xs text-base-content/60">
              {expanded ? "▼" : "▶"}
            </span>
          </button>

          {expanded && (
            <div className="mt-2 space-y-2 pl-2 border-l-2 border-error">
              {failedWaypoints.map((wp, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="font-medium">{wp.type}</span>
                  <div className="text-base-content/70">
                    {wp.location_name || wp.location_address || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const createTableConfig = ({
  onViewDetails,
  onReschedule,
}: {
  onViewDetails: (e: any) => void;
  onReschedule: (e: any) => void;
}) => ({
  ...config,
  url: "/exceptions/orders",
  columns: {
    order_number: {
      title: "Order Number",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { order_number: string; id: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.order_number || "-"}</span>
        </div>
      ),
    },
    customer: {
      title: "Customer",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { customer: any }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">
            {row?.customer?.name || "-"}
          </span>
        </div>
      ),
    },
    failed_waypoints: {
      title: "Failed Waypoints",
      sortable: false,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { failed_waypoints: any[] }) => (
        <FailedWaypointsCell failedWaypoints={row?.failed_waypoints} />
      ),
    },
    failure_count: {
      title: "Failed",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { failure_count: number }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className={`badge badge-sm ${row?.failure_count > 0 ? "badge-error" : "badge-neutral"}`}>
            {row?.failure_count || 0}
          </span>
        </div>
      ),
    },
    last_failed_at: {
      title: "Last Failed Date",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { last_failed_at: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">
            {row?.last_failed_at
              ? new Date(row.last_failed_at).toLocaleDateString("id-ID")
              : "-"}
          </span>
        </div>
      ),
    },
    actions: {
      title: "Actions",
      sortable: false,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: any) => (
        <div className="flex place-items-center gap-1">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => onViewDetails(row)}
          >
            View
          </Button>
          <Button
            size="xs"
            variant="primary"
            onClick={() => onReschedule(row)}
          >
            Reschedule
          </Button>
        </div>
      ),
    },
  },
});

export default createTableConfig;
