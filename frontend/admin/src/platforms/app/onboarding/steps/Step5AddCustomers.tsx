import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Button, Input } from "@/components";
import { useOnboarding } from "@/services/onboarding/hooks";
import { useCustomer } from "@/services/customer/hooks";
import { HiPlus, HiTrash } from "react-icons/hi2";

interface Step5AddCustomersProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onUpdate: (data: { customersCreated: number }) => void;
  isLoading?: boolean;
}

interface CustomerFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

const Step5AddCustomers = ({ onNext, onBack, onSkip, onUpdate, isLoading }: Step5AddCustomersProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  const [customers, setCustomers] = useState<CustomerFormData[]>([
    {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  ]);
  const [_isLoading, setIsLoading] = useState(false);

  const { onboardingStep5, onboardingStep5Result } = useOnboarding();
  const { get } = useCustomer();

  // Fetch existing customers when component mounts
  useEffect(() => {
    const fetchExistingCustomers = async () => {
      try {
        setIsLoading(true);
        const result = await get({
          page: 1,
          limit: 100,
        });

        if (result?.data) {
          const mappedCustomers: CustomerFormData[] = result.data.map((c: any) => ({
            id: c.id,
            name: c.name || "",
            email: c.email || "",
            phone: c.phone || "",
            address: c.address || "",
          }));

          if (mappedCustomers.length > 0) {
            setCustomers(mappedCustomers);
          }
        }
      } catch (error) {
        console.log("Failed to fetch existing customers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingCustomers();
  }, [get]);

  const handleAddCustomer = () => {
    setCustomers([
      ...customers,
      {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
    ]);
  };

  const handleRemoveCustomer = (index: number) => {
    if (customers.length > 1) {
      setCustomers(customers.filter((_, i) => i !== index));
    }
  };

  const handleCustomerChange = (index: number, field: keyof CustomerFormData, value: string) => {
    const newCustomers = [...customers];
    newCustomers[index] = { ...newCustomers[index], [field]: value };
    setCustomers(newCustomers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter customers that have data
    const validCustomers = customers.filter(
      (c) => c.name || c.email || c.phone || c.address
    );

    // Skip if no customers to create/update
    if (validCustomers.length === 0) {
      onUpdate({ customersCreated: 0 });
      onNext();
      return;
    }

    // Prepare batch payload
    const batchPayload = {
      customers: validCustomers.map((c) => ({
        id: c.id || "",
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
      })),
    };

    // Call batch endpoint
    await onboardingStep5(batchPayload);
  };

  // Handle success
  useEffect(() => {
    if (onboardingStep5Result.isSuccess) {
      const validCustomersCount = customers.filter(
        (c) => c.name || c.email || c.phone || c.address
      ).length;
      onUpdate({ customersCreated: validCustomersCount });
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
            Add Customers
          </h2>
          <p className="text-base-content/70 text-sm">
            Add your customers to get started. You can add more customers later.
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
                Customer Information
              </div>
              <div className="text-info/80 text-xs">
                Adding customers now will help you create orders faster. You can also add customers later from the Customers page.
              </div>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="space-y-6">
          {customers.map((customer, index) => (
            <div key={index} className="border border-base-300 rounded-xl p-4 relative">
              {/* Remove Button */}
              {customers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCustomer(index)}
                  className="absolute top-4 right-4 text-base-content/50 hover:text-error transition-colors"
                  aria-label="Remove customer"
                >
                  <HiTrash size={18} />
                </button>
              )}

              {/* Customer Header */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-base-content">
                  Customer {index + 1}
                </div>
              </div>

              {/* Customer Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id={`customer-${index}-name`}
                  label="Customer Name"
                  type="text"
                  placeholder="Customer name"
                  value={customer.name}
                  onChange={(e) => handleCustomerChange(index, "name", e.target.value)}
                  error={(FormState?.errors as any)?.[`customers.${index}.name`]}
                  required
                />

                <Input
                  id={`customer-${index}-email`}
                  label="Email"
                  type="email"
                  placeholder="customer@example.com"
                  value={customer.email}
                  onChange={(e) => handleCustomerChange(index, "email", e.target.value)}
                  error={(FormState?.errors as any)?.[`customers.${index}.email`]}
                />

                <Input
                  id={`customer-${index}-phone`}
                  label="Phone"
                  type="phone"
                  placeholder="08xxxxxxxxxx"
                  value={customer.phone}
                  onChange={(e) => handleCustomerChange(index, "phone", e.target.value)}
                  error={(FormState?.errors as any)?.[`customers.${index}.phone`]}
                />

                <Input
                  id={`customer-${index}-address`}
                  label="Address"
                  type="text"
                  placeholder="Customer address"
                  value={customer.address}
                  onChange={(e) => handleCustomerChange(index, "address", e.target.value)}
                  error={(FormState?.errors as any)?.[`customers.${index}.address`]}
                />
              </div>
            </div>
          ))}

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={handleAddCustomer}
            className="w-full py-3 border-2 border-dashed border-base-300 rounded-xl text-base-content/60 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <HiPlus size={18} />
            Add Another Customer
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

export default Step5AddCustomers;
