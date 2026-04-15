import { Button, Input, RemoteSelect } from "@/components";
import type { RootState } from "@/services/store";
import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useSelector } from "react-redux";
import CustomerSelector from "./CustomerSelector";

export interface OrderFormValues {
  selectedCustomer: any;
  orderType: { label: string; value: "FTL" | "LTL" };
  referenceCode: string;
  specialInstructions: string;
  manualOverridePrice: string;
}

export interface FormGeneralRef {
  getValues: () => OrderFormValues;
  setValues?: (values: OrderFormValues) => void;
}

interface ReadOnlyFields {
  orderNumber?: string;
  status?: string;
}

interface FormGeneralProps {
  onValuesChange?: (values: OrderFormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
  onClearWaypoints?: () => void;
  onSubmit?: () => void;
  // Edit mode props
  initialValues?: OrderFormValues;
  readOnlyFields?: ReadOnlyFields;
  submitLabel?: string;
}

/**
 * OrderCreatePage - Form General Component
 *
 * Contains the Order Information section (left column)
 * Manages its own state for order information
 * Supports both create and edit modes
 */
export const FormGeneral = forwardRef<FormGeneralRef, FormGeneralProps>(
  (
    {
      onValuesChange,
      onCancel,
      isLoading,
      onClearWaypoints,
      onSubmit,
      initialValues,
      readOnlyFields,
      submitLabel = "Create Order",
    },
    ref,
  ) => {
    const Profile = useSelector((state: RootState) => state.userProfile);
    const FormState = useSelector((state: RootState) => state.form);

    // Check if company is inhouse type
    const isInhouseCompany = Profile?.user?.company?.type === "inhouse";

    // Order form state (managed internally)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(
      initialValues?.selectedCustomer || null,
    );

    const orderTypeOptions: Array<{ label: string; value: "FTL" | "LTL" }> = [
      { label: "FTL (Full Truck Load)", value: "FTL" },
      { label: "LTL (Less Than Truck Load)", value: "LTL" },
    ];

    const [orderType, setOrderType] = useState<{
      label: string;
      value: "FTL" | "LTL";
    }>(() => {
      if (initialValues?.orderType) {
        // initialValues.orderType is already an object
        return initialValues.orderType;
      }
      return (
        orderTypeOptions.find((opt) => opt.value === "FTL") ||
        orderTypeOptions[0]
      );
    });
    const [referenceCode, setReferenceCode] = useState(
      initialValues?.referenceCode || "",
    );
    const [specialInstructions, setSpecialInstructions] = useState(
      initialValues?.specialInstructions || "",
    );
    const [manualOverridePrice, setManualOverridePrice] = useState(
      initialValues?.manualOverridePrice || "",
    );

    const isEditMode = !!readOnlyFields;

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      getValues: () => ({
        selectedCustomer,
        orderType,
        referenceCode,
        specialInstructions,
        manualOverridePrice,
      }),
      setValues: (values) => {
        if (values.selectedCustomer)
          setSelectedCustomer(values.selectedCustomer);
        if (values.orderType) setOrderType(values.orderType);
        if (values.referenceCode !== undefined)
          setReferenceCode(values.referenceCode);
        if (values.specialInstructions !== undefined)
          setSpecialInstructions(values.specialInstructions);
        if (values.manualOverridePrice !== undefined)
          setManualOverridePrice(values.manualOverridePrice);
      },
    }));

    // Notify parent when values change
    useEffect(() => {
      onValuesChange?.({
        selectedCustomer,
        orderType,
        referenceCode,
        specialInstructions,
        manualOverridePrice,
      });
    }, [
      selectedCustomer,
      orderType,
      referenceCode,
      specialInstructions,
      manualOverridePrice,
      onValuesChange,
    ]);

    const handleCustomerChange = (customer: any) => {
      setSelectedCustomer(customer);
      // Clear address selections when customer changes
      onClearWaypoints?.();
    };

    return (
      <div className='lg:col-span-1'>
        <div className='bg-white rounded-xl p-6 shadow-sm sticky top-0'>
          <h3 className='text-lg font-semibold mb-4'>Order Information</h3>

          <div className='space-y-4'>
            {/* Customer Selection - hide for inhouse company */}
            {!isInhouseCompany && (
              <CustomerSelector
                value={selectedCustomer?.id}
                onChange={(customer) => handleCustomerChange(customer)}
                onClear={() => {
                  setSelectedCustomer(null);
                  onClearWaypoints?.();
                }}
                error={FormState?.errors?.customer_id as string}
                required
                customer={selectedCustomer}
              />
            )}

            {/* Order Type - readonly for update mode */}
            <RemoteSelect
              label='Order Type'
              value={orderType}
              onChange={(value) => setOrderType(value)}
              data={orderTypeOptions}
              getLabel={(item) => item.label}
              getValue={(item) => item.value}
              required
              disabled={isEditMode}
            />

            {/* Reference Code */}
            <Input
              label='Reference Code'
              placeholder="Customer's reference number"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              error={FormState?.errors?.reference_code as string}
            />

            {/* Special Instructions */}
            <Input
              label='Special Instructions'
              placeholder='Any special instructions for this order'
              type='textarea'
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              error={FormState?.errors?.special_instructions as string}
            />

            {/* Manual Price (FTL only) */}
            {orderType.value === "FTL" && (
              <Input
                label='Price'
                placeholder='Enter price'
                type='number'
                prefix='Rp'
                value={manualOverridePrice}
                onChange={(e) => setManualOverridePrice(e.target.value)}
                error={FormState?.errors?.manual_override_price as string}
                hint='Enter the delivery price for this FTL order'
              />
            )}

            {/* Actions */}
            <div className='flex gap-3 pt-4 border-t border-base-200'>
              <Button
                type='button'
                variant='secondary'
                onClick={onCancel}
                className='flex-1'
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='primary'
                onClick={onSubmit}
                isLoading={isLoading}
                className='flex-1'
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

FormGeneral.displayName = "FormGeneral";
