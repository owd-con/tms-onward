import { useFormActions } from "@/services/form/hooks";
import { logger } from "@/utils/logger";
import { useDispatch } from "react-redux";
import { createCrudHook } from "../hooks/createCrudHook";
import { useLazyGetMeQuery, useUpdateMeMutation } from "./api";
import { setUser } from "./slice";
import type { User } from "../types";

// Use createCrudHook pattern with proper typing
const useProfileBase = createCrudHook<User>({
  useLazyGetQuery: useLazyGetMeQuery,
  useUpdateMutation: useUpdateMeMutation,
  entityName: "profile",
});

export const useProfile = () => {
  const dispatch = useDispatch();
  const { failureWithTimeout } = useFormActions();

  // Use the standardized hook
  const { get: getMeBase, getResult: getMeResult, update: updateMeBase, updateResult: updateMeResult } = useProfileBase();

  const getMe = async (params?: Record<string, unknown>) => {
    try {
      const res = await getMeBase(params);

      // Handle the unwrapped result manually since createCrudHook unwraps it
      // But we need to check if the result structure matches what we expect
      // The original code expected: if (res?.success)

      // If createCrudHook returns the data directly or the full response depends on api definition.
      // RTK Query hooks usually return the data structure.
      // createCrudHook return await trigger(params).unwrap();

      if (res && (res as any).success) {
        const data = (res as any).data;
        dispatch(setUser(data));
      }
      return res;
    } catch (err) {
      logger.error("Failed to get profile", err);
      throw err; // Re-throw to match original behavior
    }
  };

  const updateMe = async (payload: Record<string, unknown>) => {
    try {
      // @ts-expect-error Generic hook payload mismatch
      await updateMeBase({ payload });
    } catch (err) {
      failureWithTimeout(err);
    }
  };

  return { getMe, getMeResult, updateMe, updateMeResult };
};
