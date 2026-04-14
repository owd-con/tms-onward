import { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TripSidebar } from './components/TripSidebar';
import { LoadDetailRenderer } from './components/LoadDetailRenderer';
import { AssignTripDrawer } from './components/AssignTripDrawer';
import { ReturnShipmentDrawer } from './components/ReturnShipmentDrawer';
import { RescheduleDrawer } from './components/RescheduleDrawer';
import { Modal } from "@/components";
import { useIsMobile } from '@/hooks/useIsMobile';
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

  const isMobile = useIsMobile();

  const showMobileDetail = isMobile && !!selectedLoadId;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 relative">
      <div className={`${isMobile ? 'w-full' : 'relative z-10'}`}>
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

      {!isMobile && (
        <div className="flex-1 relative h-full">
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
          className="!p-0 !max-w-full h-[85vh] fixed bottom-0 rounded-t-[32px] overflow-hidden"
        >
          <div className="h-full pt-2">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 shrink-0" />
            <div className="h-full overflow-y-auto">
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
    </div>
  );
};

export default TripListPage;
