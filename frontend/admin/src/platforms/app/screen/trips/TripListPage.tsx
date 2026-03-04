/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HiFlag } from "react-icons/hi2";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Button } from "@/components";
import { Page } from "../../components/layout";
import createTableConfig from "./components/table/table.config";
import TableFilter from "./components/table/filter";

/**
 * TMS Onward - Trip List Page
 *
 * Halaman list trip dengan filter dan pagination
 * Menampilkan semua trip dalam sistem
 */
const TripListPage = () => {
  const navigate = useNavigate();

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onClick: (e: any) => {
        navigate(`/a/trips/${e?.id}`);
      },
    });
  }, [navigate]);

  const Table = useTable("trip", tableConfig as TableConfig<unknown>);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        title="Trips"
        titleClassName="!text-2xl"
        subtitle="Manage your trips and driver assignments"
        action={
          <Button variant="primary" onClick={() => navigate("/a/trips/create")}>
            + Create Trip
          </Button>
        }
      />

      <Page.Body className="flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0">
        <div className="w-full flex gap-2 lg:gap-4 bg-base-100 p-2 rounded-xl">
          <div className="w-full">
            <Table.Tools>
              <TableFilter table={Table} />
            </Table.Tools>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm w-full overflow-x-auto">
          {Table.State?.data && Table.State.data.length === 0 && !Table.State.loading ? (
            <div className="flex flex-col items-center justify-center h-48 lg:h-64 gap-3 lg:gap-4 px-4">
              <div className="text-base-content/40 text-4xl lg:text-6xl">
                <HiFlag />
              </div>
              <div className="text-center">
                <h3 className="text-base lg:text-lg font-semibold">No Trips Found</h3>
                <p className="text-base-content/60 mt-1 text-sm lg:text-base">
                  Get started by creating your first trip using the button above.
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

export default TripListPage;
