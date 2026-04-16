import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Page } from "@/platforms/app/components/page";
import { ErrorState } from "@/platforms/app/components/ErrorState";
import { Button } from "@/components/ui/button";
import { HiArrowRight, HiTruck } from "react-icons/hi2";
import { FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";
import { useOrder } from "@/services/order/hooks";
import type { Order, WaypointPreview, Vehicle } from "@/services/types";
import { ScanWaypointList } from "./components";

/**
 * ScanPage - Halaman konfirmasi scan order
 *
 * Menampilkan order details dan menerima order untuk membuat trip.
 * Diakses melalui URL /scan?order_id=xxx
 */
export const ScanPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<Order | undefined>(undefined);

  console.log("ScanPage mounted with orderId =", orderId);

  const {
    show,
    showResult,
    getWaypointPreview,
    getWaypointPreviewResult,
    getVehicles,
    getVehiclesResult,
    receiveOrder,
    receiveOrderResult,
  } = useOrder();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  // Fetch order details on mount
  useEffect(() => {
    if (orderId) {
      show({ id: orderId });
      getWaypointPreview({ id: orderId });
    }
  }, [orderId]);

  // Fetch vehicles list when order loads
  useEffect(() => {
    if (showResult?.isSuccess && orderId) {
      const data = showResult.data?.data as Order;
      setOrder(data);
      getVehicles({ company_id: data?.company_id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult?.isSuccess, orderId]);

  // Waypoints from getWaypointPreview - calculate weight & quantity from items
  const waypoints = useMemo(() => {
    const wps = (getWaypointPreviewResult?.data?.data as WaypointPreview[]) || [];
    const shipments = order?.shipments;

    if (!shipments) return wps;

    return wps.map((wp) => {
      let totalQuantity = 0;
      let totalWeight = 0;

      shipments.forEach((sh) => {
        wp.shipment_ids?.forEach((sid) => {
          if (sh.id === sid) {
            sh.items?.forEach((item) => {
              totalQuantity += item.quantity || 0;
              totalWeight += item.weight || 0;
            });
          }
        });
      });

      // Return new object with calculated values
      return { ...wp, weight: totalWeight, koli: totalQuantity };
    });
  }, [getWaypointPreviewResult, order]);

  const vehicles = useMemo(() => {
    return (getVehiclesResult?.data?.data as Vehicle[]) || [];
  }, [getVehiclesResult]);

  // Calculate totals from order.shipments -> items
  const totals = useMemo(() => {
    const shipments = order?.shipments || [];
    let totalWeight = 0;
    let totalKoli = 0;

    shipments.forEach((sh) => {
      // Sum from shipment level
      totalWeight += sh.weight || 0;
      totalKoli += sh.koli || 0;

      // Sum from items level
      sh.items?.forEach((item) => {
        totalWeight += (item.weight || 0) * item.quantity;
        totalKoli += item.quantity;
      });
    });

    return { totalWeight, totalKoli };
  }, [order]);

  // Handle receive order
  const handleReceiveOrder = async () => {
    await receiveOrder({
      order_id: orderId,
      vehicle_id: selectedVehicleId,
    });
  };

  // Handle success - redirect to trip detail
  useEffect(() => {
    if (receiveOrderResult?.isSuccess) {
      const data = receiveOrderResult.data?.data;
      toast.success("Order accepted successfully!");
      navigate(`/a/trips/${data?.id}`);
    }
  }, [receiveOrderResult]);

  // No order_id provided
  if (!orderId) {
    return (
      <Page>
        <Page.Body className='flex items-center justify-center h-full'>
          <div className='text-center p-8'>
            <FiPackage size={48} className='mx-auto text-slate-400 mb-4' />
            <h2 className='text-xl font-semibold text-slate-900 mb-2'>
              No Order Selected
            </h2>
            <p className='text-slate-600 mb-6'>
              Please scan a QR code from the print order to continue.
            </p>
            <Button variant='primary' onClick={() => navigate("/a/")}>
              Go to Home
            </Button>
          </div>
        </Page.Body>
      </Page>
    );
  }

  // Loading state
  if (showResult.isLoading) {
    return (
      <Page>
        <Page.Body className='flex items-center justify-center h-full'>
          <div className='animate-pulse text-center'>
            <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
            <p className='text-slate-600'>Loading order details...</p>
          </div>
        </Page.Body>
      </Page>
    );
  }

  // Error state
  if (showResult.isError && !order) {
    return (
      <Page>
        <Page.Header title='Scan Order' />
        <Page.Body className='px-4 py-4'>
          <ErrorState
            error={showResult.error}
            title='Failed to Load Order'
            message='Unable to load order details. The order may not exist or has been deleted.'
            onRetry={() => show({ id: orderId })}
            isRetrying={showResult.isLoading}
            retryText={showResult.isLoading ? "Retrying..." : "Try Again"}
          />
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page>
      <Page.Header
        title='Scan Order'
        subtitle='Review and accept this delivery order'
      />

      <Page.Body className='px-4 py-4 max-w-screen-md'>
        {order && (
          <div className='space-y-6'>
            {/* Order Info Card */}
            <div className='bg-white rounded-xl p-5 shadow-sm border border-slate-200'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <FiPackage size={24} className='text-blue-600' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-content-primary'>
                    {order.order_number}
                  </h3>
                  <p className='text-sm text-content-secondary'>
                    {order.customer?.name || "Customer"}
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className='grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-blue-600'>
                    {totals.totalWeight}
                  </p>
                  <p className='text-xs text-content-secondary'>kg</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-blue-600'>
                    {totals.totalKoli}
                  </p>
                  <p className='text-xs text-content-secondary'>koli</p>
                </div>
              </div>
            </div>

            {/* Waypoints List from getWaypointPreview */}
            <ScanWaypointList waypoints={waypoints} />

            {/* Vehicle Selection */}
            <div className='bg-white rounded-xl p-5 shadow-sm border border-slate-200'>
              <h4 className='font-semibold text-content-primary mb-4 flex items-center gap-2'>
                <HiTruck size={18} />
                Select Vehicle
              </h4>

              <div className='space-y-2'>
                {vehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedVehicleId === vehicle.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type='radio'
                      name='vehicle'
                      value={vehicle.id}
                      checked={selectedVehicleId === vehicle.id}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className='w-4 h-4 text-blue-600'
                    />
                    <div className='flex-1'>
                      <p className='font-medium text-content-primary'>
                        {vehicle.plate_number}
                      </p>
                      <p className='text-xs text-content-secondary'>
                        {vehicle.vehicle_type} - {vehicle.brand} {vehicle.model}
                      </p>
                    </div>
                    <div className='text-right text-xs text-content-tertiary'>
                      <p>{vehicle.capacity_weight} kg</p>
                    </div>
                  </label>
                ))}

                {vehicles.length === 0 && !getVehiclesResult.isLoading && (
                  <div className='text-center py-4 text-slate-500'>
                    <p>No vehicles available</p>
                  </div>
                )}

                {getVehiclesResult.isLoading && (
                  <div className='text-center py-4 text-slate-500'>
                    <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto' />
                    <p className='mt-2'>Loading vehicles...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Page.Body>

      {/* Action Buttons - moved to Footer */}
      {order && (
        <Page.Footer>
          <div className='flex gap-3 px-4 py-4'>
            <Button
              variant='secondary'
              onClick={() => navigate("/a/")}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              variant='primary'
              onClick={handleReceiveOrder}
              isLoading={receiveOrderResult.isLoading}
              disabled={!selectedVehicleId}
              className='flex-1 flex items-center justify-center gap-2'
            >
              <HiArrowRight size={20} />
              Accept Order
            </Button>
          </div>
        </Page.Footer>
      )}
    </Page>
  );
};

export default ScanPage;
