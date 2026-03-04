import { memo, useState, useCallback, useEffect, useRef } from "react";
import type { PreviewTripWaypoint, TripWaypoint, OrderType } from "@/services/types";
import { HiMapPin, HiOutlineCube, HiBars3 } from "react-icons/hi2";
import { useOrder } from "@/services/order/hooks";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ShipmentSequenceEditorProps {
  // Mode CREATE: data diambil dari order
  orderId?: string | null;
  orderType?: OrderType;

  // Mode UPDATE: data langsung dari trip (read-only)
  initialWaypoints?: TripWaypoint[] | null;
  isReadOnly?: boolean; // Force read-only mode

  /** Called when waypoints are loaded or reordered */
  onChange?: (waypoints: Array<PreviewTripWaypoint | TripWaypoint>) => void;
}

/**
 * Sortable Waypoint Item Component
 *
 * Individual waypoint item that can be dragged and dropped
 */
interface SortableWaypointItemProps {
  waypoint: PreviewTripWaypoint | TripWaypoint;
  index: number;
  isReadOnly: boolean;
}

const SortableWaypointItem = memo(
  ({ waypoint, index, isReadOnly }: SortableWaypointItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: (waypoint as any)._internalKey || `${waypoint.type}-${waypoint.address_id}`,
      disabled: isReadOnly,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          flex items-center gap-3 p-3 rounded-lg border-2
          ${
            waypoint.type === "pickup"
              ? "bg-success/10 border-success/30"
              : "bg-info/10 border-info/30"
          }
          ${isReadOnly ? "opacity-75" : ""}
          ${!isReadOnly ? "cursor-move hover:shadow-md transition-shadow" : ""}
          ${isDragging ? "opacity-50 shadow-lg" : ""}
        `}
      >
        {/* Drag Handle */}
        {!isReadOnly && (
          <button
            className='flex-shrink-0 text-base-content/40 hover:text-base-content/60 cursor-grab active:cursor-grabbing'
            {...attributes}
            {...listeners}
            type='button'
            aria-label='Drag to reorder'
          >
            <HiBars3 className='w-5 h-5' />
          </button>
        )}

        {/* Sequence Number Badge */}
        <div
          className={`
          flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
          ${
            waypoint.type === "pickup"
              ? "bg-success text-success-content"
              : "bg-info text-info-content"
          }
        `}
        >
          {index + 1}
        </div>

        {/* Waypoint Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-sm capitalize'>
              {waypoint.type} Waypoint
            </span>
          </div>

          {/* Location */}
          <div className='text-sm font-medium text-base-content mt-1'>
            {waypoint.location_name}
            {waypoint.location_name && waypoint.address && (
              <span className='text-base-content/70'> - </span>
            )}
            {waypoint.address}
          </div>

          {/* Contact */}
          {(waypoint.contact_name || waypoint.contact_phone) && (
            <div className='text-xs text-base-content/70 mt-1'>
              {waypoint.contact_name && (
                <span>Contact: {waypoint.contact_name}</span>
              )}
              {waypoint.contact_phone && (
                <span className='ml-2'>{waypoint.contact_phone}</span>
              )}
            </div>
          )}

          {/* Shipments Info - only show if more than 1 shipment */}
          {(((waypoint as any).shipment_count > 1 || (waypoint as TripWaypoint).shipment_ids?.length > 1)) && (
            <div className='mt-2 flex items-center gap-1.5 text-xs text-base-content/60'>
              <HiOutlineCube className='w-3.5 h-3.5' />
              <span>
                {(waypoint as any).shipment_count || (waypoint as TripWaypoint).shipment_ids?.length || 0} shipments
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

export const ShipmentSequenceEditor = memo(
  ({
    orderId,
    orderType,
    initialWaypoints,
    isReadOnly: isReadOnlyProp,
    onChange,
  }: ShipmentSequenceEditorProps) => {
    // State for draggable waypoints (PreviewTripWaypoint for CREATE, TripWaypoint for UPDATE)
    const [items, setItems] = useState<Array<PreviewTripWaypoint | TripWaypoint>>([]);
    const [waypoints, setWaypoints] = useState<Array<PreviewTripWaypoint | TripWaypoint>>([]);

    // Store onChange in ref to avoid dependency issues
    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    // Fetch waypoint preview (CREATE mode only)
    const { getWaypointPreview, getWaypointPreviewResult } = useOrder();

    // Determine mode: UPDATE if initialWaypoints provided, else CREATE
    const isUpdateMode = initialWaypoints !== undefined && initialWaypoints !== null;

    // Determine read-only state (only use isReadOnlyProp, don't auto-disable in UPDATE mode)
    const isReadOnly = isReadOnlyProp;

    // CREATE mode: fetch from order
    useEffect(() => {
      if (isUpdateMode) {
        // UPDATE mode: use initialWaypoints directly
        if (initialWaypoints && Array.isArray(initialWaypoints)) {
          // Add unique key for each waypoint
          const waypointsWithKeys = initialWaypoints.map((wp, idx) => ({
            ...wp,
            _internalKey: wp.id || `${wp.type}-${wp.address_id}-${wp.sequence_number ?? idx}`,
          }));
          setWaypoints(waypointsWithKeys);
          setItems(waypointsWithKeys);
          // Notify parent when waypoints are loaded
          if (onChangeRef.current) {
            onChangeRef.current(waypointsWithKeys);
          }
        }
      } else {
        // CREATE mode: fetch from order
        if (orderId) {
          getWaypointPreview({ id: orderId });
        }
      }
    }, [orderId, isUpdateMode, initialWaypoints]);

    // Extract waypoints from API response (CREATE mode only)
    useEffect(() => {
      if (isUpdateMode) return; // Skip in UPDATE mode

      if (getWaypointPreviewResult?.data) {
        const result = getWaypointPreviewResult?.data
          ?.data as PreviewTripWaypoint[];
        if (result && Array.isArray(result)) {
          // Add unique key for each waypoint to handle duplicates (same location, different shipments)
          const waypointsWithKeys = result.map((wp, idx) => ({
            ...wp,
            _internalKey: `${wp.type}-${wp.address_id}-${wp.sequence_number ?? idx}`,
          }));
          setWaypoints(waypointsWithKeys);
          setItems(waypointsWithKeys);
          // Notify parent when waypoints are loaded
          if (onChangeRef.current) {
            onChangeRef.current(waypointsWithKeys);
          }
        }
      }
    }, [getWaypointPreviewResult, isUpdateMode]);

    const isFTL = orderType === "FTL";
    // LTL is editable (can reorder), FTL is always read-only
    // isReadOnlyProp can force read-only mode if needed
    const isDragDisabled = isReadOnly || isFTL;

    // DnD sensors
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setItems((items) => {
          const oldIndex = items.findIndex(
            (item) => (item as any)._internalKey === active.id,
          );
          const newIndex = items.findIndex(
            (item) => (item as any)._internalKey === over.id,
          );

          const newItems = arrayMove(items, oldIndex, newIndex);

          // Update sequence numbers
          const updatedItems = newItems.map((item, index) => ({
            ...item,
            sequence_number: index + 1,
          }));

          // Notify parent component
          if (onChangeRef.current) {
            onChangeRef.current(updatedItems);
          }

          return updatedItems;
        });
      }
    }, []);

    // Use items for display (allows drag-drop reordering)
    const displayItems = isDragDisabled ? waypoints : items;

    // Loading state
    const isLoading = !isUpdateMode && getWaypointPreviewResult?.isLoading;

    return (
      <div className='space-y-4'>
        {/* Header Info */}
        <div className='flex items-center justify-between'>
          <div>
            <h4 className='font-semibold text-sm'>
              {isUpdateMode ? "Waypoint Sequence" : "Waypoint Preview"}
            </h4>
            <p className='text-xs text-base-content/60 mt-0.5'>
              {isFTL
                ? "FTL: Waypoints from each shipment (read-only)"
                : isDragDisabled
                  ? "LTL: Grouped by origin/destination (read-only)"
                  : "LTL: Drag waypoints to reorder sequence"}
            </p>
          </div>
          <div className='text-xs text-base-content/60'>
            {displayItems.length} waypoint{displayItems.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Waypoint List */}
        {isLoading ? (
          <div className='text-center py-8 text-base-content/60 text-sm'>
            Loading waypoints...
          </div>
        ) : displayItems.length === 0 ? (
          <div className='text-center py-8 text-base-content/60 text-sm'>
            <HiMapPin className='w-8 h-8 mx-auto mb-2 opacity-50' />
            No waypoints available
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayItems.map(
                (item) => (item as any)._internalKey || `${item.type}-${item.address_id}`,
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className='space-y-2'>
                {displayItems.map((waypoint, index) => (
                  <SortableWaypointItem
                    key={(waypoint as any)._internalKey || `${waypoint.type}-${waypoint.address_id}`}
                    waypoint={waypoint}
                    index={index}
                    isReadOnly={isDragDisabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Legend */}
        <div className='flex items-center gap-4 text-xs text-base-content/60 pt-2 border-t border-base-content/10'>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-success'></div>
            <span>Pickup</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-info'></div>
            <span>Delivery</span>
          </div>
          {!isDragDisabled && (
            <div className='flex items-center gap-1.5 ml-auto'>
              <HiBars3 className='w-4 h-4' />
              <span>Drag to reorder</span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default ShipmentSequenceEditor;
