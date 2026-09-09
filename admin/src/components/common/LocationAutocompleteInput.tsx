import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X, Loader2, Navigation } from 'lucide-react';

export interface LocationSuggestion {
  name: string;
  fullName: string;
  subtitle?: string;
  lat: number;
  lng: number;
}

interface LocationAutocompleteInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (loc: LocationSuggestion) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  iconColor?: string;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  label,
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Search city, landmark or address...',
  required = false,
  className = 'form-input',
  iconColor = 'var(--accent, #1687F5)'
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from Photon API (OpenStreetMap-based, fast & free)
  const fetchSuggestions = async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Prioritize Indian subcontinent with Delhi reference coords
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&limit=6&lat=28.6139&lon=77.2090&lang=en`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && Array.isArray(data.features) && data.features.length > 0) {
        const mapped: LocationSuggestion[] = data.features.map((f: any) => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates || [77.209, 28.6139];
          const name = props.name || props.street || term;
          const subParts = [props.city, props.state, props.country].filter(Boolean);
          const subtitle = subParts.join(', ');
          const fullName = subtitle ? `${name}, ${subtitle}` : name;

          return {
            name,
            fullName,
            subtitle,
            lat: coords[1],
            lng: coords[0]
          };
        });

        // Deduplicate
        const unique = mapped.filter((item, idx, arr) => 
          arr.findIndex(x => x.fullName.toLowerCase() === item.fullName.toLowerCase()) === idx
        );

        setSuggestions(unique);
        setIsOpen(true);
      } else {
        // Fallback to Nominatim if photon has 0 results
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=5&countrycodes=in`;
        const nomRes = await fetch(nomUrl, {
          headers: { 'Accept-Language': 'en' }
        });
        const nomData = await nomRes.json();

        if (Array.isArray(nomData) && nomData.length > 0) {
          const nomMapped: LocationSuggestion[] = nomData.map((item: any) => {
            const parts = (item.display_name || '').split(',');
            const name = parts[0]?.trim() || term;
            const subtitle = parts.slice(1, 3).join(', ').trim();
            return {
              name,
              fullName: item.display_name,
              subtitle,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            };
          });
          setSuggestions(nomMapped);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      }
    } catch (err) {
      console.warn('Location suggestion fetch error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 280);
  };

  const handleSelect = (item: LocationSuggestion) => {
    setQuery(item.fullName);
    onChange(item.fullName);
    onSelectLocation(item);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label className="form-label">{label}</label>}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <MapPin
          size={15}
          style={{
            position: 'absolute',
            left: '12px',
            color: iconColor,
            pointerEvents: 'none',
            zIndex: 2
          }}
        />

        <input
          type="text"
          className={className}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
            else if (query.trim().length >= 2) fetchSuggestions(query);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          style={{
            paddingLeft: '34px',
            paddingRight: query ? '30px' : '12px',
            width: '100%'
          }}
        />

        {isLoading ? (
          <Loader2
            size={14}
            className="spin"
            style={{
              position: 'absolute',
              right: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Clear"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown matching Image 2 design */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            marginTop: '4px',
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '10px',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px 0'
          }}
        >
          {suggestions.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={`${item.fullName}-${index}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  cursor: 'pointer',
                  borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-soft, #f1f5f9)' : 'none',
                  background: isHighlighted ? 'rgba(22, 135, 245, 0.08)' : 'transparent',
                  transition: 'background 0.12s ease'
                }}
              >
                <div
                  style={{
                    color: isHighlighted ? 'var(--accent, #1687F5)' : 'var(--text-muted, #94a3b8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <MapPin size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text, #0f172a)' }}>
                      {item.name}
                    </strong>
                    {item.subtitle && (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748b)' }}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div
            style={{
              padding: '6px 12px',
              fontSize: '10px',
              color: 'var(--text-faint, #94a3b8)',
              borderTop: '1px solid var(--border-soft, #f1f5f9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px'
            }}
          >
            <span>powered by</span>
            <strong style={{ color: 'var(--accent, #1687F5)' }}>Maps & OSM</strong>
          </div>
        </div>
      )}
    </div>
  );
};
