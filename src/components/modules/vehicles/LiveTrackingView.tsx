import React, { useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Radio, Navigation, Battery, Cpu, ShieldCheck } from 'lucide-react';

interface VehicleTelemetry {
  id: string;
  reg: string;
  model: string;
  driver: string;
  speed: number;
  ignition: boolean;
  status: 'Moving' | 'Idling' | 'Parked' | 'Offline';
  location: string;
  coordinates: string;
  distanceToday: number;
  battery: string;
  satellites: number;
  lastPing: string;
  fuelPercent: number;
}

const mockTelemetryData: Record<string, VehicleTelemetry> = {
  DL01AB1234: {
    id: 'v1',
    reg: 'DL01AB1234',
    model: 'Toyota Innova Crysta',
    driver: 'Rahul Sharma',
    speed: 48,
    ignition: true,
    status: 'Moving',
    location: 'Ring Road Flyover near ITO, New Delhi',
    coordinates: '28.6289° N, 77.2412° E',
    distanceToday: 135,
    battery: '13.4V (Healthy)',
    satellites: 18,
    lastPing: 'Just now (1s ago)',
    fuelPercent: 78
  },
  DL02CD5678: {
    id: 'v2',
    reg: 'DL02CD5678',
    model: 'Maruti Ertiga ZXi',
    driver: 'Vikas Kumar',
    speed: 74,
    ignition: true,
    status: 'Moving',
    location: 'NH-44 Highway near Murthal, Haryana',
    coordinates: '28.9833° N, 77.0667° E',
    distanceToday: 190,
    battery: '13.6V (Healthy)',
    satellites: 20,
    lastPing: '2s ago',
    fuelPercent: 62
  },
  DL03EF9012: {
    id: 'v3',
    reg: 'DL03EF9012',
    model: 'Mahindra Scorpio-N',
    driver: 'Suresh Yadav',
    speed: 0,
    ignition: false,
    status: 'Parked',
    location: 'Ludhiana Central Transport Stand, Punjab',
    coordinates: '30.9010° N, 75.8573° E',
    distanceToday: 24,
    battery: '12.8V (Normal)',
    satellites: 14,
    lastPing: '15s ago',
    fuelPercent: 88
  },
  DL05KL4432: {
    id: 'v5',
    reg: 'DL05KL4432',
    model: 'Tata Tigor EV / CNG',
    driver: 'Vikas Kumar',
    speed: 0,
    ignition: true,
    status: 'Idling',
    location: 'Delhi Jal Nigam Wazirabad Plant Gate, Delhi',
    coordinates: '28.7180° N, 77.2310° E',
    distanceToday: 110,
    battery: '13.1V (Healthy)',
    satellites: 16,
    lastPing: '4s ago',
    fuelPercent: 54
  },
  DL07GH2211: {
    id: 'v4',
    reg: 'DL07GH2211',
    model: 'Maruti Dzire Tour S',
    driver: 'Sunil Verma',
    speed: 0,
    ignition: false,
    status: 'Offline',
    location: 'Authorized Workshop Yard, Okhla Phase 2',
    coordinates: '28.5355° N, 77.2710° E',
    distanceToday: 0,
    battery: '12.4V (Standby)',
    satellites: 0,
    lastPing: '35m ago (Workshop mode)',
    fuelPercent: 35
  }
};

