import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDriverModal } from './AddDriverModal';
import { EditDriverModal } from './EditDriverModal';
import { DriverDetailView } from './DriverDetailView';
import { DriverAttendanceView } from './DriverAttendanceView';
import { DriverExpensesView } from './DriverExpensesView';
import { DriverPayrollView } from './DriverPayrollView';
import { Driver, DriverType } from '../../../types/fleet';
import {
  Users,
  CalendarCheck,
  Receipt,
  MapPin,
  Trash2,
  Power,
  Edit2,
  ChevronDown,
  Banknote,
  LayoutGrid,
  List,
  CheckCircle2,
  Search,
  Eye
} from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const DriversView: React.FC = () => {
  const {
    drivers,
    searchQuery,
    driverSubTab,
    setDriverSubTab,
    attendanceRecords,
    driverExpenses,
    payrollItems,
    trips,
    dailyDutyLogs,
    driverCompliance,
    isLoading,
    updateDriverStatus,
    deleteDriver
  } = useFleet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriverForDetail, setSelectedDriverForDetail] = useState<Driver | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Persisted view mode: 'card' | 'list'
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('fleetos_driver_view_mode') as 'card' | 'list') || 'card';
  });

  const handleSetViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('fleetos_driver_view_mode', mode);
  };

  const activeSearch = (localSearch || searchQuery).trim().toLowerCase();

  const filtered = drivers.filter(d => {
    const matchSearch =
      !activeSearch ||
      d.name.toLowerCase().includes(activeSearch) ||
      (d.assignedVehicle && d.assignedVehicle.toLowerCase().includes(activeSearch)) ||
      (d.phone && d.phone.toLowerCase().includes(activeSearch)) ||
      (d.driverType && d.driverType.toLowerCase().includes(activeSearch)) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(activeSearch));

    const matchType = selectedTypeFilter === 'All' || d.driverType === selectedTypeFilter;
    const matchStatus =
      selectedStatusFilter === 'All' ||
      (selectedStatusFilter === 'Active' && d.status === 'On duty') ||
      (selectedStatusFilter === 'On duty' && d.status === 'On duty') ||
      (selectedStatusFilter === 'Off duty' && d.status === 'Off duty') ||
      d.status === selectedStatusFilter;

    return matchSearch && matchType && matchStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedDrivers
  } = usePagination(filtered, viewMode === 'card' ? 12 : 10);

  const getTypeBadgeClass = (type?: DriverType) => {
    switch (type) {
      case 'Full Time':
        return 'driver-type-badge full-time';
      case 'Part Time':
        return 'driver-type-badge part-time';
      case 'Contract':
        return 'driver-type-badge contract';
      case 'Owner Driver':
        return 'driver-type-badge owner-driver';
      default:
        return 'driver-type-badge';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Helper to cross-reference trips for a driver in current month
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const getDriverTripsCount = (driverName: string) => {
    const dLower = (driverName || '').toLowerCase();
    const tripCount = trips.filter(
      t => t.driverName && t.driverName.toLowerCase() === dLower && (!t.startDate || t.startDate.startsWith(currentMonthKey))
    ).length;
    const dutyCount = dailyDutyLogs.filter(
      d => d.driverName && d.driverName.toLowerCase() === dLower && (!d.date || d.date.startsWith(currentMonthKey))
    ).length;
    return tripCount + dutyCount;
  };

  // Helper to cross-reference pending settlement from payroll
  const getDriverPendingSettlement = (d: Driver) => {
    const item = payrollItems.find(
      p => p.driverId === d.id || p.name.toLowerCase() === d.name.toLowerCase()
    );
    if (!item) return d.monthlySalary || 0;
    if (item.status === 'PAID') return 0;
    return item.netPayable ?? item.monthlySalary ?? 0;
  };

  // Helper to check license expiry
  const getDriverLicenseInfo = (d: Driver) => {
    const compDoc = driverCompliance.find(
      c => c.entityName && c.entityName.toLowerCase() === d.name.toLowerCase()
    );
    const expiry = d.licenseExpiry || compDoc?.expiryDate;
    if (!expiry) return { label: 'OK', isExpired: false };
    const expDate = new Date(expiry);
    const isExpired = !isNaN(expDate.getTime()) && expDate < new Date();
    return {
      label: isExpired ? 'Expired' : 'OK',
      isExpired
    };
  };

  // Summary counts
  const onDutyCount = drivers.filter(d => d.status === 'On duty').length;
  const fullTimeCount = drivers.filter(d => d.driverType === 'Full Time').length;
  const totalExpenseSum = driverExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={6} columns={6} />
      </div>
    );
  }

  return (
    <div className="section active">
      {/* Driver Sub-tabs Navigation */}
      <div className="subtab-nav">
        <button
          className={`subtab-btn ${driverSubTab === 'list' ? 'active' : ''}`}
          onClick={() => {
            setDriverSubTab('list');
            setSelectedDriverForDetail(null);
          }}
        >
          <Users size={16} />
          Driver list
          <span className="subtab-counter">{drivers.length}</span>
        </button>

        <button
          className={`subtab-btn ${driverSubTab === 'attendance' ? 'active' : ''}`}
          onClick={() => {
            setDriverSubTab('attendance');
            setSelectedDriverForDetail(null);
          }}
        >
          <CalendarCheck size={16} />
          Attendance
          <span className="subtab-counter">
            {attendanceRecords.filter(a => a.status === 'Present' || a.status === 'On Trip').length} Active
          </span>
        </button>

        <button
          className={`subtab-btn ${driverSubTab === 'expenses' ? 'active' : ''}`}
          onClick={() => {
            setDriverSubTab('expenses');
            setSelectedDriverForDetail(null);
          }}
        >
          <Receipt size={16} />
          Driver expenses
          <span className="subtab-counter">
            ₹{totalExpenseSum.toLocaleString('en-IN')}
          </span>
        </button>

        <button
          className={`subtab-btn ${driverSubTab === 'payroll' ? 'active' : ''}`}
          onClick={() => {
            setDriverSubTab('payroll');
            setSelectedDriverForDetail(null);
          }}
        >
          <Banknote size={16} />
          Driver payroll
          <span className="subtab-counter">
            {payrollItems.length}
          </span>
        </button>
      </div>

      {/* Sub-view Content */}
      {driverSubTab === 'list' && (
        selectedDriverForDetail ? (
          <>
            <DriverDetailView
              driver={drivers.find(d => d.id === selectedDriverForDetail.id) || selectedDriverForDetail}
              onBack={() => setSelectedDriverForDetail(null)}
              onEdit={drv => setEditingDriver(drv)}
            />
            <EditDriverModal
              isOpen={!!editingDriver}
              driver={editingDriver}
              onClose={() => setEditingDriver(null)}
            />
          </>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Roster Stats */}
          <div className="stats-grid">
            <StatCard label="Total Registered Drivers" value={drivers.length} customColor="var(--accent)" />
            <StatCard label="On Duty Right Now" value={onDutyCount} />
            <StatCard label="Full Time Staff" value={fullTimeCount} />
            <StatCard
              label="Contract / Owner Drivers"
              value={drivers.filter(d => d.driverType === 'Contract' || d.driverType === 'Owner Driver').length}
            />
          </div>

          <div className="panel">
            {/* Control Bar: Search, Status, Type, View Switcher, Add Driver */}
            <div
              className="panel-head"
              style={{
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border)'
              }}
            >
              {/* Left Title & Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
                <div>
                  <span className="panel-title" style={{ fontSize: '16px', fontWeight: 700 }}>
                    Drivers
                  </span>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    View and manage driver accounts and activity
                  </div>
                </div>

                <div style={{ position: 'relative', minWidth: '220px', maxWidth: '340px', flex: 1 }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '11px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, phone"
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="form-input"
                    style={{
                      paddingLeft: '32px',
                      paddingRight: '10px',
                      fontSize: '12.5px',
                      height: '36px',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              {/* Right Filters & View Mode Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', height: '36px', borderRadius: '8px' }}
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="All">Status: All</option>
                  <option value="Active">Status: Active</option>
                  <option value="Off duty">Status: Off duty</option>
                </select>

                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', height: '36px', borderRadius: '8px' }}
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Owner Driver">Owner Driver</option>
                </select>

                {/* View Switcher: Card View vs List View */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--surface-2, #f1f5f9)',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <button
                    type="button"
                    title="Card View"
                    onClick={() => handleSetViewMode('card')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: viewMode === 'card' ? 'var(--surface, #ffffff)' : 'transparent',
                      color: viewMode === 'card' ? 'var(--accent, #1687F5)' : 'var(--text-muted, #64748b)',
                      boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <LayoutGrid size={14} />
                    <span>Cards</span>
                  </button>

                  <button
                    type="button"
                    title="List View"
                    onClick={() => handleSetViewMode('list')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: viewMode === 'list' ? 'var(--surface, #ffffff)' : 'transparent',
                      color: viewMode === 'list' ? 'var(--accent, #1687F5)' : 'var(--text-muted, #64748b)',
                      boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <List size={14} />
                    <span>List</span>
                  </button>
                </div>

                <button
                  className="btn-primary-action"
                  style={{ fontSize: '12px', padding: '7px 16px', height: '36px', borderRadius: '8px' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  + Add Driver
                </button>
              </div>
            </div>

            {/* VIEW MODE 1: CARD VIEW */}
            {viewMode === 'card' && (
              <div style={{ marginTop: '18px' }}>
                {paginatedDrivers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                    No drivers found matching your filter criteria.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {paginatedDrivers.map(d => {
                      const tripsCount = getDriverTripsCount(d.name);
                      const pendingSettlement = getDriverPendingSettlement(d);
                      const licenseInfo = getDriverLicenseInfo(d);
                      const isActive = d.status === 'On duty';

                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDriverForDetail(d)}
                          style={{
                            background: 'var(--surface, #ffffff)',
                            border: '1px solid var(--border, #e2e8f0)',
                            borderRadius: '14px',
                            padding: '16px 18px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            position: 'relative',
                            userSelect: 'none'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 24px -4px rgba(0,0,0,0.08)';
                            e.currentTarget.style.borderColor = 'var(--accent, #1687F5)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                            e.currentTarget.style.borderColor = 'var(--border, #e2e8f0)';
                          }}
                        >
                          {/* Top Section: Avatar, Info, Status Badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {d.photo ? (
                                <img
                                  src={d.photo}
                                  alt={d.name}
                                  style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid var(--border, #e2e8f0)',
                                    flexShrink: 0
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, rgba(22, 135, 245, 0.15), rgba(37, 99, 235, 0.22))',
                                    color: 'var(--accent, #1687F5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    border: '1px solid rgba(22, 135, 245, 0.2)',
                                    flexShrink: 0
                                  }}
                                >
                                  {getInitials(d.name)}
                                </div>
                              )}

                              <div>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                                  {d.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                                    {d.phone || 'No phone'}
                                  </span>
                                  {d.phone && (
                                    <CheckCircle2 size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
                                  )}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  This Month: <strong style={{ color: 'var(--text)' }}>{tripsCount} trips</strong>
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                background: isActive ? 'rgba(34, 197, 94, 0.12)' : 'var(--surface-3, #f1f5f9)',
                                color: isActive ? '#16a34a' : 'var(--text-dim, #64748b)',
                                border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.3)' : 'var(--border, #e2e8f0)'}`,
                                flexShrink: 0
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: isActive ? '#16a34a' : '#94a3b8'
                                }}
                              />
                              {isActive ? 'Active' : 'Off duty'}
                            </span>
                          </div>

                          {/* Bottom Row: Settlement & License */}
                          <div
                            style={{
                              marginTop: '14px',
                              paddingTop: '12px',
                              borderTop: '1px solid var(--border, #e2e8f0)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px'
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>
                                ₹{pendingSettlement.toLocaleString('en-IN')}
                              </span>
                              <span style={{ color: 'var(--text-faint)', marginLeft: '4px' }}>
                                Pending Settlement
                              </span>
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-faint)' }}>License: </span>
                              <strong
                                style={{
                                  color: licenseInfo.isExpired ? '#f59e0b' : '#16a34a',
                                  fontWeight: 600
                                }}
                              >
                                {licenseInfo.label}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE 2: LIST VIEW */}
            {viewMode === 'list' && (
              <div className="table-responsive" style={{ marginTop: '12px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Type</th>
                      <th>Assigned vehicle</th>
                      <th>Emergency contact</th>
                      <th>License No.</th>
                      <th>Joining date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDrivers.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                          No drivers found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedDrivers.map(d => (
                        <tr
                          key={d.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedDriverForDetail(d)}
                        >
                          <td>
                            <div className="driver-info-cell">
                              {d.photo ? (
                                <img src={d.photo} alt={d.name} className="driver-avatar-circle" />
                              ) : (
                                <div className="driver-avatar-circle">
                                  {getInitials(d.name)}
                                </div>
                              )}
                              <div>
                                <div className="cell-truncate-md" style={{ fontWeight: 600, color: 'var(--text)' }} title={d.name}>
                                  {d.name}
                                </div>
                                {d.phone && (
                                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{d.phone}</span>
                                    <CheckCircle2 size={11} style={{ color: '#2563eb' }} />
                                  </div>
                                )}
                                {d.address && (
                                  <div
                                    className="cell-truncate-md"
                                    style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                    title={d.address}
                                  >
                                    <MapPin size={10} style={{ flexShrink: 0 }} /> <span className="text-truncate">{d.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={getTypeBadgeClass(d.driverType)}>
                              {d.driverType || 'Full Time'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>{d.assignedVehicle || '—'}</td>
                          <td style={{ color: d.emergencyContact ? 'var(--text)' : 'var(--text-faint)' }}>
                            {d.emergencyContact || '—'}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-dim)' }}>
                            {d.licenseNumber || '—'}
                          </td>
                          <td>{d.joiningDate}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                              <select
                                value={d.status}
                                onChange={e => updateDriverStatus(d.id, e.target.value as 'On duty' | 'Off duty')}
                                style={{
                                  background: d.status === 'On duty' ? 'rgba(34, 197, 94, 0.12)' : 'var(--surface-3)',
                                  color: d.status === 'On duty' ? '#22c55e' : 'var(--text-dim)',
                                  border: `1px solid ${d.status === 'On duty' ? 'rgba(34, 197, 94, 0.35)' : 'var(--border)'}`,
                                  padding: '4px 24px 4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  outline: 'none',
                                  appearance: 'none',
                                  WebkitAppearance: 'none',
                                  lineHeight: 1.4
                                }}
                                title="Select driver duty status"
                              >
                                <option value="On duty" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● Active</option>
                                <option value="Off duty" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● Off duty</option>
                              </select>
                              <ChevronDown
                                size={11}
                                style={{
                                  position: 'absolute',
                                  right: '8px',
                                  pointerEvents: 'none',
                                  color: d.status === 'On duty' ? '#22c55e' : 'var(--text-dim)',
                                  opacity: 0.8
                                }}
                              />
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setSelectedDriverForDetail(d)}
                                title="View full driver details"
                              >
                                <Eye size={11} color="var(--accent)" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setEditingDriver(d)}
                                title="Edit driver details"
                              >
                                <Edit2 size={11} color="var(--accent)" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => updateDriverStatus(d.id, d.status === 'On duty' ? 'Off duty' : 'On duty')}
                                title={`Toggle duty status (Currently ${d.status})`}
                              >
                                <Power size={11} color={d.status === 'On duty' ? 'var(--accent)' : 'var(--text-faint)'} />
                                <span>{d.status === 'On duty' ? 'Off duty' : 'On duty'}</span>
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '4px 7px', color: 'var(--danger)', borderColor: 'rgba(255, 92, 92, 0.2)' }}
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to remove driver "${d.name}" from the system?`)) {
                                    deleteDriver(d.id);
                                  }
                                }}
                                title="Delete driver"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="drivers"
            />
          </div>

          {/* Slide-from-bottom Animated Modals */}
          <AddDriverModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />

          <EditDriverModal
            isOpen={!!editingDriver}
            driver={editingDriver}
            onClose={() => setEditingDriver(null)}
          />
        </div>
        )
      )}

      {driverSubTab === 'attendance' && <DriverAttendanceView />}

      {driverSubTab === 'expenses' && <DriverExpensesView />}

      {driverSubTab === 'payroll' && <DriverPayrollView />}
    </div>
  );
};
