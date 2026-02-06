import { WaypointSequenceEditor } from "./WaypointSequenceEditor";

interface TripStep3WaypointSequenceProps {
  orderType: "FTL" | "LTL";
  orderWaypoints: any[];
  waypointSequences: Array<{ order_waypoint_id: string; sequence_number: number }>;
  onSequencesChange: (sequences: Array<{ order_waypoint_id: string; sequence_number: number }>) => void;
}

const TripStep3WaypointSequence: React.FC<TripStep3WaypointSequenceProps> = ({
  orderType,
  orderWaypoints,
  waypointSequences,
  onSequencesChange,
}) => {
  // Only show content for LTL orders
  if (orderType !== "LTL") {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        Step 3: Arrange Waypoint Sequence
      </h3>
      <p className="text-sm text-base-content/60 mb-4">
        Drag and drop to reorder waypoints. This sequence will be
        used for the trip route.
      </p>

      {orderWaypoints && orderWaypoints.length > 0 ? (
        <WaypointSequenceEditor
          orderType={orderType}
          waypoints={orderWaypoints}
          value={waypointSequences}
          onChange={onSequencesChange}
        />
      ) : (
        <div className="text-sm text-base-content/60">
          No waypoints available for this order.
        </div>
      )}
    </div>
  );
};

export default TripStep3WaypointSequence;