export const LiveTrackingView: React.FC = () => {
  const { vehicles } = useFleet();
  const [selectedReg, setSelectedReg] = useState<string>('DL01AB1234');
  const [activeTab, setActiveTab] = useState<'all' | 'moving' | 'idling' | 'parked'>('all');

  const selectedVehicle = mockTelemetryData[selectedReg] || {
    id: 'v1',
    reg: selectedReg,
    model: 'Fleet Vehicle',
    driver: 'Assigned Driver',
    speed: 42,
    ignition: true,
    status: 'Moving',
    location: 'Delhi NCR Inner Ring Road',
    coordinates: '28.6139° N, 77.2090° E',
    distanceToday: 88,
    battery: '13.2V (Healthy)',
    satellites: 16,
    lastPing: 'Just now',
    fuelPercent: 70
  };

  const getStatusColor = (status: VehicleTelemetry['status']) => {
    switch (status) {
      case 'Moving':
        return '#39ff6e';
      case 'Idling':
        return '#ffcc4d';
      case 'Parked':
        return '#38bdf8';
      case 'Offline':
        return '#ff5c5c';
      default:
        return 'var(--text-dim)';
    }
  };

  const vehicleList = vehicles.map(v => {
    const telem = mockTelemetryData[v.registrationNumber] || {
      id: v.id,
      reg: v.registrationNumber,
      model: v.model || v.type,
      driver: v.assignedDriver || 'Driver',
      speed: v.status === 'Running' ? 52 : 0,
      ignition: v.status === 'Running',
      status: v.status === 'Running' ? 'Moving' : v.status === 'Idle' ? 'Parked' : 'Offline',
      location: v.assignedTo + ' Hub',
      coordinates: '28.6139° N, 77.2090° E',
      distanceToday: 95,
      battery: '13.2V',
      satellites: 15,
      lastPing: '2s ago',
      fuelPercent: 65
    };
    return telem;
  });

  const filteredVehicles = vehicleList.filter(v => {
    if (activeTab === 'moving') return v.status === 'Moving';
    if (activeTab === 'idling') return v.status === 'Idling';
    if (activeTab === 'parked') return v.status === 'Parked';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Live Telematics Header Strip */}
      <div
        style={{
          background: 'var(--surface-2)',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#39ff6e',
              boxShadow: '0 0 10px #39ff6e'
            }}
          />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Real-time GPS Fleet Telematics</span>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            (Live 4G AIS-140 GPS Feed)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`subtab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
          >
            All ({vehicleList.length})
          </button>
          <button
            className={`subtab-btn ${activeTab === 'moving' ? 'active' : ''}`}
            onClick={() => setActiveTab('moving')}
            style={{ padding: '4px 10px', fontSize: '11.5px', color: '#39ff6e' }}
          >
            ● Moving ({vehicleList.filter(v => v.status === 'Moving').length})
          </button>
          <button
            className={`subtab-btn ${activeTab === 'idling' ? 'active' : ''}`}
            onClick={() => setActiveTab('idling')}
            style={{ padding: '4px 10px', fontSize: '11.5px', color: '#ffcc4d' }}
          >
            ● Idling ({vehicleList.filter(v => v.status === 'Idling').length})
          </button>
          <button
            className={`subtab-btn ${activeTab === 'parked' ? 'active' : ''}`}
            onClick={() => setActiveTab('parked')}
            style={{ padding: '4px 10px', fontSize: '11.5px', color: '#38bdf8' }}
          >
            ● Parked ({vehicleList.filter(v => v.status === 'Parked').length})
          </button>
        </div>
      </div>

      {/* Main Map & Live Telemetry Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Left: GPS Map Simulation Canvas */}
        <div
          style={{
            background: '#090d10',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            overflow: 'hidden',
            minHeight: '480px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Simulated Dark Mode Map Texture */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(57, 255, 110, 0.05) 0%, transparent 60%),
                linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 40px 40px, 40px 40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            {/* Simulated Road Lines & Highway Paths */}
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 0 140 Q 250 80 500 200 T 1000 260" stroke="#38bdf8" strokeWidth="3" fill="none" strokeDasharray="6 4" />
              <path d="M 100 0 Q 300 250 450 500" stroke="#ffcc4d" strokeWidth="2.5" fill="none" />
              <path d="M 0 350 C 300 320 600 420 1000 300" stroke="#39ff6e" strokeWidth="3" fill="none" />
            </svg>

            {/* Simulated Vehicle Pins on Map */}
            {vehicleList.map((v, idx) => {
              const isSelected = v.reg === selectedReg;
              // Deterministic positions on map
              const leftPositions = [28, 65, 45, 80, 18];
              const topPositions = [42, 25, 68, 55, 78];
              const left = leftPositions[idx % leftPositions.length];
              const top = topPositions[idx % topPositions.length];

              return (
                <div
                  key={v.reg}
                  onClick={() => setSelectedReg(v.reg)}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: `${top}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: isSelected ? 10 : 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Vehicle Marker Pulse */}
                  <div
                    style={{
                      width: isSelected ? 44 : 32,
                      height: isSelected ? 44 : 32,
                      borderRadius: '50%',
                      background: isSelected ? 'rgba(57, 255, 110, 0.22)' : 'rgba(15, 23, 42, 0.8)',
                      border: `2px solid ${getStatusColor(v.status)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isSelected ? `0 0 16px ${getStatusColor(v.status)}` : '0 2px 8px rgba(0,0,0,0.5)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Navigation
                      size={isSelected ? 20 : 15}
                      style={{
                        color: getStatusColor(v.status),
                        transform: `rotate(${idx * 45}deg)`
                      }}
                    />
                  </div>

                  {/* Marker Tooltip */}
                  <div
                    style={{
                      background: 'rgba(9, 13, 16, 0.92)',
                      border: '1px solid var(--border)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      marginTop: '4px',
                      color: isSelected ? 'var(--accent)' : 'var(--text)',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}
                  >
                    {v.reg} {v.speed > 0 ? `· ${v.speed} km/h` : ''}
                  </div>
                </div>
              );
            })}

            {/* Map Controls Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Radio size={14} color="#39ff6e" />
              <span>Tracking <b>{vehicleList.length} Fleet GPS Units</b></span>
            </div>
          </div>

          {/* Bottom Live Route Feed Bar */}
          <div
            style={{
              padding: '12px 18px',
              background: 'var(--surface-2)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-faint)' }}>Selected: </span>
              <b>{selectedVehicle.reg}</b> ({selectedVehicle.model}) — {selectedVehicle.location}
            </div>
            <div style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {selectedVehicle.coordinates}
            </div>
          </div>
        </div>

        {/* Right: Selected Vehicle Telemetry Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Telemetry Details */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                  {selectedVehicle.reg}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {selectedVehicle.model}
                </div>
              </div>
              <span
                className="status-chip"
                style={{
                  background: `${getStatusColor(selectedVehicle.status)}22`,
                  color: getStatusColor(selectedVehicle.status),
                  borderColor: getStatusColor(selectedVehicle.status)
                }}
              >
                ● {selectedVehicle.status}
              </span>
            </div>

            {/* Speed Gauge Banner */}
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>CURRENT SPEED</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent)', marginTop: '2px' }}>
                  {selectedVehicle.speed} <span style={{ fontSize: '14px', fontWeight: 500 }}>km/h</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>IGNITION</div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: selectedVehicle.ignition ? '#39ff6e' : 'var(--text-dim)',
                    marginTop: '4px'
                  }}
                >
                  {selectedVehicle.ignition ? '⚡ ON (Engine Running)' : '⛔ OFF (Parked)'}
                </div>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Driver on duty:</span>
                <b>{selectedVehicle.driver}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Distance Run Today:</span>
                <b>{selectedVehicle.distanceToday} km</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Fuel Tank Level:</span>
                <b style={{ color: '#ffcc4d' }}>{selectedVehicle.fuelPercent}% Fuel</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Battery size={13} /> Battery Voltage:
                </span>
                <span>{selectedVehicle.battery}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu size={13} /> Satellites Locked:
                </span>
                <span>{selectedVehicle.satellites} GPS Satellites</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> Telematics Ping:
                </span>
                <span>{selectedVehicle.lastPing}</span>
              </div>
            </div>
          </div>

          {/* Quick Vehicle Switcher List */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '260px',
              overflowY: 'auto'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
              Select Vehicle to Track
            </div>

            {filteredVehicles.map(v => (
              <div
                key={v.reg}
                onClick={() => setSelectedReg(v.reg)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: v.reg === selectedReg ? 'var(--surface-3)' : 'var(--surface-2)',
                  border: `1px solid ${v.reg === selectedReg ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{v.reg}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>{v.model}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: getStatusColor(v.status)
                    }}
                  >
                    ● {v.speed > 0 ? `${v.speed} km/h` : v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
