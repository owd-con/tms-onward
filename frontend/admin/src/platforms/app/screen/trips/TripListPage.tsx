import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { TripSidebar } from "./components/TripSidebar";
import { LoadDetailRenderer } from "./components/LoadDetailRenderer";
import { AssignTripDrawer } from "./components/AssignTripDrawer";
import { ReturnShipmentDrawer } from "./components/ReturnShipmentDrawer";
import { RescheduleDrawer } from "./components/RescheduleDrawer";
import { ReassignDriverDrawer } from "./components/ReassignDriverDrawer";
import { Button, Modal, useEnigmaUI } from "@/components";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTrip } from "@/services/trip/hooks";
import { orderApi } from "@/services/order/api";
import { exceptionApi } from "@/services/exception/api";
import { tripApi } from "@/services/trip/api";

const TripListPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Assign Trip Drawer (for pending orders)
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState<string | null>(null);

  // Return Shipment Drawer (for individual failed shipments)
  const [isReturnDrawerOpen, setIsReturnDrawerOpen] = useState(false);
  const [returnShipment, setReturnShipment] = useState<any>(null);

  // Reschedule Drawer (for redeliver = batch reschedule all failed shipments)
  const [isRescheduleDrawerOpen, setIsRescheduleDrawerOpen] = useState(false);
  const [rescheduleOrder, setRescheduleOrder] = useState<any>(null);

  // Reassign Driver Drawer
  const [isReassignDrawerOpen, setIsReassignDrawerOpen] = useState(false);
  const [reassignTrip, setReassignTrip] = useState<any>(null);

  // Delete Trip Modal
  const { openModal, closeModal, showToast } = useEnigmaUI();
  const { remove: removeTrip, removeResult: removeTripResult } = useTrip();

  const openDeleteTrip = (trip: any) => {
    openModal({
      id: "delete-trip-confirm",
      content: (
        <Modal.Wrapper
          open
          onClose={() => {
            closeModal("delete-trip-confirm");
          }}
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
              <p className='text-sm text-rose-900/60 font-medium mb-3'>
                You are about to delete:
              </p>
              <div className='bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex flex-col gap-1'>
                <p className='font-bold text-slate-800'>
                  {trip?.trip_number || trip?.order?.order_number || "Unknown"}
                </p>
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
                onClick={() => {
                  closeModal("delete-trip-confirm");
                }}
                disabled={removeTripResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant='error'
                isLoading={removeTripResult?.isLoading}
                disabled={removeTripResult?.isLoading}
                onClick={() => removeTrip({ id: trip?.id })}
                className='bg-rose-600 hover:bg-rose-700 text-white shadow-md border border-rose-700 outline outline-2 outline-offset-2 outline-rose-500/20'
              >
                Yes, Delete Trip
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      ),
    });
  };

  let filter = "pending";
  if (location.pathname.includes("/exception")) filter = "exception";
  else if (location.pathname.includes("/on-delivery")) filter = "on-delivery";
  else if (location.pathname.includes("/history")) filter = "history";

  useEffect(() => {
    if (location.pathname === "/a/trips" || location.pathname === "/a/trips/") {
      navigate("/a/trips/pending", { replace: true });
    }
  }, [location.pathname, navigate]);

  const selectedLoadId = id;

  const {
    data: pendingData,
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = orderApi.endpoints.getOrders.useQuery({ status: "pending", limit: 50 });
  const {
    data: exceptionData,
    isLoading: isLoadingException,
    refetch: refetchException,
  } = exceptionApi.endpoints.getExceptionOrders.useQuery({ limit: 50 });
  const {
    data: activeTripsData,
    isLoading: isLoadingActive,
    refetch: refetchActive,
  } = tripApi.endpoints.getTrips.useQuery({ status: "on_delivery", limit: 50 });
  const {
    data: historyTripsData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = tripApi.endpoints.getTrips.useQuery({ status: "completed", limit: 50 });

  useEffect(() => {
    if (filter === "pending") refetchPending();
    if (filter === "exception") refetchException();
    if (filter === "on-delivery") refetchActive();
    if (filter === "history") refetchHistory();
  }, [filter, refetchPending, refetchException, refetchActive, refetchHistory]);

  // Handle delete trip success
  useEffect(() => {
    if (removeTripResult?.isSuccess) {
      closeModal("delete-trip-confirm");
      showToast({ message: "Trip deleted successfully", type: "success" });
      // Refresh data
      if (filter === "on-delivery") refetchActive();
      if (filter === "history") refetchHistory();
    }
  }, [removeTripResult?.isSuccess]);

  const loads = useMemo(() => {
    if (filter === "pending") return pendingData?.data || [];
    if (filter === "exception") return exceptionData?.data || [];
    if (filter === "on-delivery") return activeTripsData?.data || [];
    if (filter === "history") return historyTripsData?.data || [];
    return [];
  }, [filter, pendingData, exceptionData, activeTripsData, historyTripsData]);

  const counts = {
    pending: pendingData?.total || pendingData?.data?.length || 0,
    exception: exceptionData?.total || exceptionData?.data?.length || 0,
    onDelivery: activeTripsData?.total || activeTripsData?.data?.length || 0,
    history: historyTripsData?.total || historyTripsData?.data?.length || 0,
  };

  const isLoading =
    isLoadingPending ||
    isLoadingException ||
    isLoadingActive ||
    isLoadingHistory;

  const handleRefreshException = () => {
    refetchPending();
    refetchException();
  };

  const isMobile = useIsMobile();

  const showMobileDetail = isMobile && !!selectedLoadId;

  return (
    <div className='flex h-screen w-full overflow-hidden bg-slate-50 relative'>
      <div className={`${isMobile ? "w-full" : "relative z-10"}`}>
        <TripSidebar
          loads={loads}
          selectedLoadId={selectedLoadId}
          onSelectLoad={(newId) => navigate(`/a/trips/${filter}/${newId}`)}
          onAssignLoad={(loadId) => {
            setAssignOrderId(loadId);
            setIsAssignDrawerOpen(true);
          }}
          onReturnLoad={({ shipment }) => {
            setReturnShipment(shipment);
            setIsReturnDrawerOpen(true);
          }}
          onRescheduleLoad={(loadId) => {
            const order = loads.find((l: any) => l.id === loadId);
            setRescheduleOrder(order || null);
            setIsRescheduleDrawerOpen(true);
          }}
          onReassignLoad={(loadId) => {
            const trip = loads.find((l: any) => l.id === loadId);
            setReassignTrip(trip || null);
            setIsReassignDrawerOpen(true);
          }}
          onDeleteLoad={(loadId) => {
            const trip = loads.find((l: any) => l.id === loadId);
            openDeleteTrip(trip);
          }}
          filter={filter}
          setFilter={(newFilter) => navigate(`/a/trips/${newFilter}`)}
          counts={counts}
        />
        {isLoading && (
          <div className='absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex items-center justify-center'>
            <div className='w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin'></div>
          </div>
        )}
      </div>

      {!isMobile && (
        <div className='flex-1 relative h-full'>
          <LoadDetailRenderer
            loads={loads}
            onAssign={(loadId) => {
              const order = loads.find((l: any) => l.id === loadId);
              setRescheduleOrder(order || null);
              setIsRescheduleDrawerOpen(true);
            }}
            onReturn={(shipment) => {
              setReturnShipment(shipment);
              setIsReturnDrawerOpen(true);
            }}
          />
        </div>
      )}

      {/* Mobile Detail Modal */}
      {showMobileDetail && (
        <Modal.Wrapper
          open={true}
          onClose={() => navigate(`/a/trips/${filter}`)}
          className='!p-0 !max-w-full h-[85vh] fixed bottom-0 rounded-t-[32px] overflow-hidden'
        >
          <div className='h-full pt-2'>
            <div className='w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 shrink-0' />
            <div className='h-full overflow-y-auto'>
              <LoadDetailRenderer
                loads={loads}
                onAssign={(loadId) => {
                  const order = loads.find((l: any) => l.id === loadId);
                  setRescheduleOrder(order || null);
                  setIsRescheduleDrawerOpen(true);
                }}
                onReturn={(shipment) => {
                  setReturnShipment(shipment);
                  setIsReturnDrawerOpen(true);
                }}
              />
            </div>
          </div>
        </Modal.Wrapper>
      )}

      {/* Assign Trip Drawer/Modal */}
      <AssignTripDrawer
        isOpen={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        orderId={assignOrderId}
        onSuccess={handleRefreshException}
        isMobile={isMobile}
      />

      {/* Return Shipment Drawer/Modal */}
      <ReturnShipmentDrawer
        isOpen={isReturnDrawerOpen}
        onClose={() => setIsReturnDrawerOpen(false)}
        shipment={returnShipment}
        onSuccess={handleRefreshException}
        isMobile={isMobile}
      />

      {/* Reschedule Drawer/Modal */}
      <RescheduleDrawer
        isOpen={isRescheduleDrawerOpen}
        onClose={() => setIsRescheduleDrawerOpen(false)}
        order={rescheduleOrder}
        onSuccess={handleRefreshException}
        isMobile={isMobile}
      />

      {/* Reassign Driver Drawer */}
      <ReassignDriverDrawer
        isOpen={isReassignDrawerOpen}
        onClose={() => setIsReassignDrawerOpen(false)}
        trip={reassignTrip}
        onSuccess={() => {
          if (filter === "on-delivery") refetchActive();
          if (filter === "history") refetchHistory();
        }}
      />
    </div>
  );
};

export default TripListPage;
