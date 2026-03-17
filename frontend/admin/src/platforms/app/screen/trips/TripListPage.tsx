import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Database } from "lucide-react";

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
        pillLabel="OPERATIONS"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title="Trip Management"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Comprehensive overview of all fleet trips, driver assignments, and execution states."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          <Button
            className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10"
            onClick={() => navigate("/a/trips/create")}
          >
            + Create Trip
          </Button>
        }
      />

      <Page.Body>
        <Table.Tools>
          <TableFilter table={Table} />
        </Table.Tools>
        <Table.Render 
          emptyTitle="No Trips Found"
          emptyDescription="Get started by creating your first trip using the button above."
        />
        <Table.Pagination />
      </Page.Body>
    </Page>
  );
};

export default TripListPage;
