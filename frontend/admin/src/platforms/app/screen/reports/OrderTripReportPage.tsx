/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from "react";
import { BarChart2 } from "lucide-react";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Page } from "../../components/layout";
import createTableConfig from "./components/order-trip-table/table.config";
import OrderTripTableFilter from "./components/order-trip-table/filter";

/**
 * TMS Onward - Order Trip Waypoint Report Page
 *
 * Displays order, trip, and waypoint report with date range filtering.
 */
const OrderTripReportPage = () => {
  const tableConfig = useMemo(() => {
    return createTableConfig();
  }, []);

  const Table = useTable(
    "order-trip-waypoint-report",
    tableConfig as TableConfig<unknown>,
  );

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        pillLabel="REPORTS"
        pillIcon={<BarChart2 size={12} strokeWidth={2.5} />}
        title="Order Trip Waypoint Report"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Detailed tracking of dispatch lifecycles, vehicle assignments, and route progression."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
      />

      <Page.Body>
        <Table.Tools downloadable={true}>
          <OrderTripTableFilter table={Table} />
        </Table.Tools>

        <Table.Render 
          emptyTitle="No Report Data Found"
          emptyDescription="Select a date range and click Generate to view the report."
        />
        <Table.Pagination />
      </Page.Body>
    </Page>
  );
};

export default OrderTripReportPage;
