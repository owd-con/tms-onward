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
  onSuccess?: () => void;
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
      } else if (updateResult?.isSuccess) {
        showToast({
          message: "Customer updated successfully",
          type: "success",
        });
      }
      onSuccess?.();
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
      className='max-w-2xl w-full mx-4'
    >
      <Modal.Header className='mb-2'>
        <div className='text-xl font-bold'>
          {mode === "create" ? "Add New Customer" : "Edit Customer"}
        </div>
        <div className='text-sm text-base-content/60'>
          {mode === "create"
            ? "Fill in the customer information below"
            : "Update customer information"}
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className='max-h-[60vh] overflow-y-auto'>
          <div className='space-y-4'>
            {/* Customer Information */}
            <div>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                Customer Information
              </h3>

              <Input
                label='Customer Name'
                placeholder='Enter customer name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={FormState?.errors?.name as string}
                required
              />

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

            {/* Address Information */}
            <div className='mt-6'>
              <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                Address Information
              </h3>

              <Input
                label='Address'
                placeholder='Street address'
                type='textarea'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                error={FormState?.errors?.address as string}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className='flex flex-col sm:flex-row justify-end gap-3'>
            <Button
              type='button'
              variant='secondary'
              onClick={handleClose}
              disabled={isLoading}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='primary'
              isLoading={isLoading}
              className='w-full sm:w-auto'
            >
              {mode === "create" ? "Create Customer" : "Update Customer"}
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal.Wrapper>
  );
});

export default CustomerFormModal;
