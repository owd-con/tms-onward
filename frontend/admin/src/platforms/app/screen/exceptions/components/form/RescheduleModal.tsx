import { useState, useEffect } from "react";
import { Button, Modal, Alert } from "@/components";
import { useException } from "@/services/exception/hooks";
import type { Driver, Vehicle, Order, FailedShipment } from "@/services/types";
import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";

/**
 * Props Interface
 */
interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newTripId: string) => void;
  order: Order | null;
}

/**
 * TMS Onward - Reschedule Modal Component
 *
 * Single-page modal untuk reschedule failed shipments:
 * - Show order info: Order Number, Customer, Reference (conditional)
 * - Show failed shipments info (read-only)
 * - Driver dropdown (active, not on trip)
 * - Vehicle dropdown (active, not on trip)
 * - Confirm to create new trip
 */
export const RescheduleModal = ({
  open,
  onClose,
  onSuccess,
  order,
}: RescheduleModalProps) => {
  // State
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Exception hook
  const { batchRescheduleShipments, batchRescheduleShipmentsResult } =
    useException();

  // Reset form saat modal open/close
  useEffect(() => {
    if (open) {
      setSelectedDriver(null);
      setSelectedVehicle(null);
    }
  }, [open]);

  // Close modal on success
  useEffect(() => {
    if (
      batchRescheduleShipmentsResult?.isSuccess &&
      batchRescheduleShipmentsResult?.data
    ) {
      const responseData = batchRescheduleShipmentsResult.data as any;
      const newTripId = responseData?.id || responseData?.data?.id;
      if (newTripId) {
        onSuccess?.(newTripId);
        onClose();
      }
    }
  }, [
    batchRescheduleShipmentsResult?.isSuccess,
    batchRescheduleShipmentsResult?.data,
    onSuccess,
    onClose,
  ]);

  // Handle driver & vehicle selection
  const handleDriverVehicleChange = (selection: {
    driver?: Driver | null;
    vehicle?: Vehicle | null;
  }) => {
    setSelectedDriver(selection.driver || null);
    setSelectedVehicle(selection.vehicle || null);
  };

  // Handle submit reschedule
  const handleSubmit = async () => {
    // Get all failed shipment IDs from order
    const shipmentIds = order?.failed_shipments?.map((shp) => shp.id) || [];

    await batchRescheduleShipments({
      shipment_ids: shipmentIds,
      driver_id: selectedDriver?.id || "",
      vehicle_id: selectedVehicle?.id || "",
    });
  };

  // Validation
  const isValid = selectedDriver !== null && selectedVehicle !== null;

  // Get failed shipments from order
  const failedShipments: FailedShipment[] = order?.failed_shipments || [];

  return (
    <Modal.Wrapper
      open={open}
      onClose={onClose}
      closeOnOutsideClick={false}
      className='max-w-3xl w-full mx-4'
    >
      <Modal.Header className='mb-4'>
        <div className='text-xl font-bold'>Reschedule Failed Shipments</div>
        <div className='text-sm text-base-content/60'>
          Create a new trip to handle failed shipments
        </div>
      </Modal.Header>

      <Modal.Body className='min-h-[300px] lg:min-h-[400px]'>
        {/* Order Info Header */}
        <div className='mb-6 p-4 bg-base-200 rounded-lg space-y-1'>
          <div className='text-sm'>
            <span className='font-semibold text-base-content/70'>
              Order Number:
            </span>{" "}
            <span className='font-medium'>{order?.order_number || "-"}</span>
          </div>
          <div className='text-sm'>
            <span className='font-semibold text-base-content/70'>
              Customer:
            </span>{" "}
            <span className='font-medium'>{order?.customer?.name || "-"}</span>
          </div>
          {order?.reference_code && (
            <div className='text-sm'>
              <span className='font-semibold text-base-content/70'>
                Reference:
              </span>{" "}
              <span className='font-medium'>{order.reference_code}</span>
            </div>
          )}
        </div>

        {/* Failed Shipments Info */}
        <div className='mb-6'>
          <h3 className='text-base lg:text-lg font-semibold mb-2'>
            Failed Shipments ({failedShipments.length})
          </h3>
          <div className='space-y-2 max-h-[200px] overflow-y-auto p-3 bg-base-200 rounded-lg'>
            {failedShipments.map((shipment, idx) => (
              <div
                key={shipment.id || idx}
                className='p-2 bg-white rounded-lg border border-base-200'
              >
                <div className='flex items-center justify-between mb-1'>
                  <span className='font-semibold text-sm text-primary'>
                    {shipment.shipment_number}
                  </span>
                  <span className='text-xs text-base-content/60'>
                    #{idx + 1}
                  </span>
                </div>
                <div className='flex items-center gap-1 text-xs'>
                  <span className='text-base-content/70'>
                    ▼ {shipment.dest_location}
                  </span>
                </div>
                {shipment.failed_reason && (
                  <div className='text-error text-xs mt-1'>
                    ⚠️ {shipment.failed_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Driver & Vehicle Selection */}
        <div className='mb-6'>
          <h3 className='text-base lg:text-lg font-semibold mb-2'>
            Assign Driver & Vehicle
          </h3>
          <p className='text-sm text-base-content/60 mb-3'>
            Select an active driver and vehicle for the new trip
          </p>

          <DriverVehicleSelector
            value={{
              driver: selectedDriver,
              vehicle: selectedVehicle,
            }}
            onChange={handleDriverVehicleChange}
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className='flex flex-col sm:flex-row justify-end gap-3'>
          <Button
            type='button'
            variant='secondary'
            onClick={onClose}
            disabled={batchRescheduleShipmentsResult?.isLoading}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>

          <Button
            type='button'
            variant='primary'
            onClick={handleSubmit}
            isLoading={batchRescheduleShipmentsResult?.isLoading}
            disabled={!isValid}
            className='w-full sm:w-auto'
          >
            Reschedule
          </Button>
        </div>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

RescheduleModal.displayName = "RescheduleModal";

export default RescheduleModal;
