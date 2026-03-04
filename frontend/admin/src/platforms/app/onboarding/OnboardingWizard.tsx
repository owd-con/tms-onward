import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/services/company/hooks";
import { useProfile } from "@/services/profile/hooks";
import type { RootState } from "@/services/store";
import { useSelector } from "react-redux";
import { HiCheckCircle } from "react-icons/hi2";

import Step1CompanyProfile from "./steps/Step1CompanyProfile";
import Step2AddUsers from "./steps/Step2AddUsers";
import Step3AddVehicles from "./steps/Step3AddVehicles";
import Step4AddDrivers from "./steps/Step4AddDrivers";
import Step5AddCustomers from "./steps/Step5AddCustomers";
import OnboardingCompletePage from "./OnboardingCompletePage";

export type OnboardingData = {
  step1: {
    name: string;
    type: "3PL" | "Carrier";
  };
  step2: {
    usersCreated: number;
  };
  step3: {
    vehiclesCreated: number;
  };
  step4: {
    driversCreated: number;
  };
  step5: {
    customersCreated: number;
  };
};

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const Profile = useSelector((state: RootState) => state.userProfile);
  const { completeOnboarding, completeOnboardingResult } = useCompany();
  const { getMe } = useProfile();

  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    step1: {
      name: "",
      type: "3PL",
    },
    step2: { usersCreated: 0 },
    step3: { vehiclesCreated: 0 },
    step4: { driversCreated: 0 },
    step5: { customersCreated: 0 },
  });
  const [isCompleted, setIsCompleted] = useState(false);

  const totalSteps = 5;

  // Auto-fill step 1 if company data already exists
  useEffect(() => {
    if (Profile?.user?.company) {
      const company = Profile.user.company;
      setOnboardingData((prev) => ({
        ...prev,
        step1: {
          name: company.name || "",
          type: company.type || "3PL",
        },
      }));
    }
  }, [Profile]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      await completeOnboarding({});
      setIsCompleted(true);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  const handleGoToDashboard = async () => {
    // Refresh userProfile to update onboarding status before navigating
    await getMe();
    navigate("/a/dashboard", { replace: true });
  };

  const updateOnboardingData = (step: keyof OnboardingData, data: any) => {
    setOnboardingData((prev) => ({
      ...prev,
      [step]: { ...prev[step], ...data },
    }));
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CompanyProfile
            data={onboardingData.step1}
            onNext={handleNext}
            onUpdate={(data) => updateOnboardingData("step1", data)}
          />
        );
      case 2:
        return (
          <Step2AddUsers
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            onUpdate={(data) => updateOnboardingData("step2", data)}
          />
        );
      case 3:
        return (
          <Step3AddVehicles
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            onUpdate={(data) => updateOnboardingData("step3", data)}
          />
        );
      case 4:
        return (
          <Step4AddDrivers
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            onUpdate={(data) => updateOnboardingData("step4", data)}
          />
        );
      case 5:
        return (
          <Step5AddCustomers
            onNext={handleCompleteOnboarding}
            onBack={handleBack}
            onSkip={handleCompleteOnboarding}
            onUpdate={(data) => updateOnboardingData("step5", data)}
            isLoading={completeOnboardingResult.isLoading}
          />
        );
      default:
        return null;
    }
  };

  // Show completion page if onboarding is completed
  if (isCompleted) {
    return (
      <OnboardingCompletePage
        data={onboardingData}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

  return (
    <div className='min-h-screen bg-base-200 py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-base-content mb-2'>
            Welcome to TMS Onward
          </h1>
          <p className='text-base-content/70'>
            Let's set up your account in a few simple steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className='bg-base-100 rounded-xl p-6 mb-8 shadow-sm'>
          <div className='flex items-center justify-between'>
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;

              return (
                <div key={stepNumber} className='flex items-center flex-1'>
                  {/* Step Circle */}
                  <div className='flex flex-col items-center flex-1'>
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                        ${
                          isCompleted
                            ? "bg-success text-success-content"
                            : isCurrent
                              ? "bg-primary text-primary-content"
                              : "bg-base-300 text-base-content/50"
                        }
                      `}
                    >
                      {isCompleted ? <HiCheckCircle size={20} /> : stepNumber}
                    </div>
                    <span
                      className={`
                        text-xs mt-2 font-medium
                        ${
                          isCurrent
                            ? "text-primary"
                            : isCompleted
                              ? "text-success"
                              : "text-base-content/50"
                        }
                      `}
                    >
                      {stepNumber === 1 && "Company"}
                      {stepNumber === 2 && "Users"}
                      {stepNumber === 3 && "Vehicles"}
                      {stepNumber === 4 && "Drivers"}
                      {stepNumber === 5 && "Customer"}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {stepNumber < totalSteps && (
                    <div
                      className={`
                        h-0.5 flex-1 mx-2
                        ${
                          stepNumber < currentStep
                            ? "bg-success"
                            : "bg-base-300"
                        }
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className='bg-base-100 rounded-xl shadow-sm'>{renderStep()}</div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
