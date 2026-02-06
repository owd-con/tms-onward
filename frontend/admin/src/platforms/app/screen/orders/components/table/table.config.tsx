/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components";
import config from "@/services/table/const";
import { dateFormat, statusBadge } from "@/shared/helper";

const createTableConfig = ({
  onClick,
}: {
  onClick: (e: any) => void;
}) => ({
  ...config,
  url: "/orders",
  columns: {
    order_number: {
      title: "Order Number",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { order_number: string; reference_code?: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.order_number || "-"}</span>
          {row?.reference_code && (
            <div className="text-xs text-base-content/60 mt-0.5">
              Ref: {row.reference_code}
            </div>
          )}
        </div>
      ),
    },
    customer: {
      title: "Customer",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { customer: any }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.customer?.name || "-"}</span>
        </div>
      ),
    },
    order_type: {
      title: "Type",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { order_type: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.order_type || "-"}</span>
        </div>
      ),
    },
    status: {
      title: "Status",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { status: string }) => (
        <div className="text-xs font-normal tracking-wide">
          {statusBadge(row.status)}
        </div>
      ),
    },
    total_price: {
      title: "Total Price",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { total_price: number }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">
            {row?.total_price ? `Rp ${new Intl.NumberFormat("id-ID").format(row.total_price)}` : "-"}
          </span>
        </div>
      ),
    },
    created_at: {
      title: "Created",
      sortable: true,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
      component: (row: { created_at: string; created_by?: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{dateFormat(row?.created_at)}</span>
          {row?.created_by && (
            <div className="text-xs text-base-content/60 mt-0.5">
              by {row.created_by}
            </div>
          )}
        </div>
      ),
    },
    actions: {
      title: "Actions",
      sortable: false,
      headerClass: "text-xs capitalize!",
      class: "p-4!",
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
