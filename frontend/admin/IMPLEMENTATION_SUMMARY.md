# Report API & Excel Export Implementation Summary

## Overview

Successfully created the Report API service and Excel export utility for the TMS Onward admin frontend. All components follow the existing project patterns and are ready to use.

## Created Files

### 1. Report API Service
**Location:** `/home/naufal/Workspaces/tms-onward/frontend/admin/src/services/report/api.tsx`

Created RTK Query API service with the following endpoints:
- `getOrderReport` - GET /reports/orders
- `getTripReport` - GET /reports/trips
- `getRevenueReport` - GET /reports/revenue
- `getExceptionReport` - GET /reports/exceptions
- `getDriverPerformanceReport` - GET /reports/drivers

**Features:**
- TypeScript interfaces for all report types
- Lazy query hooks for on-demand fetching
- Consistent with existing service patterns (company, order, trip, etc.)

### 2. Report Hooks
**Location:** `/home/naufal/Workspaces/tms-onward/frontend/admin/src/services/report/hooks.tsx`

Created custom hook `useReport()` that provides:
- Methods for fetching all report types
- Automatic error handling with toast notifications
- Loading states for each report
- Consistent API with other service hooks

**Exported Methods:**
- `getOrderReport(params)`
- `getTripReport(params)`
- `getRevenueReport(params)`
- `getExceptionReport(params)`
- `getDriverPerformanceReport(params)`

### 3. Excel Export Utility
**Location:** `/home/naufal/Workspaces/tms-onward/frontend/admin/src/shared/utils/excelExport.ts`

Comprehensive Excel export utility with:

**Main Functions:**
- `exportToExcel(data, filename, sheetName, reportType?)` - Export single report
- `exportMultipleSheets(sheets, filename)` - Export multiple reports to one file

**Helper Functions:**
- `flattenObject(obj, prefix?)` - Flatten nested objects
- `formatHeader(str)` - Format column headers (camelCase → Title Case)
- `formatReportDataForExcel(data, reportType)` - Format data for specific report types

**Report Type Formatting:**
- `"order"` - Order summary with status/type breakdown
- `"trip"` - Trip summary with status breakdown
- `"revenue"` - Revenue with currency formatting
- `"exception"` - Exception summary with type breakdown
- `"driver"` - Driver performance table format

**Features:**
- Auto-formatted column headers
- Auto-adjusted column widths
- Bold headers
- Timestamp in filename
- Multi-sheet support

### 4. Index File
**Location:** `/home/naufal/Workspaces/tms-onward/frontend/admin/src/services/report/index.ts`

Barrel file for clean imports:
```tsx
import { useReport } from '@/services/report';
import type { OrderSummaryReport } from '@/services/report';
```

### 5. Documentation
**Location:** `/home/naufal/Workspaces/tms-onward/frontend/admin/src/services/report/README.md`

Comprehensive documentation with:
- API reference
- Usage examples
- Data structures
- Complete dashboard example
- Error handling patterns

### 6. Example Component
**Location:** `/home/naufal/Workspaces/tms-onward/frontend/admin/src/services/report/ReportExample.tsx`

Fully functional example component demonstrating:
- Date range selection
- Fetching all report types
- Exporting individual reports
- Exporting all reports to single file
- Displaying report data
- Loading states

## Dependencies

The following packages are already installed (verified):
- `xlsx@0.18.5` - Excel file generation
- `@types/xlsx@0.0.35` - TypeScript definitions

## Usage Examples

### Basic Usage

```tsx
import { useReport } from '@/services/report/hooks';
import { exportToExcel } from '@/shared/utils/excelExport';

function MyComponent() {
  const { getOrderReport } = useReport();

  const handleExport = async () => {
    const data = await getOrderReport({
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      status: 'all'
    });

    if (data) {
      exportToExcel(data, 'order-report', 'Orders', 'order');
    }
  };

  return <button onClick={handleExport}>Export Report</button>;
}
```

