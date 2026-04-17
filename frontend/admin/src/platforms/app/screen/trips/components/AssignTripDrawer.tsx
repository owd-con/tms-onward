import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { X, Truck } from "lucide-react";

import { Button, Input, useEnigmaUI, Drawer, Modal } from "@/components";
import { useTrip } from "@/services/trip/hooks";
import { useOrder } from "@/services/order/hooks";
import type { RootState } from "@/services/store";
import type { Driver, Vehicle, Order } from "@/services/types";

import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";
import { ShipmentSequenceEditor } from "./form/ShipmentSequenceEditor";

interface AssignTripDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onSuccess?: () => void;
  actionType?: "assign" | "return";
  isMobile?: boolean;
}

export const AssignTripDrawer: React.FC<AssignTripDrawerProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
  actionType = "assign",
  isMobile = false,
}) => {
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();
  const { create, createResult } = useTrip();

  const { show: showOrder, showResult: showOrderResult } = useOrder();

  const successHandledRef = useRef(false);

  // Form state
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notes, setNotes] = useState("");
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);

  // Reset state when drawer opens with a new orderId
  useEffect(() => {
    if (isOpen && orderId) {
      setDriver(null);
      setVehicle(null);
      setNotes("");
      setWaypoints([]);
      setOrderDetail(null);
      successHandledRef.current = false;
      showOrder({ id: orderId });
    }
  }, [isOpen, orderId, showOrder, actionType]);

  // Handle fetched order detail
  useEffect(() => {
    if (showOrderResult?.data) {
      const apiResponse = showOrderResult.data as { data?: Order; meta?: any };
      const data = apiResponse.data;
      if (data && data.id === orderId) {
        setOrderDetail(data);
      }
    }
  }, [showOrderResult, orderId]);

  const handleSubmit = async () => {
    if (!orderId) return;

    // Build payload with waypoints
    const payload: any = {
      order_id: orderId,
      driver_id: driver?.id,
      vehicle_id: vehicle?.id,
      notes: notes || undefined,
      waypoints: waypoints.map((wp) => ({
        type: actionType === "return" ? "return" : wp.type,
        address_id: wp.address_id,
        shipment_ids: wp.shipment_ids,
        sequence_number: wp.sequence_number,
        failed_reason: wp.failed_reason, // In case of exceptions, pass the reason if needed
      })),
    };

    await create(payload);
  };

  useEffect(() => {
    if (createResult?.isSuccess && !successHandledRef.current) {
      successHandledRef.current = true;

      showToast({
        message:
          actionType === "return"
            ? "Return trip created successfully"
            : "Trip created successfully",
        type: "success",
      });

      onClose();
      onSuccess?.();
    }
  }, [createResult?.isSuccess, onClose, onSuccess, showToast, actionType]);

  const handleDriverVehicleChange = (selection: {
    driver?: Driver | null;
    vehicle?: Vehicle | null;
  }) => {
    setDriver(selection.driver || null);
    setVehicle(selection.vehicle || null);
  };

  const isException =
    !!orderDetail?.failed_shipments && orderDetail.failed_shipments.length > 0;
  const isReturn = actionType === "return";

  const headerColors = isReturn
    ? "bg-slate-100 text-slate-700"
    : isException
      ? "bg-red-50 text-red-700"
      : "bg-primary/10 text-primary";

  const DrawerWrapper = isMobile ? Modal.Wrapper : Drawer;

  return (
    <DrawerWrapper
      open={isOpen}
      onClose={onClose}
      {...(isMobile ? {} : { position: "right" })}
      className={
        isMobile
          ? "!w-full !max-w-full !p-0 h-[90vh] fixed bottom-0 rounded-t-[32px] overflow-hidden"
          : "!w-[500px] flex flex-col"
      }
      closeButton={false}
    >
      <div className='flex flex-col h-full bg-slate-50'>
        {isMobile && (
          <div className='w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0' />
        )}
        {/* Header */}
        <div className='px-6 py-5 bg-white border-b border-slate-200 flex justify-between items-start shrink-0'>
          <div className='flex gap-3 items-center'>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${headerColors}`}
            >
              <Truck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className='text-lg font-bold text-slate-900 leading-tight'>
                {isReturn
                  ? "Return Shipment"
                  : isException
                    ? "Redeliver Order"
                    : "Assign Trip"}
              </h2>
              <p className='text-xs text-slate-500 font-medium'>
                {orderDetail ? orderDetail.order_number : "Loading order..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 -mr-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors'
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {/* Driver & Vehicle */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-5'>
            <h3 className='text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider'>
              Resources
            </h3>
            <DriverVehicleSelector
              value={{ driver, vehicle }}
              onChange={handleDriverVehicleChange}
              errorDriver={FormState?.errors?.driver_id as string}
              errorVehicle={FormState?.errors?.vehicle_id as string}
            />
          </div>

          {/* Notes */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-5'>
            <h3 className='text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider'>
              Additional Info
            </h3>
            <Input
              id='trip-notes'
              label='Notes (optional)'
              placeholder='Add any instructions for the driver...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              type='textarea'
            />
          </div>

          {/* Waypoints Preview */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-5'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>
                Routing Sequence
              </h3>
              <span className='text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase'>
                Auto-generated
              </span>
            </div>

            {!orderDetail ? (
              <div className='text-center py-8 text-slate-500 text-sm'>
                Loading routing sequence...
              </div>
            ) : (
              <ShipmentSequenceEditor
                orderId={orderId!}
                orderType={orderDetail.order_type || "LTL"}
                onChange={setWaypoints}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className='p-5 bg-white border-t border-slate-200 flex gap-3 shrink-0'>
          <Button
            variant='secondary'
            onClick={onClose}
            disabled={createResult?.isLoading}
            className='flex-1 py-2.5 rounded-xl font-bold'
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleSubmit}
            isLoading={createResult?.isLoading}
            disabled={!driver || !vehicle || waypoints.length === 0}
            className='flex-1 py-2.5 rounded-xl font-bold'
          >
            Confirm Assignment
          </Button>
        </div>
      </div>
    </DrawerWrapper>
  );
};
