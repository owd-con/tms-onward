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

import { Button, Input, Modal, useEnigmaUI } from "@/components";
import { RegionSearchInput } from "@/platforms/app/components/region/RegionSearchInput";
import { useAddress } from "@/services/address/hooks";
import type { Address, RegionSearchResult } from "@/services/types";

// Type definitions
export interface AddressFormModalRef {
  buildPayload: () => {
    name: string;
    address: string;
    region_id: string;
    contact_name?: string;
    contact_phone?: string;
    customer_id: string;
  };
  reset: () => void;
}

interface AddressFormModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  mode: "create" | "update";
  data?: Address;
  customerId: string;
}

// Component definition with forwardRef
const AddressFormModal = forwardRef<AddressFormModalRef, AddressFormModalProps>(
  ({ onClose, onSuccess, mode = "create", data, customerId }, ref) => {
    const FormState = useSelector((state: RootState) => state.form);
    const { showToast } = useEnigmaUI();

    const { create, update, createResult, updateResult } = useAddress();

    // State management
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [contactName, setContactName] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [regionId, setRegionId] = useState("");
    const [selectedRegion, setSelectedRegion] =
      useState<RegionSearchResult | null>(null);

    // Track success agar hanya handle sekali per submit
    const successHandledRef = useRef(false);

    // Build payload method
    const buildPayload = () => {
      return {
        name,
        address,
        region_id: regionId,
        contact_name: contactName || undefined,
        contact_phone: contactPhone || undefined,
        customer_id: customerId,
      };
    };

    // Reset form method
    const reset = () => {
      setName("");
      setAddress("");
      setContactName("");
      setContactPhone("");
      setRegionId("");
      setSelectedRegion(null);
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      buildPayload,
      reset,
    }));

    // Populate/reset form based on mode
    useEffect(() => {
      successHandledRef.current = false;

      if (mode === "create") {
        reset();
      } else if (mode === "update" && data) {
        setName(data.name ?? "");
        setAddress(data.address ?? "");
        setContactName(data.contact_name ?? "");
        setContactPhone(data.contact_phone ?? "");
        setRegionId(data.region_id ?? "");
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
      }
    }, [mode, data]);

    // Form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = buildPayload();

      if (mode === "create") {
        await create(payload);
      } else {
        await update({ id: data!.id, payload });
      }
    };

    // Close modal on success
    useEffect(() => {
      const isSuccess = createResult?.isSuccess || updateResult?.isSuccess;

      // Hanya handle jika belum pernah handle untuk success ini
      if (isSuccess && !successHandledRef.current) {
        successHandledRef.current = true;

        if (createResult?.isSuccess) {
          showToast({
            message: "Address created successfully",
            type: "success",
          });
        } else if (updateResult?.isSuccess) {
          showToast({
            message: "Address updated successfully",
            type: "success",
          });
        }
        onSuccess?.();
        onClose();
      }
    }, [createResult, updateResult]);

    // Handle close with reset
    const handleClose = () => {
      reset();
      onClose();
    };

    // Handle region change
    const handleRegionChange = (id: string, region: RegionSearchResult) => {
      setRegionId(id);
      setSelectedRegion(region);
    };

    // Validation
    const isFormValid =
      name.trim() !== "" && address.trim() !== "" && regionId !== "";
    const isLoading = createResult?.isLoading || updateResult?.isLoading;

    return (
      <Modal.Wrapper
        open
        onClose={handleClose}
        closeOnOutsideClick={false}
        className='max-w-2xl'
      >
        <Modal.Header className='mb-2'>
          <div className='text-xl font-bold'>
            {mode === "create" ? "Add New Address" : "Edit Address"}
          </div>
          <div className='text-sm text-base-content/60'>
            {mode === "create"
              ? "Fill in the address information below"
              : "Update address information"}
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit}>
          <Modal.Body className='max-h-[60vh] overflow-y-auto'>
            <div className='space-y-4'>
              {/* Address Name & Contact */}
              <div>
                <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                  Address Information
                </h3>

                <Input
                  label='Address Label'
                  placeholder='e.g., Warehouse, Branch Office, Home'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={FormState?.errors?.name as string}
                  required
                />

                <Input
                  label='Street Address'
                  placeholder='Street name, building, floor, etc.'
                  type='textarea'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  error={FormState?.errors?.address as string}
                  required
                />

                <div className='grid grid-cols-2 gap-3 mt-3'>
                  <Input
                    label='Contact Name'
                    placeholder='Person to contact'
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

              {/* Location Selection */}
              <div className='mt-3'>
                <RegionSearchInput
                  label='Location'
                  value={selectedRegion}
                  onChange={handleRegionChange}
                  placeholder='Search location (e.g., "Jakarta Selatan", "Tebet")'
                  error={FormState?.errors?.region_id as string}
                  required
                />
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='secondary'
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='primary'
                isLoading={isLoading}
                disabled={!isFormValid}
              >
                {mode === "create" ? "Create Address" : "Update Address"}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Wrapper>
    );
  },
);

export default AddressFormModal;
