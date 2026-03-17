import React from "react";
import { useSelector } from "react-redux";
import { currencyFormat } from "../../../utils/common";
import type { RootState } from "../../../services/store";
import type { TableColumn } from "../../../services/table/const";
import EmptyState from "./empty-state";

interface TableRenderProps<T> {
  name: string;
  columns: Record<string, TableColumn<T>>;
  onSorted: (field: string) => void;
  onRowClick?: (row: T) => void;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

function TableRender<T>({
  name,
  columns,
  onSorted,
  onRowClick,
  onClearFilters,
  emptyTitle,
  emptyDescription,
}: TableRenderProps<T>) {
  const StateTable = useSelector(
    (state: RootState) => state?.table?.data[name]?.data
  );
  const StateSorting = useSelector(
    (state: RootState) => state?.table?.data[name]?.sorting
  );
  const StateEmpty = useSelector(
    (state: RootState) => state?.table?.data[name]?.isEmpty
  );
  const StateFilter = useSelector(
    (state: RootState) => state?.table?.data[name]?.filter
  );
  const StateSearch = useSelector(
    (state: RootState) => state?.table?.data[name]?.textSearch
  );

  const rows: T[] = Array.isArray(StateTable) ? (StateTable as T[]) : [];

  const checkSorted = () => {
    const result = { field: StateSorting, sort: "asc" as "asc" | "desc" };

    if (StateSorting?.charAt(0) === "-") {
      result.sort = "desc";
      result.field = result.field.substring(1);
    }
    return result;
  };

  const onFieldSorted = (field: string, column: TableColumn<T>) => {
    if (!column?.sortable) return;
    const sorting = checkSorted();

    let sortby = field;
    if (typeof column.alias === "string") {
      sortby = column.alias;
    }

    if (sortby === sorting.field) {
      if (sorting.sort === "asc") {
        sortby = "-" + sortby;
      }
    }

    onSorted(sortby);
  };

  const Th = ({ field, column }: { field: string; column: TableColumn<T> }) => {
    const className = column?.headerClass ?? "";
    const sorting = checkSorted();

    const isSortable = column?.sortable !== false;
    const isSortedField = sorting.field === field || sorting.field === column?.alias;

    return (
      <th
        className={`px-4 py-4 text-left select-none ${isSortable ? "cursor-pointer" : ""} ${className}`}
        style={{ width: column?.width as string | number | undefined }}
        onClick={() => isSortable && onFieldSorted(field, column)}
      >
        <div className="flex items-center justify-between w-full gap-2 group">
          <span className="text-[11px] font-bold tracking-[0.05em] text-[#8B95A5] uppercase">{column?.title}</span>

          {isSortable && (
            <div className={`flex items-center -space-x-1.5 transition-colors ${isSortedField ? "text-gray-200" : "text-[#D1D5DB] group-hover:text-gray-400"}`}>
              <svg
                className={`w-3.5 h-3.5 ${isSortedField && sorting.sort === 'asc' ? 'text-gray-500' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19V5m0 0l-6 6m6-6 6 6" />
              </svg>
              <svg
                className={`w-3.5 h-3.5 ${isSortedField && sorting.sort === 'desc' ? 'text-gray-500' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 5v14m0 0l-6-6m6 6 6-6" />
              </svg>
            </div>
          )}
        </div>
      </th>
    );
  };

  const Td = ({
    field,
    column,
    data,
  }: {
    field: string;
    column: TableColumn<T>;
    data: T;
  }) => {
    const className = column?.class ?? "";

    if (column?.component && React.isValidElement(column.component(data))) {
      return (
        <td
          className={`px-4 py-3 align-middle ${className}`}
          style={{ width: column?.width as string | number | undefined }}
        >
          {column.component(data)}
        </td>
      );
    }

    const value = column?.format_number
      ? currencyFormat((data as any)[field] || 0)
      : (data as any)[field];

    return (
      <td
        className={`px-4 py-3 align-middle text-[13px] font-medium text-gray-700 ${className}`}
        style={{ width: column?.width as string | number | undefined }}
      >
        {value}
      </td>
    );
  };

  if (StateEmpty) {
    const isFiltered =
      StateSearch !== "" ||
      Object.values(StateFilter || {}).some(
        (v) => v !== undefined && v !== "" && v !== null
      );

    return (
      <div className="bg-white border border-gray-200 p-10 min-h-[400px] flex items-center justify-center">
        <EmptyState
          type={isFiltered ? "filtered" : "empty"}
          onClearFilters={onClearFilters}
          title={isFiltered ? undefined : emptyTitle}
          description={isFiltered ? undefined : emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-390px)] flex-col bg-white border border-gray-200">
      <div className="flex-1 overflow-auto">
        <table
          className="table-hover table-vcenter card-table datatable table"
          width="100%"
        >
          <thead>
            <tr>
              {Object.keys(columns).map((key) => (
                <Th key={key} field={key} column={columns[key]} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                className="hover:bg-gray-50/50 border-b border-gray-100 last:border-0 hover:cursor-pointer transition-colors group"
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
              >
                {Object.keys(columns).map((key) => (
                  <Td key={key} field={key} column={columns[key]} data={row} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableRender;
