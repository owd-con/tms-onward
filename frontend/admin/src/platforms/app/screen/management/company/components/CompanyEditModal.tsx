/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import { Button, Input, Modal, RemoteSelect } from "@/components";
import { useCompany } from "@/services/company/hooks";
import type { Company } from "@/services/types";
import { companyTypeOptions } from "@/shared/options";
import { PhotoUpload } from "@/platforms/app/components/photo-upload/photo-upload";
import type { SelectOptionValue } from "@/shared/types";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";

const CompanyEditModal = ({
  data,
  onClose,
  onReload,
}: {
  data?: Company;
  onClose: () => void;
  onReload?: () => void;
}) => {
  const FormState = useSelector((state: RootState) => state.form);

  const { updateCompany, updateCompanyResult } = useCompany();

  // Form state
  const [company_name, setCompanyName] = useState(data?.company_name || "");
  const [brand_name, setBrandName] = useState(data?.brand_name || "");
  const [address, setAddress] = useState(data?.address || "");
  const [phone, setPhone] = useState(data?.phone || "");
  const [companyType, setCompanyType] = useState<SelectOptionValue | null>(
    null,
  );
  const [logoPhotos, setLogoPhotos] = useState<string[]>(
    data?.logo_url ? [data.logo_url] : [],
  );

  const handleSubmit = async () => {
    await updateCompany({
      id: data?.id || "",
      payload: {
        company_name,
        type: companyType?.value || "",
        brand_name,
        address,
        phone,
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
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setCompanyType(
        companyTypeOptions.find((opt) => opt.value === data.type) ?? null,
      );
      setLogoPhotos(data.logo_url ? [data.logo_url] : []);
    }
  }, [data]);

  return (
    <Modal.Wrapper
      open
      onClose={onClose}
      closeOnOutsideClick={false}
      className='!w-11/12 !max-w-3xl mx-4'
    >
      <Modal.Header>
        <div className='text-secondary font-bold leading-7 text-lg'>
          Edit Company Profile
        </div>
        <div className='text-sm text-base-content/60 leading-5 font-normal'>
          Update your company identity, contact details, and localization
          settings.
        </div>
      </Modal.Header>

      <Modal.Body className='max-h-[75vh] overflow-y-auto px-2 pb-6'>
        <div className='space-y-6 pt-2'>
          {/* GROUP 1: Brand Identity */}
          <div className='bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
            <div className='mb-5 border-b border-slate-200/60 pb-3'>
              <h3 className='text-[15px] font-bold text-slate-800'>
                Brand Identity
              </h3>
              <p className='text-xs text-slate-500 mt-1'>
                Core company naming and visual assets
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
              <div className='sm:col-span-2 mb-2'>
                <PhotoUpload
                  photos={logoPhotos}
                  onPhotosChange={setLogoPhotos}
                  maxPhotos={1}
                  label='Company Logo'
                  optionalLabel='(Optional)'
                  enableEdit
                />
              </div>
              <Input
                label='Company Name'
                required
                value={company_name}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder='Enter company name'
                error={FormState?.errors?.company_name as string}
              />
              <Input
                label='Brand Name'
                value={brand_name}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder='Enter brand name'
                error={FormState?.errors?.brand_name as string}
              />
              <div className='sm:col-span-2'>
                <RemoteSelect<SelectOptionValue>
                  value={companyType}
                  onChange={(value) => setCompanyType(value)}
                  data={companyTypeOptions}
                  getLabel={(item) => item?.label ?? ""}
                  renderItem={(item) => item?.label}
                  error={FormState?.errors?.company_type as string}
                  required
                  className='h-11 rounded-lg border-gray-200 bg-white'
                />
              </div>
            </div>
          </div>

          {/* GROUP 2: Contact & Location */}
          <div className='bg-slate-50/50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
            <div className='mb-5 border-b border-slate-200/60 pb-3'>
              <h3 className='text-[15px] font-bold text-slate-800'>
                Contact & Location
              </h3>
              <p className='text-xs text-slate-500 mt-1'>
                Primary communication channels and registered address
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
              <div className='sm:col-span-1'>
                <Input
                  label='Phone Number'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='Enter phone number'
                  error={FormState?.errors?.phone as string}
                />
              </div>
              <div className='sm:col-span-2'>
                <Input
                  label='Registered Address'
                  type='textarea'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder='Enter complete company address'
                  error={FormState?.errors?.address as string}
                />
              </div>
            </div>
          </div>
        </div>
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
