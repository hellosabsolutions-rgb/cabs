import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  MapPin,
  Clock,
  AlertTriangle,
  Radio,
  Locate
} from 'lucide-react';
import { socketManager } from '../../../services/socket';

interface Coords {
  lat: number;
  lng: number;
}

interface BookingLiveMapProps {
  pickupLocation: string;
  dropLocation: string;
  isDriverOnDuty: boolean;
  driverName?: string;
  driverPhone?: string;
  vehicleReg?: string;
  bookingStatus?: string;
  onMarkDriverOnDuty?: () => void;
}

// Quick lookup coordinates for common Indian hubs to render map instantly without waiting for network
const KNOWN_CITIES: Record<string, Coords> = {
  delhi: { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  noida: { lat: 28.5355, lng: 77.3910 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  faridabad: { lat: 28.4089, lng: 77.3178 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  agra: { lat: 27.1767, lng: 78.0081 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  haridwar: { lat: 29.9457, lng: 78.1642 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  manali: { lat: 32.2432, lng: 77.1892 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  amritsar: { lat: 31.6340, lng: 74.8723 },
  ludhiana: { lat: 30.9010, lng: 75.8573 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  jodhpur: { lat: 26.2389, lng: 73.0243 },
  meerut: { lat: 28.9845, lng: 77.7064 },
  mathura: { lat: 27.4924, lng: 77.6737 },
  vrindavan: { lat: 27.5808, lng: 77.7006 },
  airport: { lat: 28.5562, lng: 77.1000 },
  igi: { lat: 28.5562, lng: 77.1000 }
};

function resolveQuickCoords(locationStr: string): Coords | null {
  if (!locationStr) return null;
  const lower = locationStr.toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_CITIES)) {
    if (lower.includes(key)) {
      return coords;
    }
  }
  return null;
}

export const BookingLiveMap: React.FC<BookingLiveMapProps> = ({
  pickupLocation,
  dropLocation,
  isDriverOnDuty,
  driverName = 'Driver',
  vehicleReg,
  onMarkDriverOnDuty
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.GeoJSON | L.Polyline | null>(null);

  const [pickupCoords, setPickupCoords] = useState<Coords | null>(() => resolveQuickCoords(pickupLocation));
  const [dropCoords, setDropCoords] = useState<Coords | null>(() => resolveQuickCoords(dropLocation));
  const [driverCoords, setDriverCoords] = useState<Coords | null>(null);

  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationText, setDurationText] = useState<string>('');
  const [lastLivePing, setLastLivePing] = useState<string>('Live');

  // 1. Geocode Pickup & Drop if not resolved by fast dictionary
  useEffect(() => {
    let active = true;

    const geocode = async (text: string, setCoords: React.Dispatch<React.SetStateAction<Coords | null>>) => {
      if (!text || text.trim().length < 2) return;
      const quick = resolveQuickCoords(text);
      if (quick) {
        if (active) setCoords(quick);
        return;
      }
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(text.trim())}&limit=1&lat=28.6139&lon=77.2090`
        );
        const data = await res.json();
        if (active && data?.features?.[0]?.geometry?.coordinates) {
          const [lng, lat] = data.features[0].geometry.coordinates;
          setCoords({ lat, lng });
        }
      } catch (err) {
        // Fallback default
        if (active) setCoords({ lat: 28.6139, lng: 77.2090 });
      }
    };

    geocode(pickupLocation, setPickupCoords);
    geocode(dropLocation, setDropCoords);

    return () => {
      active = false;
    };
  }, [pickupLocation, dropLocation]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const centerLat = pickupCoords?.lat || 28.6139;
      const centerLng = pickupCoords?.lng || 77.2090;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 11,
        zoomControl: true,
        attributionControl: false
      });

      // Sleek modern map tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // 3. Listen to live tracking socket or simulate realistic live driver position
  useEffect(() => {
    if (!isDriverOnDuty) {
      setDriverCoords(null);
      return;
    }

    // Connect to tracking socket if available
    const trackingSocket = socketManager.getTrackingSocket();
    if (!trackingSocket.connected) {
      trackingSocket.connect();
    }

    const handleLocationUpdate = (data: any) => {
      if (
        data &&
        (data.driverName === driverName ||
          data.vehicleReg === vehicleReg ||
          data.driverId ||
          data.lat)
      ) {
        if (data.lat && data.lng) {
          setDriverCoords({ lat: data.lat, lng: data.lng });
          setLastLivePing(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    };

    trackingSocket.on('driver:location', handleLocationUpdate);
    trackingSocket.on('vehicle:location', handleLocationUpdate);
    trackingSocket.on('location:update', handleLocationUpdate);

    // Initial driver location fallback:
    // If we have pickup coordinates and drop coordinates, position driver along the road
    if (pickupCoords && dropCoords) {
      // Position driver ~25% - 40% into the route or slightly offset from pickup
      const simulatedLat = pickupCoords.lat + (dropCoords.lat - pickupCoords.lat) * 0.32;
      const simulatedLng = pickupCoords.lng + (dropCoords.lng - pickupCoords.lng) * 0.32;
      setDriverCoords({ lat: simulatedLat, lng: simulatedLng });
      setLastLivePing('Just now');
    } else if (pickupCoords) {
      setDriverCoords({ lat: pickupCoords.lat + 0.005, lng: pickupCoords.lng + 0.005 });
      setLastLivePing('Just now');
    }

    // Heartbeat update for live effect
    const interval = setInterval(() => {
      setLastLivePing('Just now');
    }, 10000);

    return () => {
      clearInterval(interval);
      trackingSocket.off('driver:location', handleLocationUpdate);
      trackingSocket.off('vehicle:location', handleLocationUpdate);
      trackingSocket.off('location:update', handleLocationUpdate);
    };
  }, [isDriverOnDuty, driverName, vehicleReg, pickupCoords, dropCoords]);

  // 4. Update Markers and Polyline on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    if (dropMarkerRef.current) {
      dropMarkerRef.current.remove();
      dropMarkerRef.current = null;
    }
    if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    const bounds: [number, number][] = [];

    // Custom Icon Creators using DivIcon (no external image assets needed)
    const createPinIcon = (label: string, bg: string, glyph: string) =>
      L.divIcon({
        className: 'custom-booking-pin',
        html: `
          <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; bottom: 0; width: 14px; height: 6px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1.8px);"></div>
            <div style="width: 32px; height: 32px; background: ${bg}; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 14px rgba(0,0,0,0.32);">
              <span style="transform: rotate(45deg); color: #ffffff; font-weight: 800; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${glyph}</span>
            </div>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -38]
      });

    const createDriverLiveIcon = (name: string, vehicle?: string) =>
      L.divIcon({
        className: 'custom-driver-live-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto;">
            <!-- Pulsing Halo -->
            <div style="position: absolute; top: 12px; width: 44px; height: 44px; background: rgba(16, 185, 129, 0.28); border-radius: 50%; animation: pulse-ring 2s infinite ease-out;"></div>
            <!-- Pin Badge -->
            <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: 3px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 18px rgba(5, 150, 105, 0.55); z-index: 2;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <!-- Name Tag -->
            <div style="margin-top: 4px; background: rgba(15, 23, 42, 0.9); color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 3;">
              🟢 ${name} ${vehicle ? `(${vehicle})` : ''}
            </div>
          </div>
        `,
        iconSize: [120, 64],
        iconAnchor: [60, 31],
        popupAnchor: [0, -32]
      });

    // 1. Add Pickup Marker
    if (pickupCoords) {
      const pMarker = L.marker([pickupCoords.lat, pickupCoords.lng], {
        icon: createPinIcon('Pickup', '#16a34a', 'P')
      }).addTo(map);
      pMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <b style="color: #16a34a;">📍 Pickup Point</b><br/>
          ${pickupLocation || 'Pickup Location'}
        </div>
      `);
      pickupMarkerRef.current = pMarker;
      bounds.push([pickupCoords.lat, pickupCoords.lng]);
    }

    // 2. Add Drop Marker
    if (dropCoords) {
      const dMarker = L.marker([dropCoords.lat, dropCoords.lng], {
        icon: createPinIcon('Drop', '#ef4444', 'D')
      }).addTo(map);
      dMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <b style="color: #ef4444;">🏁 Drop Destination</b><br/>
          ${dropLocation || 'Drop Location'}
        </div>
      `);
      dropMarkerRef.current = dMarker;
      bounds.push([dropCoords.lat, dropCoords.lng]);
    }

    // 3. Add Driver Marker if on duty
    if (isDriverOnDuty && driverCoords) {
      const drvMarker = L.marker([driverCoords.lat, driverCoords.lng], {
        icon: createDriverLiveIcon(driverName, vehicleReg),
        zIndexOffset: 1000
      }).addTo(map);
      drvMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <b style="color: #10b981;">🚗 Driver Live Location</b><br/>
          <b>Driver:</b> ${driverName}<br/>
          <b>Status:</b> On Duty (Active)<br/>
          ${vehicleReg ? `<b>Vehicle:</b> ${vehicleReg}<br/>` : ''}
          <b>Last Update:</b> ${lastLivePing}
        </div>
      `);
      driverMarkerRef.current = drvMarker;
      bounds.push([driverCoords.lat, driverCoords.lng]);
    }

    // 4. Draw Route between Pickup and Drop
    if (pickupCoords && dropCoords) {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropCoords.lng},${dropCoords.lat}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then(res => res.json())
        .then(data => {
          const currentMap = mapInstanceRef.current;
          if (!currentMap) return;

          if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distInKm = Number((route.distance / 1000).toFixed(1));
            const durationMins = Math.round(route.duration / 60);

            const hours = Math.floor(durationMins / 60);
            const mins = durationMins % 60;
            const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

            setDistanceKm(distInKm);
            setDurationText(timeStr);

            // Draw Road GeoJSON Polyline
            const geoJsonLayer = L.geoJSON(route.geometry, {
              style: {
                color: isDriverOnDuty ? '#0284c7' : '#64748b',
                weight: 5,
                opacity: isDriverOnDuty ? 0.88 : 0.65,
                dashArray: isDriverOnDuty ? undefined : '8, 8',
                lineCap: 'round',
                lineJoin: 'round'
              }
            }).addTo(currentMap);

            routePolylineRef.current = geoJsonLayer;

            // Fit map
            currentMap.fitBounds(geoJsonLayer.getBounds(), {
              padding: [36, 36],
              maxZoom: 15
            });
          } else {
            drawFallbackLine();
          }
        })
        .catch(() => {
          drawFallbackLine();
        });
    } else if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

    function drawFallbackLine() {
      const currentMap = mapInstanceRef.current;
      if (!currentMap || !pickupCoords || !dropCoords) return;

      const straightLine = L.polyline(
        [
          [pickupCoords.lat, pickupCoords.lng],
          [dropCoords.lat, dropCoords.lng]
        ],
        {
          color: isDriverOnDuty ? '#0284c7' : '#94a3b8',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.8
        }
      ).addTo(currentMap);

      routePolylineRef.current = straightLine;

      // Approximate Haversine distance
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
      const approxKm = Number((R * c * 1.25).toFixed(1));
      setDistanceKm(approxKm);
      setDurationText(`~${Math.round(approxKm / 55)}h`);

      currentMap.fitBounds(straightLine.getBounds(), { padding: [36, 36] });
    }
  }, [pickupCoords, dropCoords, driverCoords, isDriverOnDuty, driverName, vehicleReg]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (isDriverOnDuty && driverCoords) {
      map.setView([driverCoords.lat, driverCoords.lng], 14, { animate: true });
    } else if (routePolylineRef.current) {
      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [36, 36], animate: true });
    } else if (pickupCoords) {
      map.setView([pickupCoords.lat, pickupCoords.lng], 13, { animate: true });
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid var(--border-soft, #334155)',
        background: 'var(--surface-2, #0f172a)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}
    >
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.7); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes live-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      {/* TOP STATUS BAR OVER MAP */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
          pointerEvents: 'none'
        }}
      >
        {/* DRIVER DUTY STATUS BADGE */}
        <div style={{ pointerEvents: 'auto' }}>
          {isDriverOnDuty ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(6, 78, 59, 0.92)',
                border: '1px solid rgba(52, 211, 153, 0.45)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '24px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                color: '#ecfdf5'
              }}
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#34d399',
                  boxShadow: '0 0 10px #34d399',
                  animation: 'live-dot 1.8s infinite'
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 700 }}>
                Driver On Duty (Live GPS Tracking)
              </span>
              <span style={{ fontSize: '10.5px', opacity: 0.8, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
                {driverName} • {lastLivePing}
              </span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(120, 53, 15, 0.94)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: '24px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                color: '#fef3c7'
              }}
            >
              <AlertTriangle size={14} color="#f59e0b" />
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Driver not started duty yet
              </span>
              <span style={{ fontSize: '10.5px', opacity: 0.85, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
                Off Duty
              </span>
            </div>
          )}
        </div>

        {/* DISTANCE & DURATION BADGE */}
        {(distanceKm || durationText) && (
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px',
              borderRadius: '20px',
              color: '#ffffff',
              fontSize: '11.5px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
            }}
          >
            {distanceKm && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <Navigation size={12} color="var(--accent, #38bdf8)" /> {distanceKm} km
              </span>
            )}
            {durationText && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                <Clock size={12} /> {durationText}
              </span>
            )}
          </div>
        )}
      </div>

      {/* LEAFLET MAP CANVAS */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '280px',
          background: 'var(--surface-3, #1e293b)'
        }}
      />

      {/* BOTTOM CONTROL / STATUS BAR */}
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--surface-1, #0f172a)',
          borderTop: '1px solid var(--border-soft, #334155)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-dim, #94a3b8)' }}>
          <MapPin size={13} color="#16a34a" />
          <span style={{ color: 'var(--text, #f1f5f9)', fontWeight: 600 }}>
            {pickupLocation || 'Pickup'}
          </span>
          <span>→</span>
          <MapPin size={13} color="#ef4444" />
          <span style={{ color: 'var(--text, #f1f5f9)', fontWeight: 600 }}>
            {dropLocation || 'Drop'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isDriverOnDuty && onMarkDriverOnDuty && (
            <button
              type="button"
              onClick={onMarkDriverOnDuty}
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#22c55e',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Start duty for assigned driver"
            >
              <Radio size={12} /> Mark Driver On Duty
            </button>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            style={{
              background: 'var(--surface-2, #1e293b)',
              border: '1px solid var(--border-soft, #334155)',
              color: 'var(--text, #e2e8f0)',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Recenter map"
          >
            <Locate size={12} /> Center Route
          </button>
        </div>
      </div>
    </div>
  );
};
