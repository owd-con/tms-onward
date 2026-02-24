import { useState, useEffect } from "react";
import { Button, Modal, Steps, Alert } from "@/components";
import { useException } from "@/services/exception/hooks";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";
import type { Driver, Vehicle } from "@/services/types";
import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";

/**
 * Order Type
 */
interface Order {
  id: string;
  order_number: string;
  reference_code?: string;
  customer?: {
    name: string;
  };
  failed_waypoints?: Array<{
    id: string;
    type: string;
    location_name?: string;
    location_address?: string;
    failure_reason?: string;
  }>;
}

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
 * Failed Waypoint Type
 */
interface FailedWaypoint {
  id: string;
  type: string;
  location_name?: string;
  location_address?: string;
  failure_reason?: string;
}

/**
 * TMS Onward - Reschedule Modal Component
 *
 * Simplified 2-step modal untuk reschedule failed waypoints:
 *
 * Step 1: Assign New Driver + Vehicle
 * - Driver dropdown (active, not on trip)
 * - Vehicle dropdown (active, not on trip)
 * - Show order info: Order Number, Customer, Reference (conditional)
 * - Show failed waypoints info (read-only)
 *
 * Step 2: Confirm Reschedule
 * - Show summary: failed waypoints, new driver & vehicle
 * - Confirm to create new trip
 */
export const RescheduleModal = ({
  open,
  onClose,
  onSuccess,
  order,
}: RescheduleModalProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  // State untuk multi-step form
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Exception hook
  const { batchRescheduleWaypoints, batchRescheduleResult } = useException();

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
    if (batchRescheduleResult?.isSuccess && batchRescheduleResult?.data) {
      const responseData = batchRescheduleResult.data as any;
      const newTripId = responseData?.id || responseData?.data?.id;
      if (newTripId) {
        onSuccess?.(newTripId);
        onClose();
      }
    }
  }, [batchRescheduleResult?.isSuccess, batchRescheduleResult?.data, onSuccess, onClose]);

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
    // Get all failed waypoint IDs from order
    const waypointIds = order?.failed_waypoints?.map((wp) => wp.id) || [];

    await batchRescheduleWaypoints({
      waypoint_ids: waypointIds,
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
  const steps = [
    { label: "Assign Resources" },
    { label: "Confirm" },
  ];

  // Get failed waypoints from order
  const failedWaypoints: FailedWaypoint[] = order?.failed_waypoints || [];

  return (
    <Modal.Wrapper
      open={open}
      onClose={onClose}
      closeOnOutsideClick={false}
      className="max-w-3xl w-full mx-4"
    >
      <Modal.Header className="mb-4">
        <div className="text-xl font-bold">Reschedule Failed Waypoints</div>
        <div className="text-sm text-base-content/60">
          Create a new trip to handle failed waypoints
        </div>
      </Modal.Header>

      {/* Steps Indicator */}
      <div className="mb-6">
        <Steps steps={steps} current={currentStep - 1} />
      </div>

      <Modal.Body className="min-h-[300px] lg:min-h-[400px]">
        {/* Order Info Header - shown in both steps */}
        <div className="mb-6 p-4 bg-base-200 rounded-lg space-y-1">
          <div className="text-sm">
            <span className="font-semibold text-base-content/70">Order Number:</span>{" "}
            <span className="font-medium">{order?.order_number || "-"}</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-base-content/70">Customer:</span>{" "}
            <span className="font-medium">{order?.customer?.name || "-"}</span>
          </div>
          {order?.reference_code && (
            <div className="text-sm">
              <span className="font-semibold text-base-content/70">Reference:</span>{" "}
              <span className="font-medium">{order.reference_code}</span>
            </div>
          )}
        </div>

        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Failed Waypoints Info (Read-only) */}
            <div className="mb-4">
              <h3 className="text-base lg:text-lg font-semibold mb-2">
                Failed Waypoints ({failedWaypoints.length})
              </h3>
              {failedWaypoints.length === 0 ? (
                <Alert variant="info">
                  No failed waypoints found for this order.
                </Alert>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto p-3 bg-base-200 rounded-lg">
                  {failedWaypoints.map((waypoint, idx) => (
                    <div key={waypoint.id || idx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {waypoint.type}
                        </span>
                      </div>
                      <div className="text-xs text-base-content/70 pl-2">
                        📍 {waypoint.location_name || waypoint.location_address || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Driver & Vehicle Selection */}
            <div>
              <h3 className="text-base lg:text-lg font-semibold mb-2">
                Assign Driver & Vehicle
              </h3>
              <p className="text-sm text-base-content/60 mb-3">
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

            {!!FormState?.errors?.waypoint_ids && (
              <div className="text-sm text-error">
                {FormState.errors.waypoint_ids as string}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-base lg:text-lg font-semibold mb-1">
                Confirm Reschedule
              </h3>
              <p className="text-sm text-base-content/60">
                Please review the reschedule details below
              </p>
            </div>

            {/* Warning Alert */}
            <Alert variant="warning">
              <strong>Important:</strong> A new trip will be created with the
              selected driver and vehicle. All failed waypoints will be reset to
              Pending status.
            </Alert>

            {/* Summary */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-2">
                  Failed Waypoints ({failedWaypoints.length})
                </h4>
                <div className="space-y-2 p-3 bg-base-200 rounded-lg">
                  {failedWaypoints.map((waypoint, index) => (
                    <div key={waypoint.id || index} className="text-sm">
                      <div className="font-medium">{waypoint.type}</div>
                      <div className="text-base-content/70">
                        {waypoint.location_name || waypoint.location_address || "-"}
                      </div>
                      {waypoint.failure_reason && (
                        <div className="text-error text-xs mt-1">
                          ⚠️ {waypoint.failure_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider"></div>

              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-2">
                  New Assignment
                </h4>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base-content/60">Driver:</span>
                    <span className="font-medium">
                      {selectedDriver
                        ? `${selectedDriver.name} (${selectedDriver.license_number})`
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base-content/60">Vehicle:</span>
                    <span className="font-medium">
                      {selectedVehicle
                        ? `${selectedVehicle.plate_number} - ${selectedVehicle.type}`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {batchRescheduleResult?.isError && (
              <Alert variant="error">
                Failed to reschedule waypoints. Please try again.
              </Alert>
            )}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 1 || batchRescheduleResult?.isLoading}
            className="w-full sm:w-auto"
          >
            Back
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={batchRescheduleResult?.isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            {currentStep < 2 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full sm:w-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                isLoading={batchRescheduleResult?.isLoading}
                disabled={!canProceed()}
                className="w-full sm:w-auto"
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
