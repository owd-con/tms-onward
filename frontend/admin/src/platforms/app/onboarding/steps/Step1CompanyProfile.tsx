import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompany } from "@/services/company/hooks";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";

interface Step1CompanyProfileProps {
  data: {
    company_name: string;
    brand_name: string;
    address: string;
    phone: string;
    type: "3PL" | "Carrier";
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
  const [type, setType] = useState<"3PL" | "Carrier">(data.type || "3PL");

  // Sync state with data prop (for auto-fill)
  useEffect(() => {
    setCompanyName(data.company_name || "");
    setBrandName(data.brand_name || "");
    setAddress(data.address || "");
    setPhone(data.phone || "");
    setType(data.type || "3PL");
  }, [data]);

  const { updateCompany, updateCompanyResult } = useCompany();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCompany({
        id: "",
        payload: {
          company_name,
          brand_name,
          address,
          phone,
          type,
        },
      });

      onUpdate({
        company_name,
        brand_name,
        address,
        phone,
        type,
      });

      onNext();
    } catch (error) {
      console.error("Failed to update company profile:", error);
    }
  };

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
              <button
                type='button'
                onClick={() => setType("3PL")}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${
                    type === "3PL"
                      ? "border-primary bg-primary/10"
                      : "border-base-300 hover:border-base-content/30"
                  }
                `}
              >
                <div className='font-semibold text-base-content mb-1'>3PL</div>
                <div className='text-xs text-base-content/60'>
                  Third-party logistics provider
                </div>
              </button>
              <button
                type='button'
                onClick={() => setType("Carrier")}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${
                    type === "Carrier"
                      ? "border-primary bg-primary/10"
                      : "border-base-300 hover:border-base-content/30"
                  }
                `}
              >
                <div className='font-semibold text-base-content mb-1'>
                  Carrier
                </div>
                <div className='text-xs text-base-content/60'>
                  Transportation company
                </div>
              </button>
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
