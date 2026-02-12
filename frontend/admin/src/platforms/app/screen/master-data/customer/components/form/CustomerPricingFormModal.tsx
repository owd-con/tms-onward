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
import { usePricingMatrix } from "@/services/pricingMatrix/hooks";
import type { PricingMatrix, RegionSearchResult } from "@/services/types";
import { getDisplayPath } from "@/utils/common";

interface CustomerPricingFormModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  mode: "create" | "update";
  data?: PricingMatrix;
  customerId: string;
}

const CustomerPricingFormModal = forwardRef<
  unknown,
  CustomerPricingFormModalProps
>(({ onClose, onSuccess, mode = "create", data, customerId }, ref) => {
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();

  const { create, update, createResult, updateResult } = usePricingMatrix();

  const [selectedOriginRegion, setSelectedOriginRegion] =
    useState<RegionSearchResult | null>(null);
  const [selectedDestinationRegion, setSelectedDestinationRegion] =
    useState<RegionSearchResult | null>(null);
  const [originRegionId, setOriginRegionId] = useState("");
  const [destinationRegionId, setDestinationRegionId] = useState("");
  const [price, setPrice] = useState("");

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  const buildPayload = () => ({
    customer_id: customerId,
    origin_city_id: originRegionId,
    destination_city_id: destinationRegionId,
    price: parseFloat(price),
  });

  const reset = () => {
    setSelectedOriginRegion(null);
    setSelectedDestinationRegion(null);
    setOriginRegionId("");
    setDestinationRegionId("");
    setPrice("");
  };

  useImperativeHandle(ref, () => ({
    buildPayload,
    reset,
  }));

  useEffect(() => {
    successHandledRef.current = false;

    if (mode === "create") {
      reset();
    } else if (mode === "update" && data) {
      // Convert Region to RegionSearchResult if present
      if (data.origin_region) {
        const originRegionResult: RegionSearchResult = {
          id: data.origin_region.id,
          code: data.origin_region.code,
          name: data.origin_region.name,
          type: data.origin_region.type,
          administrative_area: data.origin_region.administrative_area,
          level: data.origin_region.level,
          parent_id: data.origin_region.parent_id,
          postal_code: data.origin_region.postal_code,
          latitude: data.origin_region.latitude,
          longitude: data.origin_region.longitude,
        };
        setSelectedOriginRegion(originRegionResult);
      } else {
        setSelectedOriginRegion(null);
      }

      if (data.destination_region) {
        const destRegionResult: RegionSearchResult = {
          id: data.destination_region.id,
          code: data.destination_region.code,
          name: data.destination_region.name,
          type: data.destination_region.type,
          administrative_area: data.destination_region.administrative_area,
          level: data.destination_region.level,
          parent_id: data.destination_region.parent_id,
          postal_code: data.destination_region.postal_code,
          latitude: data.destination_region.latitude,
          longitude: data.destination_region.longitude,
        };
        setSelectedDestinationRegion(destRegionResult);
      } else {
        setSelectedDestinationRegion(null);
      }

      setOriginRegionId(data.origin_region?.id || data.origin_city_id || "");
      setDestinationRegionId(
        data.destination_region?.id || data.destination_city_id || "",
      );
      setPrice(data.price?.toString() ?? "");
    }
  }, [mode, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();

    if (mode === "create") {
      await create(payload);
    } else {
      await update({ id: data!.id, payload });
    }
  };

  useEffect(() => {
    const isSuccess = createResult?.isSuccess || updateResult?.isSuccess;

    // Hanya handle jika belum pernah handle untuk success ini
    if (isSuccess && !successHandledRef.current) {
      successHandledRef.current = true;

      if (createResult?.isSuccess) {
        showToast({ message: "Pricing created successfully", type: "success" });
      } else if (updateResult?.isSuccess) {
        showToast({ message: "Pricing updated successfully", type: "success" });
      }
      onSuccess?.();
      onClose();
    }
  }, [createResult, updateResult]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const isFormValid = originRegionId && destinationRegionId && price !== "";
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
          {mode === "create" ? "Add Customer Pricing" : "Edit Customer Pricing"}
        </div>
        <div className='text-sm text-base-content/60'>
          {mode === "create"
            ? "Fill in the pricing information for this customer"
            : "Update pricing information"}
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className='max-h-[60vh] overflow-y-auto'>
          <div className='space-y-4'>
            <div>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                Pricing Information
              </h3>

              <RegionSearchInput
                label='Origin City/Region'
                value={selectedOriginRegion}
                onChange={(id, region) => {
                  setOriginRegionId(id);
                  setSelectedOriginRegion(region);
                }}
                placeholder="Search origin (e.g., 'Jakarta Selatan')"
                required
              />

              <RegionSearchInput
                label='Destination City/Region'
                value={selectedDestinationRegion}
                onChange={(id, region) => {
                  setDestinationRegionId(id);
                  setSelectedDestinationRegion(region);
                }}
                placeholder="Search destination (e.g., 'Surabaya')"
                required
              />

              <Input
                label='Price (IDR)'
                placeholder='0'
                type='number'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={FormState?.errors?.price as string}
                required
                min={0}
                step='1'
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
              {mode === "create" ? "Create Pricing" : "Update Pricing"}
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal.Wrapper>
  );
});

// Named export (no displayName needed in modern React)
export { CustomerPricingFormModal };
export default CustomerPricingFormModal;
