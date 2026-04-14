import { Button, Input, Modal, RemoteSelect } from "@/components";
import { useCustomer } from "@/services/customer/hooks";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import type { Customer } from "@/services/types";

interface CustomerSelectorProps {
  value?: string;
  onChange: (customerId: string, customer: Customer) => void;
  onClear?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  customer?: Customer; // Optional: full customer object for edit mode
}

/**
 * TMS Onward - Customer Selector Component
 *
 * Displays a dropdown of customers with option to create new customer.
 * Uses Modal for creating customers.
 */
export const CustomerSelector = ({
  value,
  onChange,
  onClear,
  error,
  required = false,
  disabled = false,
  placeholder = "Select Customer",
  customer,
}: CustomerSelectorProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Use customer hook
  const { get, getResult } = useCustomer();

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  // Load customers on mount
  useEffect(() => {
    get({ page: 1, limit: 100, status: "active" });
  }, []);

  // Sync with external value - prefer passed customer prop, otherwise find in getResult
  useEffect(() => {
    if (value) {
      // First try to use the passed customer prop (for edit mode)
      if (customer && customer.id === value) {
        setSelectedCustomer(customer);
        return;
      }

      // Otherwise try to find in getResult
      if (getResult?.data?.data) {
        const foundCustomer = getResult.data.data.find(
          (c: any) => c.id === value,
        ) as Customer | undefined;
        if (foundCustomer) {
          setSelectedCustomer(foundCustomer);
          return;
        }
      }
    } else {
      setSelectedCustomer(null);
    }
  }, [value, getResult?.data?.data, customer]);

  const handleCustomerChange = (cust: Customer) => {
    setSelectedCustomer(cust);
    onChange(cust.id, cust);
  };

  const handleCreateNewCustomer = () => {
    successHandledRef.current = false;
    setIsCreateModalOpen(true);
  };

  const handleCustomerCreated = (newCustomer: any) => {
    setIsCreateModalOpen(false);

    // Select the newly created customer
    setTimeout(() => {
      setSelectedCustomer(newCustomer);
      onChange(newCustomer.id, newCustomer);
    }, 300);
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <label className='text-base-content text-[10px] leading-[1.2] uppercase font-semibold tracking-[.6px]'>
          Customer {required && <span className='text-error'>*</span>}
        </label>
        <button
          type='button'
          onClick={handleCreateNewCustomer}
          className='text-xs text-primary hover:text-primary-focus font-medium'
          disabled={disabled}
        >
          + Create New Customer
        </button>
      </div>

      <div className='flex gap-2'>
        <div className='flex-1'>
          <RemoteSelect
            placeholder={placeholder}
            value={selectedCustomer}
            onChange={handleCustomerChange}
            onClear={() => {
              setSelectedCustomer(null);
              onClear?.();
            }}
            fetchData={(page, search) =>
              get({ page: page || 1, limit: 20, search, status: "active" })
            }
            hook={getResult as any}
            getLabel={(item: Customer) => item.name}
            getValue={(item: Customer) => item.id}
            error={error}
            disabled={disabled}
            required={required}
          />
        </div>
      </div>

      {/* Display selected customer details */}
      {selectedCustomer && (
        <div className='bg-base-200 rounded-lg p-3 text-sm space-y-1'>
          <div className='font-medium text-base-content'>
            {selectedCustomer.name}
          </div>
          <div className='text-base-content/70'>{selectedCustomer.email}</div>
          <div className='text-base-content/70'>{selectedCustomer.phone}</div>
          {selectedCustomer.address && (
            <div className='text-base-content/70'>
              {selectedCustomer.address}
            </div>
          )}
        </div>
      )}

      {/* Create Customer Modal */}
      {isCreateModalOpen && (
        <CreateCustomerModal
          onClose={() => setIsCreateModalOpen(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      )}
    </div>
  );
};

interface CreateCustomerModalProps {
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
}

/**
 * Create Customer Modal Component
 */
const CreateCustomerModal = ({
  onClose,
  onCustomerCreated,
}: CreateCustomerModalProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const { create, createResult } = useCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
    });
  };

  // Handle successful customer creation
  useEffect(() => {
    if (
      createResult?.isSuccess &&
      !successHandledRef.current &&
      createResult?.data
    ) {
      successHandledRef.current = true;
      const newCustomer = (createResult.data as any)?.data;
      if (newCustomer) {
        onCustomerCreated(newCustomer);
      }
    }
  }, [createResult]);

  return (
    <Modal.Wrapper
      open
      onClose={onClose}
      closeOnOutsideClick={false}
      className='!max-w-xl !w-11/12 mx-4'
    >
      <Modal.Header className='mb-4'>
        <div className='text-secondary font-bold leading-7 text-lg'>
          Add New Customer
        </div>
        <div className='text-sm text-base-content/60 leading-5 font-normal'>
          Create a new client profile and contact record
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className='max-h-[75vh] overflow-y-auto px-2 pb-6'>
          <div className='space-y-6 pt-2'>
            {/* GROUP 1: Customer Profile */}
            <div className='bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
              <div className='mb-5 border-b border-slate-200/60 pb-3'>
                <h3 className='text-[15px] font-bold text-slate-800'>
                  Customer Profile
                </h3>
                <p className='text-xs text-slate-500 mt-1'>
                  Core identity and primary communication methods
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <div className='sm:col-span-2'>
                  <Input
                    label='Customer Name'
                    placeholder='Enter customer name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={FormState?.errors?.name as string}
                    required
                  />
                </div>

                <Input
                  label='Email'
                  placeholder='customer@email.com'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={FormState?.errors?.email as string}
                />

                <Input
                  label='Phone'
                  placeholder='08xxxxxxxxxx'
                  type='phone'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={FormState?.errors?.phone as string}
                />
              </div>
            </div>

            {/* GROUP 2: Address Information */}
            <div className='bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
              <div className='mb-5 border-b border-slate-200/60 pb-3'>
                <h3 className='text-[15px] font-bold text-slate-800'>
                  Location
                </h3>
                <p className='text-xs text-slate-500 mt-1'>
                  Registered address and operational headquarters
                </p>
              </div>

              <div className='grid grid-cols-1 gap-5'>
                <Input
                  label='Registration Address'
                  placeholder='Street address'
                  type='textarea'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  error={FormState?.errors?.address as string}
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
              onClick={onClose}
              disabled={createResult?.isLoading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              isLoading={createResult?.isLoading}
              disabled={createResult?.isLoading}
            >
              Create Customer
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal.Wrapper>
  );
};

export default CustomerSelector;
