/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from "react";
import { BarChart2 } from "lucide-react";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Page } from "../../components/layout";
import createTableConfig from "./components/customer-report-table/table.config";
import CustomerReportTableFilter from "./components/customer-report-table/filter";

/**
 * TMS Onward - Customer Report Page
 *
 * Displays customer statistics with date range filtering.
 */
const CustomerReportPage = () => {
  const tableConfig = useMemo(() => {
    return createTableConfig();
  }, []);

  const Table = useTable("customer-report", tableConfig as TableConfig<unknown>);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        pillLabel="REPORTS"
        pillIcon={<BarChart2 size={12} strokeWidth={2.5} />}
        title="Customer Report"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Analyze customer behavior, transaction volume, and overall performance metrics."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
      />

      <Page.Body>
        <Table.Tools downloadable={true}>
          <CustomerReportTableFilter table={Table} />
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

export default CustomerReportPage;
