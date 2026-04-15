import { RemoteSelect } from "@/components";
import { useAddress } from "@/services/address/hooks";
import type { Address } from "@/services/types";
import { getDisplayPath } from "@/utils/common";
import { useEffect, useRef, useState } from "react";
import AddressFormModal from "../../../../components/address/AddressFormModal";

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
  type?: "pickup_point" | "drop_point"; // Optional: filter addresses by type (for inhouse company)
}

/**
 * TMS Onward - Address Selector Component
 *
 * Displays a dropdown of saved addresses with option to create new address.
 * Can optionally filter addresses by customer_id.
 * Uses shared AddressFormModal for creating new addresses.
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
  type,
}: AddressSelectorProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Use address hook
  const { get, getResult } = useAddress();

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
        const foundAddress = getResult.data.data.find(
          (a: any) => a.id === value,
        ) as Address | undefined;
        if (foundAddress) {
          setSelectedAddress(foundAddress);
          return;
        }
      }
    } else {
      // If value is undefined/null, clear the selected address
      setSelectedAddress(null);
    }
  }, [value, getResult?.data?.data, address]);

  const handleAddressChange = (addr: Address) => {
    setSelectedAddress(addr);
    const regency_id = addr?.region?.administrative_area?.regency_id;
    onChange(addr.id, addr, regency_id);
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
      const regency_id = newAddress?.region?.administrative_area?.regency_id;
      onChange(newAddress.id, newAddress, regency_id);
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
              customerId || type
                ? get({
                    status: "active",
                    page: page || 1,
                    limit: 20,
                    customer_id: customerId,
                    type,
                    search,
                  })
                : undefined
            }
            hook={getResult as any}
            getLabel={(item: Address) => item.name || item.address}
            getValue={(item: Address) => item.id}
            error={error}
            disabled={disabled}
            required={required}
            watchKey={customerId || type}
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
          {selectedAddress.region && (
            <div className='text-base-content/70'>
              {selectedAddress.region.administrative_area
                ? getDisplayPath(selectedAddress.region.administrative_area)
                : selectedAddress.region.name}
            </div>
          )}
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
        <AddressFormModal
          open={true}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleAddressCreated}
          mode='create'
          customerId={customerId}
          defaultType={type}
        />
      )}
    </div>
  );
};

export default AddressSelector;
