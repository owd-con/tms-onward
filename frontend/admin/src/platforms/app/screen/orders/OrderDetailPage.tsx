/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa";

import { Button, useEnigmaUI, Modal } from "@/components";
import { useOrder } from "@/services/order/hooks";
import type { Order } from "@/services/types";

import { Page } from "../../components/layout";
import WaypointTimeline from "@/platforms/app/components/order/WaypointTimeline";
import { WaypointLogsTimeline } from "./components/detail/WaypointLogsTimeline";
import { OrderTripList } from "./components/detail/OrderTripList";
import { OrderInformation } from "./components/detail/OrderInformation";
import ReturnWaypointModal from "./components/ReturnWaypointModal";

/**
 * TMS Onward - Order Detail Page
 *
 * Displays order information, customer details, waypoint timeline,
 * status history, and available actions.
 */
const OrderDetailPage = () => {
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();
  const { openModal, closeModal } = useEnigmaUI();

  const {
    show: showOrder,
    showResult: showOrderResult,
    cancel: cancelOrder,
    cancelResult: cancelOrderResult,
    remove: removeOrder,
    removeResult: removeOrderResult,
  } = useOrder();

  const [order, setOrder] = useState<Order | null>(null);

  // State for ReturnWaypointModal
  const [returnWaypointModal, setReturnWaypointModal] = useState<{
    open: boolean;
    waypoint: any;
  }>({ open: false, waypoint: null });

  // Load order detail
  useEffect(() => {
    if (orderId) {
      showOrder({ id: orderId });
    }
  }, []);

  useEffect(() => {
    if (showOrderResult?.isSuccess) {
      const data = (showOrderResult?.data as any)?.data;
      setOrder(data);
    }
  }, [showOrderResult]);

  // Reload order data after successful cancel
  useEffect(() => {
    if (cancelOrderResult?.isSuccess) {
      closeModal("cancel-order-confirm");
      showOrder({ id: orderId as string });
    }
  }, [cancelOrderResult?.isSuccess]);

  // Navigate back after successful delete
  useEffect(() => {
    if (removeOrderResult?.isSuccess) {
      closeModal("delete-order-confirm");
      navigate("/a/orders", { replace: true });
    }
  }, [removeOrderResult?.isSuccess]);

  const openCancelOrder = () => {
    openModal({
      id: "cancel-order-confirm",
      content: (
        <Modal.Wrapper
          open
          onClose={() => closeModal("cancel-order-confirm")}
          className='max-w-md'
        >
          <Modal.Header>
            <div className='text-lg font-bold'>Cancel Order</div>
          </Modal.Header>
          <Modal.Body>
            <p className='text-sm text-base-content/70'>
              Are you sure you want to cancel this order?
            </p>
            <p className='mt-2 text-sm font-medium'>{order?.order_number}</p>
            <p className='text-xs text-base-content/60 mt-1'>
              This action cannot be undone.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => closeModal("cancel-order-confirm")}
                disabled={cancelOrderResult?.isLoading}
              >
                Keep Order
              </Button>
              <Button
                variant='error'
                type='button'
                isLoading={cancelOrderResult?.isLoading}
                disabled={cancelOrderResult?.isLoading}
                onClick={handleCancel}
              >
                Cancel Order
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      ),
    });
  };

  const openModalDelete = () => {
    openModal({
      id: "delete-order-confirm",
      content: (
        <Modal.Wrapper
          open
          onClose={() => closeModal("delete-order-confirm")}
          className='max-w-md'
        >
          <Modal.Header>
            <div className='text-lg font-bold'>Delete Order</div>
          </Modal.Header>
          <Modal.Body>
            <p className='text-sm text-base-content/70'>
              Are you sure you want to delete this order?
            </p>
            <p className='mt-2 text-sm font-medium'>{order?.order_number}</p>
            <p className='text-xs text-base-content/60 mt-1'>
              This action cannot be undone.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => closeModal("delete-order-confirm")}
                disabled={removeOrderResult?.isLoading}
              >
                Keep Order
              </Button>
              <Button
                variant='error'
                type='button'
                isLoading={removeOrderResult?.isLoading}
                disabled={removeOrderResult?.isLoading}
                onClick={handleDelete}
              >
                Delete Order
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      ),
    });
  };

  const handleDelete = () => {
    console.log("handleDelete called, orderId:", orderId);
    if (orderId) {
      removeOrder({ id: orderId });
    }
  };

  const handleCancel = () => {
    console.log("handleCancel called, orderId:", orderId);
    if (orderId) {
      cancelOrder({ id: orderId });
    }
  };

  const handleReturnWaypoint = (waypoint: any) => {
    setReturnWaypointModal({ open: true, waypoint });
  };

  const handleReturnWaypointSuccess = () => {
    setReturnWaypointModal({ open: false, waypoint: null });
    // Refetch order data to update the UI
    if (orderId) {
      showOrder({ id: orderId });
    }
  };

  if (!order) {
    return (
      <Page>
        <Page.Header title='Order Detail' />
        <Page.Body>
          {showOrderResult?.isError ? (
            <div className='flex flex-col items-center justify-center h-64 gap-4'>
              <div className='text-error text-6xl'>:(</div>
              <div className='text-center'>
                <h3 className='text-lg font-semibold'>Error Loading Order</h3>
                <p className='text-base-content/60 mt-1'>
                  Failed to load order details. Please try again.
                </p>
              </div>
              <Button variant='secondary' onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </div>
          ) : (
            <div className='flex justify-center items-center h-64'>
              <div className='loading loading-spinner loading-lg'></div>
            </div>
          )}
        </Page.Body>
      </Page>
    );
  }

  const canEdit = order.status === "pending";
  const canCancel = order.status === "pending" || order.status === "planned";
  const canDelete = !order.is_deleted && order.status === "pending";

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        backTo={() => navigate(-1)}
        title='Order Detail'
        titleClassName='!text-2xl'
        subtitle={order.order_number}
        action={
          <div className='gap-3 flex'>
            {canEdit && (
              <Button
                variant='secondary'
                onClick={() => navigate(`/a/orders/${orderId}/edit`)}
              >
                <FaEdit className='h-4 w-4' />
              </Button>
            )}
            {canDelete && (
              <Button variant='error' onClick={openModalDelete}>
                <FaTrash className='h-4 w-4' />
              </Button>
            )}
            {canCancel && (
              <Button variant='error' onClick={openCancelOrder}>
                <FaTimes className='h-4 w-4 mr-1' />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      <Page.Body className='flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0 overflow-y-auto'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6'>
          {/* Order & Customer Information */}
          <div className='lg:col-span-2'>
            <OrderInformation order={order} />
          </div>

          {/* Tracking History (v2.10) */}
          {orderId && (
            <WaypointLogsTimeline orderId={orderId} className='lg:col-span-1' />
          )}

          {/* Waypoint Timeline */}
          <div className='lg:col-span-3 bg-white rounded-xl p-4 lg:p-6 shadow-sm'>
            <h3 className='text-base lg:text-lg font-semibold mb-4'>
              Waypoints
            </h3>
            <WaypointTimeline
              waypoints={order.order_waypoints || []}
              onReturn={handleReturnWaypoint}
            />
          </div>

          {/* Trip History (v2.10) */}
          {order?.status !== "pending" && orderId && (
            <OrderTripList orderId={orderId} className='lg:col-span-3' />
          )}
        </div>
      </Page.Body>

      {/* ReturnWaypointModal */}
      <ReturnWaypointModal
        open={returnWaypointModal.open}
        waypoint={returnWaypointModal.waypoint}
        onClose={() => setReturnWaypointModal({ open: false, waypoint: null })}
        onSuccess={handleReturnWaypointSuccess}
      />
    </Page>
  );
};

export default OrderDetailPage;
