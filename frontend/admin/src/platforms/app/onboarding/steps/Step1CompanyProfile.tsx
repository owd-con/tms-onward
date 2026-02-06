import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompany } from "@/services/company/hooks";

interface Step1CompanyProfileProps {
  data: {
    name: string;
    type: "3PL" | "Carrier";
  };
  onNext: () => void;
  onUpdate: (data: any) => void;
}

const Step1CompanyProfile = ({ data, onNext, onUpdate }: Step1CompanyProfileProps) => {
  const [name, setName] = useState(data.name || "");
  const [type, setType] = useState<"3PL" | "Carrier">(data.type || "3PL");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync state with data prop (for auto-fill)
  useEffect(() => {
    setName(data.name || "");
    setType(data.type || "3PL");
  }, [data]);

  const { updateCompany, updateCompanyResult } = useCompany();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Company name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await updateCompany({
        id: "",
        payload: {
          name: name.trim(),
          type,
        },
      });

      onUpdate({
        name: name.trim(),
        type,
      });

      onNext();
    } catch (error) {
      console.error("Failed to update company profile:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 md:p-8">
        {/* Step Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Company Profile
          </h2>
          <p className="text-base-content/70 text-sm">
            Tell us about your company to personalize your experience
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Company Name */}
          <Input
            id="company-name"
            label="Company Name"
            placeholder="Enter your company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />

          {/* Company Type */}
          <div>
            <label className="pb-2 block">
              <span className="text-base-content text-[10px] leading-[1.2] uppercase font-semibold tracking-[.6px]">
                Company Type <span className="text-error">*</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
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
                <div className="font-semibold text-base-content mb-1">3PL</div>
                <div className="text-xs text-base-content/60">
                  Third-party logistics provider
                </div>
              </button>
              <button
                type="button"
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
                <div className="font-semibold text-base-content mb-1">Carrier</div>
                <div className="text-xs text-base-content/60">
                  Transportation company
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Actions */}
      <div className="bg-base-200 px-6 md:px-8 py-4 flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={updateCompanyResult.isLoading}
        >
          Continue
        </Button>
      </div>
    </form>
  );
};

export default Step1CompanyProfile;
