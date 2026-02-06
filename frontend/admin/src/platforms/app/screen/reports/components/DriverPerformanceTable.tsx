import { Button } from "@/components";
import type { DriverPerformanceReport } from "@/services/types";

interface DriverPerformanceTableProps {
  data?: DriverPerformanceReport[];
  loading?: boolean;
  onExport?: () => void;
}

/**
 * TMS Onward - DriverPerformanceTable Component
 *
 * Table component for driver performance report.
 * Columns: Driver Name, Total Trips, Completed Trips, On-Time Rate.
 * Shows progress bar for on-time rate.
 */
const DriverPerformanceTable = ({
  data,
  loading = false,
  onExport,
}: DriverPerformanceTableProps) => {
  // Debug: log data structure
  console.log("DriverPerformanceTable data:", data);
  console.log("Is array?", Array.isArray(data));

  const getOnTimeRateColor = (rate: number) => {
    if (rate >= 80) return "bg-success";
    if (rate >= 60) return "bg-warning";
    return "bg-error";
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) return;

    // Create CSV content
    const headers = ["Driver Name", "Total Trips", "Completed Trips", "On-Time Rate"];
    const rows = data.map((driver) => [
      driver.driver_name,
      driver.total_trips.toString(),
      driver.completed_trips.toString(),
      `${driver.on_time_rate}%`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `driver_performance_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onExport) onExport();
  };

  if (loading) {
    return (
      <div className="bg-base-100 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content">Driver Performance</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-base-content">Driver Performance</h3>
        <Button
          size="sm"
          variant="secondary"
          onClick={exportToExcel}
          disabled={!data || data.length === 0}
          className="text-xs"
        >
          Export to Excel
        </Button>
      </div>

      {!data || data.length === 0 ? (
        <div className="text-center py-8 text-base-content/60">
          No driver performance data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="text-left">Driver Name</th>
                <th className="text-center">Total Trips</th>
                <th className="text-center">Completed Trips</th>
                <th className="text-center">On-Time Rate</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((driver) => (
                  <tr key={driver.driver_id}>
                    <td className="font-medium">{driver.driver_name}</td>
                    <td className="text-center">{driver.total_trips}</td>
                    <td className="text-center">{driver.completed_trips}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-base-300 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getOnTimeRateColor(driver.on_time_rate)}`}
                            style={{ width: `${driver.on_time_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{driver.on_time_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-base-content/60 py-8">
                    {loading ? "Loading..." : "No data available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DriverPerformanceTable;
