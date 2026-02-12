/* eslint-disable @typescript-eslint/no-explicit-any */
import { statusBadge } from "@/shared/helper";
import config from "@/services/table/const";

const createTableConfig = () => ({
  ...config,
  url: "/reports/order-trip-waypoint",
  columns: {
    order_number: {
      title: "Order Number",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <div className="font-medium">{row?.order_number || "-"}</div>
          <div className="text-xs text-base-content/60">{row?.order_type || "-"}</div>
        </div>
      ),
    },
    customer_name: {
      title: "Customer",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.customer_name || "-"}</span>
        </div>
      ),
    },
    trip_info: {
      title: "Trip",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          {row?.trip_id ? (
            <div>
              <div className="text-xs font-mono">{row.trip_id.slice(0, 8)}...</div>
              {statusBadge(row.trip_status)}
            </div>
          ) : (
            <span className="text-base-content/40">-</span>
          )}
        </div>
      ),
    },
    driver_name: {
      title: "Driver",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.driver_name || "-"}</span>
        </div>
      ),
    },
    vehicle_plate_number: {
      title: "Vehicle",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.vehicle_plate_number || "-"}</span>
        </div>
      ),
    },
    waypoint_info: {
      title: "Waypoint",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-base-content/60">#{row?.waypoint_sequence || 0}</span>
            <span className="badge badge-ghost badge-xs">{row?.waypoint_type || "-"}</span>
          </div>
        </div>
      ),
    },
    address: {
      title: "Address",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide max-w-[200px] truncate" title={row?.address}>
          <span className="font-semibold">{row?.address || "-"}</span>
        </div>
      ),
    },
    waypoint_status: {
      title: "Status",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          {statusBadge(row?.waypoint_status)}
        </div>
      ),
    },
    completed_at: {
      title: "Completed At",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.completed_at || "-"}</span>
        </div>
      ),
    },
  },
});

export default createTableConfig;
