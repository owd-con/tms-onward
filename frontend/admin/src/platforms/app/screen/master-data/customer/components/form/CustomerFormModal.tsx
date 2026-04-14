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

import { Button, Input, Modal, useEnigmaUI } from "@/components";
import { useCustomer } from "@/services/customer/hooks";
import type { Customer } from "@/services/types";

// 1. Type definitions
export interface CustomerFormModalRef {
  buildPayload: () => {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  reset: () => void;
}

interface CustomerFormModalProps {
  onClose: () => void;
  onSuccess?: (customer: Customer) => void;
  mode: "create" | "update";
  data?: Customer;
}

// 2. Component definition dengan forwardRef
const CustomerFormModal = forwardRef<
  CustomerFormModalRef,
  CustomerFormModalProps
>(({ onClose, onSuccess, mode = "create", data }, ref) => {
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();

  const { create, update, createResult, updateResult } = useCustomer();

  // 3. State management
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  // 4. Build payload method
  const buildPayload = () => {
    return {
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
    };
  };

  // 5. Reset form method
  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  // 6. Expose methods via ref
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
      setEmail(data.email ?? "");
      setPhone(data.phone ?? "");
      setAddress(data.address ?? "");
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

  // 10. Close modal on success
  useEffect(() => {
    const isSuccess = createResult?.isSuccess || updateResult?.isSuccess;

    // Hanya handle jika belum pernah handle untuk success ini
    if (isSuccess && !successHandledRef.current) {
      successHandledRef.current = true;

      if (createResult?.isSuccess) {
        showToast({
          message: "Customer created successfully",
          type: "success",
        });
        // Pass the newly created customer to onSuccess
        const newCustomer = (createResult.data as any)?.data as Customer;
        onSuccess?.(newCustomer);
      } else if (updateResult?.isSuccess) {
        showToast({
          message: "Customer updated successfully",
          type: "success",
        });
        // Pass the updated customer to onSuccess
        const updatedCustomer = (updateResult.data as any)?.data as Customer;
        onSuccess?.(updatedCustomer);
      }
      onClose();
    }
  }, [createResult, updateResult]);

  // 11. Handle close with reset
  const handleClose = () => {
    reset();
    onClose();
  };

  const isLoading = createResult?.isLoading || updateResult?.isLoading;

  // 12. Render
  return (
    <Modal.Wrapper
      open
      onClose={handleClose}
      closeOnOutsideClick={false}
      className='max-w-3xl w-11/12 mx-4'
    >
      <Modal.Header className='mb-4'>
        <div className='text-secondary font-bold leading-7 text-lg'>
          {mode === "create" ? "Add New Customer" : "Edit Customer"}
        </div>
        <div className='text-sm text-base-content/60 leading-5 font-normal'>
          {mode === "create"
            ? "Create a new client profile and contact record"
            : "Update customer information and preferences"}
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className='max-h-[75vh] overflow-y-auto px-2 pb-6'>
          <div className='space-y-6 pt-2'>
            
            {/* GROUP 1: Customer Profile */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="mb-5 border-b border-slate-200/60 pb-3">
                <h3 className="text-[15px] font-bold text-slate-800">Customer Profile</h3>
                <p className="text-xs text-slate-500 mt-1">Core identity and primary communication methods</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
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
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="mb-5 border-b border-slate-200/60 pb-3">
                <h3 className="text-[15px] font-bold text-slate-800">Location</h3>
                <p className="text-xs text-slate-500 mt-1">Registered address and operational headquarters</p>
              </div>

              <div className="grid grid-cols-1 gap-5">
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
              {mode === "create" ? "Create Customer" : "Save Changes"}
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal.Wrapper>
  );
});

export default CustomerFormModal;
