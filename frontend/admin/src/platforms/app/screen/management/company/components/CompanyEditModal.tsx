/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import { Button, Input, Modal, Select } from "@/components";
import { useCompany } from "@/services/company/hooks";
import type { Company } from "@/services/types";

// Timezone options
const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB)" },
  { value: "Asia/Makassar", label: "Asia/Makassar (WITA)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (WIT)" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok" },
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh" },
  { value: "Asia/Manila", label: "Asia/Manila" },
  { value: "UTC", label: "UTC" },
];

// Currency options
const CURRENCY_OPTIONS = [
  { value: "IDR", label: "IDR - Indonesian Rupiah" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "MYR", label: "MYR - Malaysian Ringgit" },
  { value: "THB", label: "THB - Thai Baht" },
  { value: "VND", label: "VND - Vietnamese Dong" },
  { value: "PHP", label: "PHP - Philippine Peso" },
];

// Language options
const LANGUAGE_OPTIONS = [
  { value: "id", label: "Indonesian (Bahasa Indonesia)" },
  { value: "en", label: "English" },
];

// Company type options
const COMPANY_TYPE_OPTIONS = [
  { value: "3PL", label: "3PL - Third Party Logistics" },
  { value: "Carrier", label: "Carrier - Transportation Company" },
];

const CompanyEditModal = ({
  data,
  onClose,
  onReload,
}: {
  data?: Company;
  onClose: () => void;
  onReload?: () => void;
}) => {
  const { updateCompany, updateCompanyResult } = useCompany();

  // Form state
  const [name, setName] = useState(data?.name || "");
  const [type, setType] = useState<"3PL" | "Carrier">(data?.type || "3PL");
  const [timezone, setTimezone] = useState(data?.timezone || "Asia/Jakarta");
  const [currency, setCurrency] = useState(data?.currency || "IDR");
  const [language, setLanguage] = useState(data?.language || "id");
  const [logoUrl, setLogoUrl] = useState(data?.logo_url || "");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (name.trim()) {
      newErrors.name = "Company name is required";
    }

    if (type) {
      newErrors.type = "Company type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      return;
    }

    try {
      await updateCompany({
        id: data?.id || "",
        payload: {
          name: name.trim(),
          type,
          timezone,
          currency,
          language,
          logo_url: logoUrl.trim() || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to update company:", error);
    }
  };

  // Close modal and reload on successful update
  useEffect(() => {
    if (updateCompanyResult.isSuccess) {
      onClose?.();
      onReload?.();
    }
  }, [updateCompanyResult.isSuccess]);

  // Reset form when data changes
  useEffect(() => {
    if (data) {
      setName(data.name || "");
      setType(data.type || "3PL");
      setTimezone(data.timezone || "Asia/Jakarta");
      setCurrency(data.currency || "IDR");
      setLanguage(data.language || "id");
      setLogoUrl(data.logo_url || "");
    }
  }, [data]);

  return (
    <Modal.Wrapper
      open
      onClose={onClose}
      closeOnOutsideClick={false}
      className="w-xl max-w-xl"
    >
      <Modal.Header>
        <div className="text-secondary font-bold leading-7">
          Edit Company Information
        </div>
        <div className="text-sm text-base-content/60 leading-5 font-normal">
          Update your company details, preferences, and settings.
        </div>
      </Modal.Header>

      <Modal.Body className="space-y-4">
        {/* Company Name */}
        <Input
          label="Company Name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) {
              setErrors({ ...errors, name: "" });
            }
          }}
          error={errors.name}
          placeholder="Enter your company name"
        />

        {/* Company Type */}
        <Select
          label="Company Type"
          required
          options={COMPANY_TYPE_OPTIONS}
          value={type}
          onChange={(e) => {
            setType(e.target.value as "3PL" | "Carrier");
            if (errors.type) {
              setErrors({ ...errors, type: "" });
            }
          }}
          error={errors.type}
        />

        {/* Timezone */}
        <Select
          label="Timezone"
          options={TIMEZONE_OPTIONS}
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />

        {/* Currency */}
        <Select
          label="Currency"
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        />

        {/* Language */}
        <Select
          label="Language"
          options={LANGUAGE_OPTIONS}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        />

        {/* Logo URL */}
        <Input
          label="Logo URL"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          hint="Optional: Enter a URL for your company logo"
        />

        {/* Logo Preview */}
        {logoUrl && (
          <div className="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
            <img
              src={logoUrl}
              alt="Logo Preview"
              className="w-12 h-12 rounded object-cover border border-base-300"
              onError={(e) => {
                e.currentTarget.src = "";
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="flex-1">
              <div className="text-xs text-base-content/60">Logo Preview</div>
              <div className="text-sm text-base-content break-all">{logoUrl}</div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          className="flex-1 rounded-xl"
          styleType="outline"
          variant="secondary"
          onClick={onClose}
          disabled={updateCompanyResult.isLoading}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 rounded-xl"
          variant="secondary"
          onClick={handleSubmit}
          isLoading={updateCompanyResult.isLoading}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

export default CompanyEditModal;
