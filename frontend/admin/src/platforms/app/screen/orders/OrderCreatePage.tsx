/* eslint-disable react-hooks/exhaustive-deps */
import { useOrder } from "@/services/order/hooks";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database } from "lucide-react";
import { Page } from "../../components/layout";
import { useEnigmaUI } from "@/components";
import {
  FormGeneral,
  type OrderFormValues,
  type FormGeneralRef,
} from "./components/form/formGeneral";
import {
  FormShipment,
  type FormShipmentRef,
} from "./components/form/formShipment";

/**
 * TMS Onward - Order Create Page
 */
const OrderCreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useEnigmaUI();
  const { create, createResult } = useOrder();

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

  const handleSubmit = async () => {
    // Get values from FormGeneral
    const values = formGeneralRef.current?.getValues();

    // Get shipments from FormShipment
    const currentShipments = formShipmentRef.current?.getShipments() || [];

    // Build payload
    const payload = {
      customer_id: values?.selectedCustomer?.id,
      order_type: values?.orderType?.value,
      reference_code: values?.referenceCode,
      special_instructions: values?.specialInstructions,
      manual_override_price:
        values?.orderType?.value === "FTL" && values?.manualOverridePrice
          ? parseFloat(values.manualOverridePrice)
          : undefined,
      shipments: currentShipments.map((shp) => ({
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

  // Clear shipments handler for FormGeneral
  const handleClearShipments = () => {
    formShipmentRef.current?.clearShipments();
  };

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        pillLabel="OPERATIONS"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title='Create Order'
        titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        subtitle='Configure a new customer order and assign initial shipments.'
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
                onCancel={() => navigate("/a/orders")}
                isLoading={createResult?.isLoading}
                onClearWaypoints={handleClearShipments}
                onSubmit={handleSubmit}
              />

              {/* Right Column - Shipments Section */}
              <FormShipment
                ref={formShipmentRef}
                orderType={formValues.orderType?.value}
                selectedCustomerId={formValues.selectedCustomer?.id}
              />
            </div>
          </div>
        </div>
      </Page.Body>
    </Page>
  );
};

export default OrderCreatePage;
