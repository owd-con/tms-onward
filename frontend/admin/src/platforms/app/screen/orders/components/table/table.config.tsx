import config from "@/services/table/const";
import { dateFormat } from "@/shared/helper";
import clsx from "clsx";
import { FiEye, FiMoreVertical, FiPrinter, FiXCircle } from "react-icons/fi";

const OrderTableStatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = (s: string) => {
    const normalized = s.toLowerCase();
    switch (normalized) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 outline-emerald-100";
      case "in_transit":
        return "bg-blue-50 text-blue-700 border-blue-200 outline-blue-100";
      case "dispatched":
        return "bg-amber-50 text-amber-700 border-amber-200 outline-amber-100";
      case "planned":
        return "bg-purple-50 text-purple-700 border-purple-200 outline-purple-100";
      case "pending":
        return "bg-slate-50 text-slate-600 border-slate-200 outline-slate-100";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200 outline-rose-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 outline-slate-100";
    }
  };

  const label = status.replace(/_/g, " ");

  return (
    <span
      className={clsx(
        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border outline outline-2 outline-offset-1 shadow-sm capitalize",
        getStatusStyles(status),
      )}
    >
      {label}
    </span>
  );
};

const createTableConfig = ({
  onClick,
  onCancel,
  navigate,
}: {
  onClick: (e: any) => void;
  onCancel?: (e: any) => void;
  navigate?: (path: string) => void;
}) => ({
  ...config,
  url: "/orders",
  columns: {
    order_number: {
      title: "Order Number",
      sortable: true,
      headerClass: "capitalize",
      class: "p-4",
      component: (row: { order_number: string; reference_code?: string }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-gray-900">
            {row?.order_number || "-"}
          </span>
          {row?.reference_code && (
            <span className="text-[12px] text-gray-500">
              Ref: {row.reference_code}
            </span>
          )}
        </div>
      ),
    },
    customer: {
      title: "Customer",
      sortable: true,
      headerClass: "capitalize",
      class: "p-4",
      component: (row: { customer: any }) => (
        <div className="text-[13px] font-medium text-gray-700">
          {row?.customer?.name || "-"}
        </div>
      ),
    },
    order_type: {
      title: "Type",
      sortable: false,
      headerClass: "capitalize w-[100px]",
      class: "p-4",
      component: (row: { order_type: string }) => {
        const type = (row?.order_type || "N/A").toUpperCase();
        let bgClass = "bg-slate-100 text-slate-700 border-slate-200";
        if (type === "FTL")
          bgClass = "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]"; // Purple
        if (type === "LTL")
          bgClass = "bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]"; // Sky blue

        return (
          <span
            className={clsx(
              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide border shadow-sm",
              bgClass,
            )}
          >
            {type}
          </span>
        );
      },
    },
    status: {
      title: "Status",
      sortable: false,
      headerClass: "capitalize w-[150px]",
      class: "p-4 w-[100px]",
      component: (row: { status: string }) => (
        <div className="flex items-center py-1">
          <OrderTableStatusBadge status={row.status} />
        </div>
      ),
    },
    progress: {
      title: "Progress",
      sortable: false,
      headerClass: "capitalize w-[250px]",
      class: "p-4 w-[200px]",
      component: (row: { total_shipment: number; total_delivered: number }) => {
        const total = row?.total_shipment || 0;
        const delivered = row?.total_delivered || 0;
        const percentage =
          total > 0 ? Math.round((delivered / total) * 100) : 0;

        return (
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-500 font-medium">Delivered</span>
              <span className="font-semibold text-gray-900">
                {delivered}/{total}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      },
    },
    total_price: {
      title: "Total Price",
      sortable: false,
      headerClass: "capitalize w-[200px]",
      class: "p-4",
      component: (row: { total_price: number }) => (
        <div className="text-[13px] font-semibold text-gray-900">
          {row?.total_price
            ? `Rp ${new Intl.NumberFormat("id-ID").format(row.total_price)}`
            : "-"}
        </div>
      ),
    },
    created_at: {
      title: "Created",
      sortable: true,
      headerClass: "capitalize  w-[200px]",
      class: "p-4",
      component: (row: { created_at: string; created_by?: string }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium text-gray-700">
            {dateFormat(row?.created_at)}
          </span>
          {row?.created_by && (
            <span className="text-[12px] text-gray-500">
              by {row.created_by}
            </span>
          )}
        </div>
      ),
    },
    actions: {
      title: "Aksi",
      sortable: false,
      headerClass: "capitalize text-center w-[50px]",
      class: "p-4 text-center w-[50px]",
      component: (row: any) => {
        const type = (row?.order_type || "").toUpperCase();
        const canCancel = row.status === "pending";

        return (
        <div className="flex justify-end">
          <div className="dropdown dropdown-end md:dropdown-click" onClick={(e) => e.stopPropagation()}>
            <button
              tabIndex={0}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            >
              <FiMoreVertical className="w-5 h-5" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-[100] menu p-2 shadow-2xl bg-white rounded-2xl w-56 border border-slate-100 mt-2"
            >
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(row);
                  }}
                  className="flex items-center gap-3 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 py-3 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <FiEye className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-[13px]">View Detail</span>
                    <span className="text-[11px] text-slate-400">Manage orders & docs</span>
                  </div>
                </button>
              </li>

              {/* Print Context Actions */}
              {type === "FTL" && navigate && (
                <li>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `/a/print/delivery-order/order/${row.id}`,
                        "_blank",
                      );
                    }}
                    className="flex items-center gap-3 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 py-3 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <FiPrinter className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-bold text-[13px]">Print DO</span>
                      <span className="text-[11px] text-slate-400">Export delivery order</span>
                    </div>
                  </button>
                </li>
              )}

              {type === "LTL" && navigate && row.shipments?.length > 0 && (
                <li>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/a/print/resi/order/${row.id}`, "_blank");
                    }}
                    className="flex items-center gap-3 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 py-3 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <FiPrinter className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-bold text-[13px]">Print Resi</span>
                      <span className="text-[11px] text-slate-400">Export receipt documents</span>
                    </div>
                  </button>
                </li>
              )}

              {/* Cancel Action */}
              {canCancel && onCancel && (
                <>
                  <div className="my-1 border-t border-slate-50"></div>
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel(row);
                      }}
                      className="flex items-center gap-3 hover:bg-rose-50 hover:text-rose-600 text-rose-600 py-3 rounded-xl transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                        <FiXCircle className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className="font-bold text-[13px]">Cancel Order</span>
                        <span className="text-[11px] text-rose-300">Stop processing</span>
                      </div>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        );
      },
    },
  },
});

export default createTableConfig;