### Export Multiple Sheets

```tsx
import { exportMultipleSheets } from '@/shared/utils/excelExport';

const [orders, trips, revenue] = await Promise.all([
  getOrderReport(params),
  getTripReport(params),
  getRevenueReport(params),
]);

exportMultipleSheets([
  { name: 'Orders', data: orders!, reportType: 'order' },
  { name: 'Trips', data: trips!, reportType: 'trip' },
  { name: 'Revenue', data: revenue!, reportType: 'revenue' },
], 'tms-summary-report');
```

## Report Data Structures

### OrderSummaryReport
```tsx
{
  total_orders: number;
  orders_by_status: Record<string, number>;
  orders_by_type: Record<string, number>;
}
```

### TripSummaryReport
```tsx
{
  total_trips: number;
  trips_by_status: Record<string, number>;
}
```

### RevenueReport
```tsx
{
  total_revenue: number;
}
```

### ExceptionReport
```tsx
{
  total_exceptions: number;
  exceptions_by_type: Record<string, number>;
}
```

### DriverPerformanceReport[]
```tsx
[{
  driver_id: string;
  driver_name: string;
  total_trips: number;
  completed_trips: number;
  on_time_rate: number; // 0-1 decimal
}]
```

## Integration Points

### Backend API Endpoints
The report hooks connect to these backend endpoints:
- GET /reports/orders?start_date=&end_date=&status=
- GET /reports/trips?start_date=&end_date=&status=
- GET /reports/revenue?start_date=&end_date=
- GET /reports/exceptions?start_date=&end_date=&status=
- GET /reports/drivers?start_date=&end_date=

### Existing Utilities Used
- `@/services/baseQuery` - Base query configuration
- `@/services/form/hooks` - Error handling with `useFormActions`
- `@/utils/logger` - Logging
- `@/shared/utils/formatter` - Currency and percentage formatting

## Next Steps

To integrate this into your admin frontend:

1. **Import the hook in your report components:**
   ```tsx
   import { useReport } from '@/services/report/hooks';
   ```

2. **Import the export utility:**
   ```tsx
   import { exportToExcel, exportMultipleSheets } from '@/shared/utils/excelExport';
   ```

3. **Use the existing report pages:**
   - `/home/naufal/Workspaces/tms-onward/frontend/admin/src/platforms/app/screen/reports/`

4. **Add export buttons to existing report cards**

## Testing

To test the implementation:

1. Use the example component:
   ```tsx
   import ReportExample from '@/services/report/ReportExample';
   <ReportExample />
   ```

2. Or integrate into existing pages in:
   `/home/naufal/Workspaces/tms-onward/frontend/admin/src/platforms/app/screen/reports/`

## Files Created Summary

| File | Lines | Purpose |
|------|-------|---------|
| `src/services/report/api.tsx` | 95 | RTK Query API service |
| `src/services/report/hooks.tsx` | 125 | Custom report hook |
| `src/services/report/index.ts` | 25 | Barrel exports |
| `src/shared/utils/excelExport.ts` | 398 | Excel export utility |
| `src/services/report/README.md` | 450+ | Documentation |
| `src/services/report/ReportExample.tsx` | 370+ | Example component |

**Total:** ~1,460 lines of code and documentation

## Benefits

1. **Consistent with existing patterns** - Follows company/service patterns
2. **Type-safe** - Full TypeScript support
3. **Error handling** - Built-in error handling with toast notifications
4. **Flexible** - Support for single or multi-sheet exports
5. **Well-documented** - Comprehensive README and examples
6. **Zero additional dependencies** - Uses already-installed packages
7. **Frontend-only export** - No backend changes needed

## Notes

- All Excel export is done client-side (no backend export endpoints needed)
- The xlsx library handles all Excel file generation
- Report data is fetched from backend, formatted, and exported on frontend
- All filenames include timestamps for versioning
- Column headers are auto-formatted for readability
