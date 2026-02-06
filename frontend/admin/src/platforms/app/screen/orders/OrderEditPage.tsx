/* eslint-disable react-hooks/exhaustive-deps */
import { useOrder } from "@/services/order/hooks";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { Page } from "../../components/layout";
import { FormGeneral, type OrderFormValues, type FormGeneralRef } from "./components/form/formGeneral";
import { FormWaypoint, type WaypointFormData, type FormWaypointRef } from "./components/form/formWaypoint";

/**
 * TMS Onward - Order Edit Page
 *
 * Allows editing of order information and waypoints.
 * Only orders with Pending status can be edited.
 */
const OrderEditPage = () => {
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();
  const { show, showResult, update, updateResult } = useOrder();

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

  // Order data from API
  const [orderData, setOrderData] = useState<any>(null);

  // Load order detail
  useEffect(() => {
    if (orderId) {
      show({ id: orderId });
    }
  }, [orderId, show]);

  // Populate form when order data is loaded
  useEffect(() => {
    if (showResult?.isSuccess && showResult?.data) {
      const data = (showResult?.data as any)?.data;
      setOrderData(data);

      // Set form values
      const initialValues: OrderFormValues = {
        selectedCustomer: data?.customer || null,
        orderType: data?.order_type || "FTL",
        referenceCode: data?.reference_code || "",
        specialInstructions: data?.special_instructions || "",
        manualOverridePrice: data?.manual_override_price?.toString() || "",
      };
      setFormValues(initialValues);

      // Update FormGeneral via ref
      if (formGeneralRef.current?.setValues) {
        formGeneralRef.current.setValues(initialValues);
      }

      // Parse and populate waypoints
      if (data?.order_waypoints && Array.isArray(data.order_waypoints)) {
        const parsedWaypoints = data.order_waypoints.map((wp: any, index: number) => {
          // Parse items JSON
          let items: Array<{ name: string; quantity: number; weight?: number }> = [];
          try {
            if (typeof wp.items === "string") {
              items = JSON.parse(wp.items);
            } else if (Array.isArray(wp.items)) {
              items = wp.items;
            }
          } catch (e) {
            console.error("Failed to parse items:", e);
          }

          return {
            id: `wp-${wp.id || Date.now()}-${index}`,
            waypointId: wp.id, // Keep original ID for update
            type: wp.type as "pickup" | "delivery",
            address_id: wp.address_id,
            address: wp.address, // Include full address object for edit mode
            scheduled_date: wp.scheduled_date
              ? dayjs(wp.scheduled_date).format("YYYY-MM-DD")
              : dayjs().format("YYYY-MM-DD"),
            scheduled_time: wp.scheduled_time || "",
            price: wp.price || undefined,
            items: items.length > 0
              ? items
              : [{ name: "", quantity: 1, weight: 0 }],
            sequence_number: wp.sequence_number || index + 1,
          } as WaypointFormData;
        });

        setWaypoints(parsedWaypoints);

        // Update FormWaypoint via ref
        if (formWaypointRef.current?.setWaypoints) {
          formWaypointRef.current.setWaypoints(parsedWaypoints);
        }
      }
    }
  }, [showResult]);

  // Navigate back after successful update
  useEffect(() => {
    if (updateResult?.isSuccess) {
      navigate(`/a/orders/${orderId}`, { replace: true });
    }
  }, [updateResult?.isSuccess]);

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
      reference_code: values.referenceCode || undefined,
      special_instructions: values.specialInstructions || undefined,
      manual_override_price: values.manualOverridePrice ? parseFloat(values.manualOverridePrice) : undefined,
      waypoints: validWaypoints.map((wp, index) => ({
        id: wp.waypointId, // Include ID for existing waypoints
        type: wp.type,
        address_id: wp.address_id!,
        scheduled_date: wp.scheduled_date,
        scheduled_time: wp.scheduled_time ? `${wp.scheduled_time} +07:00` : undefined,
        price: wp.price || undefined,
        items: wp.items.filter((item) => item.name.trim()),
        sequence_number: values.orderType === "FTL" ? index + 1 : undefined,
      })),
    };

    if (orderId) {
      await update({ id: orderId, payload });
    }
  };

  // Clear waypoints handler for FormGeneral
  const handleClearWaypoints = () => {
    formWaypointRef.current?.clearWaypoints();
  };

  const isFormValid =
    formValues.selectedCustomer && waypoints.filter((wp) => wp.address_id).length >= 2;

  if (!orderData) {
    return (
      <Page>
        <Page.Header title="Edit Order" />
        <Page.Body>
          <div className="flex justify-center items-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        title="Edit Order"
        titleClassName="!text-2xl"
        subtitle={orderData.order_number}
      />

      <Page.Body className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="w-full p-6 pb-20">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Order Information */}
              <FormGeneral
                ref={formGeneralRef}
                onValuesChange={setFormValues}
                onCancel={() => navigate(`/a/orders/${orderId}`)}
                isFormValid={isFormValid}
                isLoading={updateResult?.isLoading}
                onClearWaypoints={handleClearWaypoints}
                onSubmit={handleSubmit}
                initialValues={formValues}
                readOnlyFields={{
                  orderNumber: orderData.order_number,
                  status: orderData.status,
                }}
                submitLabel="Save Changes"
              />

              {/* Right Column - Waypoints Section */}
              <FormWaypoint
                ref={formWaypointRef}
                orderType={formValues.orderType}
                selectedCustomerId={formValues.selectedCustomer?.id}
                onValuesChange={setWaypoints}
                initialWaypoints={waypoints}
              />
            </div>
          </div>
        </div>
      </Page.Body>
    </Page>
  );
};

export default OrderEditPage;
