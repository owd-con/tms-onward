/**
 * Waypoint form components for trip module
 *
 * These are domain-specific forms co-located with the trip pages that use them.
 * They handle waypoint completion and failure reporting workflows.
 *
 * Pattern: forwardRef + useImperativeHandle for buildPayload and reset methods.
 * Error handling via FormState from Redux.
 * Auto-close on success via useEffect watching mutation result.
 */

export {
  CompleteWaypointForm,
  type CompleteWaypointFormProps,
  type CompleteWaypointFormRef,
} from "./CompleteWaypointForm";
export {
  FailWaypointForm,
  type FailWaypointFormProps,
  type FailWaypointFormRef,
} from "./FailWaypointForm";
