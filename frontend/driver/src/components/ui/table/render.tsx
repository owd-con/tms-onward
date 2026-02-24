import React from "react";
import { useSelector } from "react-redux";
import { currencyFormat } from "../../../utils/common";
import type { RootState } from "../../../services/store";
import type { TableColumn } from "../../../services/table/const";

interface TableRenderProps<T> {
  name: string;
  columns: Record<string, TableColumn<T>>;
  onSorted: (field: string) => void;
  onRowClick?: (row: T) => void;
}

function TableRender<T>({
  name,
  columns,
  onSorted,
  onRowClick,
}: TableRenderProps<T>) {
  const StateTable = useSelector(
    (state: RootState) => (state as any)?.table?.data[name]?.data
  );
  const StateSorting = useSelector(
    (state: RootState) => (state as any)?.table?.data[name]?.sorting
  );
  const StateEmpty = useSelector(
    (state: RootState) => (state as any)?.table?.data[name]?.isEmpty
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

    return (
      <th
        className={`cursor-pointer px-4 py-4 text-left text-sm font-semibold tracking-wide text-black uppercase select-none ${
          column.sortable ? "sorting" : ""
        } ${
          sorting.field === field || sorting.field === column?.alias
            ? "sorting_" + sorting.sort
            : ""
        } ${className}`}
        style={{ width: column?.width as string | number | undefined }}
        onClick={() => onFieldSorted(field, column)}
      >
        {column?.title}
        {column?.sortable !== false && <span className="sort" />}
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
          className={`px-4 py-2 text-sm ${className}`}
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
        className={`px-4 py-2 text-sm ${className}`}
        style={{ width: column?.width as string | number | undefined }}
      >
        {value}
      </td>
    );
  };

  if (StateEmpty) {
    return (
      <div className="h-[calc(100vh-390px)] w-full py-20 text-center">
        <h3 className="text-lg font-semibold">No results found</h3>
        <p className="text-sm text-gray-500">
          Try adjusting your search or filters to find what you're looking for.
          <br />
          Or maybe there's no data yet!
        </p>
      </div>
    );
  }

  return (
    <div className="table-responsive m-0 flex h-[calc(100vh-390px)] flex-col">
      <div className="flex-1 overflow-auto">
        <table
          className="table-hover table-vcenter card-table datatable table-striped table"
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
                className="hover:text-primary! text-xs font-medium tracking-wide uppercase hover:cursor-pointer"
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
