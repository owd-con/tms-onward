import config from "@/services/table/const";
import { dateFormat } from "@/shared/helper";
import { FiUser, FiInfo } from "react-icons/fi";
import clsx from "clsx";
import { Tooltip } from "@/components";

const ExecutionStatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = (s: string) => {
    const normalized = s.toLowerCase().replace(/\s+/g, "_");
    switch (normalized) {
      case "delivered":
      case "completed":
      case "picked_up":
      case "received":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 outline-emerald-100";
      case "in_transit":
      case "on_delivery":
      case "on_pickup":
        return "bg-blue-50 text-blue-700 border-blue-200 outline-blue-100";
      case "dispatched":
        return "bg-amber-50 text-amber-700 border-amber-200 outline-amber-100";
      case "planned":
        return "bg-purple-50 text-purple-700 border-purple-200 outline-purple-100";
      case "pending":
      case "new":
        return "bg-slate-50 text-slate-600 border-slate-200 outline-slate-100";
      case "cancelled":
      case "failed":
      case "returned":
        return "bg-rose-50 text-rose-700 border-rose-200 outline-rose-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 outline-slate-100";
    }
  };

  const label = status.replace(/_/g, " ");

  return (
    <span
      className={clsx(
        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black tracking-wide border outline outline-2 outline-offset-1 shadow-sm capitalize",
        getStatusStyles(status)
      )}
    >
      {label}
    </span>
  );
};

const createTableConfig = () => ({
  ...config,
  url: "/reports/order-trip-waypoint",
  columns: {
    order_number: {
      title: "Order #",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-mono font-black text-slate-700 tracking-tight leading-none mb-1">
            {row?.order_number || "---"}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {row?.trip_code || "---"}
          </span>
        </div>
      ),
    },
    customer: {
      title: "Customer",
      sortable: false,
      alias: "customer_name",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {row?.avatar_url ? (
              <img
                src={row.avatar_url}
                alt={row.customer_name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-content font-black text-xs ring-2 ring-primary/20 ring-offset-2 ring-offset-white overflow-hidden shadow-sm">
                {row?.customer_name?.substring(0, 2).toUpperCase() || "??"}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-slate-900 truncate">
              {row?.customer_name || "---"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[12px] text-slate-400 font-medium tracking-tight">
                {row?.customer_pic_name || "---"}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    shipment: {
      title: "Shipment Code",
      sortable: false,
      alias: "shipment_number",
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <span className="text-[13px] font-mono font-bold text-slate-600 uppercase tracking-tight px-1">
          {row?.shipment_number || "---"}
        </span>
      ),
    },

    operator: {
      title: "Driver",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <FiUser className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-900 leading-none mb-1">
              {row?.driver_name || "---"}
            </span>
            <span className="text-[11px] text-slate-400 font-medium uppercase">
              {row?.vehicle_plate_number || "NO PLATE"}
            </span>
          </div>
        </div>
      ),
    },
    waypoint_location: {
      title: "Waypoint Hub",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className="flex flex-col min-w-0 max-w-[220px]">
          <span className="text-[13px] font-black text-slate-900 truncate leading-none mb-1">
            {row?.location_name || "---"}
          </span>
          <span className="text-[11px] text-slate-400 truncate font-medium">
            {row?.address || "No address provided"}
          </span>
        </div>
      ),
    },
    waypoint_type: {
      title: "Movement",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => {
        const isPickup = row?.waypoint_type?.toLowerCase() === "pickup";
        return (
          <span className={clsx(
            "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black tracking-wide border outline outline-2 outline-offset-1 shadow-sm capitalize",
            isPickup 
              ? "bg-sky-50 text-sky-700 border-sky-100 outline-sky-50" 
              : "bg-purple-50 text-purple-700 border-purple-200 outline-purple-100"
          )}>
            {row?.waypoint_type || "---"}
          </span>
        );
      },
    },
    shipment_status: {
      title: "Execution",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500",
      class: "p-4",
      component: (row: any) => (
        <div className="flex items-center gap-2">
          <ExecutionStatusBadge status={row?.shipment_status || "---"} />
          {row?.failed_reason && (
            <Tooltip label={row.failed_reason} variant="error" size="sm">
              <div className="p-1 rounded-full bg-rose-50 text-rose-500 cursor-help border border-rose-100 hover:bg-rose-100 transition-colors">
                <FiInfo className="w-3.5 h-3.5" />
              </div>
            </Tooltip>
          )}
        </div>
      ),
    },
    delivery_details: {
      title: "Confirmation",
      sortable: false,
      headerClass: "capitalize font-semibold text-slate-500 text-right",
      class: "p-4 text-right",
      component: (row: any) => (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-[12px]">
            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] uppercase text-slate-400 border border-slate-200">RECV</span>
            {row?.received_by || "---"}
          </div>
          <div className="flex items-center text-[11px] text-slate-400">
            <span>{dateFormat(row?.completed_at, "DD/MM/YYYY HH:mm", "PENDING")}</span>
          </div>
        </div>
      ),
    },
  },
});

export default createTableConfig;
