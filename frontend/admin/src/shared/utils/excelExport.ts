import * as XLSX from "xlsx";
import { formatCurrency, formatPercentage } from "./formatter";

/**
 * TMS Onward - Excel Export Utility
 *
 * Provides utilities to export data to Excel format.
 * Uses xlsx library to create and download Excel files.
 */

/**
 * Flatten nested objects for Excel export
 * Converts nested objects into flat structure with dot notation keys
 *
 * @param obj - Object to flatten
 * @param prefix - Key prefix for nested properties
 * @returns Flattened object
 *
 * @example
 * flattenObject({ name: "John", address: { city: "Jakarta" } })
 * // Returns: { name: "John", "address.city": "Jakarta" }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        Object.assign(flattened, flattenObject(value as Record<string, unknown>, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
  }

  return flattened;
}

/**
 * Convert camelCase to Title Case for column headers
 *
 * @param str - String to convert
 * @returns Formatted string
 *
 * @example
 * formatHeader("totalOrders") // "Total Orders"
 * formatHeader("driver_name") // "Driver Name"
 */
export function formatHeader(str: string): string {
  // Replace snake_case and camelCase with spaces
  const formatted = str
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase to space
    .replace(/_/g, " ") // snake_case to space
    .replace(/\./g, " ") // dot notation to space
    .toLowerCase(); // Convert to lowercase first

  // Capitalize first letter of each word
  return formatted
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format report data for Excel export
 * Transforms data structures into Excel-friendly format
 *
 * @param data - Report data to format
 * @param reportType - Type of report for special formatting
 * @returns Formatted data array
 */
export function formatReportDataForExcel(
  data: unknown,
  reportType: string
): Record<string, unknown>[] {
  if (!data) return [];

  // Handle different report types
  switch (reportType) {
    case "order":
      return formatOrderReport(data as Record<string, unknown>);
    case "trip":
      return formatTripReport(data as Record<string, unknown>);
    case "revenue":
      return formatRevenueReport(data as Record<string, unknown>);
    case "exception":
      return formatExceptionReport(data as Record<string, unknown>);
    case "driver":
      return formatDriverReport(data as Record<string, unknown>[]);
    default:
      // Default: just flatten the data
      return Array.isArray(data)
        ? data.map((item) => flattenObject(item as Record<string, unknown>))
        : [flattenObject(data as Record<string, unknown>)];
  }
}

/**
 * Format order report for Excel
 */
function formatOrderReport(data: Record<string, unknown>): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Summary row
  rows.push({
    metric: "Total Orders",
    value: data.total_orders,
  });

  // Orders by status
  if (data.orders_by_status) {
    for (const [status, count] of Object.entries(
      data.orders_by_status as Record<string, number>
    )) {
      rows.push({
        metric: `Orders - ${status}`,
        value: count,
      });
    }
  }

  // Orders by type
  if (data.orders_by_type) {
    for (const [type, count] of Object.entries(data.orders_by_type as Record<string, number>)) {
      rows.push({
        metric: `Orders by Type - ${type}`,
        value: count,
      });
    }
  }

  return rows;
}

/**
 * Format trip report for Excel
 */
function formatTripReport(data: Record<string, unknown>): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Summary row
  rows.push({
    metric: "Total Trips",
    value: data.total_trips,
  });

  // Trips by status
  if (data.trips_by_status) {
    for (const [status, count] of Object.entries(
      data.trips_by_status as Record<string, number>
    )) {
      rows.push({
        metric: `Trips - ${status}`,
        value: count,
      });
    }
  }

  return rows;
}

/**
 * Format revenue report for Excel
 */
function formatRevenueReport(data: Record<string, unknown>): Record<string, unknown>[] {
  return [
    {
      metric: "Total Revenue",
      value: data.total_revenue,
      formatted: formatCurrency(data.total_revenue as number),
    },
  ];
}

/**
 * Format exception report for Excel
 */
