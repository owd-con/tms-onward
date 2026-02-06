import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { vehicleTypeOptions } from "@/shared/options";
import { useOnboarding } from "@/services/onboarding/hooks";
import { useVehicle } from "@/services/vehicle/hooks";
import { HiPlus, HiTrash } from "react-icons/hi2";

interface Step3AddVehiclesProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onUpdate: (data: { vehiclesCreated: number }) => void;
}

interface VehicleFormData {
  id?: string;
  plateNumber: string;
  vehicleType: string;
  capacityWeight: string;
  capacityVolume: string;
}

const Step3AddVehicles = ({ onNext, onBack, onSkip, onUpdate }: Step3AddVehiclesProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  const [vehicles, setVehicles] = useState<VehicleFormData[]>([
    {
      plateNumber: "",
      vehicleType: "",
      capacityWeight: "",
      capacityVolume: "",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

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
          const mappedVehicles: VehicleFormData[] = result.data.map((v: any) => ({
            id: v.id,
            plateNumber: v.plate_number || "",
            vehicleType: v.type || "",
            capacityWeight: v.capacity_weight?.toString() || "",
            capacityVolume: v.capacity_volume?.toString() || "",
          }));

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
        vehicleType: "",
        capacityWeight: "",
        capacityVolume: "",
      },
    ]);
  };

  const handleRemoveVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, i) => i !== index));
    }
  };

  const handleVehicleChange = (index: number, field: keyof VehicleFormData, value: string) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    setVehicles(newVehicles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter vehicles that have data
    const validVehicles = vehicles.filter(
      (v) => v.plateNumber || v.vehicleType || v.capacityWeight
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
        vehicle_type: v.vehicleType,
        capacity_weight: v.capacityWeight ? parseFloat(v.capacityWeight) : 0,
        capacity_volume: v.capacityVolume ? parseFloat(v.capacityVolume) : undefined,
      })),
    };

    // Call batch endpoint
    await onboardingStep3(batchPayload);
  };

  // Handle success
  useEffect(() => {
    if (onboardingStep3Result.isSuccess) {
      const validVehiclesCount = vehicles.filter(v => v.plateNumber || v.vehicleType || v.capacityWeight).length;
      onUpdate({ vehiclesCreated: validVehiclesCount });
      onNext();
    }
  }, [onboardingStep3Result.isSuccess]);

  const isSubmitting = onboardingStep3Result.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 md:p-8">
        {/* Step Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Add Vehicles
          </h2>
          <p className="text-base-content/70 text-sm">
            Add your fleet vehicles to get started. You can add more later.
          </p>
        </div>

        {/* Vehicles List */}
        <div className="space-y-6">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="border border-base-300 rounded-xl p-4 relative">
              {/* Remove Button */}
              {vehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveVehicle(index)}
                  className="absolute top-4 right-4 text-base-content/50 hover:text-error transition-colors"
                  aria-label="Remove vehicle"
                >
                  <HiTrash size={18} />
                </button>
              )}

              {/* Vehicle Header */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-base-content">
                  Vehicle {index + 1}
                </div>
              </div>

              {/* Vehicle Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id={`vehicle-${index}-plate`}
                  label="Plate Number"
                  placeholder="B 1234 ABC"
                  value={vehicle.plateNumber}
                  onChange={(e) => handleVehicleChange(index, "plateNumber", e.target.value)}
                  error={(FormState?.errors as any)?.[`vehicles.${index}.plate_number`]}
                  className="uppercase"
                />

                <Select
                  id={`vehicle-${index}-type`}
                  label="Vehicle Type"
                  options={vehicleTypeOptions}
                  value={vehicle.vehicleType}
                  onChange={(e) => handleVehicleChange(index, "vehicleType", e.target.value)}
                  error={(FormState?.errors as any)?.[`vehicles.${index}.vehicle_type`]}
                />

                <Input
                  id={`vehicle-${index}-capacity-weight`}
                  label="Capacity Weight (kg)"
                  type="number"
                  placeholder="e.g., 5000"
                  value={vehicle.capacityWeight}
                  onChange={(e) => handleVehicleChange(index, "capacityWeight", e.target.value)}
                  error={(FormState?.errors as any)?.[`vehicles.${index}.capacity_weight`]}
                  min="0"
                />

                <Input
                  id={`vehicle-${index}-capacity-volume`}
                  label="Capacity Volume (m³)"
                  type="number"
                  placeholder="e.g., 100"
                  value={vehicle.capacityVolume}
                  onChange={(e) => handleVehicleChange(index, "capacityVolume", e.target.value)}
                  error={(FormState?.errors as any)?.[`vehicles.${index}.capacity_volume`]}
                  min="0"
                />
              </div>
            </div>
          ))}

          {/* Add Vehicle Button */}
          <button
            type="button"
            onClick={handleAddVehicle}
            className="w-full py-3 border-2 border-dashed border-base-300 rounded-xl text-base-content/60 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <HiPlus size={18} />
            Add Another Vehicle
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
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Continue
          </Button>
        </div>
      </div>
    </form>
  );
};

export default Step3AddVehicles;
