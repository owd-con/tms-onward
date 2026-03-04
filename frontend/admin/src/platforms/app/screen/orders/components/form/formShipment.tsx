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
import { HiXMark, HiTrash } from "react-icons/hi2";
import { AddressSelector } from "./AddressSelector";
import type { Address } from "@/services/types";
import dayjs from "dayjs";
import { usePricingMatrix } from "@/services/pricingMatrix/hooks";

export interface ShipmentFormData {
  id: string;
  shipmentId?: string; // For edit mode - original shipment ID
  // Origin
  origin_address_id?: string;
  origin_address?: Address;
  origin_city_id?: string; // City ID for pricing
  // Destination
  destination_address_id?: string;
  destination_address?: Address;
  destination_city_id?: string; // City ID for pricing
  // Schedule
  pickup_scheduled_date: string;
  pickup_scheduled_time?: string;
  delivery_scheduled_date: string;
  delivery_scheduled_time?: string;
  // Pricing (LTL only)
  price?: number;
  // Items
  items: Array<{
    name: string;
    quantity: number;
    weight?: number;
    price?: number;
  }>;
}

export interface FormShipmentRef {
  getShipments: () => ShipmentFormData[];
  clearShipments: () => void;
  setShipments?: (shipments: ShipmentFormData[]) => void;
}

interface FormShipmentProps {
  orderType: "FTL" | "LTL";
  selectedCustomerId?: string;
  onValuesChange?: (shipments: ShipmentFormData[]) => void;
  // Edit mode props
  initialShipments?: ShipmentFormData[];
}

/**
 * OrderCreatePage - Form Shipment Component
 *
 * Contains the Shipments section (right column)
 * Manages its own state for shipments
 * Each shipment has origin → destination (1 shipment = 1 route)
 */
