import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoteSelect } from "@/components";
import { DatePicker } from "@/components/ui/date-picker";
import { licenseTypeOptions } from "@/shared/options";
import { useOnboarding } from "@/services/onboarding/hooks";
import { useDriver } from "@/services/driver/hooks";
import { HiPlus, HiTrash } from "react-icons/hi2";
import dayjs from "dayjs";

interface Step4AddDriversProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onUpdate: (data: { driversCreated: number }) => void;
}

interface DriverFormData {
  id?: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseType: { label: string; value: string };
  licenseExpiry: string;
}

const Step4AddDrivers = ({
  onNext,
  onBack,
  onSkip,
  onUpdate,
}: Step4AddDriversProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  const [drivers, setDrivers] = useState<DriverFormData[]>([
    {
      name: "",
      phone: "",
      licenseNumber: "",
      licenseType: { label: "", value: "" },
      licenseExpiry: "",
    },
  ]);
  const [_isLoading, setIsLoading] = useState(false);

  const { onboardingStep4, onboardingStep4Result } = useOnboarding();
  const { get } = useDriver();

  // Fetch existing drivers when component mounts
  useEffect(() => {
    const fetchExistingDrivers = async () => {
      try {
        setIsLoading(true);
        const result = await get({
          page: 1,
          limit: 100,
        });

        if (result?.data) {
          const mappedDrivers: DriverFormData[] = result.data.map((d: any) => ({
            id: d.id,
            name: d.name || "",
            phone: d.phone || "",
            licenseNumber: d.license_number || "",
            licenseType: licenseTypeOptions.find((opt) => opt.value === d.license_type) || { label: "", value: "" },
            licenseExpiry: d.license_expiry
              ? new Date(d.license_expiry).getFullYear().toString()
              : "",
          }));

          if (mappedDrivers.length > 0) {
            setDrivers(mappedDrivers);
          }
        }
      } catch (error) {
        console.log("Failed to fetch existing drivers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingDrivers();
  }, [get]);

  const handleAddDriver = () => {
    setDrivers([
      ...drivers,
      {
        name: "",
        phone: "",
        licenseNumber: "",
        licenseType: { label: "", value: "" },
        licenseExpiry: "",
      },
    ]);
  };

  const handleRemoveDriver = (index: number) => {
    if (drivers.length > 1) {
      setDrivers(drivers.filter((_, i) => i !== index));
    }
  };

  const handleDriverChange = (
    index: number,
    field: keyof DriverFormData,
    value: string | any,
  ) => {
    const newDrivers = [...drivers];
    newDrivers[index] = { ...newDrivers[index], [field]: value };
    setDrivers(newDrivers);
  };

  const handleLicenseExpiryChange = (index: number, date: any) => {
    const newDrivers = [...drivers];
    // Store year as string (e.g., "2025")
    newDrivers[index] = {
      ...newDrivers[index],
      licenseExpiry: date ? date.year().toString() : "",
    };
    setDrivers(newDrivers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter drivers that have data
    const validDrivers = drivers.filter(
      (d) => d.name || d.phone || d.licenseNumber,
    );

    // Skip if no drivers to create/update
    if (validDrivers.length === 0) {
      onUpdate({ driversCreated: 0 });
      onNext();
      return;
    }

    // Prepare batch payload
    const batchPayload = {
      drivers: validDrivers.map((d) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        license_number: d.licenseNumber,
        license_type: d.licenseType.value,
        // Convert year string (e.g., "2025") to ISO date (Dec 31 of that year)
        license_expiry: d.licenseExpiry
          ? dayjs(d.licenseExpiry, "YYYY").endOf("year").toISOString()
          : null,
      })),
    };

    // Call batch endpoint
    await onboardingStep4(batchPayload);
  };

  // Handle success
  useEffect(() => {
    if (onboardingStep4Result.isSuccess) {
      const validDriversCount = drivers.filter(
        (d) => d.name || d.phone || d.licenseNumber,
      ).length;
      onUpdate({ driversCreated: validDriversCount });
      onNext();
    }
  }, [onboardingStep4Result.isSuccess]);

  const isSubmitting = onboardingStep4Result.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <div className='p-6 md:p-8'>
        {/* Step Header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-base-content mb-2'>
            Add Drivers
          </h2>
          <p className='text-base-content/70 text-sm'>
            Add your drivers to manage deliveries. You can add more later.
          </p>
        </div>

        {/* Drivers List */}
        <div className='space-y-6 '>
          {drivers.map((driver, index) => (
            <div
              key={index}
              className='border border-base-300 rounded-xl p-4 relative'
            >
              {/* Remove Button */}
              {drivers.length > 1 && (
                <button
                  type='button'
                  onClick={() => handleRemoveDriver(index)}
                  className='absolute top-4 right-4 text-base-content/50 hover:text-error transition-colors'
                  aria-label='Remove driver'
                >
                  <HiTrash size={18} />
                </button>
              )}

              {/* Driver Header */}
              <div className='mb-4'>
                <div className='text-sm font-semibold text-base-content'>
                  Driver {index + 1}
                </div>
              </div>

              {/* Driver Fields */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Input
                  id={`driver-${index}-name`}
                  label='Full Name'
                  placeholder='Driver full name'
                  value={driver.name}
                  onChange={(e) =>
                    handleDriverChange(index, "name", e.target.value)
                  }
                  error={(FormState?.errors as any)?.[`drivers.${index}.name`]}
                  required
                />

                <Input
                  id={`driver-${index}-phone`}
                  label='Phone'
                  type='phone'
                  placeholder='08xxxxxxxxxx'
                  value={driver.phone}
                  onChange={(e) =>
                    handleDriverChange(index, "phone", e.target.value)
                  }
                  error={(FormState?.errors as any)?.[`drivers.${index}.phone`]}
                  required
                />

                <Input
                  id={`driver-${index}-license`}
                  label='License Number'
                  placeholder='Enter license number'
                  value={driver.licenseNumber}
                  onChange={(e) =>
                    handleDriverChange(index, "licenseNumber", e.target.value)
                  }
                  error={
                    (FormState?.errors as any)?.[
                      `drivers.${index}.license_number`
                    ]
                  }
                  required
                />

                <RemoteSelect
                  label='License Type'
                  value={driver.licenseType}
                  onChange={(value) =>
                    handleDriverChange(index, "licenseType", value)
                  }
                  data={licenseTypeOptions}
                  getLabel={(item) => item.label}
                  getValue={(item) => item.value}
                  error={
                    (FormState?.errors as any)?.[
                      `drivers.${index}.license_type`
                    ]
                  }
                  required
                />

                <DatePicker
                  label='License Expiry Year'
                  placeholder='Select year'
                  pickerMode='year'
                  format='YYYY'
                  value={
                    driver.licenseExpiry
                      ? dayjs(driver.licenseExpiry, "YYYY")
                      : undefined
                  }
                  onChange={(date) => handleLicenseExpiryChange(index, date)}
                  error={
                    (FormState?.errors as any)?.[
                      `drivers.${index}.license_expiry`
                    ]
                  }
                  required
                />
              </div>
            </div>
          ))}

          {/* Add Driver Button */}
          <button
            type='button'
            onClick={handleAddDriver}
            className='w-full py-3 border-2 border-dashed border-base-300 rounded-xl text-base-content/60 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2'
          >
            <HiPlus size={18} />
            Add Another Driver
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className='bg-base-200 px-6 md:px-8 py-4 flex justify-between'>
        <Button
          type='button'
          variant='secondary'
          styleType='outline'
          onClick={onBack}
        >
          Back
        </Button>
        <div className='flex gap-2'>
          <Button
            type='button'
            variant='default'
            styleType='ghost'
            onClick={onSkip}
          >
            Skip
          </Button>
          <Button type='submit' variant='primary' isLoading={isSubmitting}>
            Continue
          </Button>
        </div>
      </div>
    </form>
  );
};

export default Step4AddDrivers;
