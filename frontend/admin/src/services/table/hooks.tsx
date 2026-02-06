import { useDispatch, useSelector } from "react-redux";

import { useLazyDownloadTableDataQuery, useLazyGetTableDataQuery } from "./api";
import {
  initialized,
  setFilter,
  setLimit,
  setPage,
  setSearch,
  setSorting,
  setTable,
} from "./slice";

import type { RootState } from "../store";
import type { TableState, TableConfig } from "./const";
import type { PaginatedResponse, ApiResponse } from "../types/api";
import { useEffect, useCallback, useRef } from "react";
import { logger } from "@/utils/logger";
import TableWrapper from "../../components/ui/table/wrapper";
import TableRender from "../../components/ui/table/render";
import TablePagination from "../../components/ui/table/pagination";
import TableTool from "../../components/ui/table/tools";

/**
 * Custom hook for table state management and data fetching
 * Provides table operations: pagination, sorting, filtering, searching
 *
 * @template T - Type of table row data
 * @param name - Unique identifier for the table instance
 * @param config - Table configuration (columns, URL, filters, etc.)
 * @returns Table hook with render components and control functions
 *
 * @example
 * ```tsx
 * const Table = useTable<Client>("client-table", {
 *   url: "/client",
 *   columns: { ... },
 *   onReload: () => Table.boot()
 * });
 *
 * return (
 *   <>
 *     <Table.Tools />
 *     <Table.Render />
 *     <Table.Pagination />
 *   </>
 * );
 * ```
 */
