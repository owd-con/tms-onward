import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { X, RotateCcw, MapPin } from "lucide-react";

import { Button, Input, Drawer, Modal, useEnigmaUI } from "@/components";
import { useException } from "@/services/exception/hooks";
import type { RootState } from "@/services/store";

interface ReturnShipmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: any | null;
  onSuccess?: () => void;
  isMobile?: boolean;
}

export const ReturnShipmentDrawer: React.FC<ReturnShipmentDrawerProps> = ({
  isOpen,
  onClose,
  shipment,
  onSuccess,
  isMobile = false,
}) => {
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();
  const { returnShipment, returnShipmentResult } = useException();

  const successHandledRef = useRef(false);
  const [returnedNote, setReturnedNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReturnedNote("");
      successHandledRef.current = false;
    }
  }, [isOpen, shipment]);

  const handleSubmit = async () => {
    if (!shipment?.id) return;
    await returnShipment({
      id: shipment.id,
      payload: { returned_note: returnedNote.trim() },
    });
  };

  useEffect(() => {
    if (returnShipmentResult?.isSuccess && !successHandledRef.current && isOpen) {
      successHandledRef.current = true;
      showToast({ message: "Shipment marked as returned", type: "success" });
      onSuccess?.();
      onClose();
    }
  }, [returnShipmentResult?.isSuccess, isOpen, onSuccess, onClose, showToast]);

  const isFormValid = returnedNote.trim() !== "";
  const isLoading = returnShipmentResult?.isLoading;

  // Support both naming conventions from different API responses
  const originName = shipment?.origin_location_name || shipment?.origin_location || shipment?.origin_address || 'Unknown';
  const destName = shipment?.dest_location_name || shipment?.dest_location || shipment?.dest_address || 'Unknown';

  const DrawerWrapper = isMobile ? Modal.Wrapper : Drawer;

  return (
    <DrawerWrapper
      open={isOpen}
      onClose={onClose}
      {...(isMobile ? {} : { position: "right" })}
      className={isMobile ? "!w-full !max-w-full !p-0 h-[80vh] fixed bottom-0 rounded-t-[32px] overflow-hidden" : "!w-[400px] flex flex-col"}
      closeButton={false}
    >
      <div className="flex flex-col h-full bg-slate-50">
        {isMobile && (
           <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />
        )}
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex justify-between items-start shrink-0">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700">
              <RotateCcw className="size-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Return Shipment</h2>
              <p className="text-xs text-slate-500 font-medium">
                {shipment?.shipment_number || 'Loading...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Shipment Info Card */}
          {shipment && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Shipment Details</h3>
              
              {/* Route visualization */}
              <div className="relative pl-8 space-y-4 mb-4">
                {/* Origin */}
                <div className="relative">
                  <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <MapPin className="size-3.5 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <div className="absolute -left-[17px] top-7 h-[calc(100%+8px)] w-0.5 bg-slate-200"></div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Origin</span>
                    <p className="text-[13px] font-bold text-slate-900">{originName}</p>
                  </div>
                </div>
                {/* Destination */}
                <div className="relative">
                  <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                    <MapPin className="size-3.5 text-red-500" strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Destination</span>
                    <p className="text-[13px] font-bold text-slate-900">{destName}</p>
                  </div>
                </div>
              </div>

              {/* Failed reason */}
              {shipment.failed_reason && (
                <div className="p-3 bg-red-50/60 rounded-lg border border-red-100">
                  <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider block mb-1">Failed Reason</span>
                  <p className="text-[13px] font-bold text-red-600">{shipment.failed_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Return Note */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
             <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Return Note</h3>
             <Input
               id="return-note"
               label="Reason for return"
               placeholder="Explain why this shipment is being returned to origin..."
               value={returnedNote}
               onChange={(e) => setReturnedNote(e.target.value)}
               error={FormState?.errors?.returned_note as string}
               type="textarea"
               required
             />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex gap-3 shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1 py-2.5 rounded-xl font-bold">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading} disabled={!isFormValid} className="flex-1 py-2.5 rounded-xl font-bold">
            Submit Return
          </Button>
        </div>
      </div>
    </DrawerWrapper>
  );
};
