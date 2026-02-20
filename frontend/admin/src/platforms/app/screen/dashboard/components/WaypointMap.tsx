import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapWaypointsByArea } from "@/services/types";

// Set Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

interface WaypointMapProps {
  waypointsByArea: MapWaypointsByArea[];
  height?: string;
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  pending: "#FBBF24",
  dispatched: "#3B82F6",
  in_transit: "#8B5CF6",
  completed: "#10B981",
  failed: "#EF4444",
};

const getStatusColor = (status: string) => STATUS_COLORS[status] || "#6B7280";

const getMarkerIcon = (waypointType: string) => {
  return waypointType === "pickup" ? "▲" : "▼";
};

export default function WaypointMap({ waypointsByArea, height = "400px" }: WaypointMapProps) {
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
      closeOnClick: true,
      offset: 15,
    });

    map.current.on("load", () => {
      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add/update waypoints layer
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const mapInstance = map.current;

    // Convert waypoints to GeoJSON FeatureCollection
    const features: GeoJSON.Feature[] = [];
    waypointsByArea.forEach((area) => {
      const totalOrders = area.waypoints.length;
      area.waypoints.forEach((waypoint) => {
        if (waypoint.lat && waypoint.lng) {
          features.push({
            type: "Feature",
            properties: {
              id: waypoint.order_id,
              orderNumber: waypoint.order_number,
              customerName: waypoint.customer_name,
              address: waypoint.address,
              status: waypoint.status,
              waypointType: waypoint.waypoint_type,
              city: waypoint.city,
              statusColor: getStatusColor(waypoint.status),
              icon: getMarkerIcon(waypoint.waypoint_type),
              totalOrders: totalOrders,
            },
            geometry: {
              type: "Point",
              coordinates: [waypoint.lng, waypoint.lat],
            },
          });
        }
      });
    });

    const geojsonData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    // Remove existing layer and source if exists
    if (mapInstance.getLayer("waypoints")) {
      mapInstance.removeLayer("waypoints");
    }
    if (mapInstance.getLayer("waypoint-labels")) {
      mapInstance.removeLayer("waypoint-labels");
    }
    if (mapInstance.getSource("waypoints")) {
      mapInstance.removeSource("waypoints");
    }

    if (features.length === 0) return;

    // Add source
    mapInstance.addSource("waypoints", {
      type: "geojson",
      data: geojsonData,
    });

    // Add circle layer for markers
    mapInstance.addLayer({
      id: "waypoints",
      type: "circle",
      source: "waypoints",
      paint: {
        "circle-radius": 14,
        "circle-color": ["get", "statusColor"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
      // Allow map interactions to pass through empty areas
      filter: ["has", "id"],
    });

    // Add symbol layer for labels (pickup/delivery icons)
    mapInstance.addLayer({
      id: "waypoint-labels",
      type: "symbol",
      source: "waypoints",
      layout: {
        "text-field": ["get", "icon"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": 12,
        "text-anchor": "center",
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    // Click handler for waypoints - use canvas click to not interfere with double click zoom
    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      // Check if clicked on a waypoint feature
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ["waypoints"],
      });

      if (!features || features.length === 0) return;

      const feature = features[0];
      const props = feature.properties as any;

      const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];

      // Create popup content - show address and total orders
      const html = `
        <div style="min-width: 200px; padding: 8px;">
          <div style="font-size: 13px; color: #374151;">${props.address}</div>
          ${props.city ? `<div style="font-size: 12px; color: #6B7280; margin-top: 2px;">${props.city}</div>` : ""}
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #E5E7EB;">
            <div style="font-size: 12px; color: #6B7280;">Total Orders: <span style="font-weight: 600; color: #374151;">${props.totalOrders || 1}</span></div>
          </div>
        </div>
      `;

      if (popup.current) {
        popup.current.setLngLat(coordinates).setHTML(html).addTo(mapInstance);
      }
    };

    // Change cursor on hover - check if hovering over a waypoint
    const onMapMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ["waypoints"],
      });
      mapInstance.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";
    };

    mapInstance.on("click", onMapClick);
    mapInstance.on("mousemove", onMapMouseMove);

    // Fit map to show all markers (only once)
    if (!hasInitializedLayers.current && features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach((f) => {
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
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
  }, [waypointsByArea, isLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="w-full bg-gray-100 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-6">
          <p className="text-gray-500">Mapbox access token not configured</p>
          <p className="text-sm text-gray-400 mt-1">Set VITE_MAPBOX_TOKEN in your environment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-sm">
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
