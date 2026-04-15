/* eslint-disable react-hooks/exhaustive-deps */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";

import { Button, Input, Modal, RemoteSelect, useEnigmaUI } from "@/components";
import { RegionSearchInput } from "@/platforms/app/components/region/RegionSearchInput";
import type { SelectOptionValue } from "@/shared/types";
import { addressTypeOptions } from "@/shared/options";
import { useAddress } from "@/services/address/hooks";
import type { Address, RegionSearchResult } from "@/services/types";

// 1. Type definitions untuk ref
export interface AddressFormModalRef {
  buildPayload: () => {
    name: string;
    address: string;
    region_id: string;
    contact_name?: string;
    contact_phone?: string;
    type?: string;
    customer_id?: string;
  };
  reset: () => void;
}

// 2. Props interface
interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newAddress?: Address) => void;
  mode: "create" | "update";
  data?: Address;
  // Optional parameters for different use cases
  customerId?: string; // For customer addresses
  defaultType?: "pickup_point" | "drop_point"; // Default type for create mode
}

// 3. Component dengan forwardRef
const AddressFormModal = forwardRef<AddressFormModalRef, AddressFormModalProps>(
  (
    {
      open,
      onClose,
      onSuccess,
      mode = "create",
      data,
      customerId,
      defaultType,
    },
    ref,
  ) => {
    const FormState = useSelector((state: RootState) => state.form);
    const Profile = useSelector((state: RootState) => state.userProfile);
    const { showToast } = useEnigmaUI();

    // Check if company is inhouse type
    const isInhouseCompany = Profile?.user?.company?.type === "inhouse";

    // 4. Gunakan hook untuk CRUD operations
    const { create, update, createResult, updateResult } = useAddress();

    // Track success agar hanya handle sekali per submit
    const successHandledRef = useRef(false);

    // 5. State management untuk form fields
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [contactName, setContactName] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [regionId, setRegionId] = useState("");
    const [selectedRegion, setSelectedRegion] =
      useState<RegionSearchResult | null>(null);
    const [type, setType] = useState<SelectOptionValue | null>(null);

    // 6. Build payload method
    const buildPayload = () => {
      const payload: {
        name: string;
        address: string;
        region_id: string;
        contact_name?: string;
        contact_phone?: string;
        type?: string;
        customer_id?: string;
      } = {
        name,
        address,
        region_id: regionId,
      };

      if (contactName) payload.contact_name = contactName;
      if (contactPhone) payload.contact_phone = contactPhone;
      if (isInhouseCompany && type?.value) payload.type = String(type.value);
      if (customerId) payload.customer_id = customerId;

      return payload;
    };

    // 7. Expose methods via ref
    useImperativeHandle(ref, () => ({
      buildPayload,
      reset: () => {
        setName("");
        setAddress("");
        setContactName("");
        setContactPhone("");
        setRegionId("");
        setSelectedRegion(null);
        setType(null);
      },
    }));

    // 8. Reset form when data changes or modal opens
    useEffect(() => {
      if (open) {
        if (data && mode === "update") {
          setName(data.name);
          setAddress(data.address);
          setContactName(data.contact_name || "");
          setContactPhone(data.contact_phone || "");
          setRegionId(data.region_id || "");

          if (isInhouseCompany) {
            setType(
              addressTypeOptions.find((opt) => opt.value === data.type) || null,
            );
          }

          // Convert Region to RegionSearchResult if present
          if (data.region) {
            const regionSearchResult: RegionSearchResult = {
              id: data.region.id,
              code: data.region.code,
              name: data.region.name,
              type: data.region.type,
              administrative_area: data.region.administrative_area,
              level: data.region.level,
              parent_id: data.region.parent_id,
              postal_code: data.region.postal_code,
              latitude: data.region.latitude,
              longitude: data.region.longitude,
            };
            setSelectedRegion(regionSearchResult);
          } else {
            setSelectedRegion(null);
          }
        } else {
          // Reset for create mode
          setName("");
          setAddress("");
          setContactName("");
          setContactPhone("");
          setRegionId("");
          setSelectedRegion(null);

          if (isInhouseCompany) {
            setType(
              addressTypeOptions.find((opt) => opt.value === defaultType) ||
                null,
            );
          }
        }
        successHandledRef.current = false;
      }
    }, [open, data, mode]);

    // 9. Handle form submission
    const handleSubmit = async () => {
      const payload = buildPayload();

      try {
        if (mode === "update" && data) {
          await update({ id: data.id, payload });
        } else {
          await create(payload);
        }
      } catch (error) {
        console.error("Failed to save address:", error);
      }
    };

    // 10. Handle success response
    useEffect(() => {
      if (
        (createResult?.isSuccess || updateResult?.isSuccess) &&
        !successHandledRef.current
      ) {
        successHandledRef.current = true;
        showToast({
          message:
            mode === "update"
              ? "Address updated successfully"
              : "Address created successfully",
          type: "success",
        });
        // Get the created/updated address from the response
        const newAddress =
          mode === "create" ? (createResult?.data as any)?.data : data;
        onSuccess?.(newAddress);
        onClose();
      }
    }, [createResult?.isSuccess, updateResult?.isSuccess]);

    // Handle region change
    const handleRegionChange = (id: string, region: RegionSearchResult) => {
      setRegionId(id);
      setSelectedRegion(region);
    };

    const isLoading = createResult?.isLoading || updateResult?.isLoading;

    return (
      <Modal.Wrapper
        open={open}
        onClose={onClose}
        closeOnOutsideClick={false}
        className='!max-w-3xl !w-11/12 mx-4'
      >
        <Modal.Header className='mb-4'>
          <div className='text-secondary font-bold leading-7 text-lg'>
            {mode === "update" ? "Edit Address" : "Add New Address"}
          </div>
          <div className='text-sm text-base-content/60 leading-5 font-normal'>
            {mode === "update"
              ? "Update address information"
              : "Create a new location and contact record"}
          </div>
        </Modal.Header>

        <Modal.Body className='max-h-[75vh] overflow-y-auto px-2 pb-6'>
          <div className='space-y-6 pt-2'>
            {/* GROUP 1: Address Details */}
            <div className='bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
              <div className='mb-5 border-b border-slate-200/60 pb-3'>
                <h3 className='text-[15px] font-bold text-slate-800'>
                  Address Location
                </h3>
                <p className='text-xs text-slate-500 mt-1'>
                  Naming and precise physical location definitions
                </p>
              </div>

              <div className='grid grid-cols-1 gap-5'>
                {/* Type Select (only for inhouse without defaultType) - inline */}
                {isInhouseCompany && !defaultType && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                    <div>
                      <label className='text-slate-600 text-[10px] leading-[1.2] uppercase font-semibold tracking-[.6px]'>
                        Type
                      </label>
                      <RemoteSelect<SelectOptionValue>
                        value={type}
                        onChange={setType}
                        data={addressTypeOptions}
                        getLabel={(item) => item?.label ?? ""}
                        renderItem={(item) => item?.label}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                  <Input
                    label='Address Label'
                    placeholder='e.g., Warehouse, Branch, Office'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={FormState?.errors?.name as string}
                    required
                  />

                  <RegionSearchInput
                    label='Administrative Location'
                    value={selectedRegion}
                    onChange={handleRegionChange}
                    placeholder='Search region (e.g., Jakarta Selatan)'
                    error={FormState?.errors?.region_id as string}
                    required
                  />
                </div>

                <Input
                  label='Street Address'
                  placeholder='Complete street name, building number, block, etc.'
                  type='textarea'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  error={FormState?.errors?.address as string}
                  required
                />
              </div>
            </div>

            {/* GROUP 3: On-Site Contact */}
            <div className='bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
              <div className='mb-5 border-b border-slate-200/60 pb-3'>
                <h3 className='text-[15px] font-bold text-slate-800'>
                  On-Site Contact
                </h3>
                <p className='text-xs text-slate-500 mt-1'>
                  Primary personnel stationed at this location
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <Input
                  label='PIC Name'
                  placeholder='Person in charge'
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  error={FormState?.errors?.contact_name as string}
                  required
                />

                <Input
                  label='Contact Phone'
                  placeholder='Phone number'
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  error={FormState?.errors?.contact_phone as string}
                  required
                />
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className='flex justify-end gap-3'>
            <Button
              type='button'
              variant='secondary'
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='primary'
              isLoading={isLoading}
              onClick={handleSubmit}
            >
              {mode === "update" ? "Save Changes" : "Create Address"}
            </Button>
          </div>
        </Modal.Footer>
      </Modal.Wrapper>
    );
  },
);

export default AddressFormModal;
