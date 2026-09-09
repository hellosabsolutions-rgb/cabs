import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Driver } from '../../../types/fleet';
import {
  X,
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
  Navigation
} from 'lucide-react';

interface DriverDetailModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (driver: Driver) => void;
}

export const DriverDetailModal: React.FC<DriverDetailModalProps> = ({
  driver,
  isOpen,
  onClose,
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

  if (!isOpen || !driver) return null;

  // Cross-reference license compliance
  const compDoc = driverCompliance.find(
    c => c.entityName && c.entityName.toLowerCase() === driver.name.toLowerCase()
  );
  const licenseExpiry = driver.licenseExpiry || compDoc?.expiryDate;
  let isLicenseExpired = false;
  if (licenseExpiry) {
    const expDate = new Date(licenseExpiry);
    isLicenseExpired = !isNaN(expDate.getTime()) && expDate < new Date();
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
  const totalTripsAllTime =
    trips.filter(t => t.driverName && t.driverName.toLowerCase() === driver.name.toLowerCase()).length +
    dailyDutyLogs.filter(d => d.driverName && d.driverName.toLowerCase() === driver.name.toLowerCase()).length;

  // Cross-reference Driver Expenses
  const totalExpensesLogged = driverExpenses
    .filter(e => e.driverName && e.driverName.toLowerCase() === driver.name.toLowerCase())
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Cross-reference Payroll Settlement
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
    if (window.confirm(`Are you sure you want to remove driver "${driver.name}"?`)) {
      deleteDriver(driver.id);
      onClose();
    }
  };

  const handleToggleDuty = () => {
    const newStatus = driver.status === 'On duty' ? 'Off duty' : 'On duty';
    updateDriverStatus(driver.id, newStatus);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '580px',
          width: '94%',
          maxHeight: '92vh',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.22)',
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {driver.photo ? (
              <img
                src={driver.photo}
                alt={driver.name}
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent, #1687F5)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent, #1687F5), #2563eb)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {getInitials(driver.name)}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                  {driver.name}
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 9px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: driver.status === 'On duty' ? 'rgba(34, 197, 94, 0.12)' : 'var(--surface-3, #e2e8f0)',
                    color: driver.status === 'On duty' ? '#16a34a' : 'var(--text-dim, #64748b)',
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
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  {driver.phone || 'No phone'}
                </span>
                {driver.phone && (
                  <CheckCircle2 size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
                )}
                <span style={{ color: 'var(--text-faint)', margin: '0 2px' }}>•</span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 500,
                    color: 'var(--accent, #1687F5)',
                    background: 'rgba(22, 135, 245, 0.08)',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}
                >
                  {driver.driverType || 'Full Time'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon-subtle"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Quick Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}
          >
            <div
              style={{
                background: 'var(--surface-2, #f8fafc)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '10px',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                This Month Trips
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                {totalThisMonthTrips} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>trips</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                {totalTripsAllTime} all-time
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-2, #f8fafc)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '10px',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Pending Settlement
              </div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: settlementStatus === 'PAID' ? '#16a34a' : 'var(--text)'
                }}
              >
                ₹{pendingSettlement.toLocaleString('en-IN')}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: settlementStatus === 'PAID' ? '#16a34a' : settlementStatus === 'ADVANCE RUNNING' ? '#f59e0b' : '#ef4444',
                  marginTop: '2px'
                }}
              >
                {settlementStatus}
              </div>
            </div>

            <div
              style={{
                background: 'var(--surface-2, #f8fafc)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '10px',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Driving License
              </div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: isLicenseExpired ? '#f59e0b' : '#16a34a'
                }}
              >
                {isLicenseExpired ? 'Expired' : 'OK'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                {licenseExpiry || 'Verified'}
              </div>
            </div>
          </div>

          {/* Contact & Assignment Details */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              Driver Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Car size={13} style={{ color: 'var(--accent)' }} /> Assigned Vehicle
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                  {driver.assignedVehicle || '— Unassigned'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={13} style={{ color: 'var(--accent)' }} /> Emergency Contact
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)', marginTop: '2px' }}>
                  {driver.emergencyContact || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={13} style={{ color: 'var(--accent)' }} /> Joining Date
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text)', marginTop: '2px' }}>
                  {driver.joiningDate || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CreditCard size={13} style={{ color: 'var(--accent)' }} /> Monthly Base Salary
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                  ₹{(driver.monthlySalary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {driver.address && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} style={{ color: 'var(--accent)' }} /> Residential Address
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '2px' }}>
                    {driver.address}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* License & Compliance Section */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} style={{ color: isLicenseExpired ? '#f59e0b' : '#16a34a' }} />
                License & Compliance
              </div>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isLicenseExpired ? 'rgba(245, 158, 11, 0.12)' : 'rgba(22, 163, 74, 0.12)',
                  color: isLicenseExpired ? '#f59e0b' : '#16a34a'
                }}
              >
                License: {isLicenseExpired ? 'Expired' : 'OK'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>License Number</div>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                  {driver.licenseNumber || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Expiry Date</div>
                <div style={{ fontSize: '13px', color: isLicenseExpired ? '#f59e0b' : 'var(--text)', fontWeight: 500, marginTop: '2px' }}>
                  {licenseExpiry || 'Not specified'}
                </div>
              </div>

              {driver.licensePhoto && (
                <div style={{ gridColumn: 'span 2' }}>
                  <a
                    href={driver.licensePhoto}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: 'var(--accent)',
                      textDecoration: 'none'
                    }}
                  >
                    <FileText size={13} /> View License Document Photo
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Operational Expenses Summary */}
          {totalExpensesLogged > 0 && (
            <div
              style={{
                background: 'var(--surface-2, #f8fafc)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={18} style={{ color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                    Driver Logged Expenses
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Bata, food, cash toll reimbursements & night halts
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                ₹{totalExpensesLogged.toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface, #ffffff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleToggleDuty}
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Power size={13} style={{ color: driver.status === 'On duty' ? '#16a34a' : 'var(--text-muted)' }} />
              <span>Mark {driver.status === 'On duty' ? 'Off duty' : 'On duty'}</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => onEdit(driver)}
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Edit2 size={13} style={{ color: 'var(--accent)' }} />
              <span>Edit Details</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                fontSize: '12px',
                padding: '7px 12px',
                background: 'transparent',
                color: 'var(--danger, #ef4444)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Trash2 size={13} />
              <span>Remove</span>
            </button>

            <button
              type="button"
              className="btn-primary-action"
              onClick={onClose}
              style={{ fontSize: '12px', padding: '7px 16px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
