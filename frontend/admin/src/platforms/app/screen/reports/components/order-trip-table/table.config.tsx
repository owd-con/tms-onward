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
          <span className="font-medium">{row?.order_number || "-"}</span>
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
    trip_code: {
      title: "Trip Code",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-mono font-medium">{row?.trip_code || "-"}</span>
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
    shipment_number: {
      title: "Shipment Code",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-mono font-medium">{row?.shipment_number || "-"}</span>
        </div>
      ),
    },
    waypoint_location: {
      title: "Location",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <div className="font-medium">{row?.location_name || "-"}</div>
          <div className="text-gray-500">{row?.address || "-"}</div>
        </div>
      ),
    },
    waypoint_type: {
      title: "Type",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span
            className={`badge badge-sm ${
              row?.waypoint_type === "pickup"
                ? "badge-info"
                : row?.waypoint_type === "delivery"
                ? "badge-success"
                : "badge-ghost"
            }`}
          >
            {row?.waypoint_type || "-"}
          </span>
        </div>
      ),
    },
    shipment_status: {
      title: "Shipment Status",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          {statusBadge(row?.shipment_status)}
        </div>
      ),
    },
    received_by: {
      title: "Received By",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.received_by || "-"}</span>
        </div>
      ),
    },
    failed_reason: {
      title: "Failed Reason",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4 max-w-xs",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          {row?.failed_reason ? (
            <span className="text-error">{row.failed_reason}</span>
          ) : (
            "-"
          )}
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
