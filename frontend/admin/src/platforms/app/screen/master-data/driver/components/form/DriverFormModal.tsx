/* eslint-disable react-hooks/exhaustive-deps */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from "react";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";

import {
  Button,
  Checkbox,
  Input,
  Modal,
  Select,
  useEnigmaUI,
} from "@/components";
import { licenseTypeOptions } from "@/shared/options";
import { useDriver } from "@/services/driver/hooks";
import type { Driver } from "@/services/types";

// 1. Type definitions untuk ref
export interface DriverFormModalRef {
  buildPayload: () => {
    name: string;
    license_number: string;
    license_type: string;
    license_expiry?: string;
    phone: string;
    has_login?: boolean;
    email?: string;
    password?: string;
  };
  reset: () => void;
}

// 2. Props interface
interface DriverFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: "create" | "update";
  data?: Driver;
}

// Generate year options - user bebas memilih tahun berapa saja
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const options = [{ label: "Select Expiry Year", value: "" }];
  // 5 tahun ke belakang dan 5 tahun ke depan
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    options.push({ label: y.toString(), value: y.toString() });
  }
  return options;
};

// 3. Component dengan forwardRef
const DriverFormModal = forwardRef<DriverFormModalRef, DriverFormModalProps>(
  ({ open, onClose, onSuccess, mode = "create", data }, ref) => {
    const FormState = useSelector((state: RootState) => state.form);
    const { showToast } = useEnigmaUI();

    // 4. Gunakan hook untuk CRUD operations
    const { create, update, createResult, updateResult } = useDriver();

    // Track success agar hanya handle sekali per submit
    const successHandledRef = useRef(false);

    // 5. State management untuk form fields
    const [name, setName] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [licenseType, setLicenseType] = useState("");
    const [licenseExpiryYear, setLicenseExpiryYear] = useState("");
    const [phone, setPhone] = useState("");

    // Login account fields
    const [hasLogin, setHasLogin] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Generate year options memoized
    const yearOptions = useMemo(() => generateYearOptions(), []);

    // 6. Build payload method
    const buildPayload = () => {
      // Convert year to ISO date format (Dec 31 of that year for expiry)
      let licenseExpiryISO: string | undefined = undefined;
      if (licenseExpiryYear) {
        const year = parseInt(licenseExpiryYear, 10);
        licenseExpiryISO = new Date(year, 11, 31).toISOString();
      }

      const payload: {
        name: string;
        license_number: string;
        license_type: string;
        license_expiry?: string;
        phone: string;
        has_login?: boolean;
        email?: string;
        password?: string;
      } = {
        name,
        license_number: licenseNumber,
        license_type: licenseType,
        license_expiry: licenseExpiryISO,
        phone: phone, // Send phone as-is (backend validates required)
      };

      // Include login fields only if hasLogin is true
      if (hasLogin) {
        payload.has_login = true;
        payload.email = email;
        payload.password = password;
      }

      return payload;
    };

    // 7. Reset form method
    const reset = () => {
      setName("");
      setLicenseNumber("");
      setLicenseType("");
      setLicenseExpiryYear("");
      setPhone("");
      setHasLogin(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
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
        setLicenseNumber(data.license_number ?? "");
        setLicenseType(data.license_type ?? "");

        // Extract year from ISO date string
        if (data.license_expiry) {
          const date = new Date(data.license_expiry);
          setLicenseExpiryYear(date.getFullYear().toString());
        } else {
          setLicenseExpiryYear("");
        }

        setPhone(data.phone ?? "");

        // Check if driver already has login account
        // user_id is valid (not null, not empty UUID) means driver has login
        // NOTE: Don't set hasLogin=true for existing users - hasLogin is only for form control
        // If driver already has login, hasLogin should stay false so the form doesn't
        // validate the email/password fields that are not shown
        // hasLogin stays false - checkbox/form controls won't show for drivers with existing login
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
            message: "Driver created successfully",
            type: "success",
          });
        } else if (updateResult?.isSuccess) {
          showToast({
            message: "Driver updated successfully",
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
        name.trim() !== "" &&
        licenseNumber.trim() !== "" &&
        licenseType !== "" &&
        licenseExpiryYear !== "" &&
        phone.trim() !== "";

      if (!baseValid) return false;

      // Login fields validation (only when hasLogin is true)
      if (hasLogin) {
        return (
          email.trim() !== "" &&
          isValidEmail(email) &&
          password.trim() !== "" &&
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
        className='max-w-2xl'
      >
        <Modal.Header className='mb-2'>
          <div className='text-xl font-bold'>
            {mode === "create" ? "Add New Driver" : "Edit Driver"}
          </div>
          <div className='text-sm text-base-content/60'>
            {mode === "create"
              ? "Fill in the driver information below"
              : "Update driver information"}
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit}>
          <Modal.Body className='max-h-[60vh] overflow-y-auto'>
            <div className='space-y-4'>
              {/* Personal Information */}
              <div>
                <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                  Personal Information
                </h3>

                <Input
                  label='Full Name'
                  placeholder='Driver full name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={FormState?.errors?.name as string}
                  required
                />

                <Input
                  label='Phone'
                  placeholder='08xxxxxxxxxx'
                  type='phone'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={FormState?.errors?.phone as string}
                  required
                />

                {/* Has Login Account Checkbox - Only show for create or drivers without login */}
                {mode === "create" || (mode === "update" && data && (!data.user_id || data.user_id === '00000000-0000-0000-0000-000000000000')) ? (
                  <div className='mt-4'>
                    <Checkbox
                      label='This driver has login account'
                      checked={hasLogin}
                      onChange={(e) => setHasLogin(e.target.checked)}
                      variant='primary'
                      size='sm'
                    />
                    <p className='text-xs text-gray-500 mt-1 ml-7'>
                      Enable this to create a login account for the driver to
                      access the system
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Login Account Information - Conditional */}
              {/* Only show when creating new login (create mode or add login to existing driver without login) */}
              {hasLogin && (mode === "create" || (mode === "update" && data && (!data.user_id || data.user_id === '00000000-0000-0000-0000-000000000000'))) && (
                <div className='mt-6'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                    Login Account Information
                  </h3>

                  <Input
                    label='Email'
                    placeholder='driver@example.com'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={FormState?.errors?.email as string}
                    required
                  />

                  <Input
                    label='Password'
                    placeholder='Enter password (min 8 characters)'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={FormState?.errors?.password as string}
                    required
                    className='mt-3'
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
                    required
                    className='mt-3'
                  />
                </div>
              )}

              {/* License Information */}
              <div className='mt-6'>
                <h3 className='text-sm font-semibold text-gray-700 mb-3'>
                  License Information
                </h3>

                <Input
                  label='License Number'
                  placeholder='e.g., B 1234 XYZ'
                  value={licenseNumber}
                  onChange={(e) =>
                    setLicenseNumber(e.target.value.toUpperCase())
                  }
                  error={FormState?.errors?.license_number as string}
                  required
                />

                <Select
                  label='License Type'
                  options={licenseTypeOptions}
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  error={FormState?.errors?.license_type as string}
                  required
                  className='mt-3'
                />

                <Select
                  label='License Expiry Year'
                  options={yearOptions}
                  value={licenseExpiryYear}
                  onChange={(e) => setLicenseExpiryYear(e.target.value)}
                  error={FormState?.errors?.license_expiry as string}
                  required
                  className='mt-3'
                />
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
                {mode === "create" ? "Create Driver" : "Update Driver"}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Wrapper>
    );
  },
);

DriverFormModal.displayName = "DriverFormModal";

export default DriverFormModal;
