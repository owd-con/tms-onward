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
      headerClass: "text-xs capitalize",
      class: "p-4",
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
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { customer: any }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.customer?.name || "-"}</span>
        </div>
      ),
    },
    order_type: {
      title: "Type",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { order_type: string }) => (
        <div className="text-xs font-normal tracking-wide">
          <span className="font-semibold">{row?.order_type || "-"}</span>
        </div>
      ),
    },
    progress: {
      title: "Progress",
      sortable: false,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { order_type: string; total_shipment: number; total_delivered: number }) => {
        // Only show progress for LTL orders
        if (row?.order_type !== "LTL") {
          return <div className="text-xs text-base-content/40">-</div>;
        }

        const total = row?.total_shipment || 0;
        const delivered = row?.total_delivered || 0;
        const percentage = total > 0 ? Math.round((delivered / total) * 100) : 0;

        return (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <progress
              className="progress progress-success w-full h-2"
              value={percentage}
              max="100"
            />
            <div className="flex justify-between text-xs">
              <span className="text-base-content/60">{delivered}/{total} delivered</span>
              <span className="font-semibold text-success">{percentage}%</span>
            </div>
          </div>
        );
      },
    },
    status: {
      title: "Status",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
      component: (row: { status: string }) => (
        <div className="text-xs font-normal tracking-wide">
          {statusBadge(row.status)}
        </div>
      ),
    },
    total_price: {
      title: "Total Price",
      sortable: true,
      headerClass: "text-xs capitalize",
      class: "p-4",
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
      headerClass: "text-xs capitalize",
      class: "p-4",
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
