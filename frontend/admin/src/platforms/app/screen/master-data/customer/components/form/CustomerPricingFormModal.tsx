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

  const isLoading = createResult?.isLoading || updateResult?.isLoading;

  return (
    <Modal.Wrapper
      open
      onClose={handleClose}
      closeOnOutsideClick={false}
      className='!max-w-3xl !w-11/12 mx-4'
    >
      <Modal.Header className='mb-4'>
        <div className='text-secondary font-bold leading-7 text-lg'>
          {mode === "create" ? "Add Customer Pricing" : "Edit Customer Pricing"}
        </div>
        <div className='text-sm text-base-content/60 leading-5 font-normal'>
          {mode === "create"
            ? "Define dedicated route pricing for this customer"
            : "Update existing route pricing rules"}
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className='max-h-[75vh] overflow-y-auto px-2 pb-6'>
          <div className='space-y-6 pt-2'>

            {/* GROUP 1: Route Setup */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="mb-5 border-b border-slate-200/60 pb-3">
                <h3 className="text-[15px] font-bold text-slate-800">Route Definition</h3>
                <p className="text-xs text-slate-500 mt-1">Specify origin and destination coverage for this pricing logic</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <RegionSearchInput
                  label='Origin City/Region'
                  value={selectedOriginRegion}
                  onChange={(id, region) => {
                    setOriginRegionId(id);
                    setSelectedOriginRegion(region);
                  }}
                  placeholder="Search origin (e.g., 'Jakarta')"
                  filterType="regency"
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
                  filterType="regency"
                  required
                />
              </div>
            </div>

            {/* GROUP 2: Pricing Details */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="mb-5 border-b border-slate-200/60 pb-3">
                <h3 className="text-[15px] font-bold text-slate-800">Pricing Matrix</h3>
                <p className="text-xs text-slate-500 mt-1">Configure financial rates for the specified route</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-1">
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
            >
              {mode === "create" ? "Create Pricing" : "Save Changes"}
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
