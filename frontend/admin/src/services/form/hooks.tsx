/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch } from "react-redux";
import { failure, reset, requesting, success } from "./slice";
import type { AppDispatch } from "../store";
import { useEnigmaUI } from "@/components";

export function useFormActions() {
  const dispatch = useDispatch<AppDispatch>();

  const { showToast } = useEnigmaUI();

  const failureWithTimeout = (payload: any, timeout = 10000) => {
    dispatch(failure(payload));

    if (payload?.data?.errors?.id) {
      showToast({
        message: payload?.data?.errors?.id,
        type: "error",
        position: "bottom-center",
        duration: 5000,
      });
    }

    setTimeout(() => {
      dispatch(reset());
    }, timeout);
  };

  return {
    reset: () => dispatch(reset()),
    requesting: () => dispatch(requesting()),
    success: () => dispatch(success()),
    failure: (payload: unknown) => dispatch(failure(payload)),
    failureWithTimeout,
  };
}
