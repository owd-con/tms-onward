import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { HiCheck, HiExclamationTriangle, HiMapPin } from "react-icons/hi2";
import { Button, useEnigmaUI } from "@/components";
import { ErrorState } from "@/platforms/app/components";
import { LoadingWaypointForm, CompleteWaypointForm, FailWaypointForm } from "./components/form";
import { LocationInfo, OrderInfo, WaypointItems } from "./components/detail";
import { useTrip } from "@/services/driver/hooks";
import { statusBadge } from "@/shared/helper";
import { formatDateTime } from "@/shared/utils/formatter";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";
import { Page } from "@/platforms/app/components/page";
import type { Trip } from "@/services/types";

export const WaypointDetail = () => {
  const { id, waypointId } = useParams<{ id: string; waypointId: string }>();
  const navigate = useNavigate();
  const { openModal, closeModal } = useEnigmaUI();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode"); // "fail" mode for reporting failed waypoint

  // Fetch trip detail to get waypoint information - manual trigger
  const {
    show,
    showResult,
    startWaypoint,
    startWaypointResult,
    completeWaypointResult,
    failWaypointResult,
  } = useTrip();

  const [trip, setTrip] = useState<Trip | null>(null);

  // Auto-fetch when id changes
  useEffect(() => {
    if (id) {
      show({ id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Update trip state when showResult.data changes
  useEffect(() => {
    setTrip(showResult?.data?.data as Trip | null);
  }, [showResult]);

  // Extract waypoint from trip data
  const waypoint = trip?.trip_waypoints?.find((wp) => wp.id === waypointId);
  const waypointType = (waypoint?.type || "pickup") as
    | "pickup"
    | "delivery";
  const isPickup = waypointType === "pickup";
  const shipments = waypoint?.shipments || [];

  // Success handling for start waypoint
  useEffect(() => {
    if (startWaypointResult?.isSuccess) {
      toast.success("Waypoint started");
      navigate(`/a/trips/${id}`);
    }
  }, [startWaypointResult?.isSuccess, id]);

  // Success handling for complete waypoint
  useEffect(() => {
    if (completeWaypointResult?.isSuccess) {
      toast.success("Delivery completed");
      navigate(`/a/trips/${id}`);
    }
  }, [completeWaypointResult?.isSuccess, id]);

  // Success handling for fail waypoint
  useEffect(() => {
    if (failWaypointResult?.isSuccess) {
      toast.success("Waypoint failed reported");
      navigate(`/a/trips/${id}`);
    }
  }, [failWaypointResult?.isSuccess, id]);

  // Handle start waypoint (Pending -> In Transit) - v2.10
  const handleStartWaypoint = async () => {
    if (!waypointId) return;
    try {
      await startWaypoint({ id: waypointId });
    } catch (error) {
      toast.error("Failed to start waypoint. Please try again.");
      logger.error("Failed to start waypoint", error);
    }
  };

  // Handle loading waypoint (Pickup: opens LoadingWaypointForm modal) - v2.10
  const handleLoadingWaypoint = () => {
    if (!waypointId) return;

    openModal({
      id: "loading-waypoint",
      content: (
        <LoadingWaypointForm
          waypointId={waypointId}
          shipments={shipments}
          open={true}
          onSuccess={() => {
            closeModal("loading-waypoint");
            navigate(`/a/trips/${id}`);
          }}
          onCancel={() => closeModal("loading-waypoint")}
        />
      ),
    });
  };

  // Handle complete delivery (opens CompleteWaypointForm modal) - v2.10
  const handleCompleteWaypoint = () => {
    if (!waypointId) return;

    openModal({
      id: "complete-waypoint",
      content: (
        <CompleteWaypointForm
          waypointId={waypointId}
          open={true}
          onSuccess={() => {
            closeModal("complete-waypoint");
            navigate(`/a/trips/${id}`);
          }}
          onCancel={() => closeModal("complete-waypoint")}
        />
      ),
    });
  };

  // Handle fail waypoint (opens FailWaypointForm modal) - v2.10
  const handleFailWaypoint = () => {
    if (!waypointId) return;

    openModal({
      id: "fail-waypoint",
      content: (
        <FailWaypointForm
          waypointId={waypointId}
          waypointType={waypointType}
          shipments={shipments}
          open={true}
          onSuccess={() => {
            closeModal("fail-waypoint");
            navigate(`/a/trips/${id}`);
          }}
          onCancel={() => closeModal("fail-waypoint")}
        />
      ),
    });
  };

  // Check if in "fail" mode (from trip detail page)
  useEffect(() => {
    if (mode === "fail" && waypoint?.status === "in_transit") {
      // Auto-open fail waypoint modal
      handleFailWaypoint();
    }
  }, [mode, waypoint?.status]);

  // Loading state
  if (showResult.isLoading) {
    return (
      <Page>
        <Page.Body className='px-4 py-4 max-w-screen-md mx-auto'>
          <div className='flex items-center justify-center min-h-[50vh]'>
            <div className='text-center'>
              <div className='loading loading-spinner loading-lg text-blue-600'></div>
              <p className='mt-4 text-slate-600'>Loading waypoint details...</p>
            </div>
          </div>
        </Page.Body>
      </Page>
    );
  }

  // Error state
  if (showResult.isError || !waypoint) {
    const isNotFound = !showResult.isError && !waypoint;
    return (
      <Page>
        <Page.Body className='px-4 py-4 max-w-screen-md mx-auto'>
          <ErrorState
            error={showResult.error}
            title={
              isNotFound ? "Waypoint Not Found" : "Failed to Load Waypoint"
            }
            message={
              isNotFound
                ? "The requested waypoint could not be found."
                : "Failed to load waypoint details. Please check your connection."
            }
            onRetry={showResult.isError ? () => id && show({ id }) : undefined}
            isRetrying={showResult.isLoading}
            retryText={showResult.isLoading ? "Retrying..." : "Try Again"}
            secondaryAction={{
              label: "Back to Trip",
              onClick: () => navigate(`/a/trips/${id}`, { replace: true }),
            }}
          />
        </Page.Body>
      </Page>
    );
  }

  return (
    <>
      <Page>
        <Page.Header
          title={isPickup ? "Pickup Point" : "Delivery Point"}
          withBack
          onBack={() => navigate(`/a/trips/${id}`)}
          subtitle={`Stop #${waypoint.sequence_number} · ${trip?.trip_number}`}
          extra={statusBadge(waypoint.status)}
        />
        <Page.Body className='px-4 py-4 max-w-screen-md flex flex-col'>
          {/* v2.10: Completed banner with received_by for delivery */}
          {waypoint.status === "completed" && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-3 mb-4'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0'>
                  <HiCheck size={16} className='text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-green-900 text-sm'>
                    Waypoint Completed
                  </h3>
                  {isPickup && waypoint.loaded_by && (
                    <p className='text-xs text-green-700 truncate'>
                      Loaded by: {waypoint.loaded_by}
                    </p>
                  )}
                  {!isPickup && waypoint.received_by && (
                    <p className='text-xs text-green-700 truncate'>
                      Received by: {waypoint.received_by}
                    </p>
                  )}
                  <p className='text-xs text-green-700'>
                    {waypoint.actual_completion_time
                      ? `Completed at ${formatDateTime(waypoint.actual_completion_time)}`
                      : "Successfully completed"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* v2.10: Failed banner with failed_reason */}
          {waypoint.status === "failed" && waypoint.failed_reason && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-3 mb-4'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0'>
                  <HiExclamationTriangle size={16} className='text-white' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-red-900 text-sm'>
                    Waypoint Failed
                  </h3>
                  <p className='text-xs text-red-700'>
                    {waypoint.failed_reason}
                  </p>
                  {waypoint.actual_completion_time && (
                    <p className='text-xs text-red-700'>
                      Failed at{" "}
                      {formatDateTime(waypoint.actual_completion_time)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location Info */}
          <LocationInfo
            waypoint={waypoint}
            waypointType={waypointType}
            notes={waypoint.notes}
          />

          {/* Order Info */}
          <OrderInfo order={trip?.order} waypoint={waypoint} />

          {/* Items List */}
          <WaypointItems shipments={shipments} isPickup={isPickup} />
        </Page.Body>

        {/* v2.10: Action Buttons in Footer - based on waypoint type and status */}
        <Page.Footer>
          <div>
            {waypoint.status === "pending" && (
              <Button
                variant='primary'
                size='sm'
                shape='block'
                isLoading={startWaypointResult.isLoading}
                onClick={handleStartWaypoint}
              >
                <div className='flex items-center justify-center gap-2'>
                  <HiMapPin size={18} />
                  <span>Start Waypoint</span>
                </div>
              </Button>
            )}

            {waypoint.status === "in_transit" && (
              <div className='flex gap-3'>
                {/* Pickup: Loading button (opens LoadingWaypointForm) */}
                {isPickup && (
                  <Button
                    variant='success'
                    size='sm'
                    className='flex-1'
                    onClick={handleLoadingWaypoint}
                  >
                    <div className='flex items-center justify-center gap-2'>
                      <HiCheck size={16} />
                      <span>Loading</span>
                    </div>
                  </Button>
                )}

                {/* Delivery: Complete button (opens CompleteWaypointForm) */}
                {!isPickup && (
                  <Button
                    variant='success'
                    size='sm'
                    className='flex-1'
                    onClick={handleCompleteWaypoint}
                  >
                    <div className='flex items-center justify-center gap-2'>
                      <HiCheck size={16} />
                      <span>Complete</span>
                    </div>
                  </Button>
                )}

                {/* Both types: Report Failed button */}
                <Button
                  size='sm'
                  variant='error'
                  className='flex-1'
                  isLoading={failWaypointResult.isLoading}
                  onClick={handleFailWaypoint}
                >
                  <div className='flex items-center justify-center gap-2'>
                    <HiExclamationTriangle size={16} />
                    <span>Report Failed</span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        </Page.Footer>
      </Page>
    </>
  );
};
