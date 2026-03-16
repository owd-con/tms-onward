/* eslint-disable react-hooks/exhaustive-deps */
import { memo, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Database } from "lucide-react";

import { Button, Input, useEnigmaUI } from "@/components";
import { useTrip } from "@/services/trip/hooks";
import type { RootState } from "@/services/store";
import type { Driver, Vehicle, Trip } from "@/services/types";

import { Page } from "../../components/layout";
import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";
import { ShipmentSequenceEditor } from "./components/form/ShipmentSequenceEditor";

/**
 * TMS Onward - Trip Edit Page
 *
 * Allows editing trip details.
 * - Notes: Always editable
 * - Driver/Vehicle: Only editable if status is "planned"
 * - Waypoints: Read-only (created from shipments, cannot be modified after trip creation)
 */
const TripEditPage = memo(() => {
  const navigate = useNavigate();
  const { id: tripId } = useParams<{ id: string }>();
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();
  const {
    show: showTrip,
    showResult: showTripResult,
    update,
    updateResult,
  } = useTrip();

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  // Form state
  const [trip, setTrip] = useState<Trip | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notes, setNotes] = useState("");
  const [waypoints, setWaypoints] = useState<Array<any>>([]);

  // Load trip detail - dependency array kosong untuk initial load
  useEffect(() => {
    if (tripId) {
      showTrip({ id: tripId });
    }
  }, []);

  // Extract trip data from API response
  useEffect(() => {
    if (showTripResult?.isSuccess) {
      const data = (showTripResult?.data as any)?.data as Trip;
      if (data) {
        setTrip(data);
        setNotes(data.notes || "");
        setDriver(data.driver || null);
        setVehicle(data.vehicle || null);
        // Initialize waypoints from trip
        if (data.trip_waypoints && data.trip_waypoints.length > 0) {
          setWaypoints(data.trip_waypoints);
        }
      }
    }
  }, [showTripResult]);

  // Handle submit
  const handleSubmit = async () => {
    if (!tripId) return;

    // Convert waypoints to backend format
    const waypointsPayload = waypoints.map((wp) => ({
      type: wp.type,
      address_id: wp.address_id,
      shipment_ids: wp.shipment_ids || [],
      sequence_number: wp.sequence_number,
    }));

    const payload = {
      notes: notes,
      driver_id: driver?.id,
      vehicle_id: vehicle?.id,
      waypoints: waypointsPayload,
    };

    await update({ id: tripId, payload });
  };

  // Handle success - navigate back to detail page
  useEffect(() => {
    if (updateResult?.isSuccess && !successHandledRef.current) {
      successHandledRef.current = true;
      showToast({
        message: "Trip updated successfully",
        type: "success",
      });
      if (tripId) {
        navigate(`/a/trips/${tripId}`, { replace: true });
      }
    }
  }, [updateResult?.isSuccess]);

  // Handle driver & vehicle selection
  const handleDriverVehicleChange = (selection: {
    driver?: Driver | null;
    vehicle?: Vehicle | null;
  }) => {
    setDriver(selection.driver || null);
    setVehicle(selection.vehicle || null);
  };

  // Loading state
  if (!trip && showTripResult?.isLoading) {
    return (
      <Page>
        <Page.Header 
          pillLabel="OPERATIONS"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title='Edit Trip Configuration' 
          titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        />
        <Page.Body>
          <div className='flex justify-center items-center h-64'>
            <div className='loading loading-spinner loading-lg'></div>
          </div>
        </Page.Body>
      </Page>
    );
  }

  // Error state
  if (!trip && showTripResult?.isError) {
    return (
      <Page>
        <Page.Header 
          pillLabel="OPERATIONS"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title='Edit Trip Configuration' 
          titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        />
        <Page.Body>
          <div className='flex flex-col items-center justify-center h-64 gap-4'>
            <div className='text-error text-6xl'>:(</div>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>Trip Not Found</h3>
              <p className='text-base-content/60 mt-1'>
                The trip you're looking for doesn't exist or has been deleted.
              </p>
            </div>
            <Button variant='primary' onClick={() => navigate("/a/trips")}>
              Back to Trips
            </Button>
          </div>
        </Page.Body>
      </Page>
    );
  }

  // Not found state (not loading and not error but no trip)
  if (!trip) {
    return (
      <Page>
        <Page.Header 
          pillLabel="OPERATIONS"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title='Edit Trip Configuration' 
          titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        />
        <Page.Body>
          <div className='flex flex-col items-center justify-center h-64 gap-4'>
            <div className='text-error text-6xl'>:(</div>
            <div className='text-center'>
              <h3 className='text-lg font-semibold'>Trip Not Found</h3>
              <p className='text-base-content/60 mt-1'>
                The trip you're looking for doesn't exist or has been deleted.
              </p>
            </div>
            <Button variant='primary' onClick={() => navigate("/a/trips")}>
              Back to Trips
            </Button>
          </div>
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        pillLabel="OPERATIONS"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title='Edit Trip Configuration'
        titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        subtitle={`Trip Reference: ${trip.trip_number}`}
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
      />

      <Page.Body className='flex-1 flex flex-col min-h-0 overflow-y-auto'>
        <div className='w-full p-6 pb-20'>
          <div className='max-w-7xl mx-auto'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Left: Order Info (read-only) */}
              <div className='bg-base-100 rounded-xl shadow-sm p-6 flex flex-col'>
                <h3 className='text-lg font-semibold mb-4'>
                  Order Information
                </h3>
                <div className='space-y-3'>
                  <div>
                    <label className='text-sm font-medium text-base-content/60'>
                      Order Number
                    </label>
                    <div className='text-base font-medium'>
                      {trip.order?.order_number || "-"}
                    </div>
                  </div>
                  {trip.order?.reference_code && (
                    <div>
                      <label className='text-sm font-medium text-base-content/60'>
                        Reference Code
                      </label>
                      <div className='text-base font-medium'>
                        {trip.order.reference_code}
                      </div>
                    </div>
                  )}
                </div>

                {/* Spacer untuk push buttons ke bawah */}
                <div className='flex-1' />

                {/* Action Buttons */}
                <div className='flex gap-3 mt-6 pt-6 border-t border-base-200'>
                  <Button
                    variant='secondary'
                    onClick={() => navigate(`/a/trips/${trip.id}`)}
                    disabled={updateResult?.isLoading}
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='primary'
                    onClick={handleSubmit}
                    isLoading={updateResult?.isLoading}
                    disabled={false}
                    className='flex-1'
                  >
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* Right: Driver & Vehicle Assignment */}
              <div className='bg-base-100 rounded-xl shadow-sm p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold'>Assign Resources</h3>
                </div>
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

            {/* Waypoint Sequence Preview */}
            {trip.trip_waypoints && trip.trip_waypoints.length > 0 && (
              <div className='bg-base-100 rounded-xl shadow-sm p-6 mt-6'>
                <h3 className='text-lg font-semibold mb-4'>
                  Waypoint Sequence
                </h3>
                {(trip.order?.order_type === "FTL") ? (
                  <p className='text-sm text-base-content/60 mb-4'>
                    Waypoints are created from shipments for FTL trips
                    and cannot be modified.
                  </p>
                ) : (
                  <p className='text-sm text-base-content/60 mb-4'>
                    Drag waypoints to reorder the sequence for this LTL trip.
                  </p>
                )}
                <ShipmentSequenceEditor
                  initialWaypoints={trip.trip_waypoints}
                  orderType={trip.order?.order_type || "LTL"}
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

export default TripEditPage;
