import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  MapPin,
  Search,
  Navigation,
  Check,
  Loader2,
  Crosshair,
  Sparkles
} from 'lucide-react';

interface LocationResult {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationResult) => void;
  initialAddress?: string;
  initialCity?: string;
  initialState?: string;
}

// Default to central New Delhi if no initial location
const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialAddress = '',
  initialCity = '',
  initialState = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Address fields editable by user
  const [pickedAddress, setPickedAddress] = useState(initialAddress);
  const [pickedCity, setPickedCity] = useState(initialCity);
  const [pickedState, setPickedState] = useState(initialState);
  const [displayLocationName, setDisplayLocationName] = useState('');

  // Reverse geocode lat/lng to address details using OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      const data = await res.json();

      if (data && data.address) {
        const addr = data.address;

        // Build clean street address
        const road = addr.road || addr.street || addr.suburb || addr.neighbourhood || addr.industrial || '';
        const house = addr.house_number ? `${addr.house_number}, ` : '';
        const area = addr.suburb || addr.neighbourhood || addr.residential || '';
        const streetAddress = `${house}${road}${area && road ? ', ' + area : ''}`.trim() || data.name || data.display_name?.split(',')[0] || '';

        // Extract city/district
        const cityVal = addr.city || addr.town || addr.municipality || addr.city_district || addr.county || '';

        // Extract state
        const stateVal = addr.state || addr.state_district || '';

        setPickedAddress(streetAddress || (data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : ''));
        if (cityVal) setPickedCity(cityVal);
        if (stateVal) setPickedState(stateVal);
        setDisplayLocationName(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } else {
        setDisplayLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch (err) {
      console.warn('Reverse geocoding failed', err);
      setDisplayLocationName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Search address by text and fly map
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=1&countrycodes=in`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en'
        }
      });
      const results = await res.json();

      if (results && results.length > 0) {
        const item = results[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);

        setCoords({ lat: newLat, lng: newLng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLng], 16, { animate: true, duration: 1.2 });
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        }

        reverseGeocode(newLat, newLng);
      } else {
        alert('Location not found. Try searching with city or landmark name.');
      }
    } catch (err) {
      console.warn('Search geocoding failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Get current device geolocation
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const curLat = pos.coords.latitude;
        const curLng = pos.coords.longitude;

        setCoords({ lat: curLat, lng: curLng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([curLat, curLng], 17, { animate: true, duration: 1.2 });
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([curLat, curLng]);
        }

        reverseGeocode(curLat, curLng);
      },
      err => {
        setIsGeocoding(false);
        console.warn('Geolocation error:', err.message);
        alert('Could not fetch GPS location. Please allow location permissions or drag the pin on map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Initialize Leaflet Map once modal is open
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure DOM modal node has dimensions
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean existing instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initial coordinates
      const startLat = coords.lat || DEFAULT_LAT;
      const startLng = coords.lng || DEFAULT_LNG;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 15,
        zoomControl: true
      });

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Custom pulsing Pin Icon matching FleetOS theme
      const customPinIcon = L.divIcon({
        className: 'custom-fleet-pin',
        html: `
          <div style="position: relative; width: 38px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; bottom: 0; width: 14px; height: 6px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(2px);"></div>
            <div style="width: 36px; height: 36px; background: #39ff6e; border: 3px solid #000; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(57, 255, 110, 0.6);">
              <div style="width: 12px; height: 12px; background: #000; border-radius: 50%;"></div>
            </div>
          </div>
        `,
        iconSize: [38, 44],
        iconAnchor: [19, 44]
      });

      // Draggable marker
      const marker = L.marker([startLat, startLng], {
        draggable: true,
        icon: customPinIcon,
        autoPan: true
      }).addTo(map);

      marker.bindTooltip('Drag me to your office location', {
        permanent: false,
        direction: 'top',
        offset: [0, -40]
      });

      // Marker drag event
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      // Map click event: moves marker to clicked spot
      map.on('click', (e: L.LeafletMouseEvent) => {
        const clickedLat = e.latlng.lat;
        const clickedLng = e.latlng.lng;
        marker.setLatLng([clickedLat, clickedLng]);
        setCoords({ lat: clickedLat, lng: clickedLng });
        reverseGeocode(clickedLat, clickedLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Reverse geocode initial spot
      reverseGeocode(startLat, startLng);

      // Invalidate size once rendered
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onLocationSelect({
      address: pickedAddress.trim(),
      city: pickedCity.trim(),
      state: pickedState.trim(),
      lat: coords.lat,
      lng: coords.lng
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 780,
          width: '95vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} color="var(--accent)" />
              Pin & Pick Office Location on Map
            </div>
            <div className="modal-subtitle">
              Drag the pointer or click anywhere on map. Address and city will auto-fill below.
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Search Bar & Current Location Strip */}
        <div
          style={{
            padding: '12px 18px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200, display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={15}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search landmark, sector, or city (e.g. Connaught Place, New Delhi)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px', fontSize: '12.5px' }}
              />
            </div>
            <button
              type="submit"
              className="btn-primary-action"
              disabled={isSearching}
              style={{ padding: '0 16px', height: '38px', fontSize: '12px' }}
            >
              {isSearching ? <Loader2 size={14} className="spin-loader" /> : 'Search'}
            </button>
          </form>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleCurrentLocation}
            style={{
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '0 14px',
              whiteSpace: 'nowrap'
            }}
            title="Locate my device via GPS"
          >
            <Crosshair size={14} color="var(--accent)" />
            <span>My Current Location</span>
          </button>
        </div>

        {/* Map Container */}
        <div style={{ position: 'relative', width: '100%', height: 350, background: '#111' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Status Overlay Badge */}
          {isGeocoding && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.85)',
                color: '#39ff6e',
                border: '1px solid #39ff6e',
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 1000,
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
              }}
            >
              <Loader2 size={13} className="spin-loader" />
              <span>Resolving address from coordinates...</span>
            </div>
          )}

          {/* Coordinates overlay pill */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              background: 'rgba(15, 20, 25, 0.88)',
              backdropFilter: 'blur(6px)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              color: 'var(--text-dim)',
              zIndex: 999
            }}
          >
            GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </div>
        </div>

        {/* Auto-filled & Editable Address Form Fields */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="var(--accent)" />
              Auto-Detected Location (You can edit before confirming):
            </div>
            {displayLocationName && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-faint)',
                  maxWidth: 320,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={displayLocationName}
              >
                {displayLocationName}
              </span>
            )}
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Office / Street Address *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Building / Plot No, Road, Area..."
              value={pickedAddress}
              onChange={e => setPickedAddress(e.target.value)}
              style={{ fontSize: '12.5px', height: '36px' }}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>City *</label>
              <input
                type="text"
                className="form-input"
                placeholder="City"
                value={pickedCity}
                onChange={e => setPickedCity(e.target.value)}
                style={{ fontSize: '12.5px', height: '36px' }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>State *</label>
              <input
                type="text"
                className="form-input"
                placeholder="State"
                value={pickedState}
                onChange={e => setPickedState(e.target.value)}
                style={{ fontSize: '12.5px', height: '36px' }}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '12px 20px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleConfirm}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Check size={16} />
            Confirm & Auto-fill Address
          </button>
        </div>
      </div>
    </div>
  );
};
