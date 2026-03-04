import { useState, useEffect } from "react";
import { Button, Modal, Steps } from "@/components";
import { useException } from "@/services/exception/hooks";
import type { Driver, Vehicle, Order, FailedShipment } from "@/services/types";
import { RescheduleStep1 } from "./RescheduleStep1";
import { RescheduleStep2 } from "./RescheduleStep2";

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
 * Step Type
 */
type Step = 1 | 2;

/**
 * TMS Onward - Reschedule Modal Component
 *
 * Simplified 2-step modal untuk reschedule failed shipments:
 *
 * Step 1: Assign New Driver + Vehicle
 * - Driver dropdown (active, not on trip)
 * - Vehicle dropdown (active, not on trip)
 * - Show order info: Order Number, Customer, Reference (conditional)
 * - Show failed shipments info (read-only)
 *
 * Step 2: Confirm Reschedule
 * - Show summary: failed shipments, new driver & vehicle
 * - Confirm to create new trip
 */
export const RescheduleModal = ({
  open,
  onClose,
  onSuccess,
  order,
}: RescheduleModalProps) => {
  // State untuk multi-step form
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Exception hook
  const { batchRescheduleShipments, batchRescheduleShipmentsResult } =
    useException();

  // Reset form saat modal open/close
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
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

  // Handle step navigation
  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
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
  const isStep1Valid = selectedDriver !== null && selectedVehicle !== null;
  const isStep2Valid = true; // No additional validation for step 2

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      default:
        return false;
    }
  };

  // Steps configuration
  const steps = [{ label: "Assign Resources" }, { label: "Confirm" }];

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

      {/* Steps Indicator */}
      <div className='mb-6'>
        <Steps steps={steps} current={currentStep - 1} />
      </div>

      <Modal.Body className='min-h-[300px] lg:min-h-[400px]'>
        {/* Order Info Header - shown in both steps */}
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

        {currentStep === 1 && (
          <RescheduleStep1
            failedShipments={failedShipments}
            selectedDriver={selectedDriver}
            selectedVehicle={selectedVehicle}
            onDriverVehicleChange={handleDriverVehicleChange}
          />
        )}

        {currentStep === 2 && (
          <RescheduleStep2
            failedShipments={failedShipments}
            selectedDriver={selectedDriver}
            selectedVehicle={selectedVehicle}
            hasError={batchRescheduleShipmentsResult?.isError || false}
          />
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className='flex flex-col sm:flex-row justify-between gap-3'>
          <Button
            type='button'
            variant='secondary'
            onClick={handleBack}
            disabled={
              currentStep === 1 || batchRescheduleShipmentsResult?.isLoading
            }
            className='w-full sm:w-auto'
          >
            Back
          </Button>

          <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
            <Button
              type='button'
              variant='secondary'
              onClick={onClose}
              disabled={batchRescheduleShipmentsResult?.isLoading}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>

            {currentStep < 2 ? (
              <Button
                type='button'
                variant='primary'
                onClick={handleNext}
                disabled={!canProceed()}
                className='w-full sm:w-auto'
              >
                Next
              </Button>
            ) : (
              <Button
                type='button'
                variant='primary'
                onClick={handleSubmit}
                isLoading={batchRescheduleShipmentsResult?.isLoading}
                disabled={!canProceed()}
                className='w-full sm:w-auto'
              >
                Confirm Reschedule
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

RescheduleModal.displayName = "RescheduleModal";

export default RescheduleModal;
