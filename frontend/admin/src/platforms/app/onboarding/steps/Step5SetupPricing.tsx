import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Button, Input, Modal, RemoteSelect, useEnigmaUI } from "@/components";
import { useOnboarding } from "@/services/onboarding/hooks";
import { usePricingMatrix } from "@/services/pricingMatrix/hooks";
import { useCustomer } from "@/services/customer/hooks";
import { useGeo } from "@/services/geo/hooks";
import { HiPlus, HiTrash } from "react-icons/hi2";

interface Step5SetupPricingProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onUpdate: (data: { pricingRulesCreated: number }) => void;
  isLoading?: boolean;
}

interface PricingFormData {
  id?: string;
  customerId: string;
  originCityId: string;
  destinationCityId: string;
  price: string;
  customer?: any;
  originCity?: any;
  destinationCity?: any;
}

const Step5SetupPricing = ({ onNext, onBack, onSkip, onUpdate, isLoading }: Step5SetupPricingProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  const [pricingRules, setPricingRules] = useState<PricingFormData[]>([
    {
      customerId: "",
      originCityId: "",
      destinationCityId: "",
      price: "",
    },
  ]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { onboardingStep5, onboardingStep5Result } = useOnboarding();
  const { get } = usePricingMatrix();
  const { getCities, getCitiesResult } = useGeo();
  const { get: getCustomer, getResult: getCustomerResult } = useCustomer();

  const fetchCities = (page?: number, search?: string) => {
    getCities({ page, limit: 20, search });
  };

  const fetchCustomers = (page?: number, search?: string) => {
    getCustomer({ page, limit: 20, search });
  };

  // Fetch existing pricing rules when component mounts
  useEffect(() => {
    const fetchExistingPricing = async () => {
      try {
        setIsLoadingData(true);
        const result = await get({
          page: 1,
          limit: 100,
        });

        if (result?.data) {
          const mappedPricing: PricingFormData[] = result.data.map((p: any) => ({
            id: p.id,
            customerId: p.customer_id || "",
            originCityId: p.origin_city_id || "",
            destinationCityId: p.destination_city_id || "",
            price: p.price?.toString() || "",
            customer: p.customer,
            originCity: p.origin_city,
            destinationCity: p.destination_city,
          }));

          if (mappedPricing.length > 0) {
            setPricingRules(mappedPricing);
          }
        }
      } catch (error) {
        console.log("Failed to fetch existing pricing:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchExistingPricing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddPricing = () => {
    setPricingRules([
      ...pricingRules,
      {
        customerId: "",
        originCityId: "",
        destinationCityId: "",
        price: "",
      },
    ]);
  };

  const handleRemovePricing = (index: number) => {
    if (pricingRules.length > 1) {
      setPricingRules(pricingRules.filter((_, i) => i !== index));
    }
  };

  const handlePricingChange = (index: number, field: keyof PricingFormData, value: any) => {
    const newPricingRules = [...pricingRules];
    newPricingRules[index] = { ...newPricingRules[index], [field]: value };
    setPricingRules(newPricingRules);
  };

  // Handlers for RemoteSelect changes
  const handleCustomerChange = (index: number, value: any) => {
    const newPricingRules = [...pricingRules];
    newPricingRules[index] = {
      ...newPricingRules[index],
      customer: value,
      customerId: value?.id || "",
    };
    setPricingRules(newPricingRules);
  };

  const handleOriginCityChange = (index: number, value: any) => {
    const newPricingRules = [...pricingRules];
    newPricingRules[index] = {
      ...newPricingRules[index],
      originCity: value,
      originCityId: value?.id || "",
    };
    setPricingRules(newPricingRules);
  };

  const handleDestCityChange = (index: number, value: any) => {
    const newPricingRules = [...pricingRules];
    newPricingRules[index] = {
      ...newPricingRules[index],
      destinationCity: value,
      destinationCityId: value?.id || "",
    };
    setPricingRules(newPricingRules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter pricing rules that have data
    const validPricing = pricingRules.filter(
      (p) => p.customerId || p.originCityId || p.destinationCityId || p.price
    );

    // Skip if no pricing to create/update
    if (validPricing.length === 0) {
      onUpdate({ pricingRulesCreated: 0 });
      onNext();
      return;
    }

    // Prepare batch payload
    const batchPayload = {
      pricing: validPricing.map((p) => ({
        id: p.id,
        customer_id: p.customerId,
        origin_city_id: p.originCityId,
        dest_city_id: p.destinationCityId,
        price: Number(p.price) || 0,
      })),
    };

    // Call batch endpoint
    await onboardingStep5(batchPayload);
  };

  // Handle success
  useEffect(() => {
    if (onboardingStep5Result.isSuccess) {
      const validPricingCount = pricingRules.filter(
        (p) => p.customerId || p.originCityId || p.destinationCityId || p.price
      ).length;
      onUpdate({ pricingRulesCreated: validPricingCount });
      onNext();
    }
  }, [onboardingStep5Result.isSuccess]);

  const isSubmitting = onboardingStep5Result.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 md:p-8">
        {/* Step Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Setup Default Pricing
          </h2>
          <p className="text-base-content/70 text-sm">
            Set up default pricing rules for common routes. You can add more detailed pricing
            later, including customer-specific rates.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-info/10 border border-info/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-info mt-0.5">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-info text-sm mb-1">
                Default Pricing
              </div>
              <div className="text-info/80 text-xs">
                These pricing rules will be used as default rates. You can set up
                customer-specific pricing later from the customer detail page.
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Rules List */}
        <div className="space-y-6">
          {pricingRules.map((pricing, index) => (
            <div key={index} className="border border-base-300 rounded-xl p-4 relative">
              {/* Remove Button */}
              {pricingRules.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePricing(index)}
                  className="absolute top-4 right-4 text-base-content/50 hover:text-error transition-colors"
                  aria-label="Remove pricing rule"
                >
                  <HiTrash size={18} />
                </button>
              )}

              {/* Pricing Header */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-base-content">
                  Pricing Rule {index + 1}
                </div>
              </div>

              {/* Pricing Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RemoteSelect
                  label="Customer"
                  placeholder="Select customer"
                  value={pricing.customer}
                  onChange={(value) => handleCustomerChange(index, value)}
                  onClear={() => handleCustomerChange(index, null)}
                  getLabel={(item) => item?.name || ""}
                  renderItem={(item) => item?.name || ""}
                  fetchData={fetchCustomers}
                  hook={getCustomerResult as any}
                  error={(FormState?.errors as any)?.[`pricing.${index}.customer_id`]}
                />

                <RemoteSelect
                  label="Origin City"
                  placeholder="Select origin city"
                  value={pricing.originCity}
                  onChange={(value) => handleOriginCityChange(index, value)}
                  onClear={() => handleOriginCityChange(index, null)}
                  getLabel={(item) => item ? `${item.name}, ${item.province?.name || ""}` : ""}
                  renderItem={(item) => `${item.name}, ${item.province?.name || ""}`}
                  fetchData={fetchCities}
                  hook={getCitiesResult as any}
                  error={(FormState?.errors as any)?.[`pricing.${index}.origin_city_id`]}
                />

                <RemoteSelect
                  label="Destination City"
                  placeholder="Select destination city"
                  value={pricing.destinationCity}
                  onChange={(value) => handleDestCityChange(index, value)}
                  onClear={() => handleDestCityChange(index, null)}
                  getLabel={(item) => item ? `${item.name}, ${item.province?.name || ""}` : ""}
                  renderItem={(item) => `${item.name}, ${item.province?.name || ""}`}
                  fetchData={fetchCities}
                  hook={getCitiesResult as any}
                  error={(FormState?.errors as any)?.[`pricing.${index}.dest_city_id`]}
                />

                <Input
                  id={`pricing-${index}-price`}
                  label="Price (IDR)"
                  type="number"
                  placeholder="0"
                  value={pricing.price}
                  onChange={(e) => handlePricingChange(index, "price", e.target.value)}
                  error={(FormState?.errors as any)?.[`pricing.${index}.price`]}
                  min="0"
                  prefix="Rp"
                />
              </div>
            </div>
          ))}

          {/* Add Pricing Button */}
          <button
            type="button"
            onClick={handleAddPricing}
            className="w-full py-3 border-2 border-dashed border-base-300 rounded-xl text-base-content/60 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <HiPlus size={18} />
            Add Another Route
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-base-200 px-6 md:px-8 py-4 flex justify-between">
        <Button type="button" variant="secondary" styleType="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            styleType="ghost"
            onClick={onSkip}
          >
            Skip
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting || isLoading}
          >
            Complete Setup
          </Button>
        </div>
      </div>
    </form>
  );
};

export default Step5SetupPricing;
