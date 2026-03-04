import { createCrudHook } from "../hooks/createCrudHook";
import {
  useOnboardingStep1Mutation,
  useOnboardingStep2Mutation,
  useOnboardingStep3Mutation,
  useOnboardingStep4Mutation,
  useOnboardingStep5Mutation,
  useLazyGetOnboardingStatusQuery,
} from "./api";

/**
 * TMS Onward - Onboarding Hooks
 *
 * Provides methods for onboarding wizard steps
 */
export const useOnboarding = createCrudHook({
  useLazyGetQuery: useLazyGetOnboardingStatusQuery,
  customOperations: {
    onboardingStep1: {
      hook: useOnboardingStep1Mutation,
      errorMessage: "Failed to update profile",
      requiresId: false,
    },
    onboardingStep2: {
      hook: useOnboardingStep2Mutation,
      errorMessage: "Failed to update users",
      requiresId: false,
    },
    onboardingStep3: {
      hook: useOnboardingStep3Mutation,
      errorMessage: "Failed to update vehicles",
      requiresId: false,
    },
    onboardingStep4: {
      hook: useOnboardingStep4Mutation,
      errorMessage: "Failed to update drivers",
      requiresId: false,
    },
    onboardingStep5: {
      hook: useOnboardingStep5Mutation,
      errorMessage: "Failed to update customers",
      requiresId: false,
    },
  },
  entityName: "onboarding",
});
