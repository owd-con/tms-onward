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
import { useUser } from "@/services/user/hooks";
import type { Driver, User } from "@/services/types";

// 1. Type definitions untuk ref
export interface DriverUserFormModalRef {
  buildPayload: () => {
    username: string;
    password?: string;
    confirm_password?: string;
  };
  reset: () => void;
}

// 2. Props interface
interface DriverUserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  driver: Driver | null;
}

// 3. Component dengan forwardRef
const DriverUserFormModal = forwardRef<
  DriverUserFormModalRef,
  DriverUserFormModalProps
>(({ open, onClose, onSuccess, driver }, ref) => {
  const FormState = useSelector((state: RootState) => state.form);
  const { showToast } = useEnigmaUI();

  // 4. Gunakan hook untuk update dan show operations
  const { update, updateResult, show, showResult } = useUser();

  // Track success agar hanya handle sekali per submit
  const successHandledRef = useRef(false);

  // name state untuk request payload
  const [user, setUser] = useState<User | null>(null);
  // 5. State management untuk form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 6. Build payload method
  const buildPayload = () => {
    const payload = {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: "driver",
      username,
      password: "",
      confirm_password: "",
    };

    // Include password only if provided
    if (password.trim()) {
      payload.password = password;
      payload.confirm_password = confirmPassword;
    }

    return payload;
  };

  // 7. Reset form method
  const reset = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  // 8. Expose methods via ref
  useImperativeHandle(ref, () => ({
    buildPayload,
    reset,
  }));

  // 9. Fetch user details when modal opens
  useEffect(() => {
    if (open && driver) {
      successHandledRef.current = false;

      // Check if driver has existing user account
      if (
        driver.user_id &&
        driver.user_id !== "00000000-0000-0000-0000-000000000000"
      ) {
        // Fetch user details to populate username
        show({ id: driver.user_id })
          .then((response) => {
            if (response?.data) {
              const userData = response.data as User;
              setUser(userData);
              setUsername(userData.username);
            }
          })
          .catch((err) => {
            console.error("Failed to fetch user details:", err);
          });
      } else {
        // No user account yet - this shouldn't happen for update mode
        reset();
      }
    }
  }, [open, driver]);

  // 10. Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();

    // Driver's user_id is the actual user ID to update
    if (
      driver?.user_id &&
      driver.user_id !== "00000000-0000-0000-0000-000000000000"
    ) {
      await update({ id: driver.user_id, payload });
    }
  };

  // 11. Close modal on success
  useEffect(() => {
    if (updateResult?.isSuccess && !successHandledRef.current && open) {
      successHandledRef.current = true;

      showToast({
        message: "User account updated successfully",
        type: "success",
      });
      onSuccess?.();
      onClose();
    }
  }, [updateResult?.isSuccess]);

  // 12. Handle close with reset
  const handleClose = () => {
    reset();
    onClose();
  };

  const isLoading = updateResult?.isLoading || showResult?.isLoading;

  // Check if driver has user account
  const hasUserAccount =
    driver?.user_id &&
    driver.user_id !== "00000000-0000-0000-0000-000000000000";

  // 13. Render
  return (
    <Modal.Wrapper
      open={open}
      onClose={handleClose}
      closeOnOutsideClick={false}
      className='!w-11/12 !max-w-lg mx-4'
    >
      <Modal.Header className='mb-4'>
        <div className='text-secondary font-bold leading-7 text-lg'>
          Update User Account
        </div>
        <div className='text-sm text-base-content/60 leading-5 font-normal'>
          Update login credentials for {driver?.name}
        </div>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body className='max-h-[75vh] overflow-y-auto px-2 pb-6'>
          <div className='space-y-6 pt-2'>
            {/* Error state: no user account */}
            {!hasUserAccount && (
              <div className='bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0'>
                    <span className='text-amber-600 text-xl'>!</span>
                  </div>
                  <div>
                    <h3 className='text-[15px] font-bold text-amber-800'>
                      No User Account
                    </h3>
                    <p className='text-sm text-amber-700 mt-1'>
                      This driver does not have a user account. Please create
                      one from the driver form.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* User account form */}
            {hasUserAccount && (
              <>
                {/* GROUP 1: Username */}
                <div className='bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
                  <div className='mb-5 border-b border-slate-200/60 pb-3'>
                    <h3 className='text-[15px] font-bold text-slate-800'>
                      Username
                    </h3>
                    <p className='text-xs text-slate-500 mt-1'>
                      Driver's unique login identifier
                    </p>
                  </div>

                  <div className='grid grid-cols-1 gap-5'>
                    <Input
                      label='System Username'
                      placeholder='Enter username'
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      error={FormState?.errors?.username as string}
                      required
                    />
                  </div>
                </div>

                {/* GROUP 2: Password */}
                <div className='bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
                  <div className='mb-5 border-b border-slate-200/60 pb-3'>
                    <h3 className='text-[15px] font-bold text-slate-800'>
                      Password
                    </h3>
                    <p className='text-xs text-slate-500 mt-1'>
                      Leave blank to keep current password
                    </p>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                    <Input
                      label='New Password'
                      placeholder='Enter new password (min 8 characters)'
                      type='password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={FormState?.errors?.password as string}
                    />

                    <Input
                      label='Confirm Password'
                      placeholder='Re-enter new password'
                      type='password'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={
                        confirmPassword && password !== confirmPassword
                          ? "Passwords do not match"
                          : undefined
                      }
                    />
                  </div>
                </div>
              </>
            )}
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
            {hasUserAccount && (
              <Button type='submit' variant='primary' isLoading={isLoading}>
                Update Account
              </Button>
            )}
          </div>
        </Modal.Footer>
      </form>
    </Modal.Wrapper>
  );
});

DriverUserFormModal.displayName = "DriverUserFormModal";

export default DriverUserFormModal;
