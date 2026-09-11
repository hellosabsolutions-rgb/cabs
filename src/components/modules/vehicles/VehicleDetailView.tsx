import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFleet } from '../../../context/FleetContext';
import { Vehicle, VehicleStatus } from '../../../types/fleet';
import {
  ArrowLeft,
  Truck,
  Building2,
  Briefcase,
  User,
  Fuel,
  Gauge,
  CreditCard,
  Radio,
  FileCheck,
  Shield,
  Wind,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  X,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wrench,
  Navigation
} from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { EditVehicleModal } from './EditVehicleModal';
import { VehicleAvailabilityModal } from '../bookings/VehicleAvailabilityModal';

interface VehicleDetailViewProps {
  vehicle?: Vehicle;
  vehicleId?: string;
  onBack?: () => void;
  onEdit?: (vehicle: Vehicle) => void;
}

export const VehicleDetailView: React.FC<VehicleDetailViewProps> = ({
  vehicle: propVehicle,
  vehicleId: propVehicleId,
  onBack,
  onEdit
}) => {
  const { id: urlParamId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    vehicles,
    trips,
    bookings,
    dailyDutyLogs,
    fuelLogs,
    fastagTransactions,
    vehicleCompliance,
    maintenanceRecords,
    drivers,
    updateVehicleStatus,
    switchVehicleMode,
    deleteVehicle
  } = useFleet();

  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'trips' | 'expenses'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewPhotoTitle, setPreviewPhotoTitle] = useState<string>('');

  // Resolve target vehicle
  const targetId = propVehicle?.id || propVehicleId || urlParamId;
  const vehicle = useMemo(() => {
    if (propVehicle) {
      // Find latest updated version from context if available
      return vehicles.find(v => v.id === propVehicle.id || v.registrationNumber === propVehicle.registrationNumber) || propVehicle;
    }
    if (targetId) {
      return vehicles.find(
        v => v.id === targetId || v.registrationNumber.toUpperCase() === targetId.toUpperCase()
      );
    }
    return null;
  }, [vehicles, propVehicle, targetId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/vehicles');
    }
  };

  const handleEdit = () => {
    if (onEdit && vehicle) {
      onEdit(vehicle);
    } else {
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    if (window.confirm(`Are you sure you want to delete vehicle ${vehicle.registrationNumber} from fleet?`)) {
      await deleteVehicle(vehicle.id);
      handleBack();
    }
  };

  // Find assigned driver object
  const assignedDriverObj = useMemo(() => {
    if (!vehicle?.assignedDriver || vehicle.assignedDriver === 'Unassigned' || vehicle.assignedDriver === '—') {
      return null;
    }
    return drivers.find(
      d => d.name.toLowerCase() === vehicle.assignedDriver?.toLowerCase()
    );
  }, [drivers, vehicle?.assignedDriver]);

  // Cross-reference Compliance records for this vehicle
  const complianceDocs = useMemo(() => {
    if (!vehicle) return [];
    return vehicleCompliance.filter(
      c => c.entityName && c.entityName.toLowerCase() === vehicle.registrationNumber.toLowerCase()
    );
  }, [vehicleCompliance, vehicle?.registrationNumber]);

  // Cross-reference Trips & Bookings
  const vehicleTrips = useMemo(() => {
    if (!vehicle) return [];
    const reg = vehicle.registrationNumber.toLowerCase();
    const all = [...trips, ...bookings];
    return all.filter(
      t =>
        (t.assignedVehicle && t.assignedVehicle.toLowerCase() === reg) ||
        (t.cabNumber && t.cabNumber.toLowerCase() === reg)
    );
  }, [trips, bookings, vehicle?.registrationNumber]);

  // Cross-reference Daily Duty Logs (Department)
  const vehicleDutyLogs = useMemo(() => {
    if (!vehicle) return [];
    const reg = vehicle.registrationNumber.toLowerCase();
    return dailyDutyLogs.filter(
      d => d.vehicleNumber && d.vehicleNumber.toLowerCase() === reg
    );
  }, [dailyDutyLogs, vehicle?.registrationNumber]);

  // Cross-reference Fuel Logs
  const vehicleFuelLogs = useMemo(() => {
    if (!vehicle) return [];
    const reg = vehicle.registrationNumber.toLowerCase();
    return fuelLogs.filter(
      f => f.vehicle && f.vehicle.toLowerCase() === reg
    );
  }, [fuelLogs, vehicle?.registrationNumber]);

  // Cross-reference FASTag Transactions
  const vehicleFastagTolls = useMemo(() => {
    if (!vehicle) return [];
    const reg = vehicle.registrationNumber.toLowerCase();
    return fastagTransactions.filter(
      t => t.vehicle && t.vehicle.toLowerCase() === reg
    );
  }, [fastagTransactions, vehicle?.registrationNumber]);

  // Cross-reference Maintenance records
  const vehicleMaintenance = useMemo(() => {
    if (!vehicle) return [];
    const reg = vehicle.registrationNumber.toLowerCase();
    return maintenanceRecords.filter(
      m => m.vehicle && m.vehicle.toLowerCase() === reg
    );
  }, [maintenanceRecords, vehicle?.registrationNumber]);

  if (!vehicle) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button
          type="button"
          onClick={handleBack}
          className="btn-secondary"
          style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={15} /> Back to Vehicles
        </button>

        <div className="panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <AlertTriangle size={36} color="var(--warning, #f59e0b)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--text)' }}>
            Vehicle Not Found
          </h3>
          <p style={{ margin: '0 0 20px', color: 'var(--text-faint)', fontSize: '13px' }}>
            The requested vehicle registration or ID could not be found in your active fleet.
          </p>
          <button type="button" onClick={handleBack} className="btn-primary-action">
            Return to Fleet Roster
          </button>
        </div>
      </div>
    );
  }

  // Calc Compliance Status Meta for the 5 mandatory documents
  const getDocStatus = (docName: string, directExp?: string, directPhoto?: string | null) => {
    const compMatch = complianceDocs.find(
      c => c.documentName.toLowerCase().includes(docName.toLowerCase())
    );
    const expDate = directExp || compMatch?.expiryDate;
    const photo = directPhoto || compMatch?.documentPhoto;

    if (!expDate) {
      return {
        expiryDate: 'Not specified',
        statusType: 'none',
        label: 'No Expiry Set',
        photo: photo || null,
        daysLeft: null
      };
    }

    const exp = new Date(expDate);
    const now = new Date();
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isNaN(diff)) {
      return { expiryDate: expDate, statusType: 'ok', label: 'Valid', photo: photo || null, daysLeft: null };
    }
    if (diff < 0) {
      return { expiryDate: expDate, statusType: 'late', label: `Expired ${Math.abs(diff)}d ago`, photo: photo || null, daysLeft: diff };
    }
    if (diff <= 30) {
      return { expiryDate: expDate, statusType: 'soon', label: `Expires in ${diff}d`, photo: photo || null, daysLeft: diff };
    }
    return { expiryDate: expDate, statusType: 'ok', label: `Valid (${diff}d left)`, photo: photo || null, daysLeft: diff };
  };

  const complianceList = [
    {
      id: 'rc',
      name: 'Registration Certificate (RC)',
      code: 'RC',
      icon: <FileText size={16} color="#38bdf8" />,
      ...getDocStatus('rc', vehicle.rcExpiry, vehicle.rcPhoto)
    },
    {
      id: 'insurance',
      name: 'Commercial Insurance Policy',
      code: 'Insurance',
      icon: <Shield size={16} color="#38bdf8" />,
      ...getDocStatus('insurance', vehicle.insuranceExpiry, vehicle.insurancePhoto)
    },
    {
      id: 'pollution',
      name: 'Pollution Under Control (PUCC)',
      code: 'PUC',
      icon: <Wind size={16} color="var(--success)" />,
      ...getDocStatus('puc', vehicle.pollutionExpiry, vehicle.pollutionPhoto)
    },
    {
      id: 'permit',
      name: 'Commercial Vehicle Permit',
      code: 'Permit',
      icon: <FileCheck size={16} color="#ffcc4d" />,
      ...getDocStatus('permit', vehicle.permitExpiry, vehicle.permitPhoto)
    },
    {
      id: 'fitness',
      name: 'Vehicle Fitness Certificate',
      code: 'Fitness',
      icon: <FileCheck size={16} color="#c084fc" />,
      ...getDocStatus('fitness', vehicle.fitnessExpiry, vehicle.authPhoto)
    }
  ];

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* TOP NAVIGATION & ACTIONS BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          onClick={handleBack}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            padding: '7px 14px',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} /> Back to Vehicles
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick Status Toggle Dropdown */}
          <select
            className="form-input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}
            value={vehicle.status}
            onChange={e => updateVehicleStatus(vehicle.id, e.target.value as VehicleStatus)}
          >
            <option value="Running">● Running / Active</option>
            <option value="Idle">● Idle in Yard</option>
            <option value="Maintenance">● Under Maintenance</option>
          </select>

          {/* Availability Check */}
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}
            onClick={() => setIsAvailabilityModalOpen(true)}
          >
            <Calendar size={14} /> Availability
          </button>

          {/* Edit Vehicle */}
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleEdit}
          >
            <Edit2 size={13} color="var(--accent)" /> Edit Vehicle
          </button>

          {/* Delete Vehicle */}
          <button
            type="button"
            className="btn-secondary"
            style={{
              fontSize: '12px',
              padding: '7px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
            onClick={handleDelete}
            title="Delete this vehicle from fleet"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* VEHICLE MAIN PROFILE HEADER CARD */}
      <div
        className="panel"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Left: Indian Registration Plate Badge + Title Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            {/* Realistic Plate Box */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '2px solid #0f172a',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                fontFamily: 'monospace, sans-serif'
              }}
            >
              <div
                style={{
                  backgroundColor: '#1d4ed8',
                  color: '#ffffff',
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px'
                }}
              >
                <span style={{ fontSize: '7px', fontWeight: 900, lineHeight: 1 }}>🇮🇳</span>
                <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.5px' }}>IND</span>
              </div>
              <div
                style={{
                  padding: '8px 16px',
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '2px',
                  lineHeight: 1
                }}
              >
                {vehicle.registrationNumber}
              </div>
            </div>

            {/* Model & Classification */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                  {vehicle.model || 'Commercial Vehicle'}
                </h1>

                <span
                  className={`tag ${vehicle.type === 'Department' ? 'dept' : 'trip'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px' }}
                >
                  {vehicle.type === 'Department' ? <Building2 size={12} /> : <Briefcase size={12} />}
                  {vehicle.type === 'Department' ? 'Department Contract Fleet' : 'Commercial Booking & Rental Fleet'}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor:
                      vehicle.status === 'Running' || vehicle.status === 'Active'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : vehicle.status === 'Maintenance'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(148, 163, 184, 0.15)',
                    color:
                      vehicle.status === 'Running' || vehicle.status === 'Active'
                        ? '#4ade80'
                        : vehicle.status === 'Maintenance'
                        ? '#f87171'
                        : '#cbd5e1'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'currentColor'
                    }}
                  />
                  {vehicle.status === 'Running' || vehicle.status === 'Active' ? 'Running / On Duty' : vehicle.status === 'Maintenance' ? 'Maintenance' : 'Idle in Yard'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', fontSize: '13px', color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                <span>
                  Client / Dept: <strong style={{ color: 'var(--text)' }}>{vehicle.assignedTo || 'General Fleet'}</strong>
                </span>
                <span>•</span>
                <span>
                  Designated Driver: <strong style={{ color: 'var(--text)' }}>{vehicle.assignedDriver || 'Unassigned'}</strong>
                </span>
                <span>•</span>
                <span>
                  Fuel: <strong style={{ color: 'var(--text)' }}>{vehicle.fuelType || 'Diesel'}</strong>
                </span>
                <span>•</span>
                <span>
                  Seats: <strong style={{ color: 'var(--text)' }}>{vehicle.seatingCapacity ? `${vehicle.seatingCapacity} Seater` : 'Standard'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Weekend Operating Mode Switch (if Department) */}
          {vehicle.type === 'Department' && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'var(--surface-2, rgba(255,255,255,0.03))',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                  Weekend Retail Trip Mode
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                  {vehicle.currentOperationMode === 'Trip-based' ? 'Currently switched to Booking fleet' : 'Standard Department Mode'}
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px', color: vehicle.currentOperationMode === 'Trip-based' ? '#38bdf8' : undefined }}
                onClick={() => switchVehicleMode(vehicle.id, vehicle.currentOperationMode === 'Trip-based' ? 'Department' : 'Trip-based')}
              >
                {vehicle.currentOperationMode === 'Trip-based' ? 'Revert to Dept' : 'Enable Booking Mode'}
              </button>
            </div>
          )}
        </div>

        {/* FINANCIAL & FLEET OVERVIEW STAT CARDS */}
        <div className="stats-grid">
          <StatCard
            label="Total Revenue Generated"
            value={`₹${(vehicle.revenue || 0).toLocaleString('en-IN')}`}
            customColor="var(--accent)"
          />
          <StatCard
            label="Total Expenses Incurred"
            value={`₹${(vehicle.expense || 0).toLocaleString('en-IN')}`}
            customColor="#f87171"
          />
          <StatCard
            label="Net Lifetime Profit"
            value={`₹${(vehicle.profit || 0).toLocaleString('en-IN')}`}
            customColor="var(--success)"
          />
          <StatCard
            label={`FASTag (${vehicle.fastagBank || 'Balance'})`}
            value={`₹${(vehicle.fastagBalance || 0).toLocaleString('en-IN')}`}
            customColor="#38bdf8"
          />
        </div>
      </div>

      {/* DETAIL TABS NAVIGATION */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '10px',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          style={{ fontSize: '13px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Gauge size={15} /> Overview & Specs
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
          onClick={() => setActiveTab('compliance')}
          style={{ fontSize: '13px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <FileCheck size={15} /> 5 Compliance Documents
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => setActiveTab('trips')}
          style={{ fontSize: '13px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Navigation size={15} /> Trips & Duties ({vehicleTrips.length + vehicleDutyLogs.length})
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
          style={{ fontSize: '13px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <DollarSign size={15} /> Fuel & FASTag Logs ({vehicleFuelLogs.length + vehicleFastagTolls.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & HARDWARE SPECS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Card 1: Technical & Registration Details */}
          <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={17} color="var(--accent)" /> Vehicle Identification & Specs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Registration Plate</span>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px', letterSpacing: '0.5px' }}>
                  {vehicle.registrationNumber}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Make & Model</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                  {vehicle.model || 'Commercial Vehicle'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Fleet Category</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                  {vehicle.type === 'Department' ? 'Department Contract' : 'Trip-based (Commercial Booking)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Assigned Department / Client</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                  {vehicle.assignedTo || 'General Fleet'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Fuel Type</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                  {vehicle.fuelType || 'Diesel'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Seating Capacity</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                  {vehicle.seatingCapacity ? `${vehicle.seatingCapacity} Passengers` : 'Standard'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Current Odometer</span>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>
                  {vehicle.odometer ? `${vehicle.odometer.toLocaleString('en-IN')} KM` : '0 KM'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Designated Driver & Telematics */}
          <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={17} color="#38bdf8" /> Driver Assignment & Telematics
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Designated Driver</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                  {vehicle.assignedDriver || 'Unassigned'}
                </span>
              </div>

              {assignedDriverObj && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Driver Phone</span>
                  <a
                    href={`tel:${assignedDriverObj.phone}`}
                    style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '13px', textDecoration: 'none' }}
                  >
                    {assignedDriverObj.phone}
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>FASTag Barcode / Tag ID</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}>
                  {vehicle.fastagTagId || 'Not Configured'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>FASTag Issuer Bank</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                  {vehicle.fastagBank || 'Not Linked'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>Current FASTag Balance</span>
                <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px' }}>
                  ₹{(vehicle.fastagBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>GPS Device IMEI</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}>
                  {vehicle.gpsImei || 'Not Installed'}
                </span>
              </div>
            </div>

            {/* Vehicle Photo Card Preview */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)', display: 'block', marginBottom: '8px' }}>
                Vehicle Profile Photo:
              </span>
              {vehicle.vehiclePhoto ? (
                <div
                  onClick={() => {
                    setPreviewPhoto(vehicle.vehiclePhoto || null);
                    setPreviewPhotoTitle(`${vehicle.registrationNumber} Vehicle Photo`);
                  }}
                  style={{
                    position: 'relative',
                    height: '140px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid var(--border)'
                  }}
                >
                  <img
                    src={vehicle.vehiclePhoto}
                    alt={vehicle.registrationNumber}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    <Eye size={16} /> Click to View Full Photo
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px 16px',
                    borderRadius: '10px',
                    border: '1px dashed var(--border)',
                    textAlign: 'center',
                    background: 'var(--surface-2, rgba(255,255,255,0.02))'
                  }}
                >
                  <Truck size={28} color="var(--text-faint)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                    No vehicle photo uploaded yet
                  </div>
                  <button
                    type="button"
                    onClick={handleEdit}
                    style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      padding: '4px 10px',
                      background: 'transparent',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Upload Photo via Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 5 COMPLIANCE DOCUMENTS */}
      {activeTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0.02) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                Mandatory Fleet Compliance Documents
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>
                RC, Commercial Insurance, Pollution (PUCC), Permit, and Fitness certificates
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleEdit}
            >
              <Edit2 size={13} /> Update Compliance Dates & Photos
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {complianceList.map(doc => (
              <div
                key={doc.id}
                className="panel"
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  border: `1px solid ${
                    doc.statusType === 'late'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : doc.statusType === 'soon'
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'var(--border)'
                  }`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {doc.icon}
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                      {doc.name}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor:
                        doc.statusType === 'late'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : doc.statusType === 'soon'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : doc.statusType === 'ok'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(148, 163, 184, 0.15)',
                      color:
                        doc.statusType === 'late'
                          ? '#f87171'
                          : doc.statusType === 'soon'
                          ? '#fbbf24'
                          : doc.statusType === 'ok'
                          ? '#4ade80'
                          : '#94a3b8'
                    }}
                  >
                    {doc.label}
                  </span>
                </div>

                <div style={{ fontSize: '12.5px', color: 'var(--text-faint)' }}>
                  Expiry Date: <strong style={{ color: 'var(--text)' }}>{doc.expiryDate}</strong>
                </div>

                {/* Photo Thumbnail */}
                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  {doc.photo ? (
                    <div
                      onClick={() => {
                        setPreviewPhoto(doc.photo);
                        setPreviewPhotoTitle(`${vehicle.registrationNumber} · ${doc.name}`);
                      }}
                      style={{
                        position: 'relative',
                        height: '110px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <img
                        src={doc.photo}
                        alt={doc.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: 600
                        }}
                      >
                        <Eye size={14} /> Click to View Document
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '18px 12px',
                        borderRadius: '8px',
                        border: '1px dashed var(--border)',
                        textAlign: 'center',
                        fontSize: '11.5px',
                        color: 'var(--text-faint)'
                      }}
                    >
                      No document scan uploaded
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TRIPS & DUTY LOGS */}
      {activeTab === 'trips' && (
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              Trips & Duty Assignments Logged for {vehicle.registrationNumber}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              Total: {vehicleTrips.length + vehicleDutyLogs.length} Records
            </span>
          </div>

          {vehicleTrips.length === 0 && vehicleDutyLogs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>
              No trips or daily duty logs recorded for this vehicle yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-faint)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px' }}>Client / Customer</th>
                    <th style={{ padding: '10px 12px' }}>Route / Purpose</th>
                    <th style={{ padding: '10px 12px' }}>Driver</th>
                    <th style={{ padding: '10px 12px' }}>Fare / Amount</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Commercial Trips */}
                  {vehicleTrips.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="tag trip" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          Booking Trip
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text)' }}>
                        {t.startDate || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>
                        {t.customerName || t.departmentName || 'Direct Booking'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                        {t.route || `${t.pickupLocation || ''} → ${t.dropLocation || ''}` || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text)' }}>
                        {t.driverName || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--success)' }}>
                        ₹{(t.fare || t.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {t.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* Department Duty Logs */}
                  {vehicleDutyLogs.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span className="tag dept" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          Dept Duty
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text)' }}>
                        {d.date || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>
                        {d.departmentName || 'Department'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                        {d.startLocation && d.endLocation ? `${d.startLocation} → ${d.endLocation}` : d.dutyType || 'Official Duty'}
                        {d.totalKm ? ` (${d.totalKm} km)` : ''}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text)' }}>
                        {d.driverName || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>
                        {d.tollCharges ? `Toll: ₹${d.tollCharges}` : 'Contracted'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '11px', color: '#4ade80' }}>
                          {d.status || 'Verified'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FUEL & FASTAG LOGS */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Fuel Refill History */}
          <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Fuel size={17} color="#f87171" /> Fuel Refill Logs
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                {vehicleFuelLogs.length} Records
              </span>
            </div>

            {vehicleFuelLogs.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '12.5px' }}>
                No fuel logs entered for this vehicle yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-faint)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Date</th>
                      <th style={{ padding: '8px 10px' }}>Quantity</th>
                      <th style={{ padding: '8px 10px' }}>Cost</th>
                      <th style={{ padding: '8px 10px' }}>Odo</th>
                      <th style={{ padding: '8px 10px' }}>Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleFuelLogs.map(f => (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--text)' }}>{f.date}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text)' }}>{f.liters} L</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#f87171' }}>₹{f.cost?.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-faint)' }}>{f.odometerReading ? `${f.odometerReading} km` : '—'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{f.driver || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FASTag Toll Deductions History */}
          <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={17} color="#38bdf8" /> FASTag Toll Transactions
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                {vehicleFastagTolls.length} Deductions
              </span>
            </div>

            {vehicleFastagTolls.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '12.5px' }}>
                No FASTag toll deductions recorded for this vehicle.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-faint)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Date</th>
                      <th style={{ padding: '8px 10px' }}>Plaza / Location</th>
                      <th style={{ padding: '8px 10px' }}>Amount</th>
                      <th style={{ padding: '8px 10px' }}>Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleFastagTolls.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--text)' }}>{t.date}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{t.plazaName || t.location || 'Toll Plaza'}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#f87171' }}>-₹{t.amount?.toLocaleString()}</td>
                        <td style={{ padding: '8px 10px', color: '#38bdf8' }}>{t.balanceAfter !== undefined ? `₹${t.balanceAfter}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewPhoto(null)}
          style={{ zIndex: 1400 }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              background: 'var(--surface)',
              padding: '16px',
              borderRadius: '14px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                {previewPhotoTitle || 'Document Preview'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text)'
                }}
              >
                <X size={15} />
              </button>
            </div>
            <img
              src={previewPhoto}
              alt="Preview"
              style={{ maxWidth: '85vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      <EditVehicleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        vehicle={vehicle}
      />

      {/* VEHICLE AVAILABILITY MODAL */}
      <VehicleAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
      />
    </div>
  );
};
