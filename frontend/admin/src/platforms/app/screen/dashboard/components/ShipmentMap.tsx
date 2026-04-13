import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapShipmentsByArea } from "@/services/types";

// Set Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

interface ShipmentMapProps {
  shipmentsByArea: MapShipmentsByArea[];
  height?: string;
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  dispatched: "#3B82F6",
  on_pickup: "#8B5CF6",
  picked_up: "#6366F1",
  on_delivery: "#EC4899",
  delivered: "#10B981",
  failed: "#EF4444",
  cancelled: "#6B7280",
  returned: "#F59E0B",
};

const getStatusColor = (status: string) => STATUS_COLORS[status] || "#6B7280";

export default function ShipmentMap({
  shipmentsByArea,
  height = "400px",
}: ShipmentMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasInitializedLayers = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      accessToken: MAPBOX_TOKEN,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [106.8456, -6.2088], // Jakarta default center
      zoom: 10,
      // Enable all interactions
      interactive: true,
      dragPan: true,
      dragRotate: true,
      scrollZoom: { around: "center" }, // Enable trackpad pinch zoom
      touchZoomRotate: true, // Enable touch pinch zoom
      doubleClickZoom: true,
      boxZoom: true,
      touchPitch: true,
      // Hide Mapbox attribution
      attributionControl: false,
    });

    // Add navigation control (zoom buttons)
    const navControl = new mapboxgl.NavigationControl({ showCompass: false });
    map.current.addControl(navControl, "top-right");

    // Initialize popup
    popup.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 15,
    });

    map.current.on("load", () => {
      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add/update shipments layer
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const mapInstance = map.current;

    // Collect all unique coordinates and routes
    const originFeatures: GeoJSON.Feature[] = [];
    const destFeatures: GeoJSON.Feature[] = [];
    const routeFeatures: GeoJSON.Feature[] = [];

    shipmentsByArea.forEach((area) => {
      area.shipments.forEach((shipment) => {
        // Only add if both origin and destination have valid coordinates
        if (
          shipment.origin_lat !== 0 &&
          shipment.origin_lng !== 0 &&
          shipment.dest_lat !== 0 &&
          shipment.dest_lng !== 0
        ) {
          // Origin marker (▲)
          originFeatures.push({
            type: "Feature",
            properties: {
              id: shipment.shipment_id,
              type: "origin",
              shipmentNumber: shipment.shipment_number,
              orderId: shipment.order_id,
              orderNumber: shipment.order_number,
              customerName: shipment.customer_name,
              originAddress: shipment.origin_address,
              originCity: shipment.origin_city,
              destAddress: shipment.dest_address,
              destCity: shipment.dest_city,
              status: shipment.status,
              statusColor: getStatusColor(shipment.status),
              icon: "▲",
            },
            geometry: {
              type: "Point",
              coordinates: [shipment.origin_lng, shipment.origin_lat],
            },
          });

          // Destination marker (▼)
          destFeatures.push({
            type: "Feature",
            properties: {
              id: shipment.shipment_id,
              type: "destination",
              shipmentNumber: shipment.shipment_number,
              orderId: shipment.order_id,
              orderNumber: shipment.order_number,
              customerName: shipment.customer_name,
              originAddress: shipment.origin_address,
              originCity: shipment.origin_city,
              destAddress: shipment.dest_address,
              destCity: shipment.dest_city,
              status: shipment.status,
              statusColor: getStatusColor(shipment.status),
              icon: "▼",
            },
            geometry: {
              type: "Point",
              coordinates: [shipment.dest_lng, shipment.dest_lat],
            },
          });

          // Route line
          routeFeatures.push({
            type: "Feature",
            properties: {
              id: shipment.shipment_id,
              statusColor: getStatusColor(shipment.status),
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [shipment.origin_lng, shipment.origin_lat],
                [shipment.dest_lng, shipment.dest_lat],
              ],
            },
          });
        }
      });
    });

    // Remove existing layers and sources
    const layersToRemove = [
      "shipment-origins",
      "shipment-origins-labels",
      "shipment-destinations",
      "shipment-destinations-labels",
      "shipment-routes",
    ];
    layersToRemove.forEach((layerId) => {
      if (mapInstance.getLayer(layerId)) {
        mapInstance.removeLayer(layerId);
      }
    });

    const sourcesToRemove = [
      "shipment-origins",
      "shipment-destinations",
      "shipment-routes",
    ];
    sourcesToRemove.forEach((sourceId) => {
      if (mapInstance.getSource(sourceId)) {
        mapInstance.removeSource(sourceId);
      }
    });

    if (originFeatures.length === 0) return;

    // Add origins source
    mapInstance.addSource("shipment-origins", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: originFeatures,
      },
    });

    // Add destinations source
    mapInstance.addSource("shipment-destinations", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: destFeatures,
      },
    });

    // Add routes source
    mapInstance.addSource("shipment-routes", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: routeFeatures,
      },
    });

    // Add route lines (draw first so markers appear on top)
    mapInstance.addLayer({
      id: "shipment-routes",
      type: "line",
      source: "shipment-routes",
      paint: {
        "line-color": ["get", "statusColor"],
        "line-width": 2,
        "line-opacity": 0.6,
      },
    });

    // Add origin markers
    mapInstance.addLayer({
      id: "shipment-origins",
      type: "circle",
      source: "shipment-origins",
      paint: {
        "circle-radius": 12,
        "circle-color": ["get", "statusColor"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // Add origin labels
    mapInstance.addLayer({
      id: "shipment-origins-labels",
      type: "symbol",
      source: "shipment-origins",
      layout: {
        "text-field": ["get", "icon"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": 10,
        "text-anchor": "center",
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Add destination markers
    mapInstance.addLayer({
      id: "shipment-destinations",
      type: "circle",
      source: "shipment-destinations",
      paint: {
        "circle-radius": 12,
        "circle-color": ["get", "statusColor"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // Add destination labels
    mapInstance.addLayer({
      id: "shipment-destinations-labels",
      type: "symbol",
      source: "shipment-destinations",
      layout: {
        "text-field": ["get", "icon"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": 10,
        "text-anchor": "center",
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Click handler for markers
    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Check if clicked on origin or destination feature
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ["shipment-origins", "shipment-destinations"],
      });

      if (!features || features.length === 0) return;

      const feature = features[0];
      const props = feature.properties as any;

      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [
        number,
        number,
      ];

      // Create popup content
      const html = `
        <div style="min-width: 250px; padding: 16px; font-family: 'Inter', sans-serif; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border-radius: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 900; color: #111827; letter-spacing: -0.02em;">
              ${props.shipmentNumber}
            </div>
            <div style="font-size: 10px; font-weight: 800; color: ${props.statusColor}; background: ${props.statusColor}15; padding: 4px 8px; border-radius: 8px; text-transform: uppercase; border: 1px solid ${props.statusColor}30;">
              ${props.status}
            </div>
          </div>

          <div style="font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
            ${props.customerName}
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; gap: 10px;">
              <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; border: 2px solid #10b981; background: #fff;"></div>
                <div style="width: 1px; height: 20px; background: #e5e7eb;"></div>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></div>
              </div>
              <div style="flex: 1;">
                <div style="margin-bottom: 14px;">
                   <div style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Origin</div>
                   <div style="font-size: 12px; font-weight: 700; color: #1f2937; line-height: 1.4;">${props.originAddress}</div>
                   <div style="font-size: 11px; font-weight: 500; color: #6b7280;">${props.originCity || "Jakarta"}</div>
                </div>
                <div>
                   <div style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">Destination</div>
                   <div style="font-size: 12px; font-weight: 700; color: #1f2937; line-height: 1.4;">${props.destAddress}</div>
                   <div style="font-size: 11px; font-weight: 500; color: #6b7280;">${props.destCity || "Tangerang"}</div>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #f3f4f6;">
             <button id="view-shipment-btn" data-order-id="${props.orderId}" style="width: 100%; padding: 10px; background: #022c22; color: #fff; border: none; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s;" >
               VIEW ORDER DETAILS
             </button>
          </div>
        </div>
      `;

      if (popup.current) {
        // Store order ID for the open handler
        const orderId = props.orderId;

        popup.current.setLngLat(coordinates).setHTML(html).addTo(mapInstance);

        // Add one-time open handler for button click
        requestAnimationFrame(() => {
          const btn = document.getElementById("view-shipment-btn");
          if (btn) {
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/a/orders/${orderId}`;
            };
          }
        });
      }
    };

    // Change cursor on hover
    const onMapMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ["shipment-origins", "shipment-destinations"],
      });
      mapInstance.getCanvas().style.cursor =
        features.length > 0 ? "pointer" : "";
    };

    mapInstance.on("click", onMapClick);
    mapInstance.on("mousemove", onMapMouseMove);

    // Fit map to show all markers (only once)
    if (!hasInitializedLayers.current && originFeatures.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      originFeatures.forEach((f) => {
        const coords = (f.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ];
        bounds.extend(coords);
      });
      destFeatures.forEach((f) => {
        const coords = (f.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ];
        bounds.extend(coords);
      });
      mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      hasInitializedLayers.current = true;
    }

    // Cleanup function
    return () => {
      mapInstance.off("click", onMapClick);
      mapInstance.off("mousemove", onMapMouseMove);
    };
  }, [shipmentsByArea, isLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="w-full bg-gray-100 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-6">
          <p className="text-gray-500">Mapbox access token not configured</p>
          <p className="text-sm text-gray-400 mt-1">
            Set VITE_MAPBOX_TOKEN in your environment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm flex flex-col">
      <style>{`
        .mapboxgl-ctrl-logo {
          display: none !important;
        }
      `}</style>
      <div
        ref={mapContainer}
        className="w-full"
        style={{
          height,
          position: "relative",
          touchAction: "pan-x pan-y", // Allow Mapbox to handle zoom gestures
        }}
      />
    </div>
  );
}
