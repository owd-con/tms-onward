/* eslint-disable @typescript-eslint/no-explicit-any */
import { currencyFormat } from "@/utils/common";
import config from "@/services/table/const";

const getSuccessRateColor = (rate: number) => {
  if (rate >= 80) return "text-success";
  if (rate >= 60) return "text-warning";
  return "text-error";
};

const getSuccessRateBg = (rate: number) => {
  if (rate >= 80) return "bg-success";
  if (rate >= 60) return "bg-warning";
  return "bg-error";
};

const createTableConfig = () => ({
  ...config,
  url: "/reports/customer",
  columns: {
    customer_name: {
      title: "Customer Name",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.customer_name || "-"}</span>
        </div>
      ),
    },
    order_count: {
      title: "Order Count",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide text-center">
          <span className="badge badge-ghost">{row?.order_count ?? 0}</span>
        </div>
      ),
    },
    total_revenue: {
      title: "Total Revenue",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide text-center">
          <span className="font-semibold">{currencyFormat(row?.total_revenue ?? 0)}</span>
        </div>
      ),
    },
    completed_waypoints: {
      title: "Completed Waypoints",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide text-center text-success">
          <span className="font-semibold">{row?.completed_waypoints ?? 0}</span>
        </div>
      ),
    },
    failed_waypoints: {
      title: "Failed Waypoints",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide text-center text-error">
          <span className="font-semibold">{row?.failed_waypoints ?? 0}</span>
        </div>
      ),
    },
    success_rate: {
      title: "Success Rate",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <div className="flex items-center justify-center gap-2">
            <div className="w-20 h-2 bg-base-300 rounded-full overflow-hidden">
              <div
                className={`h-full ${getSuccessRateBg(row?.success_rate || 0)}`}
                style={{ width: `${Math.min(row?.success_rate || 0, 100)}%` }}
              ></div>
            </div>
            <span className={`text-sm font-medium ${getSuccessRateColor(row?.success_rate || 0)}`}>
              {(row?.success_rate || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      ),
    },
  },
});

export default createTableConfig;
