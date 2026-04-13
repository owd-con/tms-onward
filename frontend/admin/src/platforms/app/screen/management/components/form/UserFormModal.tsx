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
        className='!w-11/12 !max-w-3xl mx-4'
      >
        <Modal.Header className='mb-4'>
          <div className='text-secondary font-bold leading-7 text-lg'>
            {mode === "create" ? "Add Team Member" : "Edit Team Member"}
          </div>
          <div className='text-sm text-base-content/60 leading-5 font-normal'>
            {mode === "create"
              ? "Create a new account and set permissions"
              : "Update user information and access"}
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit}>
          <Modal.Body className='max-h-[75vh] overflow-y-auto px-2 pb-6'>
            <div className='space-y-6 pt-2'>

              {/* GROUP 1: User Details */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="mb-5 border-b border-slate-200/60 pb-3">
                  <h3 className="text-[15px] font-bold text-slate-800">User Identity</h3>
                  <p className="text-xs text-slate-500 mt-1">Core identity and system role</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    placeholder='Enter username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    error={FormState?.errors?.username as string}
                    required
                  />

                  <div className="sm:col-span-2">
                    <label className='text-sm font-medium mb-1.5 block text-slate-700'>System Role</label>
                    <div className='w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 capitalize cursor-not-allowed select-none'>
                      {role}
                    </div>
                  </div>
                </div>
              </div>

              {/* GROUP 2: Contact Methods */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="mb-5 border-b border-slate-200/60 pb-3">
                  <h3 className="text-[15px] font-bold text-slate-800">Contact Methods</h3>
                  <p className="text-xs text-slate-500 mt-1">Primary communication channels</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                </div>
              </div>

              {/* GROUP 3: Authentication */}
              {(mode === "create" || mode === "update") && (
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="mb-5 border-b border-slate-200/60 pb-3">
                    <h3 className="text-[15px] font-bold text-slate-800">Authentication</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {mode === "create"
                        ? "Set initial login credentials"
                        : "Update user password (leave blank to keep current)"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label={mode === "create" ? "Password" : "New Password"}
                      placeholder={
                        mode === "create"
                          ? "Enter password (min 8 characters)"
                          : "Enter new password"
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
                    />
                  </div>
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
