import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { orderApi } from "@/services/order/api";
import { tripApi } from "@/services/trip/api";
import { OrderDetailFloatingCard } from './OrderDetailFloatingCard';
import { TripDetailFloatingCard } from './TripDetailFloatingCard';
import { TripMapViewer } from './TripMapViewer';

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

  if (!id) {
    return <TripMapViewer loads={loads} />;
  }

  const loadData = isOrder ? specificOrderData?.data : specificTripData?.data;

  const handleClose = () => {
    navigate(`/a/trips/${filter}`);
  };

  if (!loadData && (isLoadingOrder || isLoadingTrip)) {
    const fallbackLoad = loads.find(l => l.id === id);
    return <TripMapViewer loads={loads} selectedLoad={fallbackLoad} />;
  }

  if (!loadData) {
    return <TripMapViewer loads={loads} />;
  }

  return (
    <>
      <TripMapViewer loads={loads} selectedLoad={loadData} />
      {isOrder ? (
        <OrderDetailFloatingCard 
          order={loadData} 
          onClose={handleClose} 
          onAssign={onAssign ? () => onAssign(loadData.id) : undefined}
          onReturn={onReturn ? (shipment) => onReturn(shipment) : undefined}
        />
      ) : (
        <TripDetailFloatingCard load={loadData} onClose={handleClose} />
      )}
    </>
  );
};
