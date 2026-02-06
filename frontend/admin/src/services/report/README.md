# Report Service & Excel Export Usage Guide

This guide demonstrates how to use the Report Service and Excel Export utility in TMS Onward admin frontend.

## Report Service API

### Location
- API: `/home/naufal/Workspaces/tms-onward/frontend/admin/src/services/report/api.tsx`
- Hooks: `/home/naufal/Workspaces/tms-onward/frontend/admin/src/services/report/hooks.tsx`

### Available Report Types

1. **Order Report** - Order summary by status and type
2. **Trip Report** - Trip summary by status
3. **Revenue Report** - Total revenue for a period
4. **Exception Report** - Exception summary by type
5. **Driver Performance Report** - Individual driver performance metrics

## Usage Examples

### 1. Import the Hook

```tsx
import { useReport } from "@/services/report/hooks";
import { exportToExcel, exportMultipleSheets } from "@/shared/utils/excelExport";
```

### 2. Using Report Hook in Component

```tsx
function ReportPage() {
  const {
    getOrderReport,
    orderReportResult,
    getTripReport,
    tripReportResult,
    getRevenueReport,
    revenueReportResult,
  } = useReport();

  const [dateRange, setDateRange] = useState({
    start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
    end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const fetchReports = async () => {
    try {
      // Fetch order report
      const orderData = await getOrderReport({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        status: 'all',
      });

      // Fetch trip report
      const tripData = await getTripReport({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      });

      // Fetch revenue report
      const revenueData = await getRevenueReport({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      });

    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  return (
    // Your UI here
    <button onClick={fetchReports}>Load Reports</button>
  );
}
```

### 3. Exporting Single Report to Excel

```tsx
function OrderReportPage() {
  const { getOrderReport } = useReport();

  const handleExport = async () => {
    try {
      // Fetch report data
      const orderData = await getOrderReport({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        status: 'all',
      });

      // Export to Excel
      if (orderData) {
        exportToExcel(
          orderData,
          'order-summary-report',  // filename
          'Orders',                 // sheet name
          'order'                   // report type for special formatting
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return <button onClick={handleExport}>Export Order Report</button>;
}
```

### 4. Exporting Multiple Reports to Single Excel File

```tsx
function SummaryReportPage() {
  const {
    getOrderReport,
    getTripReport,
    getRevenueReport,
  } = useReport();

  const handleExportAll = async () => {
    try {
      // Fetch all reports
      const [orderData, tripData, revenueData] = await Promise.all([
        getOrderReport({ start_date: '2024-01-01', end_date: '2024-01-31' }),
        getTripReport({ start_date: '2024-01-01', end_date: '2024-01-31' }),
        getRevenueReport({ start_date: '2024-01-01', end_date: '2024-01-31' }),
      ]);

      // Export all to single Excel file with multiple sheets
      exportMultipleSheets([
        {
          name: 'Orders',
          data: orderData!,
          reportType: 'order',
        },
        {
          name: 'Trips',
          data: tripData!,
          reportType: 'trip',
        },
        {
          name: 'Revenue',
          data: revenueData!,
          reportType: 'revenue',
        },
      ], 'tms-summary-report');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return <button onClick={handleExportAll}>Export All Reports</button>;
}
```

### 5. Exporting Driver Performance Report

```tsx
function DriverPerformancePage() {
  const { getDriverPerformanceReport } = useReport();

  const handleExport = async () => {
    try {
      const driverData = await getDriverPerformanceReport({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      });

      if (driverData) {
        exportToExcel(
          driverData,
          'driver-performance-report',
          'Driver Performance',
          'driver'
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return <button onClick={handleExport}>Export Driver Report</button>;
}
```

## Report Data Structures

### Order Summary Report
```tsx
interface OrderSummaryReport {
  total_orders: number;
  orders_by_status: {
    [key: string]: number;  // e.g., "Pending": 10, "Completed": 50
  };
  orders_by_type: {
    [key: string]: number;  // e.g., "FTL": 30, "LTL": 20
  };
}
```

### Trip Summary Report
```tsx
interface TripSummaryReport {
  total_trips: number;
  trips_by_status: {
    [key: string]: number;
  };
}
```

### Revenue Report
```tsx
interface RevenueReport {
  total_revenue: number;
}
```

### Exception Report
```tsx
interface ExceptionReport {
  total_exceptions: number;
  exceptions_by_type: {
    [key: string]: number;
  };
}
```

### Driver Performance Report
```tsx
interface DriverPerformanceReport {
  driver_id: string;
  driver_name: string;
  total_trips: number;
  completed_trips: number;
  on_time_rate: number;  // 0-1 decimal
}
```

## Excel Export Utility

### Location
`/home/naufal/Workspaces/tms-onward/frontend/admin/src/shared/utils/excelExport.ts`

### Main Functions

#### `exportToExcel(data, filename, sheetName, reportType?)`
Exports a single report to Excel file.

**Parameters:**
- `data`: Report data (array or object)
- `filename`: Name of the file (without extension)
- `sheetName`: Name of the sheet (default: "Sheet1")
- `reportType`: Optional report type for special formatting

**Supported Report Types:**
- `"order"` - Order summary report
- `"trip"` - Trip summary report
- `"revenue"` - Revenue report
- `"exception"` - Exception report
- `"driver"` - Driver performance report

#### `exportMultipleSheets(sheets, filename)`
Exports multiple reports to a single Excel file with multiple sheets.

