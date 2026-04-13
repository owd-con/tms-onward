/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import config from "@/services/table/const";
import { dateFormat } from "@/utils/common";
import { FiEye, FiMoreVertical, FiCalendar } from "react-icons/fi";

/**
 * Failed Waypoint Item Component (for display in table cell)
 */
const FailedWaypointsCell = ({
  failedWaypoints,
}: {
  failedWaypoints?: any[];
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!failedWaypoints || failedWaypoints.length === 0) {
    return <span className='text-base-content/60 text-[10px]'>-</span>;
  }

  return (
    <div className='text-[10px]'>
      {failedWaypoints.length === 1 ? (
        // Single waypoint - show directly without expand
        <div>
          <span className='font-medium'>
            {failedWaypoints[0]?.shipment_number || "-"}
          </span>
          <div className='text-base-content/70 mt-0.5'>
            {failedWaypoints[0]?.dest_location || "-"}
            {failedWaypoints[0]?.failed_reason && (
              <span className='text-error'>
                {" "}
                ({failedWaypoints[0]?.failed_reason})
              </span>
            )}
          </div>
        </div>
      ) : (
        // Multiple waypoints - expandable
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className='flex items-center gap-1 text-base-content hover:text-base-content/80 transition-colors'
          >
            <span className='font-medium'>
              {failedWaypoints.length} shipment
              {failedWaypoints.length > 1 ? "s" : ""}
            </span>
            <span className='text-[10px] text-base-content/60'>
              {expanded ? "▼" : "▶"}
            </span>
          </button>

          {expanded && (
            <div className='mt-1.5 space-y-1 pl-2 border-l-2 border-error'>
              {failedWaypoints.map((wp: any, idx: number) => (
                <div key={idx} className='space-y-0.5'>
                  <span className='font-medium'>
                    {wp?.shipment_number || "-"}
                  </span>
                  <div className='text-base-content/70'>
                    {wp?.dest_location || "-"}
                    {wp?.failed_reason && (
                      <span className='text-error'> ({wp?.failed_reason})</span>
                    )}
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
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { order_number: string; id: string }) => (
        <div className='text-xs font-normal tracking-wide'>
          <span className='font-semibold'>{row?.order_number || "-"}</span>
        </div>
      ),
    },
    customer_name: {
      title: "Customer",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { customer_name: string }) => (
        <div className='text-xs font-normal tracking-wide'>
          <span className='font-semibold'>{row?.customer_name || "-"}</span>
        </div>
      ),
    },
    failed_shipments: {
      title: "Failed Waypoints",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { failed_shipments: any[] }) => (
        <FailedWaypointsCell failedWaypoints={row?.failed_shipments} />
      ),
    },
    failure_count: {
      title: "Failed",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { failure_count: number }) => (
        <div className='text-xs font-normal tracking-wide'>
          <span
            className={`badge badge-sm ${row?.failure_count > 0 ? "badge-error" : "badge-neutral"}`}
          >
            {row?.failure_count || 0}
          </span>
        </div>
      ),
    },
    last_failed_at: {
      title: "Last Failed Date",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { last_failed_at: string }) => (
        <div className='text-xs font-normal tracking-wide'>
          <span className='font-semibold'>
            {dateFormat(row?.last_failed_at)}
          </span>
        </div>
      ),
    },
    actions: {
      title: "",
      sortable: false,
      headerClass: "w-[60px]",
      class: "p-4 text-right w-[60px]",
      component: (row: any) => (
        <div className="flex justify-end">
          <div className="dropdown dropdown-end md:dropdown-click" onClick={(e) => e.stopPropagation()}>
            <button
              tabIndex={0}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            >
              <FiMoreVertical className="w-5 h-5" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-[100] menu p-2 shadow-2xl bg-white rounded-2xl w-56 border border-slate-100 mt-2"
            >
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(row);
                  }}
                  className="flex items-center gap-3 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 py-3 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <FiEye className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-[13px]">View Details</span>
                    <span className="text-[11px] text-slate-400">Inspect failed routes</span>
                  </div>
                </button>
              </li>
              <div className="my-1 border-t border-slate-50"></div>
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReschedule(row);
                  }}
                  className="flex items-center gap-3 hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 py-3 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <FiCalendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-[13px]">Reschedule</span>
                    <span className="text-[11px] text-slate-400">Re-dispatch failed items</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
  },
});

export default createTableConfig;
