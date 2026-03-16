import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiExclamationTriangle } from "react-icons/hi2";
import { Database } from "lucide-react";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Page } from "../../components/layout";
import createTableConfig from "./components/table/table.config";
import { RescheduleModal } from "./components/form/RescheduleModal";

/**
 * TMS Onward - Exception List Page
 *
 * Halaman list exception dengan filter dan pagination
 * Menampilkan orders dengan failed waypoints (per-order view)
 */
const ExceptionListPage = () => {
  const navigate = useNavigate();

  // Reschedule modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onViewDetails: (orderData: any) => {
        navigate(`/a/orders/${orderData?.id}`);
      },
      onReschedule: (orderData: any) => {
        setSelectedOrder(orderData);
        setRescheduleModalOpen(true);
      },
    });
  }, [navigate]);

  const Table = useTable("exception", tableConfig as TableConfig<unknown>);

  // Handle reschedule success - navigate to new trip
  const handleRescheduleSuccess = (newTripId: string) => {
    setRescheduleModalOpen(false);
    // Navigate to new trip detail
    navigate(`/a/trips/${newTripId}`);
  };

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        pillLabel="OPERATIONS"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title="Exception Management"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Review failed shipments, resolve operational blockers, and reschedule routes."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
      />

      <Page.Body className='flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0'>
        <div className='bg-base-100 rounded-xl shadow-sm w-full overflow-x-auto'>
          {Table.State?.data &&
          Table.State.data.length === 0 &&
          !Table.State.loading ? (
            <div className='flex flex-col items-center justify-center h-48 lg:h-64 gap-3 lg:gap-4 px-4'>
              <div className='text-base-content/40 text-4xl lg:text-6xl'>
                <HiExclamationTriangle />
              </div>
              <div className='text-center'>
                <h3 className='text-base lg:text-lg font-semibold'>
                  No Exceptions Found
                </h3>
                <p className='text-base-content/60 mt-1 text-sm lg:text-base'>
                  No failed shipments at the moment. Your operations are running
                  smoothly.
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

      {/* Reschedule Modal */}
      <RescheduleModal
        open={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        onSuccess={handleRescheduleSuccess}
        order={selectedOrder}
      />
    </Page>
  );
};

export default ExceptionListPage;
