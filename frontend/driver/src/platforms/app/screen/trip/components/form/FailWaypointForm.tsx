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
import type { DriverShipment } from "@/services/types";

/**
 * Ref type for FailWaypointForm
 */
export interface FailWaypointFormRef {
  buildPayload: () => {
    failed_reason: string;
    images: string[];
    note?: string;
    failed_shipment_ids?: string[];
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
  /** Shipments at this waypoint (for delivery partial failure selection) */
  shipments?: DriverShipment[];
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
 * - For delivery: Shipment selection for partial failure
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
 *   shipments={shipments}
 *   open={showFailForm}
 *   onSuccess={() => navigate('/trips')}
 *   onCancel={() => setShowFailForm(false)}
 * />
 * ```
 */
const FailWaypointForm = forwardRef<FailWaypointFormRef, FailWaypointFormProps>(
  ({ waypointId, waypointType, shipments = [], open, onCancel, onSuccess }, ref) => {
    const FormState = useSelector((state: RootState) => state.form);

    // Hook for mutation
    const { failWaypoint, failWaypointResult } = useTrip();

    // Local form state
    const [failedReason, setFailedReason] = useState("");
    const [note, setNote] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    // For delivery: track which shipments failed
    const [failedShipmentIds, setFailedShipmentIds] = useState<Set<string>>(new Set());

    // Initialize: for delivery, default to all shipments selected
    useEffect(() => {
      if (open && waypointType === "delivery" && shipments.length > 0) {
        setFailedShipmentIds(new Set(shipments.map(s => s.id)));
      } else {
        setFailedShipmentIds(new Set());
      }
    }, [open, waypointType, shipments]);

    /**
     * Build payload for submission
     */
    const buildPayload = () => {
      const payload: any = {
        failed_reason: failedReason.trim(),
        images: photos,
      };

      // Add note if provided
      if (note.trim()) {
        payload.note = note.trim();
      }

      // For delivery: add failed_shipment_ids (only selected shipments)
      // For pickup: all shipments automatically failed (no selection)
      if (waypointType === "delivery" && failedShipmentIds.size > 0) {
        payload.failed_shipment_ids = Array.from(failedShipmentIds);
      }

      return payload;
    };

    /**
     * Reset form to initial state
     */
    const reset = () => {
      setFailedReason("");
      setNote("");
      setPhotos([]);
      setFailedShipmentIds(new Set());
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
     * Toggle shipment selection (for delivery only)
     */
    const toggleShipment = (shipmentId: string) => {
      setFailedShipmentIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(shipmentId)) {
          // Don't allow deselecting all shipments - at least one must be failed
          if (newSet.size > 1) {
            newSet.delete(shipmentId);
          }
        } else {
          newSet.add(shipmentId);
        }
        return newSet;
      });
    };

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

    const isDelivery = waypointType === "delivery";
    const showShipmentSelection = isDelivery && shipments.length > 1;

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
              {waypointType === "pickup"
                ? "Laporkan kendala pada pickup ini. Semua shipment akan dibatalkan."
                : "Laporkan kendala pada delivery ini. Pilih shipment yang gagal."}
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

            {/* Shipment Selection (for delivery with multiple shipments) */}
            {showShipmentSelection && (
              <div className='mb-4'>
                <label className='typo-small font-medium text-content-primary mb-2 block'>
                  Pilih Shipment yang Gagal <span className='text-error'>*</span>
                </label>
                <div className='space-y-2'>
                  {shipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      onClick={() => toggleShipment(shipment.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        failedShipmentIds.has(shipment.id)
                          ? 'bg-error/10 border-error'
                          : 'bg-white border-base-200'
                      }`}
                    >
                      <div className='flex items-start gap-2'>
                        <input
                          type='checkbox'
                          checked={failedShipmentIds.has(shipment.id)}
                          onChange={() => toggleShipment(shipment.id)}
                          disabled={isLoading}
                          className='mt-1'
                        />
                        <div className='flex-1'>
                          <div className='flex items-center justify-between mb-1'>
                            <span className='typo-small font-semibold text-primary'>
                              {shipment.shipment_number}
                            </span>
                            <span className='typo-tiny text-content-secondary'>
                              #{shipment.sorting_id}
                            </span>
                          </div>
                          <div className='typo-tiny text-content-secondary'>
                            {shipment.origin_location_name} → {shipment.dest_location_name}
                          </div>
                          {failedShipmentIds.has(shipment.id) && (
                            <div className='mt-2 flex items-center gap-2'>
                              <span className='badge badge-error badge-xs'>Akan Gagal</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {failedShipmentIds.size === 0 && (
                  <p className='text-error text-xs mt-1'>
                    Minimal 1 shipment harus dipilih
                  </p>
                )}
              </div>
            )}

            {/* Single shipment info message */}
            {isDelivery && shipments.length === 1 && (
              <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                <p className='typo-tiny text-amber-800'>
                  <strong>Info:</strong> 1 shipment akan ditandai gagal: {shipments[0].shipment_number}
                </p>
              </div>
            )}

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
                value={note}
                onChange={(e) => setNote(e?.target?.value || "")}
                error={
                  typeof FormState?.errors?.note === "string"
                    ? FormState.errors.note
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
                disabled={!isFormValid || isLoading || (showShipmentSelection && failedShipmentIds.size === 0)}
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
