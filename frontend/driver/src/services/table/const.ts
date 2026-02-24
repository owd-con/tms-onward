/**
 * TMS Driver - Table Constants (Minimal)
 *
 * This file provides minimal table type definitions for the table components.
 * Note: The driver app doesn't currently use the table state management like the admin app.
 */

export interface TableColumn<T = unknown> {
  title?: string;
  field?: string;
  alias?: string;
  width?: string | number;
  sortable?: boolean;
  class?: string;
  headerClass?: string;
  format_number?: boolean;
  component?: (data: T) => React.ReactNode;
}

export interface TableState {
  data: Record<string, {
    data?: unknown[];
    page?: number;
    limit?: number;
    total?: number;
    sorting?: string;
    isEmpty?: boolean;
  }>;
}
