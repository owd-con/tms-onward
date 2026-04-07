/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import { Button, Input, Modal, RemoteSelect } from "@/components";
import { useCompany } from "@/services/company/hooks";
import type { Company } from "@/services/types";
import { companyTypeOptions } from "@/shared/options";
import { PhotoUpload } from "@/platforms/app/components/photo-upload/photo-upload";

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
  const [company_name, setCompanyName] = useState(data?.company_name || "");
  const [brand_name, setBrandName] = useState(data?.brand_name || "");
  const [address, setAddress] = useState(data?.address || "");
  const [type, setType] = useState<{ label: string; value: "3PL" | "Carrier" }>(
    companyTypeOptions.find((opt) => opt.value === (data?.type || "3PL")) ||
      companyTypeOptions[0],
  );
  const [logoPhotos, setLogoPhotos] = useState<string[]>(
    data?.logo_url ? [data.logo_url] : [],
  );

  const handleSubmit = async () => {
    await updateCompany({
      id: data?.id || "",
      payload: {
        company_name: company_name.trim(),
        type: type.value,
        brand_name: brand_name.trim(),
        address,
        logo_url: logoPhotos[0] || undefined,
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
      setCompanyName(data.company_name || "");
      setBrandName(data.brand_name || "");
      setAddress(data.address || "");
      setType(
        companyTypeOptions.find((opt) => opt.value === data.type) ||
          companyTypeOptions[0],
      );
      setLogoPhotos(data.logo_url ? [data.logo_url] : []);
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

        {/* Company Name */}
        <Input
          label='Company Name'
          required
          value={company_name}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder='Enter your company name'
        />

        <Input
          label='Brand Name'
          value={brand_name}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder='Enter your brand name'
        />

        <Input
          label='Address '
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        {/* Logo Upload */}
        <PhotoUpload
          photos={logoPhotos}
          onPhotosChange={setLogoPhotos}
          maxPhotos={1}
          label='Company Logo'
          optionalLabel='(Optional)'
        />
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
