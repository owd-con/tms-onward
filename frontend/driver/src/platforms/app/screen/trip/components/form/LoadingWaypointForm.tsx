/* eslint-disable react-hooks/exhaustive-deps */
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { FiPackage, FiCheck } from "react-icons/fi";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Modal } from "@/components";
import { SignaturePad } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrip } from "@/services/driver/hooks";
import type { Shipment } from "@/services/types";

/**
 * Ref type for LoadingWaypointForm
 */
export interface LoadingWaypointFormRef {
  buildPayload: () => {
    loaded_shipment_ids: string[];
    loaded_by: string;
    images: string[];
  };
  reset: () => void;
}

/**
 * Props for LoadingWaypointForm component
 */
export interface LoadingWaypointFormProps {
  /** Trip waypoint ID */
  waypointId: string;
  /** Available shipments at this waypoint */
  shipments?: Shipment[];
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Callback when loading is successfully completed */
  onSuccess?: () => void;
  /** Whether the form is open */
  open: boolean;
}

/**
 * LoadingWaypointForm - Modal form for pickup waypoint loading
 *
 * Features:
 * - Shipment selection checklist (select which were successfully loaded)
 * - Warehouse staff name input (required)
 * - Digital signature canvas with touch/drag support (required)
 * - Form validation before submit
 * - Loading states during submission
 * - Calls PUT /driver/trips/waypoint/:id/loading
 *
 * @example
 * ```tsx
 * <LoadingWaypointForm
 *   waypointId="wp-123"
 *   shipments={shipments}
 *   open={showLoadingForm}
 *   onSuccess={() => navigate('/trips')}
 *   onCancel={() => setShowLoadingForm(false)}
 * />
 * ```
 */
const LoadingWaypointForm = forwardRef<
  LoadingWaypointFormRef,
  LoadingWaypointFormProps
>(({ waypointId, shipments = [], open, onCancel, onSuccess }, ref) => {
  const FormState = useSelector((state: RootState) => state.form);

  // Hook for mutation
  const { loadingWaypoint, loadingWaypointResult } = useTrip();

  // Form state
  const [loadedBy, setLoadedBy] = useState("");
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>(
    shipments.map(s => s.id)
  );
  const [signatureUrl, setSignatureUrl] = useState<string>("");

  /**
   * Build payload for submission
   */
  const buildPayload = () => ({
    loaded_shipment_ids: selectedShipmentIds,
    loaded_by: loadedBy.trim(),
    images: signatureUrl ? [signatureUrl] : [],
  });

  /**
   * Reset form to initial state
   */
  const reset = () => {
    setLoadedBy("");
    setSelectedShipmentIds(shipments.map(s => s.id));
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
    if (loadingWaypointResult?.isSuccess) {
      onSuccess?.();
      onCancel();
    }
  }, [loadingWaypointResult?.isSuccess]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const payload = buildPayload();

    // Call loadingWaypoint mutation
    await loadingWaypoint({
      id: waypointId,
      payload,
    });
  };

  /**
   * Toggle shipment selection
   */
  const toggleShipment = (shipmentId: string) => {
    setSelectedShipmentIds(prev =>
      prev.includes(shipmentId)
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  /**
   * Select all shipments
   */
  const selectAll = () => {
    setSelectedShipmentIds(shipments.map(s => s.id));
  };

  /**
   * Deselect all shipments
   */
  const deselectAll = () => {
    setSelectedShipmentIds([]);
  };

  // Validation: check if form is valid for submission
  const isFormValid =
    loadedBy.trim() !== "" &&
    selectedShipmentIds.length > 0 &&
    signatureUrl !== "";
  const isLoading = loadingWaypointResult?.isLoading;

  const allSelected = shipments.length > 0 && selectedShipmentIds.length === shipments.length;

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
            <FiPackage className='w-5 h-5 text-primary' />
            <h2 className='text-lg font-bold text-base-content'>
              Complete Loading
            </h2>
          </div>
          <p className='text-xs text-base-content/70'>
            Select shipments, enter warehouse staff name, and provide signature
          </p>
        </div>

        {/* Body - Scrollable */}
        <div className='px-4 py-3 max-w-screen-md flex flex-col flex-1 min-h-0 overflow-y-auto'>
          {/* Shipment Selection */}
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-base-content'>
                Select Loaded Shipments <span className='text-error'>*</span>
              </label>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={selectAll}
                  disabled={isLoading}
                  className='text-xs text-primary disabled:opacity-50'
                >
                  Select All
                </button>
                <button
                  type='button'
                  onClick={deselectAll}
                  disabled={isLoading}
                  className='text-xs text-error disabled:opacity-50'
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className='space-y-2 max-h-48 overflow-y-auto border border-base-300 rounded-lg p-2'>
              {shipments.length === 0 ? (
                <p className='text-xs text-base-content/60 text-center py-2'>
                  No shipments available
                </p>
              ) : (
                shipments.map((shipment) => (
                  <label
                    key={shipment.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors ${
                      selectedShipmentIds.includes(shipment.id)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-white border-base-200 hover:border-base-300'
                    }`}
                  >
                    <input
                      type='checkbox'
                      checked={selectedShipmentIds.includes(shipment.id)}
                      onChange={() => toggleShipment(shipment.id)}
                      disabled={isLoading}
                      className='w-4 h-4'
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-base-content truncate'>
                        {shipment.shipment_number}
                      </p>
                      <p className='text-xs text-base-content/60 truncate'>
                        {shipment.items?.map((item: any) => item.name).join(', ') || shipment.order?.reference_code}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className='text-xs text-base-content/60 mt-1'>
              {selectedShipmentIds.length} of {shipments.length} shipments selected
            </p>
            {typeof FormState?.errors?.loaded_shipment_ids === "string" && (
              <p className='text-error text-xs -mt-1'>
                {FormState.errors.loaded_shipment_ids}
              </p>
            )}
          </div>

          {/* Warehouse Staff Name */}
          <div className='mb-4'>
            <Input
              id='loaded-by'
              label='Warehouse Staff Name'
              placeholder="Enter name of warehouse staff"
              value={loadedBy}
              onChange={(e) => setLoadedBy(e.target.value)}
              error={FormState?.errors?.loaded_by as string}
              required
              disabled={isLoading}
            />
          </div>

          {/* Signature Pad */}
          <div className='mb-4'>
            <SignaturePad
              required
              label='Signature'
              helperText='Sign above using your finger or stylus'
              error={FormState?.errors?.images as string}
              autoUpload
              filePrefix={`loading-waypoint-${waypointId}`}
              onEnd={(url) => {
                if (url) {
                  setSignatureUrl(url);
                } else {
                  setSignatureUrl("");
                }
              }}
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
              <div className='flex items-center justify-center gap-2'>
                <FiCheck size={16} />
                <span>Complete Loading</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Modal.Wrapper>
  );
});

export { LoadingWaypointForm };
