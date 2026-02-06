# Report Service - Quick Start Guide

## Import Statements

```tsx
// Import the report hook
import { useReport } from '@/services/report/hooks';

// Import types (if needed)
import type { OrderSummaryReport, TripSummaryReport } from '@/services/report';

// Import Excel export utilities
import { exportToExcel, exportMultipleSheets } from '@/shared/utils/excelExport';
```

## Basic Usage Pattern

```tsx
function ReportPage() {
  const { getOrderReport } = useReport();

  const fetchAndExport = async () => {
    // 1. Fetch report data
    const data = await getOrderReport({
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      status: 'all'
    });

    // 2. Export to Excel
    if (data) {
      exportToExcel(data, 'order-report', 'Orders', 'order');
    }
  };

  return <button onClick={fetchAndExport}>Export Order Report</button>;
}
```

## Available Report Methods

| Method | Params | Returns | Report Type |
|--------|--------|---------|-------------|
| `getOrderReport` | start_date, end_date, status | OrderSummaryReport | order |
| `getTripReport` | start_date, end_date, status | TripSummaryReport | trip |
| `getRevenueReport` | start_date, end_date | RevenueReport | revenue |
| `getExceptionReport` | start_date, end_date, status | ExceptionReport | exception |
| `getDriverPerformanceReport` | start_date, end_date | DriverPerformanceReport[] | driver |

## Export Function Signatures

### Single Report
```tsx
exportToExcel(data, filename, sheetName, reportType?)
```

### Multiple Reports
```tsx
exportMultipleSheets([
  { name: 'Sheet1', data: data1, reportType?: 'type1' },
  { name: 'Sheet2', data: data2, reportType?: 'type2' }
], filename)
```

## Quick Examples

### Export Order Report
```tsx
const { getOrderReport } = useReport();
const data = await getOrderReport({ start_date, end_date, status });
exportToExcel(data, 'order-report', 'Orders', 'order');
```

### Export All Reports to One File
```tsx
const { getOrderReport, getTripReport, getRevenueReport } = useReport();
const [orders, trips, revenue] = await Promise.all([
  getOrderReport(params),
  getTripReport(params),
  getRevenueReport(params)
]);
exportMultipleSheets([
  { name: 'Orders', data: orders!, reportType: 'order' },
  { name: 'Trips', data: trips!, reportType: 'trip' },
  { name: 'Revenue', data: revenue!, reportType: 'revenue' }
], 'complete-report');
```

## File Locations

- API Service: `src/services/report/api.tsx`
- Hooks: `src/services/report/hooks.tsx`
- Excel Utility: `src/shared/utils/excelExport.ts`
- Full Docs: `src/services/report/README.md`
- Example: `src/services/report/ReportExample.tsx`

## Error Handling

All report methods automatically handle errors and show toast notifications:

```tsx
try {
  const data = await getOrderReport(params);
  // Success - use data
} catch (error) {
  // Error already shown via toast notification
}
```

## Loading States

Each report has a corresponding result object:

```tsx
const { getOrderReport, orderReportResult } = useReport();

{orderReportResult.isLoading && <Spinner />}
{orderReportResult.data && <ReportDisplay data={orderReportResult.data} />}
```

## Dependencies (Already Installed)

- xlsx@0.18.5
- @types/xlsx@0.0.35

No additional installation required!