const useTable = <T = unknown,>(
  name: string,
  config: TableConfig<T> | TableConfig<unknown>
) => {
  const dispatch = useDispatch();
  const TableState = useSelector(
    (state: RootState) => state?.table?.data[name]
  );

  const [triggerFetch] = useLazyGetTableDataQuery();
  const [triggerDownload] = useLazyDownloadTableDataQuery();

  const fetchData = useCallback(
    async (state: TableState<T>) => {
      try {
        const res = (await triggerFetch({
          url: state.url,
          table: state as TableState<unknown>,
        }).unwrap()) as PaginatedResponse<T> | ApiResponse<T[]>;

        const isSuccess = res?.message === "success";
        const data =
          isSuccess && Array.isArray(res?.data) ? (res.data as T[]) : [];
        const total =
          isSuccess && "meta" in res && res.meta?.total
            ? (res.meta.total as number)
            : 0;
        const isEmpty = data?.length === 0;

        dispatch(
          setTable({
            name,
            table: {
              ...state,
              ...res,
              data,
              total,
              isEmpty,
            } as TableState<unknown>,
          })
        );
      } catch (err) {
        logger.error(`Failed to fetch table data for ${name}`, err);

        dispatch(
          setTable({
            name,
            table: {
              ...state,
              data: [],
              total: 0,
              isEmpty: true,
            } as TableState<unknown>,
          })
        );
      }
    },
    [name, dispatch, triggerFetch]
  );

  // Use ref to track if boot has been called to prevent infinite loops
  const hasBootedRef = useRef(false);
  const configUrlRef = useRef<string | undefined>(config?.url);

  const boot = useCallback(() => {
    const merged: TableState<T> = {
      ...config,
      ...(TableState || ({} as TableState<T>)),
      filter: {
        ...(TableState?.filter || {}),
        ...(config?.filter || {}), // config override tableState
      },
      data: (TableState?.data as T[] | null) || null,
      total: TableState?.total || 0,
      page:
        typeof TableState?.page === "number"
          ? TableState.page
          : typeof config.page === "number"
          ? config.page
          : 1,
      limit:
        typeof TableState?.limit === "number"
          ? TableState.limit
          : typeof config.limit === "number"
          ? config.limit
          : 25,
      sorting:
        typeof TableState?.sorting === "string"
          ? TableState.sorting
          : typeof config.sorting === "string"
          ? config.sorting
          : "",
      queryString: TableState?.queryString || "",
      textSearch: TableState?.textSearch || "",
      isEmpty: TableState?.isEmpty || false,
      showFilter: TableState?.showFilter || false,
      loading: TableState?.loading || false,
    };

    dispatch(initialized({ name, config: merged as TableState<unknown> }));
    fetchData(merged);
  }, [config, TableState, name, dispatch, fetchData]);

  useEffect(() => {
    // Only boot if URL changed or hasn't booted yet
    const urlChanged = configUrlRef.current !== config?.url;
    if (!hasBootedRef.current || urlChanged) {
      hasBootedRef.current = true;
      configUrlRef.current = config?.url;
      boot();
    }
    // Note: boot is intentionally not in dependencies to prevent infinite loops
    // It will use the latest config and TableState via closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.url]);

  const refetch = useCallback(() => {
    if (!TableState) return;
    fetchData(TableState as TableState<T>);
  }, [TableState, fetchData]);

  const updateAndFetch = useCallback(
    (updates: Partial<TableState<T>>) => {
      if (!TableState) return;

      // Only update if there are actual changes to prevent unnecessary re-renders
      const hasChanges = Object.keys(updates).some((key) => {
        const updateKey = key as keyof TableState<T>;
        const currentValue = TableState[updateKey];
        const newValue = updates[updateKey];

        // Deep comparison for objects/arrays
        if (typeof currentValue === "object" && typeof newValue === "object") {
          return JSON.stringify(currentValue) !== JSON.stringify(newValue);
        }

        return currentValue !== newValue;
      });

      if (!hasChanges) return;

      const newState = { ...TableState, ...updates } as TableState<T>;
      fetchData(newState);
    },
    [TableState, fetchData]
  );

  const onPageChange = useCallback(
    (page: number) => {
      dispatch(setPage({ name, page }));
      updateAndFetch({ page });
    },
    [name, dispatch, updateAndFetch]
  );

  const onLimitChange = useCallback(
    (limit: number) => {
      dispatch(setLimit({ name, limit }));
      updateAndFetch({ limit });
    },
    [name, dispatch, updateAndFetch]
  );

  const onSorted = useCallback(
    (sorting: string) => {
      dispatch(setSorting({ name, sorting }));
      updateAndFetch({ sorting });
    },
    [name, dispatch, updateAndFetch]
  );

  const onSearched = useCallback(
    (text: string) => {
      dispatch(setSearch({ name, text }));
      updateAndFetch({ textSearch: text });
    },
    [name, dispatch, updateAndFetch]
  );

  const onFilter = useCallback(
    (field: string | Record<string, unknown>, value?: unknown) => {
      if (!TableState) return;

      let newFilter: Record<string, unknown> = { ...(TableState.filter || {}) };

      if (typeof field === "object") {
        // bulk update
        newFilter = { ...newFilter, ...field };
      } else {
        // single field
        newFilter[field] = value;
      }

      dispatch(
        setFilter({
          name,
          field, // bisa string atau object
          value,
        })
      );

      updateAndFetch({ filter: newFilter, page: 1 });
    },
    [name, TableState, dispatch, updateAndFetch]
  );

  const onDownload = useCallback(() => {
    if (!TableState) return;
    triggerDownload({
      url: TableState.url,
      table: TableState as TableState<unknown>,
    });
  }, [TableState, triggerDownload]);

  const Render = () => {
    if (!TableState) return null;

    return (
      <TableWrapper>
        <TableRender
          name={name}
          columns={config?.columns}
          onSorted={onSorted}
          onRowClick={config?.onRowClick}
        />
      </TableWrapper>
    );
  };

  const Pagination = () => (
    <TablePagination
      name={name}
      onChangePage={onPageChange}
      onChangeLimit={onLimitChange}
    />
  );

  const Tools = ({
    children,
    downloadable,
  }: {
    children?: React.ReactNode;
    downloadable?: boolean;
  }) => (
    <TableTool
      name={name}
      onSearch={onSearched}
      downloadable={downloadable}
      onDownload={onDownload}
    >
      {children}
    </TableTool>
  );

  return {
    Render,
    Tools,
    Pagination,
    filter: onFilter,
    boot,
    State: TableState,
    refetch,
  };
};

export default useTable;
