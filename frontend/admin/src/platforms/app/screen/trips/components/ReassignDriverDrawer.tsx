import React, { useEffect, useState } from "react";
import { HiXMark, HiUserCircle } from "react-icons/hi2";

import { Button, Drawer, Modal, useEnigmaUI } from "@/components";
import { useTrip } from "@/services/trip/hooks";
import type { Driver, Trip, Vehicle } from "@/services/types";

import { DriverVehicleSelector } from "@/platforms/app/components/trip/DriverVehicleSelector";

interface ReassignDriverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  onSuccess?: () => void;
  isMobile?: boolean;
}

export const ReassignDriverDrawer: React.FC<ReassignDriverDrawerProps> = ({
  isOpen,
  onClose,
  trip,
  onSuccess,
  isMobile = false,
}) => {
  const { showToast } = useEnigmaUI();
  const { reassignDriver, reassignDriverResult } = useTrip();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when drawer opens
  useEffect(() => {
    if (isOpen) {
      // Set current driver and vehicle as initial values
      setDriver(trip?.driver || null);
      setVehicle(trip?.vehicle || null);
    }
  }, [isOpen, trip]);

  const handleSubmit = async () => {
    if (!trip || !driver) return;

    setIsSubmitting(true);
    try {
      await reassignDriver({
        id: trip.id,
        payload: { driver_id: driver.id },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (reassignDriverResult?.isSuccess) {
      showToast({
        message: "Driver reassigned successfully",
        type: "success",
      });
      onSuccess?.();
      onClose();
    }
  }, [reassignDriverResult?.isSuccess, onSuccess, onClose, showToast]);

  const handleDriverVehicleChange = (selection: {
    driver?: Driver | null;
    vehicle?: any;
  }) => {
    setDriver(selection.driver || null);
  };

  // Get current driver ID to exclude from selection
  const currentDriverId = trip?.driver?.id;

  const DrawerWrapper = isMobile ? Modal.Wrapper : Drawer;

  return (
    <DrawerWrapper
      open={isOpen}
      onClose={onClose}
      {...(isMobile ? {} : { position: "right" })}
      className={
        isMobile
          ? "!w-full !max-w-full !p-0 h-[85vh] fixed bottom-0 rounded-t-[32px] overflow-hidden"
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
            <div className='w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600'>
              <HiUserCircle size={20} />
            </div>
            <div>
              <h2 className='text-lg font-bold text-slate-900 leading-tight'>
                Reassign Driver
              </h2>
              <p className='text-xs text-slate-500 font-medium'>
                {trip?.order?.order_number || "Loading..."} •{" "}
                {trip?.trip_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 -mr-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors'
          >
            <HiXMark size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {/* Current Driver Info */}
          {trip?.driver && (
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-5'>
              <h3 className='text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider'>
                Current Driver
              </h3>
              <div className='flex items-center gap-3 p-3 bg-slate-50 rounded-lg'>
                <div className='w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0'>
                  <span className='text-sm font-bold text-slate-600'>
                    {trip.driver.name?.charAt(0).toUpperCase() || "D"}
                  </span>
                </div>
                <div>
                  <p className='text-sm font-medium text-slate-900'>
                    {trip.driver.name}
                  </p>
                  <p className='text-xs text-slate-500'>
                    {trip.driver.license_number}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Driver Selection */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-5'>
            <h3 className='text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider'>
              Select New Driver
            </h3>
            <DriverVehicleSelector
              value={{ driver, vehicle }}
              onChange={handleDriverVehicleChange}
              excludeDriverIds={currentDriverId ? [currentDriverId] : []}
            />
          </div>

          {/* Info Banner */}
          <div className='bg-amber-50 border border-amber-200 rounded-xl p-4'>
            <p className='text-sm text-amber-800'>
              <strong>Note:</strong> The driver can only be reassigned before
              the trip starts. Once the trip is in progress or completed, this
              action is not available.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='p-5 bg-white border-t border-slate-200 flex gap-3 shrink-0'>
          <Button
            variant='secondary'
            onClick={onClose}
            disabled={isSubmitting}
            className='flex-1 py-2.5 rounded-xl font-bold'
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className='flex-1 py-2.5 rounded-xl font-bold'
          >
            Confirm Reassignment
          </Button>
        </div>
      </div>
    </DrawerWrapper>
  );
};
