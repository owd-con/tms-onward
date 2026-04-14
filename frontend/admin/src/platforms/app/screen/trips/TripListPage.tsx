import { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TripSidebar } from './components/TripSidebar';
import { LoadDetailRenderer } from './components/LoadDetailRenderer';
import { AssignTripDrawer } from './components/AssignTripDrawer';
import { ReturnShipmentDrawer } from './components/ReturnShipmentDrawer';
import { RescheduleDrawer } from './components/RescheduleDrawer';
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

  let filter = 'pending';
  if (location.pathname.includes('/exception')) filter = 'exception';
  else if (location.pathname.includes('/on-delivery')) filter = 'on-delivery';
  else if (location.pathname.includes('/history')) filter = 'history';

  useEffect(() => {
    if (location.pathname === '/a/trips' || location.pathname === '/a/trips/') {
      navigate('/a/trips/pending', { replace: true });
    }
  }, [location.pathname, navigate]);

  const selectedLoadId = id;

  const { data: pendingData, isLoading: isLoadingPending, refetch: refetchPending } = orderApi.endpoints.getOrders.useQuery({ status: 'pending', limit: 50 });
  const { data: exceptionData, isLoading: isLoadingException, refetch: refetchException } = exceptionApi.endpoints.getExceptionOrders.useQuery({ limit: 50 });
  const { data: activeTripsData, isLoading: isLoadingActive, refetch: refetchActive } = tripApi.endpoints.getTrips.useQuery({ status: 'on_delivery', limit: 50 });
  const { data: historyTripsData, isLoading: isLoadingHistory, refetch: refetchHistory } = tripApi.endpoints.getTrips.useQuery({ status: 'completed', limit: 50 });

  useEffect(() => {
    if (filter === 'pending') refetchPending();
    if (filter === 'exception') refetchException();
    if (filter === 'on-delivery') refetchActive();
    if (filter === 'history') refetchHistory();
  }, [filter, refetchPending, refetchException, refetchActive, refetchHistory]);

  const loads = useMemo(() => {
    if (filter === 'pending') return pendingData?.data || [];
    if (filter === 'exception') return exceptionData?.data || [];
    if (filter === 'on-delivery') return activeTripsData?.data || [];
    if (filter === 'history') return historyTripsData?.data || [];
    return [];
  }, [filter, pendingData, exceptionData, activeTripsData, historyTripsData]);

  const counts = {
    pending: pendingData?.total || pendingData?.data?.length || 0,
    exception: exceptionData?.total || exceptionData?.data?.length || 0,
    onDelivery: activeTripsData?.total || activeTripsData?.data?.length || 0,
    history: historyTripsData?.total || historyTripsData?.data?.length || 0,
  };

  const isLoading = isLoadingPending || isLoadingException || isLoadingActive || isLoadingHistory;

  const handleRefreshException = () => {
    refetchPending();
    refetchException();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <div className="relative z-10">
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
          filter={filter}
          setFilter={(newFilter) => navigate(`/a/trips/${newFilter}`)}
          counts={counts}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}
      </div>

      <div className="flex-1 relative h-full">
        <LoadDetailRenderer
          loads={loads}
          onAssign={(loadId) => {
            // Redeliver = Reschedule all failed shipments for this order
            const order = loads.find((l: any) => l.id === loadId);
            setRescheduleOrder(order || null);
            setIsRescheduleDrawerOpen(true);
          }}
          onReturn={(shipment) => {
            // Return = mark the passed shipment as returned to origin
            setReturnShipment(shipment);
            setIsReturnDrawerOpen(true);
          }}
        />
      </div>

      {/* Assign Trip Drawer — for pending orders */}
      <AssignTripDrawer
        isOpen={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        orderId={assignOrderId}
        onSuccess={handleRefreshException}
      />

      {/* Return Shipment Drawer — mark individual failed shipment as returned */}
      <ReturnShipmentDrawer
        isOpen={isReturnDrawerOpen}
        onClose={() => setIsReturnDrawerOpen(false)}
        shipment={returnShipment}
        onSuccess={handleRefreshException}
      />

      {/* Reschedule Drawer — batch reschedule all failed shipments (Redeliver) */}
      <RescheduleDrawer
        isOpen={isRescheduleDrawerOpen}
        onClose={() => setIsRescheduleDrawerOpen(false)}
        order={rescheduleOrder}
        onSuccess={handleRefreshException}
      />
    </div>
  );
};

export default TripListPage;
