/* eslint-disable react-hooks/exhaustive-deps */
import { useOrder } from "@/services/order/hooks";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "../../components/layout";
import { useEnigmaUI } from "@/components";
import { FormGeneral, type OrderFormValues, type FormGeneralRef } from "./components/form/formGeneral";
import { FormWaypoint, type WaypointFormData, type FormWaypointRef } from "./components/form/formWaypoint";

/**
 * TMS Onward - Order Create Page
 */
const OrderCreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useEnigmaUI();
  const { create, createResult } = useOrder();

  // Refs for form components
  const formGeneralRef = useRef<FormGeneralRef>(null);
  const formWaypointRef = useRef<FormWaypointRef>(null);

  // Track form values from FormGeneral
  const [formValues, setFormValues] = useState<OrderFormValues>({
    selectedCustomer: null,
    orderType: "FTL",
    referenceCode: "",
    specialInstructions: "",
    manualOverridePrice: "",
  });

  // Track waypoints from FormWaypoint
  const [waypoints, setWaypoints] = useState<WaypointFormData[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Get values from FormGeneral
    const values = formGeneralRef.current?.getValues();
    if (!values?.selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    // Get waypoints from FormWaypoint
    const currentWaypoints = formWaypointRef.current?.getWaypoints() || [];
    const validWaypoints = currentWaypoints.filter((wp) => wp.address_id);
    if (validWaypoints.length < 2) {
      alert("Please add at least one pickup and one delivery address");
      return;
    }

    // Build payload
    const payload = {
      customer_id: values.selectedCustomer.id,
      order_type: values.orderType,
      reference_code: values.referenceCode || undefined,
      special_instructions: values.specialInstructions || undefined,
      manual_override_price: values.manualOverridePrice
        ? parseFloat(values.manualOverridePrice)
        : undefined,
      waypoints: validWaypoints.map((wp, index) => ({
        type: wp.type,
        address_id: wp.address_id!,
        scheduled_date: wp.scheduled_date,
        scheduled_time: wp.scheduled_time ? `${wp.scheduled_time} +07:00` : undefined,
        price: wp.price || undefined,
        items: wp.items.filter((item) => item.name.trim()),
        sequence_number: values.orderType === "FTL" ? index + 1 : undefined,
      })),
    };

    setSubmitError(null);
    await create(payload);
  };

  useEffect(() => {
    if (createResult?.isSuccess) {
      showToast({
        message: "Order created successfully",
        type: "success",
      });
      const data = (createResult?.data as any)?.data;
      if (data?.id) {
        navigate(`/a/orders/${data.id}`, { replace: true });
      }
    }
  }, [createResult?.isSuccess]);

  useEffect(() => {
    if (createResult?.isError) {
      setSubmitError("Failed to create order. Please check your input and try again.");
    }
  }, [createResult?.isError]);

  // Clear waypoints handler for FormGeneral
  const handleClearWaypoints = () => {
    formWaypointRef.current?.clearWaypoints();
  };

  const isFormValid =
    formValues.selectedCustomer && waypoints.filter((wp) => wp.address_id).length >= 2;

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        title='Create Order'
        titleClassName='!text-2xl'
        subtitle='Create a new order with waypoints'
      />

      <Page.Body className='flex-1 flex flex-col min-h-0 overflow-y-auto'>
        {submitError && (
          <div className='alert alert-error mx-6 mt-4'>
            <span>{submitError}</span>
          </div>
        )}
        <div className='w-full p-6 pb-20'>
          <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Left Column - Order Information */}
              <FormGeneral
                ref={formGeneralRef}
                onValuesChange={setFormValues}
                onCancel={() => navigate("/a/orders")}
                isFormValid={isFormValid}
                isLoading={createResult?.isLoading}
                onClearWaypoints={handleClearWaypoints}
                onSubmit={handleSubmit}
              />

              {/* Right Column - Waypoints Section */}
              <FormWaypoint
                ref={formWaypointRef}
                orderType={formValues.orderType}
                selectedCustomerId={formValues.selectedCustomer?.id}
                onValuesChange={setWaypoints}
              />
            </div>
          </div>
        </div>
      </Page.Body>
    </Page>
  );
};

export default OrderCreatePage;
