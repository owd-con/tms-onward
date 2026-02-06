/* eslint-disable react-hooks/exhaustive-deps */
import { Button, useEnigmaUI } from "@/components";
import { useTrip } from "@/services/trip/hooks";
import { useOrder } from "@/services/order/hooks";
import type { RootState } from "@/services/store";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Page } from "../../components/layout";
import TripStep1SelectOrder from "./components/form/TripStep1SelectOrder";
import { TripStep2AssignResources } from "./components/form/TripStep2AssignResources";
import TripStep3WaypointSequence from "./components/form/TripStep3WaypointSequence";
import { TripStep4Confirm } from "./components/form/TripStep4Confirm";
import type { Order, Driver, Vehicle } from "@/services/types";

type Step = 1 | 2 | 3 | 4;

/**
 * TMS Onward - Trip Create Page
 *
 * Multi-step wizard untuk Direct Assignment:
 * Step 1: Select Order (Pending status only)
 * Step 2: Assign Resources (driver + vehicle)
 * Step 3: Waypoint Sequence (LTL only, drag-and-drop)
 * Step 4: Confirm & Create
 */
const TripCreatePage = () => {
  const navigate = useNavigate();
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();
  const { create, createResult } = useTrip();

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  // Fetch pending orders for dropdown
  const { get: getOrders, getResult: getOrdersResult } = useOrder();

  useEffect(() => {
    getOrders({
      status: "pending",
      limit: 100,
    });
  }, [getOrders]);

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Form state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notes, setNotes] = useState("");
  const [waypointSequences, setWaypointSequences] = useState<
    Array<{ order_waypoint_id: string; sequence_number: number }>
  >([]);

  // Order detail
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [orderDetailError, setOrderDetailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch order detail when order is selected
  const { show: showOrder, showResult: showOrderResult } = useOrder();

  useEffect(() => {
    if (selectedOrder?.id) {
      setOrderDetailError(null);
      showOrder({ id: selectedOrder.id });
    }
  }, [selectedOrder, showOrder]);

  useEffect(() => {
    if (showOrderResult?.data) {
      // showOrderResult.data is ApiResponse<Order>, which has {data: Order, meta: {...}}
      const apiResponse = showOrderResult.data as { data?: Order; meta?: any };
      const data = apiResponse.data;
      if (data) {
        setOrderDetail(data);
        setOrderDetailError(null);
        // Initialize waypoint sequences from order
        if (data.order_waypoints && data.order_waypoints.length > 0) {
          setWaypointSequences(
            data.order_waypoints.map((wp: any) => ({
              order_waypoint_id: wp.id,
              sequence_number: wp.sequence_number || 0,
            })),
          );
        }
      }
    }
  }, [showOrderResult]);

  useEffect(() => {
    if (showOrderResult?.isError) {
      setOrderDetailError("Failed to load order details. Please try again.");
    }
  }, [showOrderResult?.isError]);

  const handleSubmit = async () => {
    // Validate
    if (!selectedOrder?.id) {
      alert("Please select an order");
      return;
    }
    if (!driver?.id) {
      alert("Please select a driver");
      return;
    }
    if (!vehicle?.id) {
      alert("Please select a vehicle");
      return;
    }

    // Build payload
    const payload: any = {
      order_id: selectedOrder.id,
      driver_id: driver.id,
      vehicle_id: vehicle.id,
      notes: notes || undefined,
    };

    // For LTL, include waypoint sequences
    if (orderDetail?.order_type === "LTL" && waypointSequences.length > 0) {
      payload.waypoints = waypointSequences;
    }

    setSubmitError(null);
    await create(payload);
  };

  useEffect(() => {
    if (createResult?.isSuccess && !successHandledRef.current) {
      successHandledRef.current = true;
      showToast({
        message: "Trip created successfully",
        type: "success",
      });
      const data = (createResult?.data as any)?.data;
      if (data?.id) {
        navigate(`/a/trips/${data.id}`, { replace: true });
      }
    }
  }, [createResult?.isSuccess]);

  useEffect(() => {
    if (createResult?.isError) {
      setSubmitError(
        "Failed to create trip. Please check your input and try again.",
      );
    }
  }, [createResult?.isError]);

  // Navigation handlers
  const goToStep = (step: Step) => {
    // Validation before proceeding
    if (currentStep === 1 && step === 2) {
      if (!selectedOrder?.id) {
        alert("Please select an order first");
        return;
      }
    }
    if (currentStep === 2 && step === 3) {
      if (!driver?.id || !vehicle?.id) {
        alert("Please select driver and vehicle first");
        return;
      }
      // Skip step 3 for FTL (no sequence editing needed)
      if (orderDetail?.order_type === "FTL") {
        setCurrentStep(4);
        return;
      }
    }
    setCurrentStep(step);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!selectedOrder?.id;
      case 2:
        return !!driver?.id && !!vehicle?.id;
      case 3:
        return waypointSequences.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        title='Create Trip'
        titleClassName='!text-2xl'
        subtitle='Assign driver and vehicle to an order'
      />

      <Page.Body className='flex-1 flex flex-col min-h-0 overflow-y-auto'>
        {submitError && (
          <div className='alert alert-error mx-6 mt-4'>
            <span>{submitError}</span>
          </div>
        )}
        {orderDetailError && (
          <div className='alert alert-warning mx-6 mt-4'>
            <span>{orderDetailError}</span>
          </div>
        )}
        <div className='w-full p-6 pb-20'>
          <div className='max-w-4xl mx-auto'>
            {/* Steps Indicator */}
            <div className='mb-8'>
              <div className='flex items-center justify-center gap-2'>
                {[1, 2, 3, 4]
                  .filter(
                    (step) =>
                      !(step === 3 && orderDetail?.order_type === "FTL"),
                  )
                  .map((step, index, filteredSteps) => {
                    const isFTL = orderDetail?.order_type === "FTL";

                    // For FTL, renumber step 4 → 3
                    const displayStep = isFTL && step === 4 ? 3 : step;
                    const actualStep = step;

                    const isCompleted = currentStep > actualStep;
                    const isCurrent = currentStep === actualStep;

                    // Show connector after step (except last visible step)
                    const showConnector = index < filteredSteps.length - 1;

                    return (
                      <div key={step} className='flex items-center'>
                        <div className='flex flex-col items-center'>
                          <div
                            className={`
                              w-10 h-10 rounded-full flex items-center justify-center font-semibold
                              ${
                                isCompleted
                                  ? "bg-success text-white"
                                  : isCurrent
                                    ? "bg-primary text-white"
                                    : "bg-base-300 text-base-content/60"
                              }
                            `}
                          >
                            {isCompleted ? "✓" : displayStep}
                          </div>
                          <span
                            className={`
                              text-xs mt-2 font-medium whitespace-nowrap
                              ${isCurrent ? "text-primary" : "text-base-content/60"}
                            `}
                          >
                            {displayStep === 1 && "Select Order"}
                            {displayStep === 2 && "Assign Resources"}
                            {displayStep === 3 &&
                              (isFTL ? "Confirm" : "Waypoint Sequence")}
                            {displayStep === 4 && "Confirm"}
                          </span>
                        </div>
                        {showConnector && (
                          <div className='w-32 h-1 bg-base-300 rounded' />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Step Content */}
            <div className='bg-base-100 rounded-xl shadow-sm p-6'>
              {/* Step 1: Select Order */}
              {currentStep === 1 && (
                <TripStep1SelectOrder
                  selectedOrder={selectedOrder}
                  onOrderChange={setSelectedOrder}
                  onReset={() => {
                    setOrderDetail(null);
                    setDriver(null);
                    setVehicle(null);
                    setNotes("");
                  }}
                  getOrdersResult={getOrdersResult}
                  onFetchOrders={(page, search) =>
                    getOrders({
                      status: "pending",
                      search,
                      page,
                      limit: 20,
                    })
                  }
                />
              )}

              {/* Step 2: Assign Resources */}
              {currentStep === 2 && (
                <TripStep2AssignResources
                  driver={driver}
                  vehicle={vehicle}
                  notes={notes}
                  onChange={({ driver, vehicle, notes }) => {
                    setDriver(driver);
                    setVehicle(vehicle);
                    setNotes(notes);
                  }}
                  FormState={FormState}
                />
              )}

              {/* Step 3: Waypoint Sequence (LTL only) */}
              {currentStep === 3 && orderDetail?.order_type === "LTL" && (
                <TripStep3WaypointSequence
                  orderType={orderDetail.order_type}
                  orderWaypoints={orderDetail.order_waypoints || []}
                  waypointSequences={waypointSequences}
                  onSequencesChange={setWaypointSequences}
                />
              )}

              {/* Step 4: Confirm */}
              {currentStep === 4 && (
                <TripStep4Confirm
                  selectedOrder={selectedOrder}
                  orderDetail={orderDetail}
                  driver={driver}
                  vehicle={vehicle}
                  notes={notes}
                  orderType={orderDetail?.order_type || "LTL"}
                  waypointSequences={waypointSequences}
                />
              )}

              {/* Navigation Buttons */}
              <div className='flex justify-between mt-6 pt-6 border-t border-base-content/10'>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    if (currentStep === 1) {
                      navigate("/a/trips");
                    } else {
                      goToStep((currentStep - 1) as Step);
                    }
                  }}
                >
                  {currentStep === 1 ? "Cancel" : "Back"}
                </Button>

                {currentStep < 4 && (
                  <Button
                    type='button'
                    variant='primary'
                    onClick={() => goToStep((currentStep + 1) as Step)}
                    disabled={!isStepValid()}
                  >
                    {orderDetail?.order_type === "FTL" && currentStep === 2
                      ? "Review"
                      : "Next"}
                  </Button>
                )}

                {currentStep === 4 && (
                  <Button
                    type='button'
                    variant='primary'
                    onClick={handleSubmit}
                    isLoading={createResult?.isLoading}
                  >
                    Create Trip
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Page.Body>
    </Page>
  );
};

export default TripCreatePage;
