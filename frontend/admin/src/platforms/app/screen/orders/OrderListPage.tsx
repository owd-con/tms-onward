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
            className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10"
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
          className='!max-w-md !w-11/12 mx-4'
        >
          <Modal.Header className='mb-4'>
            <div className='text-orange-600 font-bold leading-7 text-lg'>
              Cancel Active Order
            </div>
            <div className='text-sm text-slate-500 leading-5 font-normal'>
              This will halt all workflow operations immediately. Are you sure?
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className='bg-orange-50/50 border border-orange-100/60 p-5 rounded-2xl'>
              <p className='text-sm text-orange-900/60 font-medium mb-3'>You are about to cancel:</p>
              <div className='bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex flex-col gap-1'>
                <p className='font-bold text-slate-800'>{orderToCancel?.order_number}</p>
                <p className='text-sm text-slate-500 font-medium'>
                  Drivers and dispatchers will be notified. This cannot be undone.
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => setOrderToCancel(null)}
                disabled={cancelResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant='error'
                type='button'
                isLoading={cancelResult?.isLoading}
                disabled={cancelResult?.isLoading}
                onClick={() => {
                  if (orderToCancel?.id) {
                    cancelOrder({ id: orderToCancel.id });
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-md border border-orange-700 outline outline-2 outline-offset-2 outline-orange-500/20"
              >
                Yes, Cancel Order
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      </Page.Body>
    </Page>
  );
};

export default OrderListPage;
