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
import type { User, UserRole } from "@/services/types";

// 1. Type definitions untuk ref
export interface UserFormModalRef {
  buildPayload: () => {
    name: string;
    username: string;
    email: string;
    password?: string;
    confirm_password?: string;
    phone?: string;
    role: UserRole;
  };
  reset: () => void;
}

// 2. Props interface
interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: "create" | "update";
  data?: User;
}

// 3. Component dengan forwardRef
const UserFormModal = forwardRef<UserFormModalRef, UserFormModalProps>(
  ({ open, onClose, onSuccess, mode = "create", data }, ref) => {
    const FormState = useSelector((state: RootState) => state.form);
    const { showToast } = useEnigmaUI();

    // 4. Gunakan hook untuk CRUD operations
    const { create, update, createResult, updateResult } = useUser();

    // Track success agar hanya handle sekali per submit
    const successHandledRef = useRef(false);

    // 5. State management untuk form fields
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<UserRole>("dispatcher");

    // 6. Build payload method
    const buildPayload = () => {
      const payload: {
        name: string;
        username: string;
        email: string;
        password?: string;
        confirm_password?: string;
        phone?: string;
        role: UserRole;
      } = {
        name,
        username,
        email,
        role,
      };

      // Include phone only if provided
      if (phone.trim()) {
        payload.phone = phone;
      }

      // Include password & confirm_password only on create or when explicitly provided on update
      if (mode === "create" || password.trim()) {
        payload.password = password;
        payload.confirm_password = confirmPassword;
      }

      return payload;
    };

    // 7. Reset form method
    const reset = () => {
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setRole("dispatcher");
    };

    // 8. Expose methods via ref
    useImperativeHandle(ref, () => ({
      buildPayload,
      reset,
    }));

    // 9. Populate form untuk update mode
    useEffect(() => {
      if (mode === "update" && data) {
        setName(data.name ?? "");
        setUsername(data.username ?? "");
        setEmail(data.email ?? "");
        setPassword(""); // Don't populate password on update
        setConfirmPassword("");
        setPhone(data.phone ?? "");
        setRole(data.role ?? "dispatcher");
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
        // Hook expects { id, payload } format
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
            message: "User created successfully",
            type: "success",
          });
        } else if (updateResult?.isSuccess) {
          showToast({
            message: "User updated successfully",
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

    // 15. Render
    return (
      <Modal.Wrapper
        open={open}
        onClose={handleClose}
        closeOnOutsideClick={false}
        className='max-w-2xl w-full mx-4'
      >
        <Modal.Header className='mb-4'>
          <div className='text-xl font-bold'>
            {mode === "create" ? "Add Team Member" : "Edit Team Member"}
          </div>
          <div className='text-sm text-base-content/60'>
            {mode === "create"
              ? "Create a new account for a team member"
              : "Update user information"}
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit}>
          <Modal.Body className='min-h-[300px]'>
            <div className='space-y-4'>
              {/* Personal Information */}
              <div>
                <h3 className='text-base font-semibold mb-3'>
                  User Information
                </h3>

                <Input
                  label='Full Name'
                  placeholder='User full name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={FormState?.errors?.name as string}
                  required
                />

                <Input
                  label='Username'
                  placeholder='Enter your username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={FormState?.errors?.username as string}
                  required
                />

                <Input
                  label='Email'
                  placeholder='user@example.com'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={FormState?.errors?.email as string}
                />

                <Input
                  label='Phone'
                  placeholder='08xxxxxxxxxx (optional)'
                  type='phone'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={FormState?.errors?.phone as string}
                />

                <div>
                  <label className='text-sm font-medium'>Role</label>
                  <div className='w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-base-content capitalize'>
                    {role}
                  </div>
                </div>
              </div>

              {/* Password Section - Conditional */}
              {(mode === "create" || mode === "update") && (
                <div className='mt-6'>
                  <h3 className='text-base font-semibold mb-3'>
                    {mode === "create"
                      ? "Password"
                      : "Change Password (Optional)"}
                  </h3>

                  <Input
                    label={mode === "create" ? "Password" : "New Password"}
                    placeholder={
                      mode === "create"
                        ? "Enter password (min 8 characters)"
                        : "Leave blank to keep current password"
                    }
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={FormState?.errors?.password as string}
                    required={mode === "create"}
                  />

                  <Input
                    label='Confirm Password'
                    placeholder='Re-enter password'
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={
                      confirmPassword && password !== confirmPassword
                        ? "Passwords do not match"
                        : undefined
                    }
                    required={mode === "create" || password.trim() !== ""}
                    className='mt-3'
                  />
                </div>
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
              <Button type='submit' variant='primary' isLoading={isLoading}>
                {mode === "create" ? "Create Account" : "Update Account"}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Wrapper>
    );
  },
);

UserFormModal.displayName = "UserFormModal";

export default UserFormModal;
