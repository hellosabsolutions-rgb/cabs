import React, { useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Driver } from '../../../types/fleet';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Car,
  Calendar,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Power,
  Edit2,
  Trash2,
  Receipt,
  Navigation,
  ExternalLink,
  Eye,
  X
} from 'lucide-react';
import { StatCard } from '../../common/StatCard';

interface DriverDetailViewProps {
  driver: Driver;
  onBack: () => void;
  onEdit: (driver: Driver) => void;
}

export const DriverDetailView: React.FC<DriverDetailViewProps> = ({
  driver,
  onBack,
  onEdit
}) => {
  const {
    trips,
    dailyDutyLogs,
    payrollItems,
    driverCompliance,
    driverExpenses,
    updateDriverStatus,
    deleteDriver
  } = useFleet();

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // License compliance cross-reference
  const compDoc = driverCompliance.find(
    c => c.entityName && c.entityName.toLowerCase() === driver.name.toLowerCase()
  );
  const licenseExpiry = driver.licenseExpiry || compDoc?.expiryDate;
  let isLicenseExpired = false;
  let daysUntilExpiry: number | null = null;

  if (licenseExpiry) {
    const expDate = new Date(licenseExpiry);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isLicenseExpired = daysUntilExpiry < 0;
  }

  // Cross-reference Trips & Duties
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const driverTripsThisMonth = trips.filter(
    t =>
      t.driverName &&
      t.driverName.toLowerCase() === driver.name.toLowerCase() &&
      (!t.startDate || t.startDate.startsWith(currentMonthKey))
  ).length;

  const driverDutiesThisMonth = dailyDutyLogs.filter(
    d =>
      d.driverName &&
      d.driverName.toLowerCase() === driver.name.toLowerCase() &&
      (!d.date || d.date.startsWith(currentMonthKey))
  ).length;

  const totalThisMonthTrips = driverTripsThisMonth + driverDutiesThisMonth;
  const driverTripsAllTime = trips.filter(
    t => t.driverName && t.driverName.toLowerCase() === driver.name.toLowerCase()
  );
  const driverDutiesAllTime = dailyDutyLogs.filter(
    d => d.driverName && d.driverName.toLowerCase() === driver.name.toLowerCase()
  );
  const totalTripsAllTime = driverTripsAllTime.length + driverDutiesAllTime.length;

  // Driver Expenses
  const driverExpensesList = driverExpenses.filter(
    e => e.driverName && e.driverName.toLowerCase() === driver.name.toLowerCase()
  );
  const totalExpensesLogged = driverExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Payroll Settlement
  const payroll = payrollItems.find(
    p => p.driverId === driver.id || p.name.toLowerCase() === driver.name.toLowerCase()
  );
  const pendingSettlement = payroll ? (payroll.netPayable ?? payroll.monthlySalary ?? 0) : (driver.monthlySalary || 0);
  const settlementStatus = payroll?.status || 'DUE';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove driver "${driver.name}" from fleet?`)) {
      deleteDriver(driver.id);
      onBack();
    }
  };

  const handleToggleDuty = () => {
    const newStatus = driver.status === 'On duty' ? 'Off duty' : 'On duty';
    updateDriverStatus(driver.id, newStatus);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar: Back button & Action controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} /> Back to Drivers
          </button>
          <div style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
            Drivers / <span style={{ color: 'var(--text)', fontWeight: 600 }}>{driver.name}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleToggleDuty}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              borderColor: driver.status === 'On duty' ? 'rgba(34, 197, 94, 0.4)' : undefined,
              color: driver.status === 'On duty' ? '#16a34a' : undefined
            }}
          >
            <Power size={14} />
            {driver.status === 'On duty' ? 'Mark Off Duty' : 'Mark On Duty (Active)'}
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={() => onEdit(driver)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600
            }}
          >
            <Edit2 size={14} /> Edit Driver
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--danger)',
              borderColor: 'rgba(255, 92, 92, 0.3)'
            }}
            title="Remove driver from fleet"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '24px 28px',
          background: 'var(--surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Avatar / Photo */}
          <div style={{ position: 'relative' }}>
            {driver.photo ? (
              <img
                src={driver.photo}
                alt={driver.name}
                onClick={() => setPreviewPhoto(driver.photo || null)}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--accent)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                title="Click to zoom photo"
              />
            ) : (
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #2563eb)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {getInitials(driver.name)}
              </div>
            )}
            <span
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: driver.status === 'On duty' ? '#16a34a' : '#94a3b8',
                border: '2px solid var(--surface)'
              }}
              title={driver.status === 'On duty' ? 'Active On Duty' : 'Off Duty'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                {driver.name}
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  background: driver.status === 'On duty' ? 'rgba(34, 197, 94, 0.12)' : 'var(--surface-3)',
                  color: driver.status === 'On duty' ? '#16a34a' : 'var(--text-dim)',
                  border: `1px solid ${driver.status === 'On duty' ? 'rgba(34, 197, 94, 0.3)' : 'var(--border)'}`
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: driver.status === 'On duty' ? '#16a34a' : '#94a3b8'
                  }}
                />
                {driver.status === 'On duty' ? 'Active' : 'Off duty'}
              </span>

              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'rgba(22, 135, 245, 0.08)',
                  border: '1px solid rgba(22, 135, 245, 0.25)',
                  padding: '3px 9px',
                  borderRadius: '6px'
                }}
              >
                {driver.driverType || 'Full Time'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '8px',
                flexWrap: 'wrap',
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}
            >
              {driver.phone && (
                <a
                  href={`tel:${driver.phone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: 'var(--text)',
                    fontWeight: 500,
                    textDecoration: 'none'
                  }}
                  title="Click to call"
                >
                  <Phone size={14} color="var(--accent)" />
                  <span>{driver.phone}</span>
                  <CheckCircle2 size={13} color="#2563eb" />
                </a>
              )}

              {driver.assignedVehicle && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Car size={14} color="#38bdf8" />
                  <span>Assigned Vehicle: <b>{driver.assignedVehicle}</b></span>
                </div>
              )}

              {driver.joiningDate && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={14} color="#ffcc4d" />
                  <span>Joined: {driver.joiningDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick action: Call or WhatsApp */}
        {driver.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={`https://wa.me/${driver.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'rgba(34, 197, 94, 0.4)',
                color: '#16a34a',
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={13} /> WhatsApp
            </a>
            <a
              href={`tel:${driver.phone}`}
              className="btn-secondary"
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <Phone size={13} /> Call
            </a>
          </div>
        )}
      </div>

      {/* 4 Stat KPI Cards */}
      <div className="stats-grid">
        <StatCard
          label="Trips This Month"
          value={totalThisMonthTrips}
          delta={`All-time: ${totalTripsAllTime} trips / duties`}
          isUp
          icon={<Navigation size={16} />}
        />
        <StatCard
          label="Pending Settlement"
          value={`₹${pendingSettlement.toLocaleString('en-IN')}`}
          delta={`Status: ${settlementStatus}`}
          isDown={settlementStatus === 'DUE'}
          icon={<CreditCard size={16} />}
        />
        <StatCard
          label="Driving License"
          value={isLicenseExpired ? 'EXPIRED' : daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'SOON' : 'VALID'}
          delta={
            daysUntilExpiry !== null
              ? daysUntilExpiry < 0
                ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                : `${daysUntilExpiry} days remaining`
              : 'License Verified'
          }
          isUp={!isLicenseExpired}
          isDown={isLicenseExpired}
          icon={<ShieldCheck size={16} />}
        />
        <StatCard
          label="Expenses Logged"
          value={`₹${totalExpensesLogged.toLocaleString('en-IN')}`}
          delta={`${driverExpensesList.length} expense entries`}
          icon={<Receipt size={16} />}
        />
      </div>

      {/* 2-Column Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Left Column: Personal Info & Compliance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Driver Information Panel */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={16} color="var(--accent)" /> Driver Information
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '4px 0' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Assigned Vehicle
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
                  {driver.assignedVehicle || 'Unassigned (Pool Driver)'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Emergency Contact
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
                  {driver.emergencyContact || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Joining Date
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
                  {driver.joiningDate || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Monthly Base Salary
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>
                  ₹{(driver.monthlySalary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Residential Address
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '4px', lineHeight: 1.4 }}>
                  {driver.address || 'Address not registered'}
                </div>
              </div>
            </div>
          </div>

          {/* License & Regulatory Compliance Panel */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#16a34a" /> License & Compliance
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isLicenseExpired ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                  color: isLicenseExpired ? '#ef4444' : '#16a34a',
                  border: `1px solid ${isLicenseExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                }}
              >
                {isLicenseExpired ? 'Expired' : 'Verified OK'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '4px 0' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Driving License No.
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginTop: '4px', fontFamily: 'monospace' }}>
                  {driver.licenseNumber || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  License Expiry Date
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: isLicenseExpired ? 'var(--danger)' : 'var(--text)', marginTop: '4px' }}>
                  {licenseExpiry || 'Not specified'}
                </div>
              </div>

              {/* License Document Preview */}
              <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  License Copy / Document
                </div>
                {driver.licensePhoto ? (
                  <div
                    onClick={() => setPreviewPhoto(driver.licensePhoto || null)}
                    style={{
                      background: 'var(--surface-2)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    title="Click to view full document"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="var(--accent)" />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                          Driving_License_Document
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                          Click to preview document
                        </div>
                      </div>
                    </div>
                    <Eye size={16} color="var(--accent)" />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px dashed var(--border)',
                      fontSize: '12px',
                      color: 'var(--text-faint)',
                      textAlign: 'center'
                    }}
                  >
                    No license document uploaded
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Trips, Duties & Expenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Recent Duty & Trip Activity */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#38bdf8" /> Recent Activity & Duties
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                {totalTripsAllTime} total logged
              </span>
            </div>

            {totalTripsAllTime === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-faint)', fontSize: '12.5px' }}>
                No trips or duties recorded yet for {driver.name}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {driverDutiesAllTime.slice(0, 4).map(duty => (
                  <div
                    key={duty.id}
                    style={{
                      background: 'var(--surface-2)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                        {duty.departmentName || 'Department Duty'} · {duty.vehicle || driver.assignedVehicle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {duty.date} · {duty.startKm && duty.endKm ? `${duty.endKm - duty.startKm} km traveled` : 'Duty completed'}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8',
                        fontWeight: 600
                      }}
                    >
                      Duty Log
                    </span>
                  </div>
                ))}

                {driverTripsAllTime.slice(0, 4).map(trip => (
                  <div
                    key={trip.id}
                    style={{
                      background: 'var(--surface-2)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                        Trip #{trip.id.slice(-6)} · {trip.vehicleRegistration || driver.assignedVehicle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {trip.startDate} · Status: {trip.status}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                      ₹{trip.amount ? trip.amount.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logged Driver Expenses & Allowances */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} color="#ffcc4d" /> Logged Expenses & Bata
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                Total: ₹{totalExpensesLogged.toLocaleString('en-IN')}
              </span>
            </div>

            {driverExpensesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-faint)', fontSize: '12.5px' }}>
                No driver expense claims logged.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {driverExpensesList.slice(0, 5).map(exp => (
                  <div
                    key={exp.id}
                    style={{
                      background: 'var(--surface-2)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                        {exp.category} · {exp.vehicle || driver.assignedVehicle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {exp.date} · {exp.notes || 'Expense logged'}
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Photo Preview */}
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
              padding: '12px',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }}
            >
              <X size={16} />
            </button>
            <img
              src={previewPhoto}
              alt="Document Preview"
              style={{ maxWidth: '80vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