export const FormShipment = forwardRef<FormShipmentRef, FormShipmentProps>(
  (
    { orderType, selectedCustomerId, onValuesChange, initialShipments },
    ref,
  ) => {
    const FormState = useSelector((state: RootState) => state.form);

    // Pricing hook
    const { get: getPricingMatrices } = usePricingMatrix();

    // Track loading state for pricing fetches
    const [loadingPricing, setLoadingPricing] = useState<
      Record<string, boolean>
    >({});

    // Track which shipments we've already fetched pricing for to avoid duplicates
    const fetchedPricingRef = useRef<Set<string>>(new Set());

    // Shipments state (managed internally)
    const [shipments, setShipments] = useState<ShipmentFormData[]>(() => {
      if (initialShipments && initialShipments.length > 0) {
        return initialShipments;
      }

      const defaultState = [
        {
          id: `shp-${Date.now()}`,
          pickup_scheduled_date: new Date().toISOString().split("T")[0],
          delivery_scheduled_date: new Date().toISOString().split("T")[0],
          items: [{ name: "", quantity: 1 }],
        },
      ];

      return defaultState;
    });

    // Update shipments when initialShipments changes (for edit mode)
    const initialShipmentsRef = useRef<ShipmentFormData[] | undefined>(
      undefined,
    );

    useEffect(() => {
      // Only update if initialShipments actually changed (deep check by length and IDs)
      if (initialShipments && initialShipments.length > 0) {
        const prev = initialShipmentsRef.current;
        const isDifferent =
          !prev ||
          prev.length !== initialShipments.length ||
          prev.some((p, i) => p.id !== initialShipments[i]?.id);

        if (isDifferent) {
          initialShipmentsRef.current = initialShipments;
          setShipments(initialShipments);
        }
      }
    }, [initialShipments]);

    // Reset shipments when customer changes (reset to 1 default shipment)
    const prevCustomerIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
      // If customer changed (from undefined to value, or value to different value), reset shipments
      if (prevCustomerIdRef.current !== selectedCustomerId) {
        // Only reset if we had a previous customer (not first time setting customer)
        if (prevCustomerIdRef.current !== undefined) {
          // Reset to 1 default shipment
          const defaultShipments: ShipmentFormData[] = [
            {
              id: `shp-${Date.now()}`,
              pickup_scheduled_date: new Date().toISOString().split("T")[0],
              delivery_scheduled_date: new Date().toISOString().split("T")[0],
              items: [{ name: "", quantity: 1 }],
            },
          ];

          setShipments(defaultShipments);

          // Clear fetched pricing cache when customer changes
          fetchedPricingRef.current.clear();
        }
        prevCustomerIdRef.current = selectedCustomerId;
      }
    }, [selectedCustomerId]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      getShipments: () => shipments,
      setShipments: (newShipments) => {
        setShipments(newShipments);
      },
      clearShipments: () => {
        // Reset to 1 default shipment
        const defaultShipments: ShipmentFormData[] = [
          {
            id: `shp-${Date.now()}`,
            pickup_scheduled_date: new Date().toISOString().split("T")[0],
            delivery_scheduled_date: new Date().toISOString().split("T")[0],
            items: [{ name: "", quantity: 1 }],
          },
        ];
        setShipments(defaultShipments);
      },
    }));

    // Notify parent when shipments change
    useEffect(() => {
      onValuesChange?.(shipments);
    }, [shipments, onValuesChange]);

    // Shipment handlers
    const addShipment = () => {
      const newShipment: ShipmentFormData = {
        id: `shp-${Date.now()}`,
        pickup_scheduled_date: new Date().toISOString().split("T")[0],
        delivery_scheduled_date: new Date().toISOString().split("T")[0],
        items: [{ name: "", quantity: 1 }],
      };

      setShipments((prev) => [...prev, newShipment]);
    };

    const removeShipment = (id: string) => {
      if (shipments.length <= 1) {
        alert("You must have at least 1 shipment");
        return;
      }
      setShipments((prev) => prev.filter((shp) => shp.id !== id));
    };

    const updateShipment = (id: string, updates: Partial<ShipmentFormData>) => {
      setShipments((prev) =>
        prev.map((shp) => (shp.id === id ? { ...shp, ...updates } : shp)),
      );
    };

    const updateShipmentItem = (
      shipmentId: string,
      itemIndex: number,
      field: string,
      value: string | number,
    ) => {
      setShipments((prev) =>
        prev.map((shp) => {
          if (shp.id === shipmentId) {
            const newItems = [...shp.items];
            newItems[itemIndex] = {
              ...newItems[itemIndex],
              [field]: value,
            };
            return { ...shp, items: newItems };
          }
          return shp;
        }),
      );
    };

    const addShipmentItem = (shipmentId: string) => {
      setShipments((prev) =>
        prev.map((shp) => {
          if (shp.id === shipmentId) {
            return {
              ...shp,
              items: [...shp.items, { name: "", quantity: 1 }],
            };
          }
          return shp;
        }),
      );
    };

    const removeShipmentItem = (shipmentId: string, itemIndex: number) => {
      setShipments((prev) =>
        prev.map((shp) => {
          if (shp.id === shipmentId && shp.items.length > 1) {
            return {
              ...shp,
              items: shp.items.filter((_, i) => i !== itemIndex),
            };
          }
          return shp;
        }),
      );
    };

    // Helper function to fetch pricing for a shipment
    const fetchPricingForShipment = async (
      shipmentId: string,
      originCityId: string,
      destCityId: string,
      customerId: string,
    ): Promise<number | null> => {
      try {
        // Fetch customer-specific pricing
        const customerResult = await getPricingMatrices({
          customer_id: customerId,
          origin_city_id: originCityId,
          destination_city_id: destCityId,
          status: "active",
          limit: 1,
        });

        // Response structure: { data: [...], meta: {...} }
        if (
          customerResult?.data &&
          Array.isArray(customerResult.data) &&
          customerResult.data.length > 0
        ) {
          const price = (customerResult.data[0] as any).price;
          return price || null;
        }

        return null;
      } catch (error) {
        console.error(
          `❌ Failed to fetch pricing for shipment ${shipmentId}:`,
          error,
        );
        return null;
      }
    };

    // Auto-fetch pricing for LTL shipments when both addresses are selected
    useEffect(() => {
      // Only fetch for LTL orders with a selected customer
      if (orderType !== "LTL") {
        return;
      }

      if (!selectedCustomerId) {
        return;
      }

      // For each shipment with both origin and dest city_id
      shipments.forEach((shipment) => {
        // Only fetch if:
        // 1. Has origin_city_id
        // 2. Has destination_city_id
        // 3. No price set yet
        // 4. Haven't already fetched for this shipment
        const fetchKey = `${shipment.origin_city_id}-${shipment.destination_city_id}-${shipment.id}`;

        if (
          shipment.origin_city_id &&
          shipment.destination_city_id &&
          !shipment.price &&
          !fetchedPricingRef.current.has(fetchKey)
        ) {
          // Mark as fetched to avoid duplicate calls
          fetchedPricingRef.current.add(fetchKey);

          // Set loading state
          setLoadingPricing((prev) => ({ ...prev, [shipment.id]: true }));

          // Fetch pricing
          fetchPricingForShipment(
            shipment.id,
            shipment.origin_city_id,
            shipment.destination_city_id,
            selectedCustomerId,
          )
            .then((price) => {
              if (price) {
                setShipments((prev) =>
                  prev.map((shp) =>
                    shp.id === shipment.id ? { ...shp, price } : shp,
                  ),
                );
              }
            })
            .catch((error) => {
              console.error(
                `❌ Failed to fetch pricing for ${shipment.id}:`,
                error,
              );
            })
            .finally(() => {
              setLoadingPricing((prev) => ({
                ...prev,
                [shipment.id]: false,
              }));
            });
        }
      });
    }, [shipments, selectedCustomerId, orderType]);

    return (
      <div className='lg:col-span-2'>
        <div className='bg-white rounded-xl p-6 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold'>Shipments</h3>
            <Button
              type='button'
              size='sm'
              variant='secondary'
              onClick={() => addShipment()}
            >
              + Add Shipment
            </Button>
          </div>

          <div className='space-y-4'>
            {shipments.map((shipment, index) => (
              <div
                key={shipment.id}
                className='border-2 border-primary/30 bg-primary/5 rounded-xl p-4'
              >
                {/* Shipment Header */}
                <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-bold'>
                      {index + 1}
                    </div>
                    <h4 className='font-semibold'>Shipment #{index + 1}</h4>
                  </div>
                  {shipments.length > 1 && (
                    <Button
                      type='button'
                      size='xs'
                      variant='error'
                      styleType='soft'
                      shape='circle'
                      onClick={() => removeShipment(shipment.id)}
                    >
                      <HiXMark size={16} />
                    </Button>
                  )}
                </div>

                {/* Addresses */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                  <AddressSelector
                    label='Origin Address'
                    value={shipment.origin_address_id}
                    address={shipment.origin_address}
                    onChange={(addressId, address, cityId) =>
                      updateShipment(shipment.id, {
                        origin_address_id: addressId,
                        origin_address: address,
                        origin_city_id: cityId,
                      })
                    }
                    customerId={selectedCustomerId}
                    error={
                      (FormState?.errors as any)?.[
                        `shipments.${index}.origin_address_id`
                      ]
                    }
                    required
                  />

                  <AddressSelector
                    label='Destination Address'
                    value={shipment.destination_address_id}
                    address={shipment.destination_address}
                    onChange={(addressId, address, cityId) =>
                      updateShipment(shipment.id, {
                        destination_address_id: addressId,
                        destination_address: address,
                        destination_city_id: cityId,
                      })
                    }
                    customerId={selectedCustomerId}
                    error={
                      (FormState?.errors as any)?.[
                        `shipments.${index}.destination_address_id`
                      ]
                    }
                    required
                  />
                </div>

                {/* Schedules */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                  <DatePicker
                    label='Pickup Date'
                    value={dayjs(shipment.pickup_scheduled_date)}
                    onChange={(date) =>
                      updateShipment(shipment.id, {
                        pickup_scheduled_date:
                          date && !Array.isArray(date)
                            ? date.format("YYYY-MM-DD")
                            : "",
                      })
                    }
                    error={
                      (FormState?.errors as any)?.[
                        `shipments.${index}.pickup_scheduled_date`
                      ]
                    }
                    required
                  />
                  <Input
                    label='Pickup Time'
                    type='time'
                    value={shipment.pickup_scheduled_time || ""}
                    onChange={(e) =>
                      updateShipment(shipment.id, {
                        pickup_scheduled_time: e.target.value,
                      })
                    }
                    error={
                      (FormState?.errors as any)?.[
                        `shipments.${index}.pickup_scheduled_time`
                      ]
                    }
                  />
                  <DatePicker
                    label='Delivery Date'
                    value={dayjs(shipment.delivery_scheduled_date)}
                    onChange={(date) =>
                      updateShipment(shipment.id, {
                        delivery_scheduled_date:
                          date && !Array.isArray(date)
                            ? date.format("YYYY-MM-DD")
                            : "",
                      })
                    }
                    error={
                      (FormState?.errors as any)?.[
                        `shipments.${index}.delivery_scheduled_date`
                      ]
                    }
                    required
                  />
                  <Input
                    label='Delivery Time'
                    type='time'
                    value={shipment.delivery_scheduled_time || ""}
                    onChange={(e) =>
                      updateShipment(shipment.id, {
                        delivery_scheduled_time: e.target.value,
                      })
                    }
                    error={
                      (FormState?.errors as any)?.[
                        `shipments.${index}.delivery_scheduled_time`
                      ]
                    }
                  />
                </div>

                {/* Price for LTL */}
                {orderType === "LTL" && (
                  <div className='mb-4'>
                    <Input
                      label='Delivery Price'
                      type='number'
                      prefix='Rp'
                      placeholder={
                        loadingPricing[shipment.id]
                          ? "Fetching price..."
                          : "Enter price"
                      }
                      value={shipment.price || ""}
                      onChange={(e) =>
                        updateShipment(shipment.id, {
                          price: parseFloat(e.target.value) || undefined,
                        })
                      }
                      disabled={loadingPricing[shipment.id]}
                    />
                  </div>
                )}

                {/* Items */}
                <div>
                  <label className='block text-sm font-semibold mb-2'>
                    Items
                  </label>
                  <span className='text-error text-xs mt-1 block'>
                    {(FormState?.errors as any)?.[`shipments.${index}.items`]}
                  </span>
                  <div className='space-y-2'>
                    {Array.isArray(shipment.items) &&
                      shipment.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className='flex gap-2 items-start flex-wrap'
                        >
                          <div className='flex-1 min-w-[150px]'>
                            <Input
                              placeholder='Item name'
                              value={item.name}
                              onChange={(e) =>
                                updateShipmentItem(
                                  shipment.id,
                                  itemIndex,
                                  "name",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className='w-20'>
                            <Input
                              type='number'
                              placeholder='Qty'
                              value={item.quantity}
                              onChange={(e) =>
                                updateShipmentItem(
                                  shipment.id,
                                  itemIndex,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                            />
                          </div>
                          <div className='w-24'>
                            <Input
                              type='number'
                              placeholder='Weight (kg)'
                              value={item.weight || ""}
                              onChange={(e) =>
                                updateShipmentItem(
                                  shipment.id,
                                  itemIndex,
                                  "weight",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                          {Array.isArray(shipment.items) &&
                            shipment.items.length > 1 && (
                              <Button
                                type='button'
                                size='xs'
                                variant='error'
                                styleType='soft'
                                shape='circle'
                                onClick={() =>
                                  removeShipmentItem(shipment.id, itemIndex)
                                }
                              >
                                <HiTrash size={16} />
                              </Button>
                            )}
                        </div>
                      ))}
                    <Button
                      type='button'
                      size='sm'
                      variant='secondary'
                      onClick={() => addShipmentItem(shipment.id)}
                    >
                      + Add Item
                    </Button>
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

FormShipment.displayName = "FormShipment";
