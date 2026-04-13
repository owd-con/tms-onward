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

import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Modal,
  RemoteSelect,
  useEnigmaUI,
} from "@/components";
import { licenseTypeOptions } from "@/shared/options";
import type { SelectOptionValue } from "@/shared/types";
import { useDriver } from "@/services/driver/hooks";
import type { Driver } from "@/services/types";
import dayjs from "dayjs";

// 1. Type definitions untuk ref
export interface DriverFormModalRef {
  buildPayload: () => {
    name: string;
    license_number: string;
    license_type: string;
    license_expiry?: string;
    phone: string;
    has_login?: boolean;
    username?: string;
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
    const [licenseType, setLicenseType] = useState<SelectOptionValue | null>(
      null,
    );
    const [licenseExpiryYear, setLicenseExpiryYear] = useState<
      dayjs.Dayjs | undefined
    >(undefined);
    const [phone, setPhone] = useState("");

    // Login account fields
    const [hasLogin, setHasLogin] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // 6. Build payload method
    const buildPayload = () => {
      // Convert year to ISO date format (Dec 31 of that year for expiry)
      let licenseExpiryISO: string | undefined = undefined;
      if (licenseExpiryYear) {
        licenseExpiryISO = licenseExpiryYear.endOf("year").toISOString();
      }

      const payload: {
        name: string;
        license_number: string;
        license_type: string;
        license_expiry?: string;
        phone: string;
        has_login?: boolean;
        username?: string;
        password?: string;
        confirm_password?: string;
      } = {
        name,
        license_number: licenseNumber,
        license_type: licenseType?.value ? String(licenseType.value) : "",
        license_expiry: licenseExpiryISO,
        phone: phone, // Send phone as-is (backend validates required)
      };

      // Include login fields only if hasLogin is true
      if (hasLogin) {
        payload.has_login = true;
        payload.username = username;
        payload.password = password;
        payload.confirm_password = confirmPassword;
      }

      return payload;
    };

    // 7. Reset form method
    const reset = () => {
      setName("");
      setLicenseNumber("");
      setLicenseType(null);
      setLicenseExpiryYear(undefined);
      setPhone("");
      setHasLogin(false);
      setUsername("");
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
        setLicenseType(
          licenseTypeOptions.find((opt) => opt.value === data.license_type) ??
            null,
        );

        // Extract year from ISO date string
        if (data.license_expiry) {
          setLicenseExpiryYear(dayjs(data.license_expiry));
        } else {
          setLicenseExpiryYear(undefined);
        }

        setPhone(data.phone ?? "");

        // Check if driver already has login account
        // user_id is valid (not null, not empty UUID) means driver has login
        // NOTE: Don't set hasLogin=true for existing users - hasLogin is only for form control
        // If driver already has login, hasLogin should stay false so the form doesn't
        // validate the username/password fields that are not shown
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

    const isLoading = createResult?.isLoading || updateResult?.isLoading;

    return (
      <Modal.Wrapper
        open={open}
        onClose={handleClose}
        closeOnOutsideClick={false}
        className='!max-w-3xl !w-11/12 mx-4'
      >
        <Modal.Header className='mb-4'>
          <div className='text-secondary font-bold leading-7 text-lg'>
            {mode === "create" ? "Add New Driver" : "Edit Driver"}
          </div>
          <div className='text-sm text-base-content/60 leading-5 font-normal'>
            {mode === "create"
              ? "Register a new driver into the system"
              : "Update driver profile and access credentials"}
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit}>
          <Modal.Body className='max-h-[75vh] overflow-y-auto px-2 pb-6'>
            <div className='space-y-6 pt-2'>
              
               {/* GROUP 1: Personal Information */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="mb-5 border-b border-slate-200/60 pb-3">
                  <h3 className="text-[15px] font-bold text-slate-800">Personal Information</h3>
                  <p className="text-xs text-slate-500 mt-1">Core identity and primary communication methods</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label='Full Name'
                    placeholder='Driver full name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={FormState?.errors?.name as string}
                    required
                  />

                  <Input
                    label='Phone Number'
                    placeholder='08xxxxxxxxxx'
                    type='phone'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={FormState?.errors?.phone as string}
                    required
                  />

                  {/* Has Login Account Checkbox - Only show for create or drivers without login */}
                  {mode === "create" ||
                  (mode === "update" &&
                    data &&
                    (!data.user_id ||
                      data.user_id ===
                        "00000000-0000-0000-0000-000000000000")) ? (
                    <div className='sm:col-span-2 mt-2 bg-white border border-slate-200 rounded-xl p-4'>
                      <Checkbox
                        label='This driver requires a system login account'
                        checked={hasLogin}
                        onChange={(e) => setHasLogin(e.target.checked)}
                        variant='primary'
                        size='sm'
                      />
                      <p className='text-xs text-slate-500 mt-1.5 ml-7'>
                        Enable this to generate secure application credentials for the driver
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* GROUP 2: Login Account Information - Conditional */}
              {hasLogin &&
                (mode === "create" ||
                  (mode === "update" &&
                    data &&
                    (!data.user_id ||
                      data.user_id ===
                        "00000000-0000-0000-0000-000000000000"))) && (
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                    <div className="mb-5 border-b border-slate-200/60 pb-3">
                      <h3 className="text-[15px] font-bold text-slate-800">System Credentials</h3>
                      <p className="text-xs text-slate-500 mt-1">Application access configuration</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <Input
                          label='System Username'
                          placeholder='Enter unique username'
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          error={FormState?.errors?.username as string}
                          required
                        />
                      </div>

                      <Input
                        label='Password'
                        placeholder='Min. 8 characters'
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={FormState?.errors?.password as string}
                        required
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
                      />
                    </div>
                  </div>
                )}

              {/* GROUP 3: License Information */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                 <div className="mb-5 border-b border-slate-200/60 pb-3">
                  <h3 className="text-[15px] font-bold text-slate-800">License Information</h3>
                  <p className="text-xs text-slate-500 mt-1">Driving certification and validation details</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Input
                      label='License Number'
                      placeholder='e.g., SIM B1 Umum'
                      value={licenseNumber}
                      onChange={(e) =>
                        setLicenseNumber(e.target.value.toUpperCase())
                      }
                      error={FormState?.errors?.license_number as string}
                      required
                    />
                  </div>

                  <RemoteSelect<SelectOptionValue>
                    label='License Classification'
                    data={licenseTypeOptions}
                    value={licenseType}
                    onChange={setLicenseType}
                    onClear={() => setLicenseType(null)}
                    getLabel={(item) => item?.label ?? ""}
                    renderItem={(item) => item?.label}
                    error={FormState?.errors?.license_type as string}
                    required
                  />

                  <DatePicker
                    label='Expiration Year'
                    placeholder='Select year'
                    pickerMode='year'
                    format='YYYY'
                    value={licenseExpiryYear}
                    onChange={(date) =>
                      setLicenseExpiryYear(date as dayjs.Dayjs | undefined)
                    }
                    error={FormState?.errors?.license_expiry as string}
                    required
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
              <Button type='submit' variant='primary' isLoading={isLoading}>
                {mode === "create" ? "Create Driver" : "Update Driver"}
              </Button>
            </div>
          </Modal.Footer>
        </form>
      </Modal.Wrapper>
    );
  },
);

// Named export (no displayName needed in modern React)
export default DriverFormModal;
