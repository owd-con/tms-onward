import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Database } from "lucide-react";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Button, Modal } from "@/components";
import { Page } from "../../components/layout";
import createTableConfig from "./components/table/table.config";
import TableFilter from "./components/table/filter";
import { useCancelOrderMutation } from "@/services/order/api";

/**
 * TMS Onward - Order List Page
 */
const OrderListPage = () => {
  const navigate = useNavigate();

  const [cancelOrder, cancelResult] = useCancelOrderMutation();
  const [orderToCancel, setOrderToCancel] = useState<any>(null);

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onClick: (e: any) => {
        navigate(`/a/orders/${e?.id}`);
      },
      navigate,
      onCancel: (e: any) => {
        setOrderToCancel(e);
      },
    });
  }, [navigate]);

  const Table = useTable("order", tableConfig as TableConfig<unknown>);

  // Reload order data after successful cancel
  useEffect(() => {
    if (cancelResult?.isSuccess) {
      setOrderToCancel(null);
      Table.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelResult?.isSuccess]);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        pillLabel="OPERATIONS"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title="Order Management"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Comprehensive overview of all customer orders, shipments, and processing states."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          <Button
            className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10"
            onClick={() => navigate("/a/orders/create")}
          >
            + Create Order
          </Button>
        }
      />

      <Page.Body>
        <Table.Tools>
          <TableFilter table={Table} />
        </Table.Tools>
        
        <Table.Render 
          emptyTitle="No Orders Found"
          emptyDescription="Get started by creating your first order using the button above."
        />
        <Table.Pagination />

        <Modal.Wrapper
          open={!!orderToCancel}
          onClose={() => setOrderToCancel(null)}
          className="max-w-md"
        >
          <Modal.Header>
            <div className="text-lg font-bold">Cancel Order</div>
          </Modal.Header>
          <Modal.Body className="py-2">
            <div className="text-base-content/70">
              Are you sure you want to cancel order <strong>{orderToCancel?.order_number}</strong>?
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="default"
                styleType="ghost"
                onClick={() => setOrderToCancel(null)}
                disabled={cancelResult?.isLoading}
              >
                Kembali
              </Button>
              <Button
                variant="error"
                isLoading={cancelResult?.isLoading}
                disabled={cancelResult?.isLoading}
                onClick={() => {
                  if (orderToCancel?.id) {
                    cancelOrder({ id: orderToCancel.id });
                  }
                }}
              >
                Cancel Order
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      </Page.Body>
    </Page>
  );
};

export default OrderListPage;
