/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from "react";
import { HiBuildingOffice2 } from "react-icons/hi2";

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
        title="Customer Report"
        titleClassName="!text-2xl"
        subtitle="View customer statistics and performance"
      />

      <Page.Body className="flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0">
        <div className="w-full flex gap-2 lg:gap-4 bg-base-100 p-2 rounded-xl">
          <div className="w-full">
            <Table.Tools downloadable={true}>
              <CustomerReportTableFilter table={Table} />
            </Table.Tools>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm w-full overflow-x-auto">
          {Table.State?.data && Table.State.data.length === 0 && !Table.State.loading ? (
            <div className="flex flex-col items-center justify-center h-48 lg:h-64 gap-3 lg:gap-4 px-4">
              <div className="text-base-content/40 text-4xl lg:text-6xl">
                <HiBuildingOffice2 />
              </div>
              <div className="text-center">
                <h3 className="text-base lg:text-lg font-semibold">No Report Data Found</h3>
                <p className="text-base-content/60 mt-1 text-sm lg:text-base">
                  Select a date range and click Generate to view the report.
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table.Render />
              <Table.Pagination />
            </>
          )}
        </div>
      </Page.Body>
    </Page>
  );
};

export default CustomerReportPage;
