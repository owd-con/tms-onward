import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// We use the environment variable for mapbox token like in dashboard
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface TripMapViewerProps {
  loads?: any[];
  selectedLoad?: any;
}

export const TripMapViewer: React.FC<TripMapViewerProps> = ({ loads = [], selectedLoad }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current || !MAPBOX_TOKEN) return;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // standard working style used in dashboard
        center: [106.8456, -6.2088], // Jakarta default center
        zoom: 10,
        interactive: true,
        attributionControl: false,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: true,
        offset: 15,
        maxWidth: '320px',
        className: "shipment-popup shadow-lg rounded-xl border border-slate-100",
      });

      map.current.on('load', () => {
        setIsLoaded(true);
      });

    } catch (error) {
      console.warn('Mapbox initialization failed.', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Sync Markers
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    const originFeatures: GeoJSON.Feature[] = [];
    const destFeatures: GeoJSON.Feature[] = [];
    const waypointFeatures: GeoJSON.Feature[] = [];
    const routeFeatures: GeoJSON.Feature[] = [];

    const itemsToMap = selectedLoad ? [selectedLoad] : loads;

    itemsToMap.forEach((item) => {
      const shipments = item.shipments || item.failed_shipments || [];
      const waypoints = item.trip_waypoints || [];

      shipments.forEach((s: any) => {
        const oLat = parseFloat(s.origin_address_rel?.region?.latitude || s.origin_lat);
        const oLng = parseFloat(s.origin_address_rel?.region?.longitude || s.origin_lng);
        const dLat = parseFloat(s.destination_address_rel?.region?.latitude || s.dest_lat);
        const dLng = parseFloat(s.destination_address_rel?.region?.longitude || s.dest_lng);

        if (oLat && oLng) {
          originFeatures.push({
            type: "Feature",
            properties: { 
              color: '#10B981', 
              icon: '▲',
              type: 'origin',
              contactName: s.origin_contact_name || s.origin_address_rel?.contact_name || "Contact Unknown",
              contactPhone: s.origin_contact_phone || s.origin_address_rel?.contact_phone || "No Phone",
              originName: s.origin_address_rel?.name || "Origin Site",
              originAddress: s.origin_address_rel?.address || s.origin_address || "Address Unavailable",
              originCity: s.origin_address_rel?.region?.name || "City Unknown",
            },
            geometry: { type: "Point", coordinates: [oLng, oLat] }
          });
          bounds.extend([oLng, oLat]);
          hasPoints = true;
        }

        if (dLat && dLng) {
          destFeatures.push({
            type: "Feature",
            properties: { 
              color: '#EF4444', 
              icon: '▼',
              type: 'destination',
              contactName: s.dest_contact_name || s.destination_address_rel?.contact_name || "Contact Unknown",
              contactPhone: s.dest_contact_phone || s.destination_address_rel?.contact_phone || "No Phone",
              destName: s.destination_address_rel?.name || "Dest Site",
              destAddress: s.destination_address_rel?.address || s.dest_address || "Address Unavailable",
              destCity: s.destination_address_rel?.region?.name || "City Unknown",
            },
            geometry: { type: "Point", coordinates: [dLng, dLat] }
          });
          bounds.extend([dLng, dLat]);
          hasPoints = true;
        }

        if (oLat && oLng && dLat && dLng) {
          routeFeatures.push({
            type: "Feature",
            properties: { color: '#0F172A' },
            geometry: {
              type: "LineString",
              coordinates: [[oLng, oLat], [dLng, dLat]]
            }
          });
        }
      });

      let previousWaypoint: [number, number] | null = null;
      waypoints.forEach((wp: any, idx: number) => {
        const lat = parseFloat(wp.lat || wp.address_rel?.region?.latitude || wp.address_rel?.lat);
        const lng = parseFloat(wp.lng || wp.address_rel?.region?.longitude || wp.address_rel?.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
          const isPickup = wp.type?.toLowerCase().includes('pickup');
          const color = isPickup ? '#10B981' : '#3B82F6'; // Emerald-500, Blue-500

          waypointFeatures.push({
            type: "Feature",
            properties: { 
              color: color, 
              label: `${idx + 1}`,
              type: wp.type || 'waypoint',
              contactName: wp.contact_name || wp.address_rel?.contact_name || "Contact Unknown",
              contactPhone: wp.contact_phone || wp.address_rel?.contact_phone || "No Phone",
              destName: wp.location_name || wp.address_rel?.name || "Waypoint",
              destAddress: wp.address || wp.address_rel?.address || "Address Unavailable",
              destCity: wp.region?.name || wp.address_rel?.region?.name || "",
            },
            geometry: { type: "Point", coordinates: [lng, lat] }
          });
          bounds.extend([lng, lat]);
          hasPoints = true;

          if (previousWaypoint) {
             routeFeatures.push({
              type: "Feature",
              properties: { color: '#64748B' }, // Slate-500 for the route line
              geometry: { type: "LineString", coordinates: [previousWaypoint, [lng, lat]] }
            });
          }
          previousWaypoint = [lng, lat];
        }
      });
    });

    const cleanupLayers = ['trip-routes', 'trip-origins', 'trip-origins-labels', 'trip-dests', 'trip-dests-labels', 'trip-waypoints', 'trip-waypoints-labels'];
    cleanupLayers.forEach(l => {
      if (map.current!.getLayer(l)) map.current!.removeLayer(l);
    });

    const cleanupSources = ['trip-origins', 'trip-dests', 'trip-waypoints', 'trip-routes'];
    cleanupSources.forEach(s => {
      if (map.current!.getSource(s)) map.current!.removeSource(s);
    });

    if (hasPoints) {
      if (routeFeatures.length > 0) map.current!.addSource('trip-routes', { type: 'geojson', data: { type: 'FeatureCollection', features: routeFeatures } });
      if (originFeatures.length > 0) map.current!.addSource('trip-origins', { type: 'geojson', data: { type: 'FeatureCollection', features: originFeatures } });
      if (destFeatures.length > 0) map.current!.addSource('trip-dests', { type: 'geojson', data: { type: 'FeatureCollection', features: destFeatures } });
      if (waypointFeatures.length > 0) map.current!.addSource('trip-waypoints', { type: 'geojson', data: { type: 'FeatureCollection', features: waypointFeatures } });

      if (routeFeatures.length > 0) {
        map.current!.addLayer({
          id: 'trip-routes',
          type: 'line',
          source: 'trip-routes',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2,
            'line-opacity': 0.8
          }
        });
      }

      if (originFeatures.length > 0) {
        map.current!.addLayer({ id: 'trip-origins', type: 'circle', source: 'trip-origins', paint: { 'circle-radius': 12, 'circle-color': ['get', 'color'], 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
        map.current!.addLayer({ id: 'trip-origins-labels', type: 'symbol', source: 'trip-origins', layout: { 'text-field': ['get', 'icon'], 'text-font': ["Open Sans Regular", "Arial Unicode MS Regular"], 'text-size': 10, 'text-anchor': 'center', 'text-ignore-placement': true }, paint: { 'text-color': '#ffffff' } });
      }

      if (destFeatures.length > 0) {
        map.current!.addLayer({ id: 'trip-dests', type: 'circle', source: 'trip-dests', paint: { 'circle-radius': 12, 'circle-color': ['get', 'color'], 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
        map.current!.addLayer({ id: 'trip-dests-labels', type: 'symbol', source: 'trip-dests', layout: { 'text-field': ['get', 'icon'], 'text-font': ["Open Sans Regular", "Arial Unicode MS Regular"], 'text-size': 10, 'text-anchor': 'center', 'text-ignore-placement': true }, paint: { 'text-color': '#ffffff' } });
      }

      if (waypointFeatures.length > 0) {
        map.current!.addLayer({ id: 'trip-waypoints', type: 'circle', source: 'trip-waypoints', paint: { 'circle-radius': 12, 'circle-color': ['get', 'color'], 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
        map.current!.addLayer({ id: 'trip-waypoints-labels', type: 'symbol', source: 'trip-waypoints', layout: { 'text-field': ['get', 'label'], 'text-font': ["Open Sans Regular", "Arial Unicode MS Regular"], 'text-size': 12, 'text-anchor': 'center', 'text-ignore-placement': true }, paint: { 'text-color': '#ffffff' } });
      }

      map.current!.fitBounds(bounds, { padding: 80, maxZoom: 14 });

      const getActiveInteractiveLayers = () => {
        return ["trip-origins", "trip-dests", "trip-waypoints"].filter(id => map.current!.getLayer(id));
      };

      const onMapClick = (e: mapboxgl.MapMouseEvent) => {
        const activeLayers = getActiveInteractiveLayers();
        if (activeLayers.length === 0) return;

        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: activeLayers,
        });

        if (!features || features.length === 0) return;

        const feature = features[0];
        const props = feature.properties as any;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];

        const popupHtml = `
          <div style="width: 100%; min-width: 250px; box-sizing: border-box; font-family: 'Inter', sans-serif; padding: 2px 0;">
            <!-- Header section structured explicitly around the Mapbox Close X button overlap space -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-right: 20px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${props.color}; box-shadow: 0 0 0 3px ${props.color}30;"></div>
              <div style="font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; text-transform: capitalize;">
                ${props.type}
              </div>
            </div>
            
            <!-- Contact Info Nested Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px; box-sizing: border-box; width: 100%;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                Contact Person
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #ffffff; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #cbd5e1; color: #475569;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div style="font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1;">${props.contactName}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #ffffff; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #cbd5e1; color: #475569;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div style="font-size: 12px; font-weight: 600; color: #475569; line-height: 1;">${props.contactPhone}</div>
                </div>
              </div>
            </div>
            
            <!-- Address Location Nested Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; box-sizing: border-box; width: 100%;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                 Physical Location
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                  ${props.originName || props.destName || "Location Name"}
                </div>
                <div style="font-size: 12px; font-weight: 500; color: #64748b; line-height: 1.4;">
                  ${props.originAddress || props.destAddress || "Address Unavailable"}
                </div>
                ${(props.originCity || props.destCity) ? `<div style="font-size: 11px; font-weight: 500; color: #94a3b8; line-height: 1.4; margin-top: 2px;">${props.originCity || props.destCity}</div>` : ""}
              </div>
            </div>
          </div>
        `;

        if (popupRef.current) {
          popupRef.current.setLngLat(coordinates).setHTML(popupHtml).addTo(map.current!);
        }
      };

      const onMapMouseMove = (e: mapboxgl.MapMouseEvent) => {
        const activeLayers = getActiveInteractiveLayers();
        if (activeLayers.length === 0) return;

        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: activeLayers,
        });
        map.current!.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";
      };

      map.current!.on("click", onMapClick);
      map.current!.on("mousemove", onMapMouseMove);

      // Cleanup event listeners when effect unmounts
      return () => {
        if (popupRef.current) popupRef.current.remove();
        if (map.current) {
          map.current.off("click", onMapClick);
          map.current.off("mousemove", onMapMouseMove);
        }
      };

    } else if (selectedLoad) {
      map.current!.flyTo({ center: [106.8456, -6.2088], zoom: 10 });
    }

  }, [loads, selectedLoad, isLoaded]);

  return (
    <div className="w-full h-full relative bg-slate-100 flex items-center justify-center overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {!MAPBOX_TOKEN && (
        <div className='absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center z-10'>
          <p className="text-slate-600 font-medium text-lg mb-2">Mapbox token is missing or not bound</p>
          <code className="text-sm text-slate-400 bg-slate-100 px-3 py-1 rounded-md">VITE_MAPBOX_TOKEN</code>
        </div>
      )}
    </div>
  );
};
