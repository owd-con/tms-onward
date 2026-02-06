import { createCrudHook } from "../hooks/createCrudHook";
import {
  useLazyGetCompaniesQuery,
  useUpdateCompaniesMutation,
  useCompleteOnboardingMutation,
} from "./api";
import type { Company } from "../types";

/**
 * TMS Onward - Company Hook
 *
 * Custom hook for company operations using createCrudHook pattern.
 * Provides methods for getting, updating company info, and completing onboarding.
 */
const useCompanyBase = createCrudHook<Company>({
  useLazyGetQuery: useLazyGetCompaniesQuery,
  useUpdateMutation: useUpdateCompaniesMutation,
  customOperations: {
    completeOnboarding: {
      hook: useCompleteOnboardingMutation,
      errorMessage: "Failed to complete onboarding",
      requiresId: false, // Onboarding completion doesn't require an ID
    },
  },
  entityName: "company",
});

export const useCompany = () => {
  // Use the standardized hook with custom operations
  const {
    get,
    getResult,
    update,
    updateResult,
    completeOnboarding,
    completeOnboardingResult,
  } = useCompanyBase();

  return {
    // Get current user's company
    getCompany: get,
    getCompanyResult: getResult,

    // Update company information
    updateCompany: update,
    updateCompanyResult: updateResult,

    // Complete onboarding
    completeOnboarding,
    completeOnboardingResult,
  };
};
