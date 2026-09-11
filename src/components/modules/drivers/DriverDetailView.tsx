import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Driver, DriverAssignment } from '../../../types/fleet';
import { driverAssignmentsApi } from '../../../services/api';
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
  X,
  History,
  Fuel,
  Gauge,
  UserX,
  RefreshCw,
  Check,
  Loader2,
  KeyRound
} from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { resolveAssignedVehicle, plateKey } from '../../../utils/assignment';
import { CustomDropdown, CustomDropdownOption } from '../../common/CustomDropdown';

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
    vehicles,
    drivers,
    updateDriver,
    updateDriverStatus,
    deleteDriver,
    showToast,
    fetchLiveDrivers
  } = useFleet();

  const driverId = driver.id || (driver as any)._id;
  const currentDriver = (drivers && drivers.find(d => (d.id || (d as any)._id) === driverId)) || driver;
  const assignedVehiclePlate = resolveAssignedVehicle(currentDriver, vehicles);
  const assignedVehicleObj = assignedVehiclePlate
    ? vehicles.find(v => plateKey(v.registrationNumber) === plateKey(assignedVehiclePlate))
    : null;

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<DriverAssignment[]>(driver.assignmentHistory || []);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState<string>(
    assignedVehiclePlate || 'unassign'
  );
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    setSelectedVehicleForAssign(assignedVehiclePlate || 'unassign');
  }, [assignedVehiclePlate]);

  useEffect(() => {
    if (driverId) {
      setIsLoadingHistory(true);
      driverAssignmentsApi
        .getDriverHistory(driverId)
        .then(res => {
          if (res?.data) {
            setAssignmentHistory(res.data);
          }
        })
        .catch(err => {
          console.warn('Could not fetch driver assignment history:', err);
        })
        .finally(() => setIsLoadingHistory(false));
    }
  }, [driverId]);

  const refreshAssignmentHistory = async () => {
    if (!driverId) return;
    try {
      const res = await driverAssignmentsApi.getDriverHistory(driverId);
      if (res?.data) {
        setAssignmentHistory(res.data);
      }
    } catch (err) {
      console.warn('Could not refresh assignment history:', err);
    }
  };

  const handleAssignVehicle = async (targetPlate: string) => {
    if (!driverId) return;
    setIsAssigning(true);
    try {
      if (!targetPlate || targetPlate === 'unassign' || targetPlate === '—') {
        // End any active assignment
        const activeAssignment = assignmentHistory.find(a => a.status === 'ACTIVE');
        if (activeAssignment?.id) {
          try {
            await driverAssignmentsApi.endAssignment(activeAssignment.id, {
              reason: 'Unassigned via Driver Detail Screen',
              notes: `Vehicle detached from driver ${currentDriver.name}`
            });
          } catch (e) {
            console.warn('endAssignment api error:', e);
          }
        }
        await updateDriver(driverId, { assignedVehicle: '—' });
        showToast('info', `Vehicle unassigned. ${currentDriver.name} is now a pool driver.`, 'Vehicle Unassigned');
      } else {
        // Assign / Reassign
        try {
          await driverAssignmentsApi.assign({
            driverId,
            vehicleRegistration: targetPlate,
            reason: assignedVehiclePlate ? 'Vehicle Reassignment' : 'Fleet Allocation',
            notes: `Assigned via Driver Details Screen for ${currentDriver.name}`
          });
        } catch (e) {
          console.warn('driverAssignmentsApi.assign error:', e);
        }
        await updateDriver(driverId, { assignedVehicle: targetPlate });
        showToast('success', `Vehicle ${targetPlate} successfully assigned to ${currentDriver.name}!`, 'Vehicle Assigned');
      }

      await refreshAssignmentHistory();
      if (fetchLiveDrivers) await fetchLiveDrivers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update vehicle assignment.', 'Assignment Error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleQuickUnassign = () => {
    if (!assignedVehiclePlate) return;
    if (window.confirm(`Are you sure you want to unassign vehicle "${assignedVehiclePlate}" from ${currentDriver.name}?`)) {
      handleAssignVehicle('unassign');
    }
  };

  // License compliance cross-reference
  const compDoc = driverCompliance.find(
    c => c.entityName && c.entityName.toLowerCase() === currentDriver.name.toLowerCase()
  );
  const licenseExpiry = currentDriver.licenseExpiry || compDoc?.expiryDate;
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
      t.driverName.toLowerCase() === currentDriver.name.toLowerCase() &&
      (!t.startDate || t.startDate.startsWith(currentMonthKey))
  ).length;

  const driverDutiesThisMonth = dailyDutyLogs.filter(
    d =>
      d.driverName &&
      d.driverName.toLowerCase() === currentDriver.name.toLowerCase() &&
      (!d.date || d.date.startsWith(currentMonthKey))
  ).length;

  const totalThisMonthTrips = driverTripsThisMonth + driverDutiesThisMonth;
  const driverTripsAllTime = trips.filter(
    t => t.driverName && t.driverName.toLowerCase() === currentDriver.name.toLowerCase()
  );
  const driverDutiesAllTime = dailyDutyLogs.filter(
    d => d.driverName && d.driverName.toLowerCase() === currentDriver.name.toLowerCase()
  );
  const totalTripsAllTime = driverTripsAllTime.length + driverDutiesAllTime.length;

  // Driver Expenses
  const driverExpensesList = driverExpenses.filter(
    e => e.driverName && e.driverName.toLowerCase() === currentDriver.name.toLowerCase()
  );
  const totalExpensesLogged = driverExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Payroll Settlement
  const payroll = payrollItems.find(
    p => p.driverId === driverId || p.name.toLowerCase() === currentDriver.name.toLowerCase()
  );
  const pendingSettlement = payroll ? (payroll.netPayable ?? payroll.monthlySalary ?? 0) : (currentDriver.monthlySalary || 0);
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
    if (window.confirm(`Are you sure you want to remove driver "${currentDriver.name}" from fleet?`)) {
      deleteDriver(driverId);
      onBack();
    }
  };

  const handleToggleDuty = () => {
    const newStatus = currentDriver.status === 'On duty' ? 'Off duty' : 'On duty';
    updateDriverStatus(driverId, newStatus);
  };

  // Dropdown options for all vehicles
  const vehicleOptions: CustomDropdownOption[] = [
    {
      value: 'unassign',
      label: '— None (Unassign / Pool Driver) —',
      sublabel: 'No vehicle permanently allocated to this driver',
      badge: !assignedVehiclePlate ? 'Active' : undefined,
      badgeColor: 'rgba(245, 158, 11, 0.25)',
      icon: <UserX size={14} color="#f59e0b" />
    },
    ...vehicles.map(v => {
      const isCurrent =
        assignedVehiclePlate &&
        plateKey(v.registrationNumber) === plateKey(assignedVehiclePlate);
      const isWithOther =
        v.assignedDriver &&
        v.assignedDriver.trim().toLowerCase() !== currentDriver.name.trim().toLowerCase();

      return {
        value: v.registrationNumber,
        label: `${v.registrationNumber} · ${v.model || 'Fleet Vehicle'}`,
        sublabel: `${v.type || 'Commercial'}${v.departmentName ? ` (${v.departmentName})` : ''}${v.fuelType ? ` · ${v.fuelType}` : ''}`,
        badge: isCurrent
          ? 'Current'
          : isWithOther
          ? `With ${v.assignedDriver}`
          : 'Available',
        badgeColor: isCurrent
          ? 'rgba(56, 189, 248, 0.25)'
          : isWithOther
          ? 'rgba(245, 158, 11, 0.25)'
          : 'rgba(34, 197, 94, 0.25)',
        icon: <Car size={14} color={isCurrent ? '#38bdf8' : isWithOther ? '#f59e0b' : '#16a34a'} />
      };
    })
  ];

  const targetVehicleObj =
    selectedVehicleForAssign && selectedVehicleForAssign !== 'unassign'
      ? vehicles.find(
          v => plateKey(v.registrationNumber) === plateKey(selectedVehicleForAssign)
        )
      : null;

  const isAssignedToOther =
    targetVehicleObj?.assignedDriver &&
    targetVehicleObj.assignedDriver.trim().toLowerCase() !==
      currentDriver.name.trim().toLowerCase();

  const isDirty =
    (assignedVehiclePlate || 'unassign') !== selectedVehicleForAssign;

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
            Drivers / <span style={{ color: 'var(--text)', fontWeight: 600 }}>{currentDriver.name}</span>
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
              borderColor: currentDriver.status === 'On duty' ? 'rgba(34, 197, 94, 0.4)' : undefined,
              color: currentDriver.status === 'On duty' ? '#16a34a' : undefined
            }}
          >
            <Power size={14} />
            {currentDriver.status === 'On duty' ? 'Mark Off Duty' : 'Mark On Duty (Active)'}
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={() => onEdit(currentDriver)}
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
            {currentDriver.photo ? (
              <img
                src={currentDriver.photo}
                alt={currentDriver.name}
                onClick={() => setPreviewPhoto(currentDriver.photo || null)}
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
                {getInitials(currentDriver.name)}
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
                background: currentDriver.status === 'On duty' ? '#16a34a' : '#94a3b8',
                border: '2px solid var(--surface)'
              }}
              title={currentDriver.status === 'On duty' ? 'Active On Duty' : 'Off Duty'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
                {currentDriver.name}
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
                  background: currentDriver.status === 'On duty' ? 'rgba(34, 197, 94, 0.12)' : 'var(--surface-3)',
                  color: currentDriver.status === 'On duty' ? '#16a34a' : 'var(--text-dim)',
                  border: `1px solid ${currentDriver.status === 'On duty' ? 'rgba(34, 197, 94, 0.3)' : 'var(--border)'}`
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: currentDriver.status === 'On duty' ? '#16a34a' : '#94a3b8'
                  }}
                />
                {currentDriver.status === 'On duty' ? 'Active' : 'Off duty'}
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
                {currentDriver.driverType || 'Full Time'}
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
              {currentDriver.phone && (
                <a
                  href={`tel:${currentDriver.phone}`}
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
                  <span>{currentDriver.phone}</span>
                  <CheckCircle2 size={13} color="#2563eb" />
                </a>
              )}

              {assignedVehiclePlate ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    color: '#38bdf8',
                    fontSize: '12.5px'
                  }}
                >
                  <Car size={13} />
                  <span>
                    Assigned Vehicle: <b>{assignedVehiclePlate}</b>
                    {assignedVehicleObj?.model ? ` (${assignedVehicleObj.model})` : ''}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    color: '#f59e0b',
                    fontSize: '12.5px'
                  }}
                >
                  <Car size={13} />
                  <span>Pool Driver · <b>No Vehicle Assigned</b></span>
                </div>
              )}

              {currentDriver.joiningDate && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={14} color="#ffcc4d" />
                  <span>Joined: {currentDriver.joiningDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick action: Call or WhatsApp */}
        {currentDriver.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={`https://wa.me/${currentDriver.phone.replace(/[^0-9]/g, '')}`}
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
              href={`tel:${currentDriver.phone}`}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {assignedVehiclePlate ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--surface-2)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text)'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                      {assignedVehiclePlate}
                      {assignedVehicleObj?.model && (
                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
                          ({assignedVehicleObj.model})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                      Unassigned (Pool Driver)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Emergency Contact
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
                  {currentDriver.emergencyContact || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Joining Date
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
                  {currentDriver.joiningDate || '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Monthly Base Salary
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)', marginTop: '4px' }}>
                  ₹{(currentDriver.monthlySalary || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Residential Address
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '4px', lineHeight: 1.4 }}>
                  {currentDriver.address || 'Address not registered'}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Vehicle & Fleet Allocation Panel */}
          <div className="panel" id="assigned-vehicle-panel">
            <div className="panel-head">
              <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={16} color="var(--accent)" /> Assigned Vehicle & Fleet Allocation
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: assignedVehiclePlate ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: assignedVehiclePlate ? '#16a34a' : '#f59e0b',
                  border: `1px solid ${assignedVehiclePlate ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}
              >
                {assignedVehiclePlate ? 'Vehicle Allocated' : 'Unassigned (Pool Driver)'}
              </span>
            </div>

            {/* Current Vehicle Card */}
            {assignedVehiclePlate ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--surface-2) 0%, rgba(56, 189, 248, 0.04) 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Plate & Status Top Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: '#090d16',
                        border: '1.5px solid rgba(56, 189, 248, 0.45)',
                        borderRadius: '6px',
                        padding: '3px 10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>IND</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14.5px', color: '#ffffff', letterSpacing: '0.8px' }}>
                        {assignedVehicleObj?.registrationNumber || assignedVehiclePlate}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background:
                          assignedVehicleObj?.status === 'Running' || assignedVehicleObj?.status === 'Active'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          assignedVehicleObj?.status === 'Running' || assignedVehicleObj?.status === 'Active'
                            ? '#16a34a'
                            : '#f59e0b',
                        border: `1px solid ${
                          assignedVehicleObj?.status === 'Running' || assignedVehicleObj?.status === 'Active'
                            ? 'rgba(34, 197, 94, 0.3)'
                            : 'rgba(245, 158, 11, 0.3)'
                        }`
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background:
                            assignedVehicleObj?.status === 'Running' || assignedVehicleObj?.status === 'Active'
                              ? '#16a34a'
                              : '#f59e0b'
                        }}
                      />
                      {assignedVehicleObj?.status || 'Active'}
                    </span>
                  </div>

                  {/* Fuel & Type pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {assignedVehicleObj?.fuelType && (
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'var(--surface-3)',
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Fuel size={11} /> {assignedVehicleObj.fuelType}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'var(--surface-3)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {assignedVehicleObj?.type || 'Commercial Fleet'}
                    </span>
                  </div>
                </div>

                {/* Model & Department */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                    {assignedVehicleObj?.model || 'Commercial Fleet Vehicle'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {assignedVehicleObj?.departmentName
                      ? `Dedicated to ${assignedVehicleObj.departmentName} Department`
                      : assignedVehicleObj?.assignedTo
                      ? `Duty assigned to: ${assignedVehicleObj.assignedTo}`
                      : 'General Fleet Duty'}
                  </div>
                </div>

                {/* Specs 4-item grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '10px',
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div style={{ background: 'var(--surface-3)', padding: '8px 10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Gauge size={11} /> Current Odometer
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginTop: '3px' }}>
                      {assignedVehicleObj?.odometer ? `${assignedVehicleObj.odometer.toLocaleString('en-IN')} km` : '—'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-3)', padding: '8px 10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CreditCard size={11} /> FASTag Balance
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#16a34a', marginTop: '3px' }}>
                      {assignedVehicleObj?.fastagBalance != null ? `₹${assignedVehicleObj.fastagBalance.toLocaleString('en-IN')}` : '—'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-3)', padding: '8px 10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={11} /> Insurance Expiry
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginTop: '3px' }}>
                      {assignedVehicleObj?.insuranceExpiry || 'Valid'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-3)', padding: '8px 10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={11} /> RC Expiry
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginTop: '3px' }}>
                      {assignedVehicleObj?.rcExpiry || 'Valid'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.04)',
                  border: '1px dashed rgba(245, 158, 11, 0.25)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    flexShrink: 0
                  }}
                >
                  <Car size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                    No Vehicle Permanently Assigned
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                    {currentDriver.name} is currently working as a <b>Pool / Relief Driver</b> without a dedicated vehicle. Assign any vehicle from the fleet below.
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Vehicle Assignment Dropdown & Controls */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <KeyRound size={12} color="var(--accent)" />
                  {assignedVehiclePlate ? 'Change Assigned Vehicle' : 'Assign Vehicle from Fleet'}
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                  {vehicles.length} vehicles available in fleet
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <CustomDropdown
                  value={selectedVehicleForAssign}
                  onChange={val => setSelectedVehicleForAssign(val)}
                  options={vehicleOptions}
                  placeholder="Search and select vehicle from fleet..."
                  searchable={true}
                  buttonStyle={{
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                />

                {/* Reassignment warning if vehicle is currently with another driver */}
                {isAssignedToOther && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontSize: '12px',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}
                  >
                    <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>
                      <b>Reassignment Notice:</b> Vehicle <b>{selectedVehicleForAssign}</b> is currently assigned to driver <b>{targetVehicleObj?.assignedDriver}</b>. Confirming will reassign this vehicle to <b>{currentDriver.name}</b> and release {targetVehicleObj?.assignedDriver} to the pool roster.
                    </span>
                  </div>
                )}

                {/* Unassign notice */}
                {selectedVehicleForAssign === 'unassign' && assignedVehiclePlate && (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <UserX size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span>
                      Vehicle <b>{assignedVehiclePlate}</b> will be unassigned. <b>{currentDriver.name}</b> will become a Pool Driver.
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleAssignVehicle(selectedVehicleForAssign)}
                    disabled={!isDirty || isAssigning}
                    style={{
                      fontSize: '12.5px',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 600,
                      opacity: !isDirty ? 0.55 : 1,
                      cursor: !isDirty ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin-loader 0.8s linear infinite' }} />
                        <span>Updating Assignment...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>
                          {selectedVehicleForAssign === 'unassign'
                            ? 'Confirm Unassign'
                            : assignedVehiclePlate
                            ? 'Save New Vehicle'
                            : 'Assign Selected Vehicle'}
                        </span>
                      </>
                    )}
                  </button>

                  {isDirty && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setSelectedVehicleForAssign(assignedVehiclePlate || 'unassign')}
                      disabled={isAssigning}
                      style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px' }}
                    >
                      Cancel
                    </button>
                  )}

                  {assignedVehiclePlate && !isDirty && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleQuickUnassign}
                      disabled={isAssigning}
                      style={{
                        fontSize: '12px',
                        padding: '7px 14px',
                        borderRadius: '8px',
                        color: 'var(--danger)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="Unassign vehicle from driver"
                    >
                      <UserX size={13} />
                      <span>Unassign Vehicle</span>
                    </button>
                  )}
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

          {/* Vehicle Assignment History Panel */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color="var(--accent)" /> Vehicle Assignment History
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'var(--surface-2)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)'
                }}
              >
                {assignmentHistory.length} {assignmentHistory.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {isLoadingHistory && assignmentHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)', fontSize: '12px' }}>
                Loading assignment timeline...
              </div>
            ) : assignmentHistory.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px dashed var(--border)',
                  fontSize: '12px',
                  color: 'var(--text-faint)',
                  textAlign: 'center'
                }}
              >
                No historical vehicle assignments logged yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {assignmentHistory.map(assign => {
                  const isActive = assign.status === 'ACTIVE';
                  const isCompleted = assign.status === 'COMPLETED';
                  const assignedDate = assign.assignedAt
                    ? new Date(assign.assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—';
                  const unassignedDate = assign.unassignedAt
                    ? new Date(assign.unassignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : null;

                  return (
                    <div
                      key={assign.id || (assign as any)._id}
                      style={{
                        background: 'var(--surface-2)',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.35)' : 'var(--border)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Car size={14} style={{ color: isActive ? '#16a34a' : 'var(--accent)' }} />
                          <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', letterSpacing: '0.3px' }}>
                            {assign.vehicleRegistration}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: isActive
                              ? 'rgba(34, 197, 94, 0.15)'
                              : isCompleted
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                            color: isActive
                              ? '#16a34a'
                              : isCompleted
                              ? '#38bdf8'
                              : '#f59e0b',
                            border: `1px solid ${
                              isActive
                                ? 'rgba(34, 197, 94, 0.3)'
                                : isCompleted
                                ? 'rgba(56, 189, 248, 0.3)'
                                : 'rgba(245, 158, 11, 0.3)'
                            }`
                          }}
                        >
                          {isActive ? '● Currently Assigned' : isCompleted ? 'Completed' : 'Unassigned'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '2px', flexWrap: 'wrap', gap: '6px' }}>
                        <div>
                          <span>Timeline: </span>
                          <strong style={{ color: 'var(--text-muted)' }}>
                            {assignedDate}
                          </strong>
                          {' → '}
                          <strong style={{ color: isActive ? '#16a34a' : 'var(--text-muted)' }}>
                            {unassignedDate || 'Present'}
                          </strong>
                        </div>
                        {assign.reason && (
                          <div style={{ fontStyle: 'italic', fontSize: '11px' }}>
                            {assign.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                        {duty.departmentName || 'Department Duty'} · {duty.vehicle || assignedVehiclePlate || '—'}
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
                        Trip #{trip.id.slice(-6)} · {(trip as any).vehicleRegistration || (trip as any).vehicleNumber || assignedVehiclePlate || '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {trip.startDate} · Status: {trip.status}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                      ₹{(trip as any).amount ? (trip as any).amount.toLocaleString('en-IN') : ((trip as any).totalAmount ? (trip as any).totalAmount.toLocaleString('en-IN') : '0')}
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
                        {exp.category} · {exp.vehicle || assignedVehiclePlate || '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {exp.date} · {exp.remarks || (exp as any).notes || 'Expense logged'}
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
