/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Database } from "lucide-react";

import { Button, Input, RemoteSelect, useEnigmaUI } from "@/components";
import { useTrip } from "@/services/trip/hooks";
import { useOrder } from "@/services/order/hooks";
import type { RootState } from "@/services/store";
import type { Driver, Vehicle, Order } from "@/services/types";

import { Page } from "../../components/layout";
import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";
import { ShipmentSequenceEditor } from "./components/form/ShipmentSequenceEditor";

/**
 * TMS Onward - Trip Create Page (Single Page Form)
 *
 * Direct Assignment: Single-page form with auto-preview
 * - Order selection + Driver/Vehicle assignment side-by-side
 * - Auto-shows waypoint preview after order selected
 */
const TripCreatePage = memo(() => {
  const navigate = useNavigate();
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();
  const { create, createResult } = useTrip();

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  // Fetch pending orders for dropdown
  const {
    get: getOrders,
    getResult: getOrdersResult,
    show: showOrder,
    showResult: showOrderResult,
  } = useOrder();

  // Form state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notes, setNotes] = useState("");
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);

  // Fetch order detail when order is selected (for orderType)
  useEffect(() => {
    if (selectedOrder?.id) {
      showOrder({ id: selectedOrder.id });
    }
  }, [selectedOrder?.id, showOrder]);

  useEffect(() => {
    if (showOrderResult?.data) {
      const apiResponse = showOrderResult.data as { data?: Order; meta?: any };
      const data = apiResponse.data;
      if (data) {
        setOrderDetail(data);
      }
    }
  }, [showOrderResult]);

  const handleSubmit = async () => {
    // Build payload with waypoints
    const payload: any = {
      order_id: selectedOrder?.id,
      driver_id: driver?.id,
      vehicle_id: vehicle?.id,
      notes: notes || undefined,
      waypoints: waypoints.map((wp) => ({
        type: wp.type,
        address_id: wp.address_id,
        shipment_ids: wp.shipment_ids,
        sequence_number: wp.sequence_number,
      })),
    };

    await create(payload);
  };

  useEffect(() => {
    if (createResult?.isSuccess && !successHandledRef.current) {
      successHandledRef.current = true;
      showToast({
        message: "Trip created successfully",
        type: "success",
      });
      const data = (createResult?.data as any)?.data;
      if (data?.id) {
        navigate(`/a/trips/${data.id}`, { replace: true });
      }
    }
  }, [createResult?.isSuccess]);

  // Handle driver & vehicle selection
  const handleDriverVehicleChange = (selection: {
    driver?: Driver | null;
    vehicle?: Vehicle | null;
  }) => {
    setDriver(selection.driver || null);
    setVehicle(selection.vehicle || null);
  };

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        pillLabel="OPERATIONS"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title='Create Trip'
        titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        subtitle='Configure a new fleet trip and assign driver resources.'
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
      />

      <Page.Body className='flex-1 flex flex-col min-h-0 overflow-y-auto'>
        <div className='w-full p-6 pb-20'>
          <div className='max-w-7xl mx-auto'>
            {/* Top Row: Order Selection + Driver/Vehicle Assignment */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Left: Order Selection */}
              <div className='bg-base-100 rounded-xl shadow-sm p-6 flex flex-col'>
                <h3 className='text-lg font-semibold mb-4'>Select Order</h3>
                <RemoteSelect<Order>
                  label='Order'
                  placeholder='Select a pending order'
                  value={selectedOrder}
                  onChange={setSelectedOrder}
                  onClear={() => {
                    setSelectedOrder(null);
                    setOrderDetail(null);
                    setWaypoints([]);
                  }}
                  fetchData={(page, search) =>
                    getOrders({
                      status: "pending",
                      search,
                      page,
                      limit: 20,
                    })
                  }
                  hook={getOrdersResult as any}
                  getLabel={(item: Order) =>
                    `${item.order_number}${item.reference_code ? ` (${item.reference_code})` : ""}`
                  }
                  getValue={(item: Order) => item.id}
                  required
                />

                {/* Spacer untuk push buttons ke bawah */}
                <div className='flex-1' />

                {/* Action Buttons */}
                <div className='flex gap-3 mt-6 pt-6 border-t border-base-200'>
                  <Button
                    variant='secondary'
                    onClick={() => navigate("/a/trips")}
                    disabled={createResult?.isLoading}
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='primary'
                    onClick={handleSubmit}
                    isLoading={createResult?.isLoading}
                    disabled={false}
                    className='flex-1'
                  >
                    Create Trip
                  </Button>
                </div>
              </div>

              {/* Right: Driver & Vehicle Assignment */}
              <div className='bg-base-100 rounded-xl shadow-sm p-6'>
                <h3 className='text-lg font-semibold mb-4'>Assign Resources</h3>
                <DriverVehicleSelector
                  value={{
                    driver: driver,
                    vehicle: vehicle,
                  }}
                  onChange={handleDriverVehicleChange}
                  errorDriver={FormState?.errors?.driver_id as string}
                  errorVehicle={FormState?.errors?.vehicle_id as string}
                />

                {/* Notes */}
                <div className='mt-4'>
                  <Input
                    id='trip-notes'
                    label='Notes (optional)'
                    placeholder='Add any notes for this trip...'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    type='textarea'
                  />
                </div>
              </div>
            </div>

            {/* Waypoint Sequence Preview (auto-shows after order selected) */}
            {selectedOrder && (
              <div className='bg-base-100 rounded-xl shadow-sm p-6'>
                <h3 className='text-lg font-semibold mb-4'>
                  Waypoint Sequence Preview
                </h3>
                <p className='text-sm text-base-content/60 mb-4'>
                  Preview of waypoints that will be created for this trip
                </p>
                <ShipmentSequenceEditor
                  orderId={selectedOrder.id}
                  orderType={orderDetail?.order_type || "LTL"}
                  onChange={setWaypoints}
                />
              </div>
            )}
          </div>
        </div>
      </Page.Body>
    </Page>
  );
});

export default TripCreatePage;
