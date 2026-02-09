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
import type { OrderWaypoint } from "@/services/types";

/**
 * Ref interface for ReturnWaypointModal
 */
export interface ReturnWaypointModalRef {
  buildPayload: () => {
    returned_note: string;
  };
  reset: () => void;
}

/**
 * Props Interface
 */
interface ReturnWaypointModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  waypoint?: OrderWaypoint;
}

/**
 * TMS Onward - ReturnWaypointModal Component
 *
 * Modal form for marking a failed waypoint as returned to origin.
 * Uses forwardRef pattern for modal form with FormState error handling.
 */
const ReturnWaypointModal = forwardRef<
  ReturnWaypointModalRef,
  ReturnWaypointModalProps
>(({ open, onClose, onSuccess, waypoint }, ref) => {
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();

  // Exception hook - returnWaypoint mutation
  const { returnWaypoint, returnWaypointResult } = useException();

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

    if (!waypoint?.id) {
      showToast({
        message: "Waypoint data is missing",
        type: "error",
      });
      return;
    }

    const payload = buildPayload();
    await returnWaypoint({
      id: waypoint.id,
      ...payload,
    });
  };

  // Close modal on success
  useEffect(() => {
    if (
      returnWaypointResult?.isSuccess &&
      !successHandledRef.current &&
      open
    ) {
      successHandledRef.current = true;

      showToast({
        message: "Waypoint marked as returned successfully",
        type: "success",
      });

      onSuccess?.();
      onClose();
    }
  }, [returnWaypointResult?.isSuccess, open, onSuccess, onClose, showToast]);

  // Handle close with reset
  const handleClose = () => {
    reset();
    onClose();
  };

  // Validation
  const isFormValid = returnedNote.trim() !== "";
  const isLoading = returnWaypointResult?.isLoading;

  return (
    <Modal.Wrapper
      open={open}
      onClose={handleClose}
      closeOnOutsideClick={false}
      className="max-w-2xl w-full mx-4"
    >
      <Modal.Header className="mb-4">
        <div className="text-xl font-bold">Mark Waypoint as Returned</div>
        <div className="text-sm text-base-content/60">
          Mark this failed waypoint as returned to origin
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className="min-h-[300px]">
          <div className="space-y-4">
            {/* Waypoint Info */}
            {waypoint && (
              <div className="p-4 bg-base-200 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="font-semibold text-base-content/70">
                    Type:
                  </span>{" "}
                  <span className="font-medium capitalize">
                    {waypoint.type}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-base-content/70">
                    Location:
                  </span>{" "}
                  <span className="font-medium">
                    {waypoint.location_name || waypoint.location_address || "-"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-base-content/70">
                    Status:
                  </span>{" "}
                  <span className="font-medium capitalize">
                    {waypoint.dispatch_status}
                  </span>
                </div>
              </div>
            )}

            {/* Return Note */}
            <div>
              <Input
                label="Reason"
                placeholder="Explain why this waypoint is being returned to origin"
                type="textarea"
                value={returnedNote}
                onChange={(e) => setReturnedNote(e.target.value)}
                error={FormState?.errors?.returned_note as string}
                required
                rows={4}
              />
            </div>

            {/* Error Alert */}
            {returnWaypointResult?.isError && (
              <div className="text-sm text-error">
                Failed to mark waypoint as returned. Please try again.
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!isFormValid}
              className="w-full sm:w-auto"
            >
              Return to Origin
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal.Wrapper>
  );
});

ReturnWaypointModal.displayName = "ReturnWaypointModal";

export default ReturnWaypointModal;
