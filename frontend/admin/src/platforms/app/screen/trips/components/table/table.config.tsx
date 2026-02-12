/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components";
import config from "@/services/table/const";
import { statusBadge } from "@/shared/helper";

const createTableConfig = ({
  onClick,
}: {
  onClick: (e: any) => void;
}) => ({
  ...config,
  url: "/trips",
  columns: {
    trip_number: {
      title: "Trip Number",
      sortable: true,
      headerClass: "text-xs capitalize",
    class: "p-4",
      component: (row: { trip_number: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.trip_number || "-"}</span>
        </div>
      ),
    },
    order: {
      title: "Order",
      sortable: true,
      headerClass: "text-xs capitalize",
    class: "p-4",
      component: (row: { order: any }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">
            {row?.order?.order_number || "-"}
          </span>
        </div>
      ),
    },
    driver: {
      title: "Driver",
      sortable: true,
      headerClass: "text-xs capitalize",
    class: "p-4",
      component: (row: { driver: any }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.driver?.name || "-"}</span>
        </div>
      ),
    },
    vehicle: {
      title: "Vehicle",
      sortable: true,
      headerClass: "text-xs capitalize",
    class: "p-4",
      component: (row: { vehicle: any }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">
            {row?.vehicle?.plate_number || "-"}
          </span>
        </div>
      ),
    },
    status: {
      title: "Status",
      sortable: true,
      headerClass: "text-xs capitalize",
    class: "p-4",
      component: (row: { status: string }) => {
        return statusBadge(row.status);
      },
    },
    created_at: {
      title: "Created",
      sortable: true,
      headerClass: "text-xs capitalize",
    class: "p-4",
      component: (row: { created_at: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">
            {row?.created_at
              ? new Date(row.created_at).toLocaleDateString("id-ID")
              : "-"}
          </span>
        </div>
      ),
    },
    actions: {
      title: "Actions",
      sortable: false,
      headerClass: "text-xs capitalize",
    class: "p-4",
      component: (row: any) => (
        <div className="flex place-items-center gap-1">
          <Button size="xs" onClick={() => onClick(row)}>
            View
          </Button>
        </div>
      ),
    },
  },
});

export default createTableConfig;
