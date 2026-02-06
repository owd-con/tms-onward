import { useState } from "react";
import {
  HiDocument,
  HiTruck,
  HiCurrencyDollar,
  HiExclamationTriangle,
  HiUser,
} from "react-icons/hi2";
import { Page } from "../../components/layout";
import { useReport } from "@/services/report/hooks";
import type {
  OrderSummaryReport,
  TripSummaryReport,
  RevenueReport,
  ExceptionReport,
} from "@/services/report/api";
import ReportCard from "./components/ReportCard";
import DriverPerformanceTable from "./components/DriverPerformanceTable";
import { DatePicker } from "@/components/ui";
import type { Dayjs } from "dayjs";

/**
 * TMS Onward - Reports Page
 *
 * Displays report cards grid with summary statistics.
 * Includes date range filter for filtering reports.
 * Each card has export to Excel functionality (frontend).
 */
const ReportListPage = () => {
  const {
    getOrderReport,
    getOrderReportResult,
    getTripReport,
    getTripReportResult,
    getRevenueReport,
    getRevenueReportResult,
    getExceptionReport,
    getExceptionReportResult,
    getDriverPerformanceReport,
    getDriverPerformanceReportResult,
  } = useReport();

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const [orderData, setOrderData] = useState<OrderSummaryReport | undefined>();
  const [tripData, setTripData] = useState<TripSummaryReport | undefined>();
  const [revenueData, setRevenueData] = useState<RevenueReport | undefined>();
  const [exceptionData, setExceptionData] = useState<ExceptionReport | undefined>();

  const handleGenerateReports = async () => {
    const params: { start_date?: string; end_date?: string } = {};
    if (dateRange?.[0]) params.start_date = dateRange[0].format("YYYY-MM-DD");
    if (dateRange?.[1]) params.end_date = dateRange[1].format("YYYY-MM-DD");

    try {
      const [orders, trips, revenue, exceptions] = await Promise.all([
        getOrderReport(params),
        getTripReport(params),
        getRevenueReport(params),
        getExceptionReport(params),
        getDriverPerformanceReport(params),
      ]);

      setOrderData(orders);
      setTripData(trips);
      setRevenueData(revenue);
      setExceptionData(exceptions);
    } catch (error) {
      console.error("Failed to generate reports:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportOrdersToExcel = () => {
    if (!orderData) return;

    const headers = ["Status", "Count"];
    const rows = Object.entries(orderData.orders_by_status || {}).map(
      ([status, count]) => [status, String(count)]
    );

    const csvContent = [
      ["Total Orders", String(orderData.total_orders)],
      [],
      ...headers,
      ...rows.map((row) => row.join(",")).map((line) => [line]),
    ]
      .flat()
      .join("\n");

    downloadCSV(csvContent, "orders_report");
  };

  const exportTripsToExcel = () => {
    if (!tripData) return;

    const headers = ["Status", "Count"];
    const rows = Object.entries(tripData.trips_by_status || {}).map(
      ([status, count]) => [status, String(count)]
    );

    const csvContent = [
      ["Total Trips", String(tripData.total_trips)],
      [],
      ...headers,
      ...rows.map((row) => row.join(",")).map((line) => [line]),
    ]
      .flat()
      .join("\n");

    downloadCSV(csvContent, "trips_report");
  };

  const exportRevenueToExcel = () => {
    if (!revenueData) return;

    const csvContent = `Total Revenue,${formatCurrency(revenueData.total_revenue)}`;
    downloadCSV(csvContent, "revenue_report");
  };

  const exportExceptionsToExcel = () => {
    if (!exceptionData) return;

    const headers = ["Type", "Count"];
    const rows = Object.entries(exceptionData.exceptions_by_type || {}).map(
      ([type, count]) => [type, String(count)]
    );

    const csvContent = [
      ["Total Exceptions", String(exceptionData.total_exceptions)],
      [],
      ...headers,
      ...rows.map((row) => row.join(",")).map((line) => [line]),
    ]
      .flat()
      .join("\n");

    downloadCSV(csvContent, "exceptions_report");
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading =
    getOrderReportResult?.isLoading ||
    getTripReportResult?.isLoading ||
    getRevenueReportResult?.isLoading ||
    getExceptionReportResult?.isLoading ||
    getDriverPerformanceReportResult?.isLoading;

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        title="Reports"
        titleClassName="!text-2xl"
        subtitle="View and export operational reports"
      />

      <Page.Body className="flex-1 flex flex-col space-y-4 min-h-0">
        {/* Date Range Filter */}
        <div className="bg-base-100 rounded-xl shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <div className="flex-1 w-full">
              <DatePicker
                mode="range"
                value={dateRange}
                onChange={(range) => setDateRange(range as [Dayjs | null, Dayjs | null] | null)}
                placeholder="Select date range"
                label="Date Range"
              />
            </div>
            <button
              onClick={handleGenerateReports}
              disabled={isLoading}
              className="btn btn-primary btn-sm min-w-[140px]"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Generate Reports"
              )}
            </button>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Orders Report Card */}
          <ReportCard
            title="Orders Report"
            value={orderData?.total_orders ?? "No data"}
            subtitle="Total orders in selected period"
            icon={<HiDocument size={24} />}
            loading={getOrderReportResult.isLoading}
            onExport={exportOrdersToExcel}
          >
            {orderData?.orders_by_status && (
              <div className="space-y-2">
                {Object.entries(orderData.orders_by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-base-content/60">{status}</span>
                    <span className="font-medium">{count as number | string}</span>
                  </div>
                ))}
              </div>
            )}
          </ReportCard>

          {/* Trips Report Card */}
          <ReportCard
            title="Trips Report"
            value={tripData?.total_trips ?? "No data"}
            subtitle="Total trips in selected period"
            icon={<HiTruck size={24} />}
            loading={getTripReportResult.isLoading}
            onExport={exportTripsToExcel}
          >
            {tripData?.trips_by_status && (
              <div className="space-y-2">
                {Object.entries(tripData.trips_by_status).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-base-content/60">{status}</span>
                    <span className="font-medium">{count as number | string}</span>
                  </div>
                ))}
              </div>
            )}
          </ReportCard>

          {/* Revenue Report Card */}
          <ReportCard
            title="Revenue Report"
            value={
              revenueData?.total_revenue !== undefined
                ? formatCurrency(revenueData.total_revenue)
                : "No data"
            }
            subtitle="Total revenue in selected period"
            icon={<HiCurrencyDollar size={24} />}
            loading={getRevenueReportResult.isLoading}
            onExport={exportRevenueToExcel}
          />

          {/* Exceptions Report Card */}
          <ReportCard
            title="Exceptions Report"
            value={exceptionData?.total_exceptions ?? "No data"}
            subtitle="Total exceptions in selected period"
            icon={<HiExclamationTriangle size={24} />}
            loading={getExceptionReportResult.isLoading}
            onExport={exportExceptionsToExcel}
          >
            {exceptionData?.exceptions_by_type && (
              <div className="space-y-2">
                {Object.entries(exceptionData.exceptions_by_type).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-base-content/60">{type}</span>
                    <span className="font-medium">{count as number | string}</span>
                  </div>
                ))}
              </div>
            )}
          </ReportCard>
        </div>

        {/* Driver Performance Table */}
        <div className="w-full">
          <DriverPerformanceTable
            data={getDriverPerformanceReportResult?.data}
            loading={getDriverPerformanceReportResult?.isLoading}
          />
        </div>
      </Page.Body>
    </Page>
  );
};

export default ReportListPage;
