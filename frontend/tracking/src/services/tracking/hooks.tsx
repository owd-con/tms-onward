/**
 * TMS Onward - Tracking Service Hooks
 *
 * Custom hooks for public order tracking
 */

import { useLazyGetTrackingByOrderNumberQuery } from "./api";

/**
 * Tracking hook for public order tracking
 * @example
 * ```tsx
 * const { getTrackingByOrderNumber, getTrackingByOrderNumberResult } = useTracking();
 *
 * await getTrackingByOrderNumber("ORD-001");
 * const data = getTrackingByOrderNumberResult?.data;
 * ```
 */
export function useTracking() {
  const [getTrackingByOrderNumber, getTrackingByOrderNumberResult] = useLazyGetTrackingByOrderNumberQuery();

  return {
    getTrackingByOrderNumber,
    getTrackingByOrderNumberResult,
  };
}
