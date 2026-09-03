import React, { useState, useRef, useEffect } from 'react';
import { useAgency } from '../../context/AgencyContext';
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Settings,
  Briefcase
} from 'lucide-react';
import { CreateAgencyModal } from '../modules/agency/CreateAgencyModal';
import { AgencyProfileModal } from '../modules/agency/AgencyProfileModal';

interface AgencySwitcherProps {
  compact?: boolean;
}

export const AgencySwitcher: React.FC<AgencySwitcherProps> = ({ compact = false }) => {
  const { currentAgency, agencies, switchAgency } = useAgency();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!currentAgency) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(prev => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: compact ? '6px 10px' : '10px 12px',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease'
        }}
        title="Switch Agency or View Profile"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: compact ? 26 : 30,
              height: compact ? 26 : 30,
              borderRadius: '6px',
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Building2 size={compact ? 14 : 16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: compact ? '12px' : '12.5px',
                fontWeight: 600,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentAgency.name}
            </div>
            {!compact && (
              <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                {currentAgency.city ? `${currentAgency.city}` : 'Fleet Company'} · Switch ▾
              </div>
            )}
          </div>
        </div>

        <ChevronDown size={14} color="var(--text-faint)" />
      </button>

      {/* Switcher Dropdown */}
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: 270,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
            padding: '10px',
            zIndex: 1000,
            animation: 'modalSlideUp 0.15s ease'
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '4px 6px 8px'
            }}
          >
            Your Companies & Agencies
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 220, overflowY: 'auto' }}>
            {agencies.map(agency => {
              const isSelected =
                (currentAgency.id && currentAgency.id === agency.id) ||
                (currentAgency._id && currentAgency._id === agency._id);

              return (
                <div
                  key={agency.id || agency._id}
                  onClick={() => {
                    const id = agency.id || agency._id;
                    if (id) {
                      switchAgency(id);
                      setDropdownOpen(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--accent-dim)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: isSelected ? 600 : 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {agency.name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                      {agency.city ? agency.city : agency.businessType}
                    </div>
                  </div>

                  {isSelected && <Check size={14} color="var(--accent)" />}
                </div>
              );
            })}
          </div>

          <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />

          {/* Quick Actions */}
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              setProfileModalOpen(true);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--text)',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <Settings size={13} color="var(--text-faint)" />
            Agency Profile & Settings
          </button>

          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              setCreateModalOpen(true);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-soft)',
              borderRadius: '6px',
              color: 'var(--accent)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '4px',
              textAlign: 'left'
            }}
          >
            <Plus size={13} />
            Add Another Agency / Branch
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateAgencyModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <AgencyProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenCreateNew={() => setCreateModalOpen(true)}
      />
    </div>
  );
};
