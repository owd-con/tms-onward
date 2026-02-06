import { memo, useEffect, useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { OrderWaypoint, OrderType } from "@/services/types";
import {
  HiOutlineEllipsisVertical,
  HiMapPin,
  HiArrowRight,
} from "react-icons/hi2";

interface WaypointSequenceItem {
  order_waypoint_id: string;
  sequence_number: number;
  type: string;
  location_name?: string;
  location_address?: string;
}

interface WaypointSequenceEditorProps {
  orderType: OrderType;
  waypoints: OrderWaypoint[];
  value?: Array<{
    order_waypoint_id: string;
    sequence_number: number;
  }>;
  onChange?: (
    sequences: Array<{
      order_waypoint_id: string;
      sequence_number: number;
    }>,
  ) => void;
  readonly?: boolean;
}

/**
 * Sortable Waypoint Item Component
 */
interface SortableItemProps {
  id: string;
  waypoint: WaypointSequenceItem;
  index: number;
  disabled?: boolean;
}

const SortableItem = memo(
  ({ id, waypoint, index, disabled }: SortableItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id, disabled });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const isPickup = waypoint.type === "pickup";
    const bgClass = isPickup
      ? "bg-info/10 border-info/30"
      : "bg-success/10 border-success/30";
    const textClass = isPickup ? "text-info" : "text-success";
    const iconBg = isPickup ? "bg-info" : "bg-success";

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...(!disabled && attributes)}
        {...(!disabled && listeners)}
        className={`
        flex items-center gap-3 p-3 rounded-lg border-2
        ${bgClass} transition-all
        ${disabled ? "opacity-75" : "hover:border-current cursor-move"}
      `}
      >
        {/* Drag Handle Icon (visual only) */}
        {!disabled && (
          <div className='text-base-content/40'>
            <HiOutlineEllipsisVertical className='w-5 h-5' />
          </div>
        )}

        {/* Sequence Number Badge */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${iconBg} text-white font-bold text-sm`}
        >
          {index + 1}
        </div>

        {/* Waypoint Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <span className={`font-semibold text-sm capitalize ${textClass}`}>
              {waypoint.type}
            </span>
            <HiArrowRight className='w-3 h-3 text-base-content/40' />
            <span className='text-sm font-medium truncate'>
              {waypoint.location_name || "Unnamed Location"}
            </span>
          </div>
          {waypoint.location_address && (
            <p className='text-xs text-base-content/60 truncate mt-0.5'>
              {waypoint.location_address}
            </p>
          )}
        </div>
      </div>
    );
  },
);

SortableItem.displayName = "SortableItem";

/**
 * TMS Onward - Waypoint Sequence Editor Component
 *
 * Component untuk mengatur urutan waypoint pada Trip:
 * - FTL: Read-only (sequence dari order creation)
 * - LTL: Editable dengan drag-and-drop
 *
 * Rules:
 * - FTL: Urutan waypoint ditentukan SAAT order dibuat, TIDAK bisa diubah
 * - LTL: Dispatcher set urutan waypoint manual SAAT assign driver, SUDAH final
 */
export const WaypointSequenceEditor = memo(
  ({
    orderType,
    waypoints,
    value,
    onChange,
    readonly = false,
  }: WaypointSequenceEditorProps) => {
    const [items, setItems] = useState<WaypointSequenceItem[]>([]);
    const initializedRef = useRef(false);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );

    // Convert waypoints to sequence items
    useEffect(() => {
      if (waypoints && waypoints.length > 0) {
        const sequenceItems: WaypointSequenceItem[] = waypoints.map((wp) => ({
          order_waypoint_id: wp.id,
          sequence_number: wp.sequence_number || 0,
          type: wp.type,
          location_name: wp.location_name,
          location_address: wp.location_address,
        }));

        // Sort by sequence_number
        sequenceItems.sort((a, b) => a.sequence_number - b.sequence_number);

        setItems(sequenceItems);

        // Initialize value only once when waypoints first load
        if (!initializedRef.current) {
          const newSequences = sequenceItems.map((item) => ({
            order_waypoint_id: item.order_waypoint_id,
            sequence_number: item.sequence_number,
          }));
          initializedRef.current = true;
          // Defer onChange to next tick to avoid setState during render
          setTimeout(() => onChange?.(newSequences), 0);
        }
      }
    }, [waypoints]); // Only depend on waypoints, not onChange

    // Sync items with value prop when it changes from parent
    useEffect(() => {
      if (value && value.length > 0 && items.length > 0) {
        // Create a map of current items for quick lookup
        const itemMap = new Map(items.map(item => [item.order_waypoint_id, item]));

        // Reorder items based on value prop order
        const reorderedItems = value
          .map((v) => itemMap.get(v.order_waypoint_id))
          .filter((item): item is WaypointSequenceItem => item !== undefined)
          .map((item, index) => ({
            ...item,
            sequence_number: value[index].sequence_number,
          }));

        // Check if order actually changed
        const orderChanged = reorderedItems.some(
          (item, index) => items[index]?.order_waypoint_id !== item.order_waypoint_id
        );

        if (orderChanged) {
          setItems(reorderedItems);
        }
      }
    }, [value]); // Only depend on value

    const handleDragEnd = (event: any) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        let updatedSequences: Array<{
          order_waypoint_id: string;
          sequence_number: number;
        }> = [];

        setItems((items) => {
          const oldIndex = items.findIndex(
            (item) => item.order_waypoint_id === active.id,
          );
          const newIndex = items.findIndex(
            (item) => item.order_waypoint_id === over.id,
          );
          const newItems = arrayMove(items, oldIndex, newIndex);

          // Prepare sequences to send to parent
          updatedSequences = newItems.map((item, index) => ({
            order_waypoint_id: item.order_waypoint_id,
            sequence_number: index + 1,
          }));

          return newItems;
        });

        // Defer onChange to avoid setState during render
        setTimeout(() => onChange?.(updatedSequences), 0);
      }
    };

    const isFTL = orderType === "FTL";
    const isReadOnly = readonly || isFTL;

    return (
      <div className='space-y-4'>
        {/* Header Info */}
        <div className='flex items-center justify-between'>
          <div>
            <h4 className='font-semibold text-sm'>Waypoint Sequence</h4>
            <p className='text-xs text-base-content/60 mt-0.5'>
              {isFTL
                ? "FTL: Sequence from order (read-only)"
                : "LTL: Drag to reorder waypoints"}
            </p>
          </div>
          <div className='text-xs text-base-content/60'>
            {items.length} waypoint{items.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Waypoint List */}
        {items.length === 0 ? (
          <div className='text-center py-8 text-base-content/60 text-sm'>
            <HiMapPin className='w-8 h-8 mx-auto mb-2 opacity-50' />
            No waypoints available
          </div>
        ) : (
          <div className='space-y-2'>
            {isReadOnly ? (
              // Read-only mode for FTL
              <div className='space-y-2'>
                {items.map((item, index) => (
                  <SortableItem
                    key={item.order_waypoint_id}
                    id={item.order_waypoint_id}
                    waypoint={item}
                    index={index}
                    disabled={true}
                  />
                ))}
              </div>
            ) : (
              // Editable mode for LTL
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.order_waypoint_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className='space-y-2'>
                    {items.map((item, index) => (
                      <SortableItem
                        key={item.order_waypoint_id}
                        id={item.order_waypoint_id}
                        waypoint={item}
                        index={index}
                        disabled={false}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {/* Legend */}
        <div className='flex items-center gap-4 text-xs text-base-content/60 pt-2 border-t border-base-content/10'>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-info'></div>
            <span>Pickup</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-success'></div>
            <span>Delivery</span>
          </div>
        </div>
      </div>
    );
  },
);

WaypointSequenceEditor.displayName = "WaypointSequenceEditor";

export default WaypointSequenceEditor;
