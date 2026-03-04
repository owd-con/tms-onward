/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import { Button, Input, Modal, RemoteSelect } from "@/components";
import { useCompany } from "@/services/company/hooks";
import type { Company } from "@/services/types";
import { companyTypeOptions } from "@/shared/options";

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
  const [type, setType] = useState<{ label: string; value: "3PL" | "Carrier" }>(
    companyTypeOptions.find(opt => opt.value === (data?.type || "3PL")) || companyTypeOptions[0]
  );
  const [timezone, setTimezone] = useState(data?.timezone || "Asia/Jakarta");
  const [currency, setCurrency] = useState(data?.currency || "IDR");
  const [language, setLanguage] = useState(data?.language || "id");
  const [logoUrl, setLogoUrl] = useState(data?.logo_url || "");

  const handleSubmit = async () => {
    await updateCompany({
      id: data?.id || "",
      payload: {
        name: name.trim(),
        type: type.value,
        timezone,
        currency,
        language,
        logo_url: logoUrl.trim() || undefined,
      },
    });
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
      setType(companyTypeOptions.find(opt => opt.value === data.type) || companyTypeOptions[0]);
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
      className='w-xl max-w-xl'
    >
      <Modal.Header>
        <div className='text-secondary font-bold leading-7'>
          Edit Company Information
        </div>
        <div className='text-sm text-base-content/60 leading-5 font-normal'>
          Update your company details, preferences, and settings.
        </div>
      </Modal.Header>

      <Modal.Body className='space-y-4'>
        {/* Company Name */}
        <Input
          label='Company Name'
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Enter your company name'
        />

        {/* Company Type */}
        <RemoteSelect
          label='Company Type'
          required
          value={type}
          onChange={(value) => setType(value)}
          data={companyTypeOptions}
          getLabel={(item) => item.label}
          getValue={(item) => item.value}
        />

        {/* Logo URL */}
        <Input
          label='Logo URL'
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder='https://example.com/logo.png'
          hint='Optional: Enter a URL for your company logo'
        />

        {/* Logo Preview */}
        {logoUrl && (
          <div className='flex items-center gap-4 p-3 bg-base-200 rounded-lg'>
            <img
              src={logoUrl}
              alt='Logo Preview'
              className='w-12 h-12 rounded object-cover border border-base-300'
              onError={(e) => {
                e.currentTarget.src = "";
                e.currentTarget.style.display = "none";
              }}
            />
            <div className='flex-1'>
              <div className='text-xs text-base-content/60'>Logo Preview</div>
              <div className='text-sm text-base-content break-all'>
                {logoUrl}
              </div>
            </div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          className='flex-1 rounded-xl'
          styleType='outline'
          variant='secondary'
          onClick={onClose}
          disabled={updateCompanyResult.isLoading}
        >
          Cancel
        </Button>
        <Button
          className='flex-1 rounded-xl'
          variant='secondary'
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
