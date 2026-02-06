/* eslint-disable react-hooks/exhaustive-deps */
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Modal } from "@/components";
import { PhotoUpload } from "@/platforms/app/components/photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrip } from "@/services/driver/hooks";

/**
 * Ref type for FailWaypointForm
 */
export interface FailWaypointFormRef {
  buildPayload: () => {
    failed_reason: string;
    images: string[];
    notes?: string;
  };
  reset: () => void;
}

/**
 * Props for FailWaypointForm component
 */
export interface FailWaypointFormProps {
  /** Trip Waypoint ID */
  waypointId: string;
  /** Type of waypoint for context */
  waypointType: "pickup" | "delivery";
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Callback when failed waypoint is successfully submitted */
  onSuccess?: () => void;
  /** Whether the form is open */
  open: boolean;
}

/**
 * FailWaypointForm - Modal form for reporting failed waypoint
 *
 * Features:
 * - Failed reason text input (required)
 * - Photo upload as evidence (required, min 1, max 3)
 * - Notes input (optional)
 * - S3 upload via useUpload hook
 * - Form validation before submit
 * - Loading states during upload and submission
 * - Uses useFailWaypoint mutation from driver hooks
 *
 * @example
 * ```tsx
 * <FailWaypointForm
 *   waypointId="wp-123"
 *   waypointType="delivery"
 *   open={showFailForm}
 *   onSuccess={() => navigate('/trips')}
 *   onCancel={() => setShowFailForm(false)}
 * />
 * ```
 */
const FailWaypointForm = forwardRef<FailWaypointFormRef, FailWaypointFormProps>(
  ({ waypointId, waypointType, open, onCancel, onSuccess }, ref) => {
    const FormState = useSelector((state: RootState) => state.form);

    // Hook for mutation
    const { failWaypoint, failWaypointResult } = useTrip();

    // Local form state
    const [failedReason, setFailedReason] = useState("");
    const [notes, setNotes] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);

    /**
     * Build payload for submission
     */
    const buildPayload = () => ({
      failed_reason: failedReason.trim(),
      images: photos,
      notes: notes.trim() || undefined,
    });

    /**
     * Reset form to initial state
     */
    const reset = () => {
      setFailedReason("");
      setNotes("");
      setPhotos([]);
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
      if (failWaypointResult?.isSuccess) {
        onSuccess?.();
        onCancel();
      }
    }, [failWaypointResult?.isSuccess]);

    /**
     * Handle form submission
     */
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      const payload = buildPayload();

      // Call failWaypoint mutation
      await failWaypoint({
        id: waypointId,
        payload,
      });
    };

    // Validation: check if form is valid for submission
    const isFormValid = failedReason.trim() !== "" && photos.length > 0;
    const isLoading = failWaypointResult?.isLoading;

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
              <FiAlertCircle className='w-5 h-5 text-error' />
              <h2 className='text-lg font-bold text-base-content'>
                Laporkan Kegagalan {waypointType}
              </h2>
            </div>
            <p className='text-xs text-base-content/70'>
              Laporkan kendala pada {waypointType.toLowerCase()} ini dengan
              alasan dan bukti foto
            </p>
          </div>

          {/* Body - Fixed di antara header dan footer */}
          <div className='px-4 py-3 max-w-screen-md flex flex-col flex-1 min-h-0 overflow-y-auto'>
            {/* Failed Reason Input */}
            <div className='mb-4'>
              <Input
                label='Alasan Kegagalan'
                placeholder='Jelaskan alasan kegagalan...'
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                error={FormState?.errors?.failed_reason as string}
                required
                disabled={isLoading}
              />
            </div>

            {/* Photo Upload (Required) */}
            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={3}
              disabled={isLoading}
              label='Foto Bukti'
              optionalLabel='* (minimal 1)'
            />
            {photos.length === 0 && (
              <p className='text-error text-xs -mt-2 mb-4'>
                Minimal 1 foto wajib diupload sebagai bukti
              </p>
            )}
            {typeof FormState?.errors?.images === "string" && (
              <p className='text-error text-xs -mt-2 mb-4'>
                {FormState.errors.images}
              </p>
            )}

            {/* Notes Textarea (Optional) */}
            <div className='mb-4'>
              <Input
                label='Catatan Tambahan'
                type='textarea'
                placeholder={`Jelaskan detail kendala pada ${waypointType.toLowerCase()} ini...`}
                value={notes}
                onChange={(e) => setNotes(e?.target?.value || "")}
                error={
                  typeof FormState?.errors?.notes === "string"
                    ? FormState.errors.notes
                    : undefined
                }
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
                Batal
              </Button>
              <Button
                type='submit'
                variant='error'
                size='sm'
                disabled={!isFormValid || isLoading}
                isLoading={isLoading}
                className='flex-1'
                onClick={handleSubmit}
              >
                Laporkan Gagal
              </Button>
            </div>
          </div>
        </div>
      </Modal.Wrapper>
    );
  },
);

export { FailWaypointForm };
