import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { orderApi } from "@/services/order/api";
import { tripApi } from "@/services/trip/api";
import { OrderDetailFloatingCard } from './OrderDetailFloatingCard';
import { TripDetailFloatingCard } from './TripDetailFloatingCard';
import { TripMapViewer } from './TripMapViewer';
import { useIsMobile } from '@/hooks/useIsMobile';

interface LoadDetailRendererProps {
  loads: any[];
  onAssign?: (id: string) => void;
  onReturn?: (shipment: any) => void;
}

export const LoadDetailRenderer: React.FC<LoadDetailRendererProps> = ({ loads, onAssign, onReturn }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  let filter = 'pending';
  if (location.pathname.includes('/exception')) filter = 'exception';
  else if (location.pathname.includes('/on-delivery')) filter = 'on-delivery';
  else if (location.pathname.includes('/history')) filter = 'history';

  const isOrder = filter === 'pending' || filter === 'exception';
  const isTrip = filter === 'on-delivery' || filter === 'history';

  const { data: specificOrderData, isLoading: isLoadingOrder } = orderApi.endpoints.showOrder.useQuery(
    { id: id || '' },
    { skip: !isOrder || !id }
  );

  const { data: specificTripData, isLoading: isLoadingTrip } = tripApi.endpoints.showTrip.useQuery(
    { id: id || '' },
    { skip: !isTrip || !id }
  );

  const isMobile = useIsMobile();

  if (!id) {
    if (isMobile) return null;
    return <TripMapViewer loads={loads} />;
  }

  const loadData = isOrder ? specificOrderData?.data : specificTripData?.data;

  const handleClose = () => {
    navigate(`/a/trips/${filter}`);
  };

  if (!loadData && (isLoadingOrder || isLoadingTrip)) {
    if (isMobile) return null; // Or a loader? But list usually stays visible
    const fallbackLoad = loads.find(l => l.id === id);
    return <TripMapViewer loads={loads} selectedLoad={fallbackLoad} />;
  }

  if (!loadData) {
    if (isMobile) return null;
    return <TripMapViewer loads={loads} />;
  }

  const content = isOrder ? (
    <OrderDetailFloatingCard 
      order={loadData} 
      onClose={handleClose} 
      onAssign={onAssign ? () => onAssign(loadData.id) : undefined}
      onReturn={onReturn ? (shipment) => onReturn(shipment) : undefined}
    />
  ) : (
    <TripDetailFloatingCard load={loadData} onClose={handleClose} />
  );

  return (
    <>
      {!isMobile && <TripMapViewer loads={loads} selectedLoad={loadData} />}
      {content}
    </>
  );
};
