import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompany } from "@/services/company/hooks";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";
import { companyTypeOptions } from "@/shared/options";
import type { SelectOptionValue } from "@/shared/types";
import { RemoteSelect } from "@/components";

interface Step1CompanyProfileProps {
  data: {
    company_name: string;
    type: string;
    brand_name: string;
    address: string;
    phone: string;
  };
  onNext: () => void;
  onUpdate: (data: any) => void;
}

const Step1CompanyProfile = ({
  data,
  onNext,
  onUpdate,
}: Step1CompanyProfileProps) => {
  const FormState = useSelector((state: RootState) => state.form);

  const [company_name, setCompanyName] = useState(data.company_name || "");
  const [brand_name, setBrandName] = useState(data.brand_name || "");
  const [address, setAddress] = useState(data.address || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [companyType, setCompanyType] = useState<SelectOptionValue | null>(
    null,
  );
  // Sync state with data prop (for auto-fill)
  useEffect(() => {
    setCompanyName(data.company_name || "");
    setBrandName(data.brand_name || "");
    setAddress(data.address || "");
    setPhone(data.phone || "");
    setCompanyType(
      companyTypeOptions.find((opt) => opt.value === data.type) ?? null,
    );
  }, [data]);

  const { updateCompany, updateCompanyResult } = useCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateCompany({
      id: "",
      payload: {
        company_name,
        type: companyType?.value || "",
        brand_name,
        address,
        phone,
      },
    });
  };

  // Handle success
  useEffect(() => {
    if (updateCompanyResult.isSuccess) {
      const data = (updateCompanyResult?.data as any)?.data;

      onUpdate(data);
      onNext();
    }
  }, [updateCompanyResult.isSuccess]);

  return (
    <form onSubmit={handleSubmit}>
      <div className='p-6 md:p-8'>
        {/* Step Header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-base-content mb-2'>
            Company Profile
          </h2>
          <p className='text-base-content/70 text-sm'>
            Tell us about your company to personalize your experience
          </p>
        </div>

        {/* Form Fields */}
        <div className='space-y-4'>
          {/* Company Type */}
          <div>
            <label className='pb-2 block'>
              <span className='text-base-content text-[10px] leading-[1.2] uppercase font-semibold tracking-[.6px]'>
                Company Type <span className='text-error'>*</span>
              </span>
            </label>
            <div className='grid grid-cols-2 gap-3'>
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

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Company Name */}
            <Input
              id='company-name'
              label='Company Name'
              placeholder='Enter your company name'
              value={company_name}
              onChange={(e) => setCompanyName(e.target.value)}
              error={FormState?.errors.company_name as string}
              required
            />
            {/* Brand Name */}
            <Input
              id='brand-name'
              label='Brand Name'
              placeholder='Enter your brand name'
              value={brand_name}
              onChange={(e) => setBrandName(e.target.value)}
              error={FormState?.errors.brand_name as string}
            />

            {/* Phone */}
            <Input
              id='phone'
              label='Phone'
              placeholder='Enter your phone'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={FormState?.errors.phone as string}
            />

            {/* address */}
            <Input
              id='address'
              label='Address'
              type='textarea'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='bg-base-200 px-6 md:px-8 py-4 flex justify-end'>
        <Button
          type='submit'
          variant='primary'
          isLoading={updateCompanyResult.isLoading}
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default Step1CompanyProfile;
