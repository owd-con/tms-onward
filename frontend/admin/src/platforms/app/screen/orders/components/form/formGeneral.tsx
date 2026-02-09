import { Button, Input, RemoteSelect, Select } from "@/components";
import { useCustomer } from "@/services/customer/hooks";
import type { RootState } from "@/services/store";
import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useSelector } from "react-redux";

export interface OrderFormValues {
  selectedCustomer: any;
  orderType: "FTL" | "LTL";
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
  isFormValid: boolean;
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
      isFormValid,
      isLoading,
      onClearWaypoints,
      onSubmit,
      initialValues,
      readOnlyFields,
      submitLabel = "Create Order",
    },
    ref,
  ) => {
    const FormState = useSelector((state: RootState) => state.form);

    // Fetch customers for dropdown
    const { get: getCustomers, getResult } = useCustomer();

    useEffect(() => {
      getCustomers({ page: 1, limit: 20, status: "active" });
    }, []);

    // Order form state (managed internally)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(
      initialValues?.selectedCustomer || null,
    );
    const [orderType, setOrderType] = useState<"FTL" | "LTL">(
      initialValues?.orderType || "FTL",
    );
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
            {/* Read-only fields for edit mode */}
            {isEditMode && readOnlyFields && (
              <div className='space-y-3 pb-4 border-b border-base-200'>
                {readOnlyFields.orderNumber && (
                  <div>
                    <span className='text-xs text-base-content/60 block'>
                      Order Number
                    </span>
                    <span className='font-semibold text-sm'>
                      {readOnlyFields.orderNumber}
                    </span>
                  </div>
                )}
                {readOnlyFields.status && (
                  <div>
                    <span className='text-xs text-base-content/60 block'>
                      Status
                    </span>
                    <span className='badge badge-sm badge-neutral'>
                      {readOnlyFields.status}
                    </span>
                  </div>
                )}
                <div>
                  <span className='text-xs text-base-content/60 block'>
                    Order Type
                  </span>
                  <span className='font-semibold text-sm'>{orderType}</span>
                </div>
              </div>
            )}

            {/* Customer Selection */}
            <RemoteSelect
              label='Customer'
              placeholder='Select Customer'
              value={selectedCustomer}
              onChange={handleCustomerChange}
              onClear={() => {
                setSelectedCustomer(null);
                onClearWaypoints?.();
              }}
              fetchData={(page, search) =>
                getCustomers({ page, limit: 20, search, status: "active" })
              }
              hook={getResult as any}
              getLabel={(item: any) => item.name}
              getValue={(item: any) => item.id}
              error={FormState?.errors?.customer_id as string}
              required
            />

            {/* Order Type - only show in create mode */}
            {!isEditMode && (
              <Select
                label='Order Type'
                options={[
                  { label: "FTL (Full Truck Load)", value: "FTL" },
                  { label: "LTL (Less Than Truck Load)", value: "LTL" },
                ]}
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as "FTL" | "LTL")}
                required
              />
            )}

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

            {/* Manual Override Price (FTL only) */}
            {orderType === "FTL" && (
              <Input
                label='Manual Override Price'
                placeholder='Enter price'
                type='number'
                prefix='Rp'
                value={manualOverridePrice}
                onChange={(e) => setManualOverridePrice(e.target.value)}
                error={FormState?.errors?.manual_override_price as string}
                hint='Auto-filled from pricing matrix. Edit to override.'
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
                disabled={!isFormValid}
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
