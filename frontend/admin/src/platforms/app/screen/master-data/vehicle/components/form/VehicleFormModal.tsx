/* eslint-disable react-hooks/exhaustive-deps */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from "react";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";

import {
  Button,
  DatePicker,
  Input,
  Modal,
  RemoteSelect,
  useEnigmaUI,
} from "@/components";
import { vehicleTypeOptions } from "@/shared/options";
import type { SelectOptionValue } from "@/shared/types";
import { useVehicle } from "@/services/vehicle/hooks";
import type { Vehicle } from "@/services/types";
import dayjs from "dayjs";

// 1. Type definitions untuk ref
export interface VehicleFormModalRef {
  buildPayload: () => {
    plate_number: string;
    type: string;
    capacity_weight?: number;
    capacity_volume?: number;
    year?: number;
    make?: string;
    model?: string;
  };
  reset: () => void;
}

// 2. Props interface
interface VehicleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: "create" | "update";
  data?: Vehicle;
}


// 3. Component dengan forwardRef
const VehicleFormModal = forwardRef<VehicleFormModalRef, VehicleFormModalProps>(
  ({ open, onClose, onSuccess, mode = "create", data }, ref) => {
    const FormState = useSelector((state: RootState) => state.form);
    const { showToast } = useEnigmaUI();

    // 4. Gunakan hook untuk CRUD operations
    const { create, update, createResult, updateResult } = useVehicle();

    // Track success agar hanya handle sekali per submit
    const successHandledRef = useRef(false);

    // 5. State management untuk form fields
    const [plateNumber, setPlateNumber] = useState("");
    const [vehicleType, setVehicleType] = useState<SelectOptionValue | null>(
      null,
    );
    const [capacityWeight, setCapacityWeight] = useState("");
    const [capacityVolume, setCapacityVolume] = useState("");
    const [year, setYear] = useState<dayjs.Dayjs | undefined>(undefined);
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");

    // 6. Build payload method
    const buildPayload = () => ({
      plate_number: plateNumber,
      type: vehicleType?.value ? String(vehicleType.value) : "",
      capacity_weight: capacityWeight ? parseFloat(capacityWeight) : undefined,
      capacity_volume: capacityVolume ? parseFloat(capacityVolume) : undefined,
      year: year ? year.year() : undefined,
      make: make || undefined,
      model: model || undefined,
    });

    // 7. Reset form method
    const reset = () => {
      setPlateNumber("");
      setVehicleType(null);
      setCapacityWeight("");
      setCapacityVolume("");
      setYear(undefined);
      setMake("");
      setModel("");
    };

    // 8. Expose methods via ref
    useImperativeHandle(ref, () => ({
      buildPayload,
      reset,
    }));

    // 9. Populate form untuk update mode
    useEffect(() => {
      if (mode === "update" && data) {
        setPlateNumber(data.plate_number ?? "");
        setVehicleType(
          vehicleTypeOptions.find((opt) => opt.value === data.type) ?? null,
        );
        setCapacityWeight(data.capacity_weight?.toString() ?? "");
        setCapacityVolume(data.capacity_volume?.toString() ?? "");
        setYear(data.year ? dayjs().year(data.year) : undefined);
        setMake(data.make ?? "");
        setModel(data.model ?? "");
      }
    }, [data, mode]);

    // 10. Reset form saat modal open untuk create
    useEffect(() => {
      if (open) {
        successHandledRef.current = false;
      }

      if (open && mode === "create") {
        reset();
      }
    }, [open, mode]);

    // 11. Form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = buildPayload();

      if (mode === "create") {
        await create(payload);
      } else {
        await update({ id: data!.id, payload });
      }
    };

    // 12. Close modal on success
    useEffect(() => {
      const isSuccess = createResult?.isSuccess || updateResult?.isSuccess;

      // Hanya handle jika belum pernah handle untuk success ini
      if (isSuccess && !successHandledRef.current && open) {
        successHandledRef.current = true;

        if (createResult?.isSuccess) {
          showToast({
            message: "Vehicle created successfully",
            type: "success",
          });
        } else if (updateResult?.isSuccess) {
          showToast({
            message: "Vehicle updated successfully",
            type: "success",
          });
        }
        onSuccess?.();
        onClose();
      }
    }, [createResult, updateResult]);

    // 13. Handle close with reset
    const handleClose = () => {
      reset();
      onClose();
    };

    const isLoading = createResult?.isLoading || updateResult?.isLoading;

    // 14. Render
    return (
      <Modal.Wrapper
        open={open}
        onClose={handleClose}
        closeOnOutsideClick={false}
        className='max-w-3xl'
      >
        <Modal.Header className='mb-2'>
          <div className='text-xl font-bold'>
            {mode === "create" ? "Add New Vehicle" : "Edit Vehicle"}
          </div>
          <div className='text-sm text-base-content/60'>
            {mode === "create"
              ? "Fill in the vehicle information below"
              : "Update vehicle information"}
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit}>
          <Modal.Body className='max-h-[60vh] overflow-y-auto'>
            <div className='space-y-4'>
              {/* Basic Information */}
              <div>
                <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                  Basic Information
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <Input
                    label='Plate Number'
                    placeholder='B 1234 XYZ'
                    value={plateNumber}
                    onChange={(e) =>
                      setPlateNumber(e.target.value.toUpperCase())
                    }
                    error={FormState?.errors?.plate_number as string}
                    required
                  />

                  <RemoteSelect<SelectOptionValue>
                    label='Vehicle Type'
                    data={vehicleTypeOptions}
                    value={vehicleType}
                    onChange={setVehicleType}
                    onClear={() => setVehicleType(null)}
                    getLabel={(item) => item?.label ?? ""}
                    renderItem={(item) => item?.label}
                    error={FormState?.errors?.type as string}
                    required
                  />

                  <DatePicker
                    label='Year'
                    placeholder='Select year'
                    pickerMode='year'
                    format='YYYY'
                    value={year}
                    onChange={(date) => setYear(date as dayjs.Dayjs | undefined)}
                    error={FormState?.errors?.year as string}
                    required
                  />

                  <Input
                    label='Make'
                    placeholder='e.g., Isuzu, Hino'
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    error={FormState?.errors?.make as string}
                    required
                  />

                  <Input
                    label='Model'
                    placeholder='e.g., Elf, Dutro'
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    error={FormState?.errors?.model as string}
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
                    label='Capacity Weight (kg)'
                    placeholder='Maximum weight in kg'
                    type='number'
                    value={capacityWeight}
                    onChange={(e) => setCapacityWeight(e.target.value)}
                    error={FormState?.errors?.capacity_weight as string}
                    min={0}
                    required
                  />

                  <Input
                    label='Capacity Volume (m³)'
                    placeholder='Maximum volume in cubic meters'
                    type='number'
                    value={capacityVolume}
                    onChange={(e) => setCapacityVolume(e.target.value)}
                    error={FormState?.errors?.capacity_volume as string}
                    min={0}
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
                {mode === "create" ? "Create Vehicle" : "Update Vehicle"}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Wrapper>
    );
  },
);

VehicleFormModal.displayName = "VehicleFormModal";

export default VehicleFormModal;
