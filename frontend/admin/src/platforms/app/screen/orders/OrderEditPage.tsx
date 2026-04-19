/* eslint-disable react-hooks/exhaustive-deps */
import { useOrder } from "@/services/order/hooks";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { Database } from "lucide-react";
import { Page } from "../../components/layout";
import {
  FormGeneral,
  type OrderFormValues,
  type FormGeneralRef,
} from "./components/form/formGeneral";
import {
  FormShipment,
  type ShipmentFormData,
  type FormShipmentRef,
} from "./components/form/formShipment";

/**
 * TMS Onward - Order Edit Page
 *
 * Allows editing of order information and shipments.
 * Only orders with Pending status can be edited.
 */
const OrderEditPage = () => {
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();
  const { show, showResult, update, updateResult } = useOrder();

  // Refs for form components
  const formGeneralRef = useRef<FormGeneralRef>(null);
  const formShipmentRef = useRef<FormShipmentRef>(null);

  // Track form values from FormGeneral
  const [formValues, setFormValues] = useState<OrderFormValues>({
    selectedCustomer: null,
    orderType: { label: "FTL (Full Truck Load)", value: "FTL" },
    referenceCode: "",
    specialInstructions: "",
    manualOverridePrice: "",
  });

  // Track shipments from FormShipment
  const [shipments, setShipments] = useState<ShipmentFormData[]>([]);

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
        orderType: data?.order_type === "LTL"
          ? { label: "LTL (Less Than Truck Load)", value: "LTL" }
          : { label: "FTL (Full Truck Load)", value: "FTL" },
        referenceCode: data?.reference_code || "",
        specialInstructions: data?.special_instructions || "",
        manualOverridePrice: data?.manual_override_price?.toString() || "",
      };
      setFormValues(initialValues);

      // Update FormGeneral via ref
      if (formGeneralRef.current?.setValues) {
        formGeneralRef.current.setValues(initialValues);
      }

      // Parse and populate shipments
      if (data?.shipments && Array.isArray(data.shipments)) {
        const parsedShipments = data.shipments.map(
          (shp: any, index: number) => {
            // Parse items JSON
            let items: Array<{
              name: string;
              quantity: number;
              weight?: number;
              sku?: string;
            }> = [];
            try {
              if (typeof shp.items === "string") {
                items = JSON.parse(shp.items);
              } else if (Array.isArray(shp.items)) {
                items = shp.items;
              }
            } catch (e) {
              console.error("Failed to parse items:", e);
            }

            return {
              id: `shp-${shp.id || Date.now()}-${index}`,
              shipmentId: shp.id,
              origin_address_id: shp.origin_address_id,
              origin_address: shp.origin_address_rel,
              destination_address_id: shp.destination_address_id,
              destination_address: shp.destination_address_rel,
              pickup_scheduled_date: shp.scheduled_pickup_date
                ? dayjs(shp.scheduled_pickup_date).format("YYYY-MM-DD")
                : dayjs().format("YYYY-MM-DD"),
              pickup_scheduled_time: shp.scheduled_pickup_time || "",
              delivery_scheduled_date: shp.scheduled_delivery_date
                ? dayjs(shp.scheduled_delivery_date).format("YYYY-MM-DD")
                : dayjs().format("YYYY-MM-DD"),
              delivery_scheduled_time: shp.scheduled_delivery_time || "",
              price: shp.price || undefined,
              items:
                items.length > 0
                  ? items
                  : [{ name: "", quantity: 1, weight: 0 }],
              sorting_id: shp.sorting_id || index + 1,
              reference_code: shp.reference_code || "",
            } as ShipmentFormData;
          },
        );

        setShipments(parsedShipments);

        // Update FormShipment via ref
        if (formShipmentRef.current?.setShipments) {
          formShipmentRef.current.setShipments(parsedShipments);
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

    // Get shipments from FormShipment
    const currentShipments = formShipmentRef.current?.getShipments() || [];

    // Build payload
    const payload = {
      customer_id: values?.selectedCustomer?.id,
      reference_code: values?.referenceCode,
      special_instructions: values?.specialInstructions,
      manual_override_price:
        values?.orderType?.value === "FTL" && values?.manualOverridePrice
          ? parseFloat(values.manualOverridePrice)
          : undefined,
      shipments: currentShipments.map((shp) => ({
        id: shp.shipmentId, // Include ID for existing shipments
        reference_code: shp.reference_code || undefined,
        origin_address_id: shp.origin_address_id!,
        destination_address_id: shp.destination_address_id!,
        pickup_scheduled_date: shp.pickup_scheduled_date,
        pickup_scheduled_time: shp.pickup_scheduled_time
          ? shp.pickup_scheduled_time
          : undefined,
        delivery_scheduled_date: shp.delivery_scheduled_date,
        delivery_scheduled_time: shp.delivery_scheduled_time
          ? shp.delivery_scheduled_time
          : undefined,
        price: shp.price,
        items: shp.items?.filter((item) => item.name?.trim()) || [],
      })),
    };

    if (orderId) {
      await update({ id: orderId, payload });
    }
  };

  // Clear shipments handler for FormGeneral
  const handleClearShipments = () => {
    formShipmentRef.current?.clearShipments();
  };

  if (!orderData) {
    return (
      <Page>
        <Page.Header 
          pillLabel="OPERATIONS"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title='Edit Order Configuration' 
          titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1' 
        />
        <Page.Body>
          <div className='flex justify-center items-center h-64'>
            <div className='loading loading-spinner loading-lg'></div>
          </div>
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        pillLabel="OPERATIONS"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title='Edit Order Configuration'
        titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        subtitle={`Order Reference: ${orderData.order_number}`}
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
      />

      <Page.Body className='flex-1 flex flex-col min-h-0 overflow-y-auto'>
        <div className='w-full p-6 pb-20'>
          <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Left Column - Order Information */}
              <FormGeneral
                ref={formGeneralRef}
                onValuesChange={setFormValues}
                onCancel={() => navigate(`/a/orders/${orderId}`)}
                isLoading={updateResult?.isLoading}
                onClearWaypoints={handleClearShipments}
                onSubmit={handleSubmit}
                initialValues={formValues}
                readOnlyFields={{
                  orderNumber: orderData.order_number,
                  status: orderData.status,
                }}
                submitLabel='Save Changes'
              />

              {/* Right Column - Shipments Section */}
              <FormShipment
                ref={formShipmentRef}
                orderType={formValues.orderType?.value}
                selectedCustomerId={formValues.selectedCustomer?.id}
                onValuesChange={setShipments}
                initialShipments={shipments}
              />
            </div>
          </div>
        </div>
      </Page.Body>
    </Page>
  );
};

export default OrderEditPage;