**Parameters:**
- `sheets`: Array of sheet objects
  - `name`: Sheet name
  - `data`: Report data
  - `reportType`: Optional report type
- `filename`: Name of the file (without extension)

### Helper Functions

#### `flattenObject(obj, prefix?)`
Flattens nested objects into dot notation format.

#### `formatHeader(str)`
Converts camelCase/snake_case to Title Case for headers.

#### `formatReportDataForExcel(data, reportType)`
Formats report data for Excel export based on report type.

## Features

### Automatic Formatting
- Column headers are automatically formatted from camelCase/snake_case to Title Case
- Nested objects are flattened with dot notation
- Column widths are auto-adjusted
- Headers are bold
- Filename includes timestamp (e.g., `order-report_2024-01-25.xlsx`)

### Report-Specific Formatting
Each report type has custom formatting:
- **Order Report**: Breakdown by status and type
- **Trip Report**: Breakdown by status
- **Revenue Report**: Currency formatting
- **Exception Report**: Breakdown by type
- **Driver Report**: Table format with all metrics

## Error Handling

All report hooks include automatic error handling with toast notifications:

```tsx
const { getOrderReport } = useReport();

try {
  const data = await getOrderReport(params);
  // Success - use data
} catch (error) {
  // Error automatically shown via toast notification
  console.error('Report fetch failed:', error);
}
```

## Loading States

Each report has corresponding result object with loading states:

```tsx
const {
  getOrderReport,
  orderReportResult,  // { isLoading, isFetching, isSuccess, isError, data }
} = useReport();

{orderReportResult.isLoading && <div>Loading...</div>}
{orderReportResult.isError && <div>Error loading report</div>}
{orderReportResult.data && <ReportDisplay data={orderReportResult.data} />}
```

## Complete Example: Report Dashboard

```tsx
import { useState } from 'react';
import { useReport } from '@/services/report/hooks';
import { exportToExcel, exportMultipleSheets } from '@/shared/utils/excelExport';
import dayjs from 'dayjs';

export default function ReportDashboard() {
  const [dateRange, setDateRange] = useState({
    start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
    end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const {
    getOrderReport,
    orderReportResult,
    getTripReport,
    tripReportResult,
    getRevenueReport,
    revenueReportResult,
    getExceptionReport,
    exceptionReportResult,
    getDriverPerformanceReport,
    driverReportResult,
  } = useReport();

  const fetchAllReports = async () => {
    await Promise.all([
      getOrderReport(dateRange),
      getTripReport(dateRange),
      getRevenueReport(dateRange),
      getExceptionReport(dateRange),
      getDriverPerformanceReport(dateRange),
    ]);
  };

  const exportSingleReport = async (reportType: string) => {
    switch (reportType) {
      case 'order':
        const orderData = await getOrderReport(dateRange);
        if (orderData) {
          exportToExcel(orderData, 'order-report', 'Orders', 'order');
        }
        break;
      case 'trip':
        const tripData = await getTripReport(dateRange);
        if (tripData) {
          exportToExcel(tripData, 'trip-report', 'Trips', 'trip');
        }
        break;
      // ... other cases
    }
  };

  const exportAllReports = async () => {
    const [orderData, tripData, revenueData, exceptionData, driverData] = await Promise.all([
      getOrderReport(dateRange),
      getTripReport(dateRange),
      getRevenueReport(dateRange),
      getExceptionReport(dateRange),
      getDriverPerformanceReport(dateRange),
    ]);

    exportMultipleSheets([
      { name: 'Orders', data: orderData!, reportType: 'order' },
      { name: 'Trips', data: tripData!, reportType: 'trip' },
      { name: 'Revenue', data: revenueData!, reportType: 'revenue' },
      { name: 'Exceptions', data: exceptionData!, reportType: 'exception' },
      { name: 'Drivers', data: driverData!, reportType: 'driver' },
    ], 'tms-complete-report');
  };

  return (
    <div>
      <h1>TMS Reports</h1>

      {/* Date Range Picker */}
      <div>
        <input
          type="date"
          value={dateRange.start_date}
          onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
        />
        <input
          type="date"
          value={dateRange.end_date}
          onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
        />
        <button onClick={fetchAllReports}>Load Reports</button>
      </div>

      {/* Export Buttons */}
      <div>
        <button onClick={() => exportSingleReport('order')}>
          Export Orders
        </button>
        <button onClick={() => exportSingleReport('trip')}>
          Export Trips
        </button>
        <button onClick={() => exportSingleReport('revenue')}>
          Export Revenue
        </button>
        <button onClick={() => exportSingleReport('exception')}>
          Export Exceptions
        </button>
        <button onClick={() => exportSingleReport('driver')}>
          Export Drivers
        </button>
        <button onClick={exportAllReports}>
          Export All (Single File)
        </button>
      </div>

      {/* Report Displays */}
      {orderReportResult.data && (
        <div>
          <h2>Order Summary</h2>
          <p>Total: {orderReportResult.data.total_orders}</p>
        </div>
      )}

      {/* ... other report displays */}
    </div>
  );
}
```

## Notes

- All report endpoints are query-based (GET requests)
- Reports are generated on the backend and fetched by the frontend
- Excel export is done entirely on the frontend (no backend export endpoint needed)
- The xlsx library is already installed (`xlsx@0.18.5` and `@types/xlsx@0.0.35`)
- All filenames automatically include timestamps
- Error handling is built into the hooks with toast notifications
