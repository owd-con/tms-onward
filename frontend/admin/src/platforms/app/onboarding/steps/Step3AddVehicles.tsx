import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Button } from "@/components";
import { DatePicker, Input, RemoteSelect } from "@/components";
import { vehicleTypeOptions } from "@/shared/options";
import type { SelectOptionValue } from "@/shared/types";
import { useOnboarding } from "@/services/onboarding/hooks";
import { useVehicle } from "@/services/vehicle/hooks";
import { HiPlus, HiTrash } from "react-icons/hi2";
import dayjs, { type Dayjs } from "dayjs";

interface Step3AddVehiclesProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onUpdate: (data: { vehiclesCreated: number }) => void;
}

interface VehicleFormData {
  id?: string;
  plateNumber: string;
  vehicleType: SelectOptionValue | null;
  capacityWeight: string;
  capacityVolume: string;
  year: Dayjs | undefined;
  make: string;
  model: string;
}

const Step3AddVehicles = ({
  onNext,
  onBack,
  onSkip,
  onUpdate,
}: Step3AddVehiclesProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  const [vehicles, setVehicles] = useState<VehicleFormData[]>([
    {
      plateNumber: "",
      vehicleType: null,
      capacityWeight: "",
      capacityVolume: "",
      year: undefined,
      make: "",
      model: "",
    },
  ]);
  const [_isLoading, setIsLoading] = useState(false);

  const { onboardingStep3, onboardingStep3Result } = useOnboarding();
  const { get } = useVehicle();

  // Fetch existing vehicles when component mounts
  useEffect(() => {
    const fetchExistingVehicles = async () => {
      try {
        setIsLoading(true);
        const result = await get({
          page: 1,
          limit: 100,
        });

        if (result?.data) {
          const mappedVehicles: VehicleFormData[] = result.data.map(
            (v: any) => ({
              id: v.id,
              plateNumber: v.plate_number || "",
              vehicleType:
                vehicleTypeOptions.find((opt) => opt.value === v.type) ?? null,
              capacityWeight: v.capacity_weight?.toString() || "",
              capacityVolume: v.capacity_volume?.toString() || "",
              year: v.year ? dayjs().year(v.year) : undefined,
              make: v.make || "",
              model: v.model || "",
            }),
          );

          if (mappedVehicles.length > 0) {
            setVehicles(mappedVehicles);
          }
        }
      } catch (error) {
        console.log("Failed to fetch existing vehicles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingVehicles();
  }, [get]);

  const handleAddVehicle = () => {
    setVehicles([
      ...vehicles,
      {
        plateNumber: "",
        vehicleType: null,
        capacityWeight: "",
        capacityVolume: "",
        year: undefined,
        make: "",
        model: "",
      },
    ]);
  };

  const handleRemoveVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, i) => i !== index));
    }
  };

  const handleVehicleChange = (
    index: number,
    field: keyof VehicleFormData,
    value: string | SelectOptionValue | Dayjs | undefined,
  ) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    setVehicles(newVehicles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter vehicles that have data
    const validVehicles = vehicles.filter(
      (v) => v.plateNumber || v.vehicleType?.value || v.capacityWeight,
    );

    // Skip if no vehicles to create/update
    if (validVehicles.length === 0) {
      onUpdate({ vehiclesCreated: 0 });
      onNext();
      return;
    }

    // Prepare batch payload
    const batchPayload = {
      vehicles: validVehicles.map((v) => ({
        id: v.id,
        plate_number: v.plateNumber,
        vehicle_type: v.vehicleType?.value ? String(v.vehicleType.value) : "",
        capacity_weight: v.capacityWeight ? parseFloat(v.capacityWeight) : 0,
        capacity_volume: v.capacityVolume
          ? parseFloat(v.capacityVolume)
          : undefined,
        year: v.year ? v.year.year() : undefined,
        make: v.make || undefined,
        model: v.model || undefined,
      })),
    };

    // Call batch endpoint
    await onboardingStep3(batchPayload);
  };

  // Handle success
  useEffect(() => {
    if (onboardingStep3Result.isSuccess) {
      const validVehiclesCount = vehicles.filter(
        (v) => v.plateNumber || v.vehicleType?.value || v.capacityWeight,
      ).length;
      onUpdate({ vehiclesCreated: validVehiclesCount });
      onNext();
    }
  }, [onboardingStep3Result.isSuccess]);

  const isSubmitting = onboardingStep3Result.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <div className='p-6 md:p-8'>
        {/* Step Header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-base-content mb-2'>
            Add Vehicles
          </h2>
          <p className='text-base-content/70 text-sm'>
            Add your fleet vehicles to get started. You can add more later.
          </p>
        </div>

        {/* Vehicles List */}
        <div className='space-y-6'>
          {vehicles.map((vehicle, index) => (
            <div
              key={index}
              className='border border-base-300 rounded-xl p-4 relative'
            >
              {/* Remove Button */}
              {vehicles.length > 1 && (
                <button
                  type='button'
                  onClick={() => handleRemoveVehicle(index)}
                  className='absolute top-4 right-4 text-base-content/50 hover:text-error transition-colors'
                  aria-label='Remove vehicle'
                >
                  <HiTrash size={18} />
                </button>
              )}

              {/* Vehicle Header */}
              <div className='mb-4'>
                <div className='text-sm font-semibold text-base-content'>
                  Vehicle {index + 1}
                </div>
              </div>

              {/* Vehicle Fields */}
              <div className='space-y-4'>
                {/* Basic Information */}
                <div>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                    Basic Information
                  </h3>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <Input
                      id={`vehicle-${index}-plate`}
                      label='Plate Number'
                      placeholder='B 1234 ABC'
                      value={vehicle.plateNumber}
                      onChange={(e) =>
                        handleVehicleChange(
                          index,
                          "plateNumber",
                          e.target.value.toUpperCase(),
                        )
                      }
                      error={
                        (FormState?.errors as any)?.[
                          `vehicles.${index}.plate_number`
                        ]
                      }
                      required
                    />

                    <RemoteSelect<SelectOptionValue>
                      label='Vehicle Type'
                      data={vehicleTypeOptions}
                      value={vehicle.vehicleType}
                      onChange={(value) =>
                        handleVehicleChange(index, "vehicleType", value)
                      }
                      onClear={() =>
                        handleVehicleChange(index, "vehicleType", undefined)
                      }
                      getLabel={(item) => item?.label ?? ""}
                      renderItem={(item) => item?.label}
                      error={
                        (FormState?.errors as any)?.[
                          `vehicles.${index}.vehicle_type`
                        ]
                      }
                      required
                    />

                    <DatePicker
                      label='Year'
                      placeholder='Select year'
                      pickerMode='year'
                      format='YYYY'
                      value={vehicle.year}
                      onChange={(date) =>
                        handleVehicleChange(
                          index,
                          "year",
                          date as Dayjs | undefined,
                        )
                      }
                      error={
                        (FormState?.errors as any)?.[`vehicles.${index}.year`]
                      }
                      required
                    />

                    <Input
                      id={`vehicle-${index}-make`}
                      label='Make'
                      placeholder='e.g., Isuzu, Hino'
                      value={vehicle.make}
                      onChange={(e) =>
                        handleVehicleChange(index, "make", e.target.value)
                      }
                      error={
                        (FormState?.errors as any)?.[`vehicles.${index}.make`]
                      }
                      required
                    />

                    <Input
                      id={`vehicle-${index}-model`}
                      label='Model'
                      placeholder='e.g., Elf, Dutro'
                      value={vehicle.model}
                      onChange={(e) =>
                        handleVehicleChange(index, "model", e.target.value)
                      }
                      error={
                        (FormState?.errors as any)?.[`vehicles.${index}.model`]
                      }
                      required
                    />
                  </div>
                </div>

                {/* Capacity Information */}
                <div className='mt-6'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                    Capacity Information
                  </h3>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <Input
                      id={`vehicle-${index}-capacity-weight`}
                      label='Capacity Weight (kg)'
                      type='number'
                      placeholder='Maximum weight in kg'
                      value={vehicle.capacityWeight}
                      onChange={(e) =>
                        handleVehicleChange(
                          index,
                          "capacityWeight",
                          e.target.value,
                        )
                      }
                      error={
                        (FormState?.errors as any)?.[
                          `vehicles.${index}.capacity_weight`
                        ]
                      }
                      min='0'
                      required
                    />

                    <Input
                      id={`vehicle-${index}-capacity-volume`}
                      label='Capacity Volume (m³)'
                      type='number'
                      placeholder='Maximum volume in cubic meters'
                      value={vehicle.capacityVolume}
                      onChange={(e) =>
                        handleVehicleChange(
                          index,
                          "capacityVolume",
                          e.target.value,
                        )
                      }
                      error={
                        (FormState?.errors as any)?.[
                          `vehicles.${index}.capacity_volume`
                        ]
                      }
                      min='0'
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Vehicle Button */}
          <button
            type='button'
            onClick={handleAddVehicle}
            className='w-full py-3 border-2 border-dashed border-base-300 rounded-xl text-base-content/60 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2'
          >
            <HiPlus size={18} />
            Add Another Vehicle
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

export default Step3AddVehicles;
