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

import { Button, Input, Modal, RemoteSelect, useEnigmaUI } from "@/components";
import { useAddress } from "@/services/address/hooks";
import { useGeo } from "@/services/geo/hooks";
import type {
  Address,
  City,
  District,
  Province,
  Village,
} from "@/services/types";

// Type definitions
export interface AddressFormModalRef {
  buildPayload: () => {
    name: string;
    address: string;
    village_id?: string;
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
    const {
      getProvinces,
      getProvincesResult,
      getCities,
      getCitiesResult,
      getDistricts,
      getDistrictsResult,
      getVillages,
      getVillagesResult,
    } = useGeo();

    // State management
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [contactName, setContactName] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [selectedProvince, setSelectedProvince] = useState<any>(null);
    const [selectedCity, setSelectedCity] = useState<any>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
    const [selectedVillage, setSelectedVillage] = useState<any>(null);

    // Track success agar hanya handle sekali per submit
    const successHandledRef = useRef(false);

    // Fetch data helpers for RemoteSelect
    const fetchProvinces = (page?: number, search?: string) => {
      getProvinces({ limit: 50, page, search });
    };

    const fetchCities = (page?: number, search?: string) => {
      if (selectedProvince?.id) {
        getCities({
          province_id: selectedProvince.id,
          limit: 100,
          page,
          search,
        });
      }
    };

    const fetchDistricts = (page?: number, search?: string) => {
      if (selectedCity?.id) {
        getDistricts({ city_id: selectedCity.id, limit: 200, page, search });
      }
    };

    const fetchVillages = (page?: number, search?: string) => {
      if (selectedDistrict?.id) {
        getVillages({
          district_id: selectedDistrict.id,
          limit: 500,
          page,
          search,
        });
      }
    };

    // Build payload method
    const buildPayload = () => {
      return {
        name,
        address,
        village_id: selectedVillage?.id,
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
      setSelectedProvince(null);
      setSelectedCity(null);
      setSelectedDistrict(null);
      setSelectedVillage(null);
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
        if (data.village) {
          setSelectedVillage(data.village);
          if (data.village.district) {
            setSelectedDistrict(data.village.district);
            if (data.village.district.city) {
              setSelectedCity(data.village.district.city);
              if (data.village.district.city.province) {
                setSelectedProvince(data.village.district.city.province);
              }
            }
          }
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

    // Validation
    const isFormValid =
      name.trim() !== "" && address.trim() !== "" && selectedVillage?.id;
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
                  className='mt-3'
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
              <div className='mt-6'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                  Location
                </h3>

                <div className='space-y-3'>
                  <RemoteSelect<Province>
                    label='Province'
                    placeholder='Select Province'
                    value={selectedProvince}
                    onChange={(province) => {
                      setSelectedProvince(province);
                      // Cascading clear: jika Province dipilih/ubah, clear child selections
                      if (!province) {
                        setSelectedCity(null);
                        setSelectedDistrict(null);
                        setSelectedVillage(null);
                      }
                    }}
                    onClear={() => {
                      setSelectedProvince(null);
                      setSelectedCity(null);
                      setSelectedDistrict(null);
                      setSelectedVillage(null);
                    }}
                    getLabel={(item) => item?.name ?? ""}
                    renderItem={(item) => item?.name}
                    fetchData={fetchProvinces}
                    hook={getProvincesResult}
                    required
                  />

                  <RemoteSelect<City>
                    label='City'
                    placeholder='Select City'
                    value={selectedCity}
                    onChange={(city) => {
                      setSelectedCity(city);
                      // Cascading clear: jika City diubah, clear child selections
                      if (!city) {
                        setSelectedDistrict(null);
                        setSelectedVillage(null);
                      }
                    }}
                    onClear={() => {
                      setSelectedCity(null);
                      setSelectedDistrict(null);
                      setSelectedVillage(null);
                    }}
                    getLabel={(item) => item?.name ?? ""}
                    renderItem={(item) => item?.name}
                    fetchData={fetchCities}
                    hook={getCitiesResult}
                    disabled={!selectedProvince}
                    required
                    watchKey={selectedProvince?.id}
                  />

                  <RemoteSelect<District>
                    label='District'
                    placeholder='Select District'
                    value={selectedDistrict}
                    onChange={(district) => {
                      setSelectedDistrict(district);
                      // Cascading clear: jika District diubah, clear Village
                      if (!district) {
                        setSelectedVillage(null);
                      }
                    }}
                    onClear={() => {
                      setSelectedDistrict(null);
                      setSelectedVillage(null);
                    }}
                    getLabel={(item) => item?.name ?? ""}
                    renderItem={(item) => item?.name}
                    fetchData={fetchDistricts}
                    hook={getDistrictsResult}
                    disabled={!selectedCity}
                    required
                    watchKey={selectedCity?.id}
                  />

                  <RemoteSelect<Village>
                    label='Village'
                    placeholder='Select Village'
                    value={selectedVillage}
                    onChange={setSelectedVillage}
                    onClear={() => setSelectedVillage(null)}
                    getLabel={(item) => item?.name ?? ""}
                    renderItem={(item) => item?.name}
                    fetchData={fetchVillages}
                    hook={getVillagesResult}
                    disabled={!selectedDistrict}
                    required
                    watchKey={selectedDistrict?.id}
                    error={FormState?.errors?.village_id as string}
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
