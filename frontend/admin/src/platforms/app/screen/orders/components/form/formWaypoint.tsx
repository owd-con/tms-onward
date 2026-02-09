import { Button, Input } from "@/components";
import { DatePicker } from "@/components/ui";
import type { RootState } from "@/services/store";
import {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import { AddressSelector } from "../AddressSelector";
import type { Address } from "@/services/types";
import dayjs from "dayjs";
import { usePricingMatrix } from "@/services/pricingMatrix/hooks";

export interface WaypointFormData {
  id: string;
  waypointId?: string; // For edit mode - original waypoint ID
  type: "pickup" | "delivery";
  address_id?: string;
  address?: Address;
  city_id?: string; // City ID extracted from address.village?.district?.city?.id for pricing
  scheduled_date: string;
  scheduled_time?: string;
  price?: number;
  items: Array<{
    name: string;
    quantity: number;
    weight?: number;
    volume?: number;
  }>;
  sequence_number?: number;
}

export interface FormWaypointRef {
  getWaypoints: () => WaypointFormData[];
  clearWaypoints: () => void;
  setWaypoints?: (waypoints: WaypointFormData[]) => void;
}

interface FormWaypointProps {
  orderType: "FTL" | "LTL";
  selectedCustomerId?: string;
  onValuesChange?: (waypoints: WaypointFormData[]) => void;
  // Edit mode props
  initialWaypoints?: WaypointFormData[];
}

/**
 * OrderCreatePage - Form Waypoint Component
 *
 * Contains the Waypoints section (right column)
 * Manages its own state for waypoints
 * Supports both create and edit modes
 */
export const FormWaypoint = forwardRef<FormWaypointRef, FormWaypointProps>(
  (
    { orderType, selectedCustomerId, onValuesChange, initialWaypoints },
    ref,
  ) => {
    console.log("FormWaypoint render:", {
      selectedCustomerId,
      initialWaypoints,
    });

    const FormState = useSelector((state: RootState) => state.form);

    // Pricing hook
    const { get: getPricingMatrices } = usePricingMatrix();

    // Track loading state for pricing fetches
    const [loadingPricing, setLoadingPricing] = useState<Record<string, boolean>>({});

    // Track which waypoints we've already fetched pricing for to avoid duplicates
    const fetchedPricingRef = useRef<Set<string>>(new Set());

    // Waypoints state (managed internally)
    const [waypoints, setWaypoints] = useState<WaypointFormData[]>(() => {
      if (initialWaypoints && initialWaypoints.length > 0) {
        console.log(
          "FormWaypoint initial state from initialWaypoints:",
          initialWaypoints,
        );
        return initialWaypoints;
      }

      const defaultState = [
        {
          id: `wp-${Date.now()}`,
          type: "pickup" as const,
          scheduled_date: new Date().toISOString().split("T")[0],
          items: [{ name: "", quantity: 1 }],
          ...(orderType === "FTL" && { sequence_number: 1 }),
        },
        {
          id: `wp-${Date.now() + 1}`,
          type: "delivery" as const,
          scheduled_date: new Date().toISOString().split("T")[0],
          items: [{ name: "", quantity: 1 }],
          ...(orderType === "FTL" && { sequence_number: 2 }),
        },
      ];
      console.log("FormWaypoint initial state (default):", defaultState);
      return defaultState;
    });

    // Update waypoints when initialWaypoints changes (for edit mode)
    // Use useRef to prevent infinite loop when initialWaypoints reference changes
    const initialWaypointsRef = useRef<WaypointFormData[] | undefined>(
      undefined,
    );

    useEffect(() => {
      // Only update if initialWaypoints actually changed (deep check by length, IDs, and sequence_number)
      if (initialWaypoints && initialWaypoints.length > 0) {
        const prev = initialWaypointsRef.current;
        const isDifferent =
          !prev ||
          prev.length !== initialWaypoints.length ||
          prev.some((p, i) => {
            const curr = initialWaypoints[i];
            return (
              p.id !== curr?.id || p.sequence_number !== curr?.sequence_number
            );
          });

        console.log("initialWaypoints check:", {
          hasInitial: !!initialWaypoints,
          length: initialWaypoints.length,
          isDifferent,
        });

        if (isDifferent) {
          console.log(
            "Setting waypoints from initialWaypoints:",
            initialWaypoints,
          );
          initialWaypointsRef.current = initialWaypoints;
          setWaypoints(initialWaypoints);
        }
      }
    }, [initialWaypoints]);

    // Reset waypoints when customer changes (reset to 2 default waypoints)
    const prevCustomerIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
      // If customer changed (from undefined to value, or value to different value), reset waypoints
      if (prevCustomerIdRef.current !== selectedCustomerId) {
        console.log("Customer changed:", {
          prev: prevCustomerIdRef.current,
          curr: selectedCustomerId,
        });

        // Only reset if we had a previous customer (not first time setting customer)
        if (prevCustomerIdRef.current !== undefined) {
          // Reset to 2 default waypoints (Pickup and Delivery)
          const defaultWaypoints: WaypointFormData[] = [
            {
              id: `wp-${Date.now()}`,
              type: "pickup",
              scheduled_date: new Date().toISOString().split("T")[0],
              items: [{ name: "", quantity: 1 }],
              ...(orderType === "FTL" && { sequence_number: 1 }),
            },
            {
              id: `wp-${Date.now() + 1}`,
              type: "delivery",
              scheduled_date: new Date().toISOString().split("T")[0],
              items: [{ name: "", quantity: 1 }],
              ...(orderType === "FTL" && { sequence_number: 2 }),
            },
          ];
          console.log("Reset waypoints to default:", defaultWaypoints);
          setWaypoints(defaultWaypoints);

          // Clear fetched pricing cache when customer changes
          fetchedPricingRef.current.clear();
        }
        prevCustomerIdRef.current = selectedCustomerId;
      }
    }, [selectedCustomerId]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      getWaypoints: () => waypoints,
      setWaypoints: (newWaypoints) => {
        setWaypoints(newWaypoints);
      },
      clearWaypoints: () => {
        // Reset to 2 default waypoints (Pickup and Delivery)
        const defaultWaypoints: WaypointFormData[] = [
          {
            id: `wp-${Date.now()}`,
            type: "pickup",
            scheduled_date: new Date().toISOString().split("T")[0],
            items: [{ name: "", quantity: 1 }],
            ...(orderType === "FTL" && { sequence_number: 1 }),
          },
          {
            id: `wp-${Date.now() + 1}`,
            type: "delivery",
            scheduled_date: new Date().toISOString().split("T")[0],
            items: [{ name: "", quantity: 1 }],
            ...(orderType === "FTL" && { sequence_number: 2 }),
          },
        ];
        setWaypoints(defaultWaypoints);
      },
    }));

    // Notify parent when waypoints change
    useEffect(() => {
      console.log("Waypoints changed, notifying parent:", waypoints);
      onValuesChange?.(waypoints);
    }, [waypoints, onValuesChange]);

    // Waypoint handlers
    const addWaypoint = (type: "pickup" | "delivery") => {
      const newWaypoint: WaypointFormData = {
        id: `wp-${Date.now()}`,
        type,
        scheduled_date: new Date().toISOString().split("T")[0],
        items: [{ name: "", quantity: 1 }],
        ...(orderType === "FTL" && {
          sequence_number:
            Math.max(...waypoints.map((wp) => wp.sequence_number || 0), 0) + 1,
        }),
      };

      // Always add to the end
      setWaypoints((prev) => [...prev, newWaypoint]);
    };

    const removeWaypoint = (id: string) => {
      if (waypoints.length <= 2) {
        alert("You must have at least 2 waypoints (1 pickup and 1 delivery)");
        return;
      }
      setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
    };

    const updateWaypoint = (id: string, updates: Partial<WaypointFormData>) => {
      console.log(`🔄 updateWaypoint called for ${id}:`, updates);
      setWaypoints((prev) =>
        prev.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp)),
      );
    };

    const updateWaypointItem = (
      waypointId: string,
      itemIndex: number,
      field: string,
      value: string | number,
    ) => {
      setWaypoints((prev) =>
        prev.map((wp) => {
          if (wp.id === waypointId) {
            const newItems = [...wp.items];
            newItems[itemIndex] = {
              ...newItems[itemIndex],
              [field]: value,
            };
            return { ...wp, items: newItems };
          }
          return wp;
        }),
      );
    };

    const addWaypointItem = (waypointId: string) => {
      setWaypoints((prev) =>
        prev.map((wp) => {
          if (wp.id === waypointId) {
            return {
              ...wp,
              items: [...wp.items, { name: "", quantity: 1 }],
            };
          }
          return wp;
        }),
      );
    };

    const removeWaypointItem = (waypointId: string, itemIndex: number) => {
      setWaypoints((prev) =>
        prev.map((wp) => {
          if (wp.id === waypointId && wp.items.length > 1) {
            return {
              ...wp,
              items: wp.items.filter((_, i) => i !== itemIndex),
            };
          }
          return wp;
        }),
      );
    };

    // Helper function to get the last pickup before a given waypoint
    const getLastPickupBefore = (waypointsList: WaypointFormData[], index: number): WaypointFormData | null => {
      for (let i = index - 1; i >= 0; i--) {
        if (waypointsList[i].type === 'pickup' && waypointsList[i].city_id) {
          return waypointsList[i];
        }
      }
      return null;
    };

    // Helper function to fetch pricing for a waypoint
    const fetchPricingForWaypoint = async (
      waypointId: string,
      originCityId: string,
      destCityId: string,
      customerId: string,
    ): Promise<number | null> => {
      console.log("📋 fetchPricingForWaypoint called:", {
        waypointId,
        originCityId,
        destCityId,
        customerId,
      });
      try {
        // Fetch customer-specific pricing
        console.log("🔍 Fetching customer-specific pricing...");
        const customerResult = await getPricingMatrices({
          customer_id: customerId,
          origin_city_id: originCityId,
          destination_city_id: destCityId,
          status: 'active',
          limit: 1,
        });
        console.log("📦 Customer pricing result:", customerResult);

        // Response structure: { data: [...], meta: {...} }
        if (customerResult?.data && Array.isArray(customerResult.data) && customerResult.data.length > 0) {
          const price = (customerResult.data[0] as any).price;
          console.log("✅ Using customer pricing:", price);
          return price || null;
        }

        console.log("⚠️ No pricing found for this route");
        return null;
      } catch (error) {
        console.error(`❌ Failed to fetch pricing for waypoint ${waypointId}:`, error);
        return null;
      }
    };

    // Auto-fetch pricing for LTL delivery waypoints when addresses are selected
    useEffect(() => {
      console.log("=== Auto-fetch Pricing Effect Triggered ===");
      console.log("orderType:", orderType);
      console.log("selectedCustomerId:", selectedCustomerId);

      // Only fetch for LTL orders with a selected customer
      if (orderType !== 'LTL') {
        console.log("❌ Not LTL, skipping");
        return;
      }

      if (!selectedCustomerId) {
        console.log("❌ No customer selected, skipping");
        return;
      }

      console.log("✅ Conditions met, checking waypoints:", waypoints);

      // For each delivery waypoint with city_id
      waypoints.forEach((waypoint, index) => {
        // Only fetch if:
        // 1. It's a delivery waypoint
        // 2. Has city_id
        // 3. No price set yet
        // 4. Haven't already fetched for this waypoint (avoid duplicate API calls)
        const fetchKey = `${waypoint.city_id}-${waypoint.id}`;

        console.log(`Waypoint ${index} (${waypoint.id}):`, {
          type: waypoint.type,
          city_id: waypoint.city_id,
          price: waypoint.price,
          fetchKey,
          alreadyFetched: fetchedPricingRef.current.has(fetchKey),
        });

        if (
          waypoint.type === 'delivery' &&
          waypoint.city_id &&
          !waypoint.price &&
          !fetchedPricingRef.current.has(fetchKey)
        ) {
          // Find last pickup before this delivery
          const originPickup = getLastPickupBefore(waypoints, index);

          console.log("🎯 Delivery waypoint ready for pricing fetch:", {
            waypointId: waypoint.id,
            originPickup: originPickup?.city_id,
            destCity: waypoint.city_id,
          });

          if (originPickup?.city_id) {
            // Mark as fetched to avoid duplicate calls
            fetchedPricingRef.current.add(fetchKey);

            // Set loading state
            setLoadingPricing((prev) => ({ ...prev, [waypoint.id]: true }));

            console.log("🚀 Fetching pricing...");

            // Fetch pricing
            fetchPricingForWaypoint(
              waypoint.id,
              originPickup.city_id,
              waypoint.city_id,
              selectedCustomerId,
            )
              .then((price) => {
                console.log(`✅ Pricing fetched for ${waypoint.id}:`, price);
                if (price) {
                  setWaypoints((prev) =>
                    prev.map((wp) =>
                      wp.id === waypoint.id ? { ...wp, price } : wp
                    )
                  );
                }
              })
              .catch((error) => {
                console.error(`❌ Failed to fetch pricing for ${waypoint.id}:`, error);
              })
              .finally(() => {
                setLoadingPricing((prev) => ({ ...prev, [waypoint.id]: false }));
              });
          } else {
            console.log("⚠️ No origin pickup found with city_id");
          }
        }
      });

      console.log("=== Auto-fetch Pricing Effect Complete ===");
    }, [waypoints, selectedCustomerId, orderType]);

    return (
      <div className='lg:col-span-2'>
        <div className='bg-white rounded-xl p-6 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold'>Waypoints</h3>
            <div className='flex gap-2'>
              <Button
                type='button'
                size='sm'
                variant='secondary'
                onClick={() => addWaypoint("pickup")}
              >
                + Pickup
              </Button>
              <Button
                type='button'
                size='sm'
                variant='secondary'
                onClick={() => addWaypoint("delivery")}
              >
                + Delivery
              </Button>
            </div>
          </div>

          <div className='space-y-4'>
            {waypoints.map((waypoint, index) => (
              <div
                key={waypoint.id}
                className={`border-2 rounded-xl p-4 ${
                  waypoint.type === "pickup"
                    ? "border-success bg-success/5"
                    : "border-info bg-info/5"
                }`}
              >
                {/* Waypoint Header */}
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        waypoint.type === "pickup"
                          ? "bg-success text-white"
                          : "bg-info text-white"
                      }`}
                    >
                      {orderType === "FTL"
                        ? index + 1
                        : waypoint.type === "pickup"
                          ? "P"
                          : "D"}
                    </div>
                    <h4 className='font-semibold capitalize'>{waypoint.type} Waypoint</h4>
                  </div>
                  {waypoints.length > 2 && (
                    <Button
                      type='button'
                      size='xs'
                      variant='error'
                      onClick={() => removeWaypoint(waypoint.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className='space-y-4'>
                  {/* Address Selection */}
                  <AddressSelector
                    label={`${waypoint.type} Address`}
                    value={waypoint.address_id}
                    address={waypoint.address}
                    onChange={(addressId, address, cityId) =>
                      updateWaypoint(waypoint.id, {
                        address_id: addressId,
                        address,
                        city_id: cityId,
                      })
                    }
                    customerId={selectedCustomerId}
                    error={
                      (FormState?.errors as any)?.[
                        `waypoints.${index}.address_id`
                      ]
                    }
                    required
                  />

                  {/* Schedule */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <DatePicker
                        label='Scheduled Date'
                        value={
                          waypoint.scheduled_date
                            ? dayjs(waypoint.scheduled_date)
                            : null
                        }
                        onChange={(date) =>
                          updateWaypoint(waypoint.id, {
                            scheduled_date:
                              date && !Array.isArray(date)
                                ? date.format("YYYY-MM-DD")
                                : "",
                          })
                        }
                        error={
                          (FormState?.errors as any)?.[
                            `waypoints.${index}.scheduled_date`
                          ]
                        }
                        required
                      />
                    </div>
                    <div>
                      <Input
                        label='Scheduled Time'
                        type='time'
                        value={waypoint.scheduled_time || ""}
                        onChange={(e) =>
                          updateWaypoint(waypoint.id, {
                            scheduled_time: e.target.value,
                          })
                        }
                        error={
                          (FormState?.errors as any)?.[
                            `waypoints.${index}.scheduled_time`
                          ]
                        }
                      />
                    </div>
                  </div>

                  {/* Price for Delivery waypoints */}
                  {waypoint.type === "delivery" && orderType === "LTL" && (
                    <Input
                      label='Delivery Price'
                      type='number'
                      prefix='Rp'
                      placeholder={loadingPricing[waypoint.id] ? 'Fetching price...' : 'Enter price'}
                      value={waypoint.price || ""}
                      onChange={(e) =>
                        updateWaypoint(waypoint.id, {
                          price: parseFloat(e.target.value) || undefined,
                        })
                      }
                      disabled={loadingPricing[waypoint.id]}
                    />
                  )}

                  {/* Items */}
                  <div>
                    <label className='block text-sm font-semibold mb-2'>
                      Items
                    </label>
                    <span className='text-error text-xs mt-1 block'>
                      {(FormState?.errors as any)?.[`waypoints.${index}.items`]}
                    </span>
                    <div className='space-y-2'>
                      {Array.isArray(waypoint.items) &&
                        waypoint.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className='flex gap-2 items-start'
                          >
                            <div className='flex-1'>
                              <Input
                                placeholder='Item name'
                                value={item.name}
                                onChange={(e) =>
                                  updateWaypointItem(
                                    waypoint.id,
                                    itemIndex,
                                    "name",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className='w-24'>
                              <Input
                                type='number'
                                placeholder='Qty'
                                value={item.quantity}
                                onChange={(e) =>
                                  updateWaypointItem(
                                    waypoint.id,
                                    itemIndex,
                                    "quantity",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                              />
                            </div>
                            {Array.isArray(waypoint.items) &&
                              waypoint.items.length > 1 && (
                                <Button
                                  type='button'
                                  size='xs'
                                  variant='error'
                                  onClick={() =>
                                    removeWaypointItem(waypoint.id, itemIndex)
                                  }
                                >
                                  Remove
                                </Button>
                              )}
                          </div>
                        ))}
                      <Button
                        type='button'
                        size='sm'
                        variant='secondary'
                        onClick={() => addWaypointItem(waypoint.id)}
                      >
                        + Add Item
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

FormWaypoint.displayName = "FormWaypoint";
