/* eslint-disable react-hooks/exhaustive-deps */
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Modal } from "@/components";
import { SignaturePad } from "@/components/ui";
import { PhotoUpload } from "@/platforms/app/components/photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrip } from "@/services/driver/hooks";

/**
 * Ref type for CompleteWaypointForm
 */
export interface CompleteWaypointFormRef {
  buildPayload: () => {
    received_by: string;
    signature_url: string;
    images: string[];
    note?: string;
  };
  reset: () => void;
}

/**
 * Props for CompleteWaypointForm component
 */
export interface CompleteWaypointFormProps {
  /** Trip waypoint ID */
  waypointId: string;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Callback when waypoint is successfully completed */
  onSuccess?: () => void;
  /** Whether the form is open */
  open: boolean;
}

/**
 * CompleteWaypointForm - Modal form for delivery waypoint completion
 *
 * Features:
 * - Recipient name input (required)
 * - Digital signature canvas with touch/drag support (required)
 * - Photo upload (at least 1 photo required, max 3)
 * - Notes input (optional)
 * - S3 upload via useUpload hook
 * - Form validation before submit
 * - Loading states during submission
 * - Calls PUT /driver/trips/waypoint/:id/complete
 *
 * @example
 * ```tsx
 * <CompleteWaypointForm
 *   waypointId="wp-123"
 *   open={showCompleteForm}
 *   onSuccess={() => navigate('/trips')}
 *   onCancel={() => setShowCompleteForm(false)}
 * />
 * ```
 */
const CompleteWaypointForm = forwardRef<
  CompleteWaypointFormRef,
  CompleteWaypointFormProps
>(({ waypointId, open, onCancel, onSuccess }, ref) => {
  const FormState = useSelector((state: RootState) => state.form);

  // Hook for mutation
  const { completeWaypoint, completeWaypointResult } = useTrip();

  // Form state
  const [receivedBy, setReceivedBy] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string>("");

  /**
   * Build payload for submission
   */
  const buildPayload = () => ({
    received_by: receivedBy.trim(),
    signature_url: signatureUrl,
    images: images,
    note: note.trim() || undefined,
  });

  /**
   * Reset form to initial state
   */
  const reset = () => {
    setReceivedBy("");
    setNote("");
    setImages([]);
    setSignatureUrl("");
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    buildPayload,
    reset,
  }));

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  // Close modal on success
  useEffect(() => {
    if (completeWaypointResult?.isSuccess) {
      onSuccess?.();
      onCancel();
    }
  }, [completeWaypointResult?.isSuccess]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = buildPayload();

    // Call completeWaypoint mutation
    await completeWaypoint({
      id: waypointId,
      payload,
    });
  };

  // Validation: check if form is valid for submission
  const isFormValid =
    receivedBy.trim() !== "" && signatureUrl !== "" && images.length > 0;
  const isLoading = completeWaypointResult?.isLoading;

  return (
    <Modal.Wrapper
      open={open}
      onClose={onCancel}
      closeOnOutsideClick={!isLoading}
      className='max-w-full w-full h-full mx-0 p-0'
    >
      <div className='flex flex-col h-screen overflow-hidden'>
        {/* Header - Fixed */}
        <div className='z-10 px-4 py-3 bg-white border-b border-base-200 '>
          <div className='flex items-center gap-2 mb-1'>
            <FiCheckCircle className='w-5 h-5 text-success' />
            <h2 className='text-lg font-bold text-base-content'>
              Complete Delivery
            </h2>
          </div>
          <p className='text-xs text-base-content/70'>
            Complete delivery proof with recipient name, signature, and photos
          </p>
        </div>

        {/* Body - Fixed di antara header dan footer */}
        <div className='px-4 py-3 max-w-screen-md flex flex-col flex-1 min-h-0 overflow-y-auto'>
          {/* Recipient Name (Required) */}
          <div className='mb-4'>
            <Input
              id='received-by'
              label='Recipient Name'
              placeholder="Enter recipient's full name"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              error={FormState?.errors?.received_by as string}
              required
              disabled={isLoading}
            />
          </div>

          {/* Signature Canvas */}
          <div className='mb-4'>
            <SignaturePad
              required
              error={FormState?.errors?.signature_url as string}
              autoUpload
              filePrefix={`waypoint-${waypointId}`}
              onEnd={(url) => {
                if (url) {
                  setSignatureUrl(url);
                }
              }}
              disabled={isLoading}
            />
          </div>

          {/* Photo Upload */}
          <div className='mb-4'>
            <PhotoUpload
              photos={images}
              onPhotosChange={setImages}
              maxPhotos={3}
              disabled={isLoading}
              label='Proof Photos'
              optionalLabel='(min 1, max 3) *'
            />
            {typeof FormState?.errors?.images === "string" && (
              <p className='text-error text-xs -mt-2 mb-4'>
                {FormState.errors.images}
              </p>
            )}
            <p className='text-xs text-base-content/60 -mt-3 mb-4'>
              Upload photos as delivery proof. At least 1 photo required, max 3
              photos, 5MB each.
            </p>
          </div>

          {/* Notes (Optional) */}
          <div className='mb-4'>
            <Input
              label='Notes'
              type='textarea'
              placeholder='Add any notes about this delivery...'
              value={note}
              onChange={(e) => setNote(e?.target?.value || "")}
              error={FormState?.errors?.note as string}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Footer - Fixed position */}
        <div className='px-4 py-2 bg-white border-t border-base-300'>
          <div className='w-full flex gap-3'>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={onCancel}
              disabled={isLoading}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              size='sm'
              disabled={!isFormValid || isLoading}
              isLoading={isLoading}
              onClick={handleSubmit}
              className='flex-1'
            >
              Complete Delivery
            </Button>
          </div>
        </div>
      </div>
    </Modal.Wrapper>
  );
});

export { CompleteWaypointForm };
