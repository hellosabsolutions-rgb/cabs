import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Clock, MapPin, ArrowRightLeft, Loader2 } from 'lucide-react';

interface Coords {
  lat: number;
  lng: number;
}

interface RouteMapViewerProps {
  pickupCoords: Coords | null;
  dropCoords: Coords | null;
  pickupName?: string;
  dropName?: string;
  onRouteCalculated?: (info: { distanceKm: number; durationMinutes: number; durationText: string }) => void;
  onSwapLocations?: () => void;
}

export const RouteMapViewer: React.FC<RouteMapViewerProps> = ({
  pickupCoords,
  dropCoords,
  pickupName = 'Pickup',
  dropName = 'Drop',
  onRouteCalculated,
  onSwapLocations
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.GeoJSON | L.Polyline | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);

  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationText, setDurationText] = useState<string>('');
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = pickupCoords 
        ? [pickupCoords.lat, pickupCoords.lng] 
        : [28.6139, 77.2090]; // Delhi

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 7,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep instance until unmount
    };
  }, []);

  // Update Markers & Fetch OSRM Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Clear previous layers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    if (dropMarkerRef.current) {
      dropMarkerRef.current.remove();
      dropMarkerRef.current = null;
    }
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    // Custom Styled Div Icons
    const createMarkerIcon = (label: string, bg: string) =>
      L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position: relative; width: 32px; height: 38px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; bottom: 0; width: 12px; height: 5px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1.5px);"></div>
            <div style="width: 30px; height: 30px; background: ${bg}; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
              <span style="transform: rotate(45deg); color: #ffffff; font-weight: 800; font-size: 12px; font-family: sans-serif;">${label}</span>
            </div>
          </div>
        `,
        iconSize: [32, 38],
        iconAnchor: [16, 38]
      });

    const bounds: [number, number][] = [];

    // Add Pickup Marker
    if (pickupCoords) {
      const pMarker = L.marker([pickupCoords.lat, pickupCoords.lng], {
        icon: createMarkerIcon('P', '#16a34a')
      }).addTo(map);
      pMarker.bindPopup(`<b>Pickup:</b> ${pickupName}`);
      pickupMarkerRef.current = pMarker;
      bounds.push([pickupCoords.lat, pickupCoords.lng]);
    }

    // Add Drop Marker
    if (dropCoords) {
      const dMarker = L.marker([dropCoords.lat, dropCoords.lng], {
        icon: createMarkerIcon('D', '#ef4444')
      }).addTo(map);
      dMarker.bindPopup(`<b>Drop:</b> ${dropName}`);
      dropMarkerRef.current = dMarker;
      bounds.push([dropCoords.lat, dropCoords.lng]);
    }

    // 2. If only one point is available, center on it
    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
      setDistanceKm(null);
      setDurationText('');
      return;
    }

    // 3. If both points are available, fetch driving route
    if (pickupCoords && dropCoords) {
      setIsLoadingRoute(true);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropCoords.lng},${dropCoords.lat}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then(res => res.json())
        .then(data => {
          const activeMap = mapInstanceRef.current;
          if (!activeMap) return;

          if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distInKm = Number((route.distance / 1000).toFixed(1));
            const durationMins = Math.round(route.duration / 60);

            // Format duration string
            const hours = Math.floor(durationMins / 60);
            const mins = durationMins % 60;
            const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

            setDistanceKm(distInKm);
            setDurationText(timeStr);

            if (onRouteCalculated) {
              onRouteCalculated({
                distanceKm: distInKm,
                durationMinutes: durationMins,
                durationText: timeStr
              });
            }

            // Draw Road GeoJSON Polyline
            const geoJsonLayer = L.geoJSON(route.geometry, {
              style: {
                color: '#2563eb',
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round'
              }
            }).addTo(activeMap);

            routeLayerRef.current = geoJsonLayer;

            // Fit entire route in view with padding
            activeMap.fitBounds(geoJsonLayer.getBounds(), {
              padding: [30, 30],
              maxZoom: 15
            });
          } else {
            // Fallback straight line
            drawStraightLine();
          }
        })
        .catch(err => {
          console.warn('OSRM routing fetch failed, drawing straight line', err);
          drawStraightLine();
        })
        .finally(() => {
          setIsLoadingRoute(false);
        });
    }

    function drawStraightLine() {
      const activeMap = mapInstanceRef.current;
      if (!activeMap || !pickupCoords || !dropCoords) return;

      const straightLine = L.polyline(
        [
          [pickupCoords.lat, pickupCoords.lng],
          [dropCoords.lat, dropCoords.lng]
        ],
        { color: '#2563eb', weight: 4, dashArray: '6, 8', opacity: 0.8 }
      ).addTo(activeMap);
      routeLayerRef.current = straightLine;

      // Rough Haversine distance
      const R = 6371;
      const dLat = ((dropCoords.lat - pickupCoords.lat) * Math.PI) / 180;
      const dLon = ((dropCoords.lng - pickupCoords.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((pickupCoords.lat * Math.PI) / 180) *
          Math.cos((dropCoords.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const approxKm = Number((R * c * 1.25).toFixed(1)); // 1.25 road curvature factor
      setDistanceKm(approxKm);
      setDurationText(`~${Math.round(approxKm / 55)}h`);

      activeMap.fitBounds(straightLine.getBounds(), { padding: [30, 30] });
    }
  }, [pickupCoords, dropCoords]);

  // Fix map resize when container becomes visible
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [pickupCoords, dropCoords]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border, #e2e8f0)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        background: 'var(--surface-2, #f8fafc)'
      }}
    >
      {/* Map Element */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '220px',
          zIndex: 1
        }}
      />

      {/* Floating Header Badge: Distance & Time */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: '8px',
            padding: '6px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '12px',
            pointerEvents: 'auto'
          }}
        >
          {isLoadingRoute ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent, #1687F5)' }}>
              <Loader2 size={14} className="spin" />
              <span>Calculating live driving route...</span>
            </div>
          ) : distanceKm ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Navigation size={13} style={{ color: '#2563eb' }} />
                <span style={{ color: '#64748b' }}>Total Distance:</span>
                <strong style={{ color: '#0f172a', fontSize: '13px' }}>{distanceKm} km</strong>
              </div>

              {durationText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
                  <Clock size={13} style={{ color: '#16a34a' }} />
                  <span style={{ color: '#64748b' }}>Est. Time:</span>
                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>{durationText}</strong>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#64748b', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={13} style={{ color: '#2563eb' }} />
              <span>Select pickup & drop locations to preview driving route</span>
            </div>
          )}
        </div>

        {onSwapLocations && pickupCoords && dropCoords && (
          <button
            type="button"
            onClick={onSwapLocations}
            style={{
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'var(--accent, #1687F5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              pointerEvents: 'auto'
            }}
            title="Swap Pickup and Drop Locations"
          >
            <ArrowRightLeft size={12} />
            <span>Swap</span>
          </button>
        )}
      </div>

      {/* Legend at bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '10px',
          zIndex: 999,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '10.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          pointerEvents: 'none'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a', fontWeight: 600 }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a' }} />
          Pickup
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#ef4444', fontWeight: 600 }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
          Drop
        </span>
      </div>
    </div>
  );
};
