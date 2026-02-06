import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components";
import { Input } from "@/components/ui/input";
import { WaypointSequenceEditor } from "./WaypointSequenceEditor";
import { useTrip } from "@/services/trip/hooks";
import type { Trip } from "@/services/types";

interface TripUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trip: Trip | null;
}

/**
 * TMS Onward - Trip Update Modal Component
 *
 * Allows updating trip notes and waypoint sequence (LTL only, Planned only).
 *
 * Update Rules based on trip status and order type:
 * - Notes: Always editable
 * - Waypoint Sequence: Only for LTL orders when trip status = "Planned"
 */
export const TripUpdateModal = ({
  open,
  onClose,
  onSuccess,
  trip,
}: TripUpdateModalProps) => {
  const { update, updateResult } = useTrip();

  // Form state
  const [notes, setNotes] = useState("");
  const [waypointSequences, setWaypointSequences] = useState<
    Array<{ order_waypoint_id: string; sequence_number: number }>
  >([]);

  // Reset form when modal opens
  useEffect(() => {
    if (open && trip) {
      setNotes(trip.notes || "");
      // Initialize waypoint sequences from trip.trip_waypoints
      if (trip.trip_waypoints && trip.trip_waypoints.length > 0) {
        const sequences = trip.trip_waypoints.map((wp) => ({
          order_waypoint_id: wp.order_waypoint_id,
          sequence_number: wp.sequence_number,
        }));
        setWaypointSequences(sequences);
      }
    }
  }, [open, trip]);

  // Close modal on success
  useEffect(() => {
    if (updateResult?.isSuccess) {
      onSuccess?.();
      onClose();
    }
  }, [updateResult?.isSuccess, onSuccess, onClose]);

  // Check if waypoint sequence is editable
  const canEditSequence =
    trip?.order?.order_type === "LTL" && trip?.status === "planned";

  // Handle waypoint sequence change
  const handleWaypointSequenceChange = (
    sequences: Array<{ order_waypoint_id: string; sequence_number: number }>,
  ) => {
    setWaypointSequences(sequences);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!trip) return;

    const payload: any = {
      notes,
    };

    // Only include waypoints if editable (LTL + Planned)
    if (canEditSequence) {
      payload.waypoints = waypointSequences.map((seq) => ({
        order_waypoint_id: seq.order_waypoint_id,
        sequence_number: seq.sequence_number,
      }));
    }

    await update({ id: trip.id, payload });
  };

  if (!trip) return null;

  // Convert trip.trip_waypoints to order_waypoints for WaypointSequenceEditor
  const orderWaypoints = useMemo(
    () =>
      (trip.trip_waypoints || [])
        .map((tw) => tw.order_waypoint)
        .filter((wp): wp is NonNullable<typeof wp> => wp !== undefined),
    [trip.trip_waypoints],
  );

  return (
    <Modal.Wrapper
      open
      onClose={onClose}
      closeOnOutsideClick={false}
      className='max-w-2xl w-full mx-4'
    >
      <Modal.Header className='mb-4'>
        <div className='text-xl font-bold'>Update Trip</div>
        <div className='text-sm text-base-content/60'>{trip.trip_number}</div>
      </Modal.Header>

      <Modal.Body className='min-h-[300px]'>
        <div className='space-y-6'>
          {/* Notes Section - Always editable */}
          <div>
            <h3 className='text-base font-semibold mb-2'>Notes</h3>
            <Input
              id='trip-notes'
              label='Trip Notes'
              placeholder='Add notes for this trip...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              type='textarea'
            />
          </div>

          {/* Waypoint Sequence Section - Only for LTL + Planned */}
          {canEditSequence && orderWaypoints && orderWaypoints.length > 0 && (
            <div>
              <WaypointSequenceEditor
                orderType={trip.order.order_type}
                waypoints={orderWaypoints}
                value={waypointSequences}
                onChange={handleWaypointSequenceChange}
                readonly={false}
              />
            </div>
          )}

          {/* Info for non-LTL or non-Planned trips */}
          {!canEditSequence && orderWaypoints && orderWaypoints.length > 0 && (
            <div>
              <WaypointSequenceEditor
                orderType={trip.order.order_type}
                waypoints={orderWaypoints}
                value={waypointSequences}
                onChange={handleWaypointSequenceChange}
                readonly={true}
              />
            </div>
          )}

          {/* Error message */}
          {updateResult?.isError && (
            <div className='alert alert-error'>
              <span>Failed to update trip. Please try again.</span>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className='flex justify-end gap-3'>
          <button
            type='button'
            className='btn btn-secondary'
            onClick={onClose}
            disabled={updateResult?.isLoading}
          >
            Cancel
          </button>
          <button
            type='button'
            className='btn btn-primary'
            onClick={handleSubmit}
            disabled={updateResult?.isLoading}
          >
            {updateResult?.isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Modal.Footer>
    </Modal.Wrapper>
  );
};

TripUpdateModal.displayName = "TripUpdateModal";

export default TripUpdateModal;
