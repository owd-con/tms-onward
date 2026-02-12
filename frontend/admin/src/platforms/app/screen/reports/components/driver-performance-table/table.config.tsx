/* eslint-disable @typescript-eslint/no-explicit-any */
import config from "@/services/table/const";

const getOnTimeRateColor = (rate: number) => {
  if (rate >= 80) return "bg-success";
  if (rate >= 60) return "bg-warning";
  return "bg-error";
};

const createTableConfig = () => ({
  ...config,
  url: "/reports/driver-performance",
  columns: {
    driver_name: {
      title: "Driver Name",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.driver_name || "-"}</span>
        </div>
      ),
    },
    total_trips: {
      title: "Total Trips",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide text-center">
          <span className="font-semibold">{row?.total_trips ?? 0}</span>
        </div>
      ),
    },
    completed_trips: {
      title: "Completed Trips",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide text-center">
          <span className="font-semibold">{row?.completed_trips ?? 0}</span>
        </div>
      ),
    },
    on_time_trips: {
      title: "On-Time Trips",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide text-center">
          <span className="font-semibold">{row?.on_time_trips ?? 0}</span>
        </div>
      ),
    },
    on_time_rate: {
      title: "On-Time Rate",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: any) => (
        <div className="text-xs font-normal tracking-wide">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-base-300 rounded-full overflow-hidden">
              <div
                className={`h-full ${getOnTimeRateColor(row?.on_time_rate || 0)}`}
                style={{ width: `${Math.min(row?.on_time_rate || 0, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{(row?.on_time_rate || 0).toFixed(1)}%</span>
          </div>
        </div>
      ),
    },
  },
});

export default createTableConfig;
