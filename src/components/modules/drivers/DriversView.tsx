import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDriverModal } from './AddDriverModal';
import { EditDriverModal } from './EditDriverModal';
import { ImportDriversModal } from './ImportDriversModal';
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
  Eye,
  EyeOff,
  Car,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { SkeletonCard, SkeletonTable, SkeletonDriverCard, SoftRefreshBar } from '../../common/Skeleton';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import { resolveAssignedVehicle, isAssignedPlate } from '../../../utils/assignment';
import { StatusDropdown } from '../../common/StatusDropdown';
import {
  exportDriversToExcel,
  downloadDriverExcelTemplate,
  exportDriversToCsv,
  downloadCsv
} from '../../../utils/csvHelper';

export const DriversView: React.FC = () => {
  const {
    drivers,
    vehicles,
    searchQuery,
    driverSubTab,
    setDriverSubTab,
    attendanceRecords,
    driverExpenses,
    tripExpenses,
    payrollItems,
    trips,
    dailyDutyLogs,
    driverCompliance,
    isLoading,
    isLoadingDrivers,
    updateDriverStatus,
    deleteDriver,
    showToast
  } = useFleet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [selectedDriverForDetail, setSelectedDriverForDetail] = useState<Driver | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  // Assignment filter: 'All' | 'Assigned' | 'Unassigned' - defaults to 'All' so all drivers are shown directly!
  const [assignmentFilter, setAssignmentFilter] = useState<'All' | 'Assigned' | 'Unassigned'>('All');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isExportMenuOpen]);

  const handleExportAllDrivers = () => {
    if (drivers.length === 0) {
      showToast('info', 'No drivers available to export.', 'Empty Roster');
      return;
    }
    exportDriversToExcel(drivers);
    showToast('success', `Exported ${drivers.length} drivers to Excel (.xlsx) successfully.`, 'Excel Downloaded');
  };

  const handleDownloadExcelTemplate = () => {
    downloadDriverExcelTemplate();
    showToast('info', 'Driver Excel (.xlsx) sample template downloaded.', 'Template Ready');
  };

  const handleExportCsvDrivers = () => {
    if (drivers.length === 0) {
      showToast('info', 'No drivers available to export.', 'Empty Roster');
      return;
    }
    const csv = exportDriversToCsv(drivers);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsv(csv, `fleet_drivers_roster_${dateStr}.csv`);
    showToast('success', `Exported ${drivers.length} drivers to CSV.`, 'CSV Downloaded');
  };

  // Persisted view mode: 'card' | 'list'
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('fleetos_driver_view_mode') as 'card' | 'list') || 'card';
  });

  const handleSetViewMode = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('fleetos_driver_view_mode', mode);
  };

  const activeSearch = (localSearch || searchQuery).trim().toLowerCase();

  // Counts of assigned and unassigned drivers for badges & filters
  const assignedCount = useMemo(
    () => drivers.filter(d => isAssignedPlate(resolveAssignedVehicle(d, vehicles))).length,
    [drivers, vehicles]
  );
  const unassignedCount = useMemo(
    () => drivers.filter(d => !isAssignedPlate(resolveAssignedVehicle(d, vehicles))).length,
    [drivers, vehicles]
  );

  const filtered = drivers.filter(d => {
    const assignedPlate = resolveAssignedVehicle(d, vehicles) || '';
    const isAssigned = isAssignedPlate(assignedPlate);

    // Assignment filter
    if (assignmentFilter === 'Assigned' && !isAssigned) return false;
    if (assignmentFilter === 'Unassigned' && isAssigned) return false;

    const plate = assignedPlate.toLowerCase();
    const matchSearch =
      !activeSearch ||
      d.name.toLowerCase().includes(activeSearch) ||
      plate.includes(activeSearch) ||
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
  const totalExpenseSum = driverExpenses.reduce((acc, curr) => acc + curr.amount, 0)
    + tripExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // First-time load: show full skeleton
  if (isLoadingDrivers && drivers.length === 0) {
    return (
      <div className="section active module-page">
        <SkeletonCard count={4} />
        <SkeletonDriverCard count={6} />
      </div>
    );
  }

  return (
    <div className="section active module-page">
      <SoftRefreshBar visible={isLoadingDrivers && drivers.length > 0} label="Syncing drivers…" />

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
          <div className="driver-page-container">
            {/* Header */}
            <div className="driver-page-head">
              <div>
                <h1>Drivers</h1>
                <p>View and manage driver accounts and activity</p>
              </div>
              <button
                type="button"
                className="btn-driver-main primary"
                onClick={() => setIsModalOpen(true)}
              >
                + Add driver
              </button>
            </div>

            {/* Stats Row */}
            <div className="driver-stats-grid">
              <div className="driver-stat-card">
                <div className="label">Total registered</div>
                <div className="value">{drivers.length}</div>
              </div>
              <div className="driver-stat-card paid">
                <div className="label">On duty right now</div>
                <div className="value">{onDutyCount}</div>
              </div>
              <div className="driver-stat-card">
                <div className="label">Full-time staff</div>
                <div className="value">{fullTimeCount}</div>
              </div>
              <div className="driver-stat-card accent">
                <div className="label">Contract / owner drivers</div>
                <div className="value">
                  {drivers.filter(d => d.driverType === 'Contract' || d.driverType === 'Owner Driver').length}
                </div>
              </div>
            </div>

            {/* Main Card Container */}
            <div className="driver-card-panel">
              {/* Toolbar */}
              <div className="driver-toolbar">
                <div className="driver-toolbar-controls">
                  <div className="driver-search-wrap">
                    <Search size={15} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search by name or phone"
                      value={localSearch}
                      onChange={e => setLocalSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="driver-select"
                    value={selectedStatusFilter}
                    onChange={e => setSelectedStatusFilter(e.target.value)}
                  >
                    <option value="All">Status: All</option>
                    <option value="Active">Status: Active</option>
                    <option value="Off duty">Status: Off duty</option>
                  </select>

                  <select
                    className="driver-select"
                    value={selectedTypeFilter}
                    onChange={e => setSelectedTypeFilter(e.target.value)}
                  >
                    <option value="All">All types</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Owner Driver">Owner Driver</option>
                  </select>
                </div>

                <div className="driver-toolbar-controls">
                  <div className="driver-view-toggle">
                    <span
                      className={viewMode === 'card' ? 'active' : ''}
                      onClick={() => handleSetViewMode('card')}
                    >
                      Cards
                    </span>
                    <span
                      className={viewMode === 'list' ? 'active' : ''}
                      onClick={() => handleSetViewMode('list')}
                    >
                      List
                    </span>
                  </div>

                  {/* Export Dropdown Menu - EXACT SAME FUNCTIONALITY */}
                  <div style={{ position: 'relative' }} ref={exportMenuRef}>
                    <button
                      type="button"
                      className="btn-driver-main"
                      title="Export drivers to CSV or Excel (.xlsx)"
                      onClick={() => setIsExportMenuOpen(prev => !prev)}
                    >
                      <span>⬇ Export</span>
                      <ChevronDown
                        size={13}
                        style={{
                          transform: isExportMenuOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    </button>

                    {isExportMenuOpen && (
                      <div className="driver-export-dropdown">
                        <button
                          type="button"
                          className="driver-export-item"
                          onClick={() => {
                            handleExportAllDrivers();
                            setIsExportMenuOpen(false);
                          }}
                        >
                          <FileSpreadsheet size={16} color="#22c55e" />
                          <div>
                            <div style={{ fontWeight: 600 }}>Export to Excel (.xlsx)</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                              {drivers.length} drivers (Excel Sheet)
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="driver-export-item"
                          onClick={() => {
                            handleDownloadExcelTemplate();
                            setIsExportMenuOpen(false);
                          }}
                        >
                          <Download size={16} color="var(--accent)" />
                          <div>
                            <div style={{ fontWeight: 600 }}>Download Excel Template</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                              Sample driver sheet (.xlsx)
                            </div>
                          </div>
                        </button>

                        <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                        <button
                          type="button"
                          className="driver-export-item"
                          onClick={() => {
                            handleExportCsvDrivers();
                            setIsExportMenuOpen(false);
                          }}
                        >
                          <FileSpreadsheet size={15} color="var(--text-dim)" />
                          <div>
                            <div style={{ fontWeight: 500 }}>Export as CSV (.csv)</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Import Button - EXACT SAME FUNCTIONALITY */}
                  <button
                    type="button"
                    className="btn-driver-main"
                    title="Bulk import drivers from Excel (.xlsx) spreadsheet"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    <Upload size={14} /> Import
                  </button>
                </div>
              </div>

              <div className="driver-divider" />

              {/* EMPTY STATE OR LIST */}
              {drivers.length === 0 ? (
                <div className="driver-empty-box">
                  <div className="icon"><Users size={24} /></div>
                  <h3>No drivers yet</h3>
                  <p>Add your first driver to start tracking duty status, attendance and payroll from one place.</p>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn-driver-main"
                      onClick={() => setIsImportModalOpen(true)}
                    >
                      <Upload size={14} /> Import drivers
                    </button>
                    <button
                      type="button"
                      className="btn-driver-main primary"
                      onClick={() => setIsModalOpen(true)}
                    >
                      + Add driver
                    </button>
                  </div>
                </div>
              ) : paginatedDrivers.length === 0 ? (
                <div className="driver-empty-box">
                  <div className="icon"><Search size={24} /></div>
                  <h3>No matching drivers</h3>
                  <p>Try adjusting your search query or filter options to find the driver you're looking for.</p>
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn-driver-main"
                      onClick={() => {
                        setLocalSearch('');
                        setSelectedStatusFilter('All');
                        setSelectedTypeFilter('All');
                        setAssignmentFilter('All');
                      }}
                    >
                      Reset filters
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* CARD VIEW */}
                  {viewMode === 'card' && (
                    <div style={{ padding: '20px' }}>
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

                          return (
                            <div
                              key={d.id}
                              onClick={() => setSelectedDriverForDetail(d)}
                              style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
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
                                e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = 'var(--accent)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                                e.currentTarget.style.borderColor = 'var(--border)';
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
                                        border: '2px solid var(--border)',
                                        flexShrink: 0
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: '46px',
                                        height: '46px',
                                        borderRadius: '50%',
                                        background: 'var(--accent-dim, rgba(22, 135, 245, 0.12))',
                                        color: 'var(--accent)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        border: '1px solid var(--border)',
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
                                      <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>
                                        {d.phone || 'No phone'}
                                      </span>
                                      {d.phone && (
                                        <CheckCircle2 size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                      )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                      This Month: <strong style={{ color: 'var(--text)' }}>{tripsCount} trips</strong>
                                    </div>
                                  </div>
                                </div>

                                <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                                  <StatusDropdown
                                    value={d.status === 'On duty' ? 'On duty' : 'Off duty'}
                                    options={[
                                      { value: 'On duty', label: 'Active', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', borderColor: 'rgba(22, 163, 74, 0.35)' },
                                      { value: 'Off duty', label: 'Off duty', color: 'var(--text-dim)', bg: 'var(--surface-3)', borderColor: 'var(--border)' }
                                    ]}
                                    onChange={newVal => updateDriverStatus(d.id, newVal as 'On duty' | 'Off duty')}
                                    size="sm"
                                  />
                                </div>
                              </div>

                              {/* Bottom Row: Settlement & License */}
                              <div
                                style={{
                                  marginTop: '14px',
                                  paddingTop: '12px',
                                  borderTop: '1px solid var(--border)',
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
                    </div>
                  )}

                  {/* LIST VIEW */}
                  {viewMode === 'list' && (
                    <div className="table-responsive table-dense" style={{ padding: '0 12px' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Driver</th>
                            <th>Vehicle</th>
                            <th>Type</th>
                            <th>License</th>
                            <th>Status</th>
                            <th className="td-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDrivers.map(d => (
                            <tr
                              key={d.id}
                              className="table-row-clickable"
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
                                  <div className="cell-stack">
                                    <span className="cell-primary" title={d.name}>{d.name}</span>
                                    {d.phone ? (
                                      <span className="cell-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        {d.phone}
                                        <CheckCircle2 size={10} style={{ color: 'var(--accent)' }} />
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontWeight: 500 }}>{d.assignedVehicle || '—'}</td>
                              <td>
                                <span className={getTypeBadgeClass(d.driverType)}>
                                  {d.driverType || 'Full Time'}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-dim)' }}>
                                {d.licenseNumber || '—'}
                              </td>
                              <td onClick={e => e.stopPropagation()}>
                                <StatusDropdown
                                  value={d.status === 'On duty' ? 'On duty' : 'Off duty'}
                                  options={[
                                    { value: 'On duty', label: 'Active', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', borderColor: 'rgba(22, 163, 74, 0.35)' },
                                    { value: 'Off duty', label: 'Off duty', color: 'var(--text-dim)', bg: 'var(--surface-3)', borderColor: 'var(--border)' }
                                  ]}
                                  onChange={newVal => updateDriverStatus(d.id, newVal as 'On duty' | 'Off duty')}
                                  size="sm"
                                />
                              </td>
                              <td className="td-right" onClick={e => e.stopPropagation()}>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => setSelectedDriverForDetail(d)}
                                    title="View details"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => setEditingDriver(d)}
                                    title="Edit driver"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => updateDriverStatus(d.id, d.status === 'On duty' ? 'Off duty' : 'On duty')}
                                    title={`Toggle duty (${d.status})`}
                                  >
                                    <Power size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn icon-btn--danger"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to remove driver "${d.name}" from the system?`)) {
                                        deleteDriver(d.id);
                                      }
                                    }}
                                    title="Delete driver"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
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
                </>
              )}
            </div>

            {/* Slide-from-bottom Animated Modals */}
            <AddDriverModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />

            <ImportDriversModal
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
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
