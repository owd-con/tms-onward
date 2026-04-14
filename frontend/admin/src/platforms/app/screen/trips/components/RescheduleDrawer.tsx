import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { X, Truck, MapPin } from "lucide-react";

import { Button, Drawer, useEnigmaUI } from "@/components";
import { useException } from "@/services/exception/hooks";
import type { Driver, Vehicle } from "@/services/types";
import type { RootState } from "@/services/store";

import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";

interface RescheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  onSuccess?: () => void;
}

export const RescheduleDrawer: React.FC<RescheduleDrawerProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();

  const { batchRescheduleShipments, batchRescheduleShipmentsResult } = useException();

  const successHandledRef = useRef(false);

  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDriver(null);
      setVehicle(null);
      successHandledRef.current = false;
    }
  }, [isOpen, order]);

  const handleSubmit = async () => {
    if (!order) return;

    const shipmentIds = order.failed_shipments?.map((shp: any) => shp.id) || [];

    await batchRescheduleShipments({
      shipment_ids: shipmentIds,
      driver_id: driver?.id || "",
      vehicle_id: vehicle?.id || "",
    });
  };

  useEffect(() => {
    if (batchRescheduleShipmentsResult?.isSuccess && !successHandledRef.current && isOpen) {
      successHandledRef.current = true;
      showToast({ message: "Shipments rescheduled successfully", type: "success" });
      onSuccess?.();
      onClose();
    }
  }, [batchRescheduleShipmentsResult, isOpen, onSuccess, onClose, showToast]);

  const handleDriverVehicleChange = (selection: { driver?: Driver | null; vehicle?: Vehicle | null }) => {
    setDriver(selection.driver || null);
    setVehicle(selection.vehicle || null);
  };

  const failedShipments = order?.failed_shipments || [];

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      position="right"
      className="!w-[500px] flex flex-col"
      closeButton={false}
    >
      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex justify-between items-start shrink-0">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-700">
              <Truck className="size-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Reschedule Delivery</h2>
              <p className="text-xs text-slate-500 font-medium">
                {order?.order_number || 'Loading...'} • {order?.customer_name || order?.customer?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors">
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Failed Shipments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
              Failed Shipments ({failedShipments.length})
            </h3>
            <div className="space-y-3">
              {failedShipments.map((shipment: any, idx: number) => (
                <div key={shipment.id || idx} className="p-3 bg-red-50/40 rounded-xl border border-red-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100/80 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="size-4" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[13px] font-bold text-slate-900 truncate">
                        {shipment.dest_location_name || shipment.dest_location || 'Unknown'}
                      </span>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 shrink-0">
                        {shipment.shipment_number}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-1">
                      From: {shipment.origin_location_name || shipment.origin_location || 'Unknown'}
                    </div>
                    {shipment.failed_reason && (
                      <div className="text-[11px] font-medium text-red-500">
                        ⚠ {shipment.failed_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver & Vehicle */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Assign Resources</h3>
            <DriverVehicleSelector
              value={{ driver, vehicle }}
              onChange={handleDriverVehicleChange}
              errorDriver={FormState?.errors?.driver_id ? String(FormState.errors.driver_id) : undefined}
              errorVehicle={FormState?.errors?.vehicle_id ? String(FormState.errors.vehicle_id) : undefined}
            />
          </div>

          {/* Error Alert */}
          {!!(FormState?.errors && FormState?.errors?.shipment_ids) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-red-700 mb-1">{String(FormState?.errors?.shipment_ids)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex gap-3 shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={batchRescheduleShipmentsResult?.isLoading} className="flex-1 py-2.5 rounded-xl font-bold">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={batchRescheduleShipmentsResult?.isLoading} disabled={!driver || !vehicle} className="flex-1 py-2.5 rounded-xl font-bold">
            Confirm Reschedule
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
