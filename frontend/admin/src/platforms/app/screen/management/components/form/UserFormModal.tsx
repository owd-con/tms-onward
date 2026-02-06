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

import { Button, Input, Modal, Select, useEnigmaUI } from "@/components";
import { useUser } from "@/services/user/hooks";
import type { User, UserRole } from "@/services/types";

// 1. Type definitions untuk ref
export interface UserFormModalRef {
  buildPayload: () => {
    name: string;
    email: string;
    password?: string;
    confirm_password?: string;
    phone?: string;
    role: UserRole;
    language?: string;
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

// Role options (Driver is managed through Driver form with has_login option)
const roleOptions: { label: string; value: UserRole }[] = [
  { label: "Admin", value: "admin" },
  { label: "Dispatcher", value: "dispatcher" },
];

// Language options
const languageOptions: { label: string; value: string }[] = [
  { label: "Indonesian", value: "id" },
  { label: "English", value: "en" },
];

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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<UserRole>("admin");
    const [language, setLanguage] = useState("id");

    // 6. Build payload method
    const buildPayload = () => {
      const payload: {
        name: string;
        email: string;
        password?: string;
        confirm_password?: string;
        phone?: string;
        role: UserRole;
        language?: string;
      } = {
        name,
        email,
        role,
        language,
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
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setRole("admin");
      setLanguage("id");
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
        setEmail(data.email ?? "");
        setPassword(""); // Don't populate password on update
        setConfirmPassword("");
        setPhone(data.phone ?? "");
        setRole(data.role ?? "admin");
        setLanguage(data.language ?? "id");
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

    // 14. Validation
    // Helper function for email validation
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const isFormValid = (() => {
      // Base fields validation
      const baseValid =
        name.trim() !== "" && email.trim() !== "" && isValidEmail(email);

      if (!baseValid) return false;

      // Password validation (required on create)
      if (mode === "create") {
        return (
          password.trim() !== "" &&
          password.length >= 8 &&
          password.length <= 64 &&
          confirmPassword.trim() !== "" &&
          password === confirmPassword
        );
      }

      // Password validation on update (only if password is provided)
      if (password.trim()) {
        return (
          password.length >= 8 &&
          password.length <= 64 &&
          confirmPassword.trim() !== "" &&
          password === confirmPassword
        );
      }

      return true;
    })();
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
                  label='Email'
                  placeholder='user@example.com'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={FormState?.errors?.email as string}
                  required
                />

                <Input
                  label='Phone'
                  placeholder='08xxxxxxxxxx (optional)'
                  type='phone'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={FormState?.errors?.phone as string}
                />

                <Select
                  label='Role'
                  options={roleOptions}
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  error={FormState?.errors?.role as string}
                  required
                />

                <Select
                  label='Language'
                  options={languageOptions}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  error={FormState?.errors?.language as string}
                />
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
              <Button
                type='submit'
                variant='primary'
                isLoading={isLoading}
                disabled={!isFormValid}
              >
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
