/* eslint-disable react-hooks/exhaustive-deps */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";

import { Button, Input, Modal, useEnigmaUI } from "@/components";
import { useException } from "@/services/exception/hooks";
import type { Shipment } from "@/services/types";

/**
 * Ref interface for ReturnShipmentModal
 */
export interface ReturnShipmentModalRef {
  buildPayload: () => {
    returned_note: string;
  };
  reset: () => void;
}

/**
 * Props Interface
 */
interface ReturnShipmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  shipment?: Shipment;
}

/**
 * TMS Onward - ReturnShipmentModal Component
 *
 * Modal form for marking a failed shipment as returned to origin.
 * Uses forwardRef pattern for modal form with FormState error handling.
 */
const ReturnShipmentModal = forwardRef<
  ReturnShipmentModalRef,
  ReturnShipmentModalProps
>(({ open, onClose, onSuccess, shipment }, ref) => {
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();

  // Exception hook - returnShipment mutation
  const { returnShipment, returnShipmentResult } = useException();

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  // Form state
  const [returnedNote, setReturnedNote] = useState("");

  // Build payload method
  const buildPayload = () => {
    return {
      returned_note: returnedNote.trim(),
    };
  };

  // Reset form method
  const reset = () => {
    setReturnedNote("");
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    buildPayload,
    reset,
  }));

  // Reset form saat modal open
  useEffect(() => {
    if (open) {
      successHandledRef.current = false;
      reset();
    }
  }, [open]);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shipment?.id) {
      showToast({
        message: "Shipment data is missing",
        type: "error",
      });
      return;
    }

    const payload = buildPayload();
    await returnShipment({
      id: shipment.id,
      payload,
    });
  };

  // Close modal on success
  useEffect(() => {
    if (returnShipmentResult?.isSuccess && !successHandledRef.current && open) {
      successHandledRef.current = true;

      showToast({
        message: "Shipment marked as returned successfully",
        type: "success",
      });

      onSuccess?.();
      onClose();
    }
  }, [returnShipmentResult?.isSuccess, open, onSuccess, onClose, showToast]);

  // Handle close with reset
  const handleClose = () => {
    reset();
    onClose();
  };

  // Validation
  const isFormValid = returnedNote.trim() !== "";
  const isLoading = returnShipmentResult?.isLoading;

  return (
    <Modal.Wrapper
      open={open}
      onClose={handleClose}
      closeOnOutsideClick={false}
      className='max-w-2xl w-full mx-4'
    >
      <Modal.Header className='mb-4'>
        <div className='text-xl font-bold'>Mark Shipment as Returned</div>
        <div className='text-sm text-base-content/60'>
          Mark this failed shipment as returned to origin
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className='min-h-[300px]'>
          <div className='space-y-4'>
            {/* Shipment Info */}
            {shipment && (
              <div className='p-4 bg-base-200 rounded-lg space-y-2'>
                <div className='text-sm'>
                  <span className='font-semibold text-base-content/70'>
                    Shipment Number:
                  </span>{" "}
                  <span className='font-medium text-primary'>
                    {shipment.shipment_number}
                  </span>
                </div>
                <div className='text-sm'>
                  <span className='font-semibold text-base-content/70'>
                    Route:
                  </span>{" "}
                  <span className='font-medium'>
                    ▲ {shipment.origin_location_name || shipment.origin_address}{" "}
                    → ▼ {shipment.dest_location_name || shipment.dest_address}
                  </span>
                </div>
                <div className='text-sm'>
                  <span className='font-semibold text-base-content/70'>
                    Current Status:
                  </span>{" "}
                  <span className='font-medium capitalize'>
                    {shipment.status}
                  </span>
                </div>
                {shipment.failed_reason && (
                  <div className='text-sm'>
                    <span className='font-semibold text-base-content/70'>
                      Failed Reason:
                    </span>{" "}
                    <span className='font-medium text-error'>
                      {shipment.failed_reason}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Return Note */}
            <div>
              <Input
                label='Return Reason'
                placeholder='Explain why this shipment is being returned to origin'
                type='textarea'
                value={returnedNote}
                onChange={(e) => setReturnedNote(e.target.value)}
                error={FormState?.errors?.returned_note as string}
                required
              />
            </div>

            {/* Error Alert */}
            {returnShipmentResult?.isError && (
              <div className='text-sm text-error'>
                Failed to mark shipment as returned. Please try again.
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className='flex flex-col sm:flex-row justify-end gap-3'>
            <Button
              type='button'
              variant='secondary'
              onClick={handleClose}
              disabled={isLoading}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              isLoading={isLoading}
              disabled={!isFormValid}
              className='w-full sm:w-auto'
            >
              Return to Origin
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal.Wrapper>
  );
});

ReturnShipmentModal.displayName = "ReturnShipmentModal";

export default ReturnShipmentModal;
