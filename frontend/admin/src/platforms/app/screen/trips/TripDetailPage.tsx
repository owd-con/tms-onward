/* eslint-disable react-hooks/exhaustive-deps */
import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiSignal, HiTrash } from "react-icons/hi2";
import { FaEdit } from "react-icons/fa";
import { Database } from "lucide-react";

import { Button, Modal, useEnigmaUI } from "@/components";
import { useTrip } from "@/services/trip/hooks";
import type { Trip } from "@/services/types";
import { Page } from "../../components/layout";
import WaypointTimeline from "./components/detail/WaypointTimeline";
import { TripInformation } from "./components/detail/TripInformation";
import { TripOrderCard } from "./components/detail/TripOrderCard";

/**
 * TMS Onward - Trip Detail Page
 *
 * Displays trip information, driver & vehicle details, order info,
 * waypoint status tracking, and available actions (Dispatch, Cancel).
 *
 * Note: Start Trip is now handled by Driver (via Driver Web)
 * Trip is auto-completed when all waypoints are finished
 */
const TripDetailPage = () => {
  const navigate = useNavigate();
  const { id: tripId } = useParams<{ id: string }>();
  const { openModal, closeModal, showToast } = useEnigmaUI();

  const {
    show: showTrip,
    showResult: showTripResult,
    dispatch: dispatchTrip,
    dispatchResult: dispatchTripResult,
    remove: removeTrip,
    removeResult: removeTripResult,
  } = useTrip();

  const [trip, setTrip] = useState<Trip | null>(null);

  // Load trip detail
  useEffect(() => {
    if (tripId) {
      showTrip({ id: tripId });
    }
  }, []);

  useEffect(() => {
    if (showTripResult?.isSuccess) {
      const data = (showTripResult?.data as any)?.data;
      setTrip(data);
    }
  }, [showTripResult]);

  // Reload trip data after successful dispatch
  useEffect(() => {
    if (dispatchTripResult?.isSuccess) {
      closeModal("dispatch-trip-confirm");
      showToast({
        message: "Trip dispatched successfully",
        type: "success",
      });
      if (tripId) showTrip({ id: tripId });
    }
  }, [dispatchTripResult?.isSuccess]);

  // Navigate back after successful delete
  useEffect(() => {
    if (removeTripResult?.isSuccess) {
      closeModal("delete-trip-confirm");
      showToast({
        message: "Trip deleted successfully",
        type: "success",
      });

      // Navigate back after showing success message
      const timer = setTimeout(() => {
        navigate("/a/trips", { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [removeTripResult?.isSuccess]);

  const openDeleteTrip = () => {
    openModal({
      id: "delete-trip-confirm",
      content: (
        <Modal.Wrapper
          open
          onClose={() => closeModal("delete-trip-confirm")}
          className='!max-w-md !w-11/12 mx-4'
        >
          <Modal.Header className='mb-4'>
            <div className='text-rose-600 font-bold leading-7 text-lg'>
              Delete Trip Record
            </div>
            <div className='text-sm text-slate-500 leading-5 font-normal'>
              This action is permanent and cannot be undone. Are you sure?
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className='bg-rose-50/50 border border-rose-100/60 p-5 rounded-2xl'>
              <p className='text-sm text-rose-900/60 font-medium mb-3'>You are about to delete:</p>
              <div className='bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex flex-col gap-1'>
                <p className='font-bold text-slate-800'>{trip?.trip_number}</p>
                <p className='text-sm text-slate-500 font-medium'>
                  All associated waypoints and timeline events will be removed.
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => closeModal("delete-trip-confirm")}
                disabled={removeTripResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant='error'
                onClick={handleDelete}
                isLoading={removeTripResult?.isLoading}
                disabled={removeTripResult?.isLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-md border border-rose-700 outline outline-2 outline-offset-2 outline-rose-500/20"
              >
                Yes, Delete Trip
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      ),
    });
  };

  const openDispatchTrip = () => {
    openModal({
      id: "dispatch-trip-confirm",
      content: (
        <Modal.Wrapper
          open
          onClose={() => closeModal("dispatch-trip-confirm")}
          className='max-w-md'
        >
          <Modal.Header>
            <div className='text-lg font-bold'>Dispatch Trip</div>
          </Modal.Header>
          <Modal.Body>
            <p className='text-sm text-base-content/70'>
              Are you sure you want to dispatch this trip?
            </p>
            <p className='mt-2 text-sm font-medium'>{trip?.trip_number}</p>
            <p className='text-xs text-base-content/60 mt-1'>
              The trip status will change to "Dispatched".
            </p>
          </Modal.Body>
          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => closeModal("dispatch-trip-confirm")}
                disabled={dispatchTripResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant='primary'
                onClick={handleDispatch}
                isLoading={dispatchTripResult?.isLoading}
                disabled={dispatchTripResult?.isLoading}
              >
                Dispatch Trip
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      ),
    });
  };

  const handleDispatch = () => {
    if (tripId) {
      dispatchTrip({ id: tripId });
    }
  };

  const handleDelete = () => {
    if (tripId) {
      removeTrip({ id: tripId });
    }
  };

  if (!trip) {
    // Show loading state while fetching
    if (showTripResult?.isLoading) {
      return (
        <Page>
          <Page.Header 
            pillLabel="OPERATIONS"
            pillIcon={<Database size={12} strokeWidth={2.5} />}
            title='Trip Overview' 
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

    // Show error state if trip not found
    return (
      <Page>
        <Page.Header 
          pillLabel="OPERATIONS"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title='Trip Overview' 
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

  // Determine available actions based on trip status
  const canModify = trip.status === "planned";

  return (
    <Fragment>
      <Page className='h-full flex flex-col min-h-0'>
        <Page.Header
          pillLabel="OPERATIONS"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          backTo={() => navigate(-1)}
          title='Trip Overview'
          titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
          subtitle={`Trip Reference: ${trip.trip_number}`}
          subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
          action={
            <div className='gap-3 flex'>
              {canModify && (
                <Button
                  variant='secondary'
                  onClick={() => navigate(`/a/trips/${trip.id}/edit`)}
                >
                  <FaEdit className='w-4 h-4' />
                </Button>
              )}
              {canModify && (
                <Button variant='error' onClick={openDeleteTrip}>
                  <HiTrash className='w-4 h-4' />
                </Button>
              )}
              {canModify && (
                <Button variant='primary' onClick={openDispatchTrip}>
                  <HiSignal className='w-4 h-4 mr-1' />
                  Dispatch Trip
                </Button>
              )}
            </div>
          }
        />

        <Page.Body className='flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0 overflow-y-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6'>
            {/* Trip Information (includes Driver & Vehicle) */}
            <div className='lg:col-span-8'>
              <TripInformation trip={trip} />
            </div>

            <div className='lg:col-span-4 space-y-4 lg:space-y-6'>
              {/* Order Information */}
              {trip.order && <TripOrderCard trip={trip} />}
            </div>
          </div>

          {/* Waypoint Timeline */}
          {trip.trip_waypoints && trip.trip_waypoints.length > 0 && (
            <div className='bg-base-100 rounded-xl p-4 lg:p-6 shadow-sm'>
              <h3 className='text-base lg:text-lg font-semibold mb-4'>
                Waypoints
              </h3>
              <WaypointTimeline waypoints={trip.trip_waypoints} />
            </div>
          )}
        </Page.Body>
      </Page>
    </Fragment>
  );
};

export default TripDetailPage;
