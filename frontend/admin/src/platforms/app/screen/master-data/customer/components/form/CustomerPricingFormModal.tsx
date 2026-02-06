/* eslint-disable react-hooks/exhaustive-deps */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";

import { Button, Input, Modal, RemoteSelect, useEnigmaUI } from "@/components";
import { usePricingMatrix } from "@/services/pricingMatrix/hooks";
import { useGeo } from "@/services/geo/hooks";
import type { PricingMatrix } from "@/services/types";

interface CustomerPricingFormModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  mode: "create" | "update";
  data?: PricingMatrix;
  customerId: string;
}

const CustomerPricingFormModal = forwardRef<unknown, CustomerPricingFormModalProps>(
  ({ onClose, onSuccess, mode = "create", data, customerId }, ref) => {
    const FormState = useSelector((state: RootState) => state.form);
    const { showToast } = useEnigmaUI();

    const { create, update, createResult, updateResult } = usePricingMatrix();
    const { getCities, getCitiesResult } = useGeo();

    const [selectedOriginCity, setSelectedOriginCity] = useState<any>(null);
    const [selectedDestinationCity, setSelectedDestinationCity] = useState<any>(null);
    const [price, setPrice] = useState("");

    // Track success agar hanya handle sekali per submit
    const successHandledRef = useRef(false);

    const fetchCities = (page?: number, search?: string) => {
      getCities({ page, limit: 20, search });
    };

    const buildPayload = () => ({
      customer_id: customerId,
      origin_city_id: selectedOriginCity?.id || "",
      destination_city_id: selectedDestinationCity?.id || "",
      price: parseFloat(price),
    });

    const reset = () => {
      setSelectedOriginCity(null);
      setSelectedDestinationCity(null);
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
        setSelectedOriginCity(data.origin_city);
        setSelectedDestinationCity(data.destination_city);
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

    const isFormValid = selectedOriginCity && selectedDestinationCity && price !== "";
    const isLoading = createResult?.isLoading || updateResult?.isLoading;

    return (
      <Modal.Wrapper
        open
        onClose={handleClose}
        closeOnOutsideClick={false}
        className="max-w-2xl"
      >
        <Modal.Header className="mb-2">
          <div className="text-xl font-bold">
            {mode === "create" ? "Add Customer Pricing" : "Edit Customer Pricing"}
          </div>
          <div className="text-sm text-base-content/60">
            {mode === "create"
              ? "Fill in the pricing information for this customer"
              : "Update pricing information"}
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit}>
          <Modal.Body className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Pricing Information
                </h3>

                <RemoteSelect<any>
                  label="Origin City"
                  placeholder="Select origin city"
                  value={selectedOriginCity}
                  onChange={setSelectedOriginCity}
                  onClear={() => setSelectedOriginCity(null)}
                  getLabel={(item) => item ? `${item.name}, ${item.province?.name || ""}` : ""}
                  renderItem={(item) => `${item.name}, ${item.province?.name || ""}`}
                  fetchData={fetchCities}
                  hook={getCitiesResult}
                  required
                />

                <RemoteSelect<any>
                  label="Destination City"
                  placeholder="Select destination city"
                  value={selectedDestinationCity}
                  onChange={setSelectedDestinationCity}
                  onClear={() => setSelectedDestinationCity(null)}
                  getLabel={(item) => item ? `${item.name}, ${item.province?.name || ""}` : ""}
                  renderItem={(item) => `${item.name}, ${item.province?.name || ""}`}
                  fetchData={fetchCities}
                  hook={getCitiesResult}
                  required
                  className="mt-3"
                />

                <Input
                  label="Price (IDR)"
                  placeholder="0"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  error={FormState?.errors?.price as string}
                  required
                  min={0}
                  step="1"
                  className="mt-3"
                />
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
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
  }
);

CustomerPricingFormModal.displayName = "CustomerPricingFormModal";

export default CustomerPricingFormModal;