function formatExceptionReport(data: Record<string, unknown>): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Summary row
  rows.push({
    metric: "Total Exceptions",
    value: data.total_exceptions,
  });

  // Exceptions by type
  if (data.exceptions_by_type) {
    for (const [type, count] of Object.entries(
      data.exceptions_by_type as Record<string, number>
    )) {
      rows.push({
        metric: `Exceptions - ${type}`,
        value: count,
      });
    }
  }

  return rows;
}

/**
 * Format driver performance report for Excel
 */
function formatDriverReport(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map((driver) => ({
    "Driver ID": driver.driver_id,
    "Driver Name": driver.driver_name,
    "Total Trips": driver.total_trips,
    "Completed Trips": driver.completed_trips,
    "On Time Rate": driver.on_time_rate,
    "On Time Rate (%)": formatPercentage(driver.on_time_rate as number, 2),
  }));
}

/**
 * Export data to Excel file
 * Main function to create and download Excel file from data
 *
 * @param data - Data to export (array of objects or single object)
 * @param filename - Name of the Excel file (without extension)
 * @param sheetName - Name of the sheet (default: "Sheet1")
 * @param reportType - Optional report type for special formatting
 *
 * @example
 * // Basic usage
 * exportToExcel([{ name: "John", age: 30 }], "users");
 *
 * // With report type
 * exportToExcel(orderReportData, "order-report", "Orders", "order");
 */
export function exportToExcel(
  data: unknown[] | Record<string, unknown>,
  filename: string,
  sheetName = "Sheet1",
  reportType?: string
): void {
  try {
    // Format data if report type is specified
    let processedData: Record<string, unknown>[] = [];

    if (reportType) {
      processedData = formatReportDataForExcel(data, reportType);
    } else {
      // Convert to array if single object
      const dataArray = Array.isArray(data) ? data : [data];
      // Flatten objects and format headers
      processedData = dataArray.map((item) => flattenObject(item as Record<string, unknown>));
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(processedData, {
      header: Object.keys(processedData[0] || {}),
    });

    // Format column headers
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].v = formatHeader(worksheet[cellAddress].v as string);
        // Make header bold
        worksheet[cellAddress].s = {
          font: { bold: true },
        };
      }
    }

    // Set column widths
    const colWidths = Object.keys(processedData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15), // Minimum width of 15
    }));
    worksheet["!cols"] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Add timestamp to filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fullFilename);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw new Error("Failed to export data to Excel");
  }
}

/**
 * Export multiple sheets to a single Excel file
 *
 * @param sheets - Array of sheet data with name and data
 * @param filename - Name of the Excel file (without extension)
 *
 * @example
 * exportMultipleSheets([
 *   { name: "Orders", data: orderData, reportType: "order" },
 *   { name: "Trips", data: tripData, reportType: "trip" },
 * ], "summary-report");
 */
export function exportMultipleSheets(
  sheets: Array<{
    name: string;
    data: unknown[] | Record<string, unknown>;
    reportType?: string;
  }>,
  filename: string
): void {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      // Format data if report type is specified
      let processedData: Record<string, unknown>[] = [];

      if (sheet.reportType) {
        processedData = formatReportDataForExcel(sheet.data, sheet.reportType);
      } else {
        const dataArray = Array.isArray(sheet.data) ? sheet.data : [sheet.data];
        processedData = dataArray.map((item) => flattenObject(item as Record<string, unknown>));
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(processedData, {
        header: Object.keys(processedData[0] || {}),
      });

      // Format column headers
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].v = formatHeader(worksheet[cellAddress].v as string);
          worksheet[cellAddress].s = {
            font: { bold: true },
          };
        }
      }

      // Set column widths
      const colWidths = Object.keys(processedData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet["!cols"] = colWidths;

      // Add to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    // Add timestamp to filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fullFilename);
  } catch (error) {
    console.error("Error exporting multiple sheets to Excel:", error);
    throw new Error("Failed to export data to Excel");
  }
}
