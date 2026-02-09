import { Button, Input, Modal, RemoteSelect } from "@/components";
import { useAddress } from "@/services/address/hooks";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { GeoLocationSelect } from "@/components/form/GeoLocationSelect";
import type { Address } from "@/services/types";

interface AddressSelectorProps {
  label: string;
  value?: string;
  onChange: (addressId: string, address: Address, cityId?: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  customerId?: string; // Optional: filter addresses by customer
  address?: Address; // Optional: full address object for edit mode
}

/**
 * TMS Onward - Address Selector Component
 *
 * Displays a dropdown of saved addresses with option to create new address.
 * Can optionally filter addresses by customer_id.
 */
export const AddressSelector = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = "Select Address",
  customerId,
  address,
}: AddressSelectorProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Use address hook
  const { get, getResult, create, createResult } = useAddress();

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  // Sync with external value - prefer passed address prop, otherwise find in getResult
  useEffect(() => {
    if (value) {
      // First try to use the passed address prop (for edit mode)
      if (address && address.id === value) {
        setSelectedAddress(address);
        return;
      }

      // Otherwise try to find in getResult
      if (getResult?.data?.data) {
        const foundAddress = getResult.data.data.find((a: any) => a.id === value) as Address | undefined;
        if (foundAddress) {
          setSelectedAddress(foundAddress);
          return;
        }
      }

      // If value exists but address not found, keep searching (getResult might still be loading)
      // Don't set to null immediately to avoid clearing the value during fetch
    } else {
      // If value is undefined/null, clear the selected address
      setSelectedAddress(null);
    }
  }, [value, getResult?.data?.data, address]);

  const handleAddressChange = (address: Address) => {
    setSelectedAddress(address);
    const cityId = address?.village?.district?.city?.id;
    onChange(address.id, address, cityId);
  };

  const handleCreateNewAddress = () => {
    successHandledRef.current = false;
    setIsCreateModalOpen(true);
  };

  const handleAddressCreated = (newAddress: any) => {
    setIsCreateModalOpen(false);

    // Select the newly created address
    setTimeout(() => {
      setSelectedAddress(newAddress);
      const cityId = newAddress?.village?.district?.city?.id;
      onChange(newAddress.id, newAddress, cityId);
    }, 300);
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <label className='text-sm font-semibold text-base-content uppercase tracking-wide'>
          {label} {required && <span className='text-error'>*</span>}
        </label>
        <button
          type='button'
          onClick={handleCreateNewAddress}
          className='text-xs text-primary hover:text-primary-focus font-medium'
          disabled={disabled}
        >
          + Create New Address
        </button>
      </div>

      <div className='flex gap-2'>
        <div className='flex-1'>
          <RemoteSelect
            placeholder={placeholder}
            value={selectedAddress}
            onChange={handleAddressChange}
            fetchData={(page, search) =>
              get({ page: page || 1, limit: 20, customer_id: customerId, search })
            }
            hook={getResult as any}
            getLabel={(item: Address) => item.name || item.address}
            getValue={(item: Address) => item.id}
            error={error}
            disabled={disabled}
            required={required}
            watchKey={customerId}
          />
        </div>
      </div>

      {/* Display selected address details */}
      {selectedAddress && (
        <div className='bg-base-200 rounded-lg p-3 text-sm space-y-1'>
          <div className='font-medium text-base-content'>
            {selectedAddress.name}
          </div>
          <div className='text-base-content/70'>{selectedAddress.address}</div>
          <div className='text-base-content/70'>
            {[
              selectedAddress.village?.district?.city?.province?.name,
              selectedAddress.village?.district?.city?.name,
              selectedAddress.village?.district?.name,
              selectedAddress.village?.name,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
          {(selectedAddress.contact_name || selectedAddress.contact_phone) && (
            <div className='text-base-content/70 text-xs'>
              Contact: {selectedAddress.contact_name}
              {selectedAddress.contact_name &&
                selectedAddress.contact_phone &&
                " • "}
              {selectedAddress.contact_phone}
            </div>
          )}
        </div>
      )}

      {/* Create Address Modal */}
      {isCreateModalOpen && (
        <CreateAddressModal
          onClose={() => setIsCreateModalOpen(false)}
          onAddressCreated={handleAddressCreated}
          customerId={customerId}
        />
      )}
    </div>
  );
};

interface CreateAddressModalProps {
  onClose: () => void;
  onAddressCreated: (address: any) => void;
  customerId?: string;
}

/**
 * Create Address Modal Component
 */
const CreateAddressModal = ({
  onClose,
  onAddressCreated,
  customerId,
}: CreateAddressModalProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [villageId, setVillageId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const { create, createResult } = useAddress();

  const validate = () => {
    return name.trim() !== "" && address.trim() !== "" && villageId !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await create({
      customer_id: customerId,
      name,
      address,
      village_id: villageId,
      contact_name: contactName || undefined,
      contact_phone: contactPhone || undefined,
    });
  };

  // Handle successful address creation
  useEffect(() => {
    if (createResult?.isSuccess && !successHandledRef.current && createResult?.data) {
      successHandledRef.current = true;
      const newAddress = (createResult.data as any)?.data;
      if (newAddress) {
        onAddressCreated(newAddress);
      }
    }
  }, [createResult]);

  const isFormValid = name.trim() && address.trim() && villageId;

  return (
    <Modal.Wrapper open onClose={onClose} closeOnOutsideClick={false}>
      <Modal.Header>
        <div className='text-secondary font-bold text-lg'>
          Create New Address
        </div>
      </Modal.Header>

      <Modal.Body className='text-sm'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Address Name */}
          <Input
            label='Address Name'
            placeholder='e.g., Main Office, Warehouse A'
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={FormState?.errors?.name as string}
            required
          />

          {/* Street Address */}
          <Input
            label='Street Address'
            placeholder='Street name, building, floor, etc.'
            type='textarea'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={FormState?.errors?.address as string}
            required
          />

          {/* Contact Information */}
          <div className='grid grid-cols-2 gap-4'>
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
              type='phone'
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              error={FormState?.errors?.contact_phone as string}
              required
            />
          </div>

          {/* Location Selector */}
          <div>
            <label className='block text-sm font-semibold text-base-content uppercase tracking-wide mb-2'>
              Location
            </label>
            <GeoLocationSelect
              villageId={villageId}
              onVillageChange={(village) => {
                setVillageId(village?.id || "");
              }}
              error={FormState?.errors?.village_id as string}
            />
          </div>
        </form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          className='flex-1 rounded-xl'
          styleType='outline'
          variant='secondary'
          onClick={onClose}
          disabled={createResult?.isLoading}
        >
          Cancel
        </Button>
        <Button
          className='flex-1 rounded-xl'
          variant='primary'
          onClick={handleSubmit}
          isLoading={createResult?.isLoading}
          disabled={!isFormValid}
        >
          Create Address
        </Button>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

export default AddressSelector;
