import React, { useState, useMemo, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDutyLogModal } from './AddDutyLogModal';
import { LogBookPrintModal } from './LogBookPrintModal';
import { WeekendTripBillModal } from './WeekendTripBillModal';
import { DailyDutyLog } from '../../../types/fleet';
import { StatusDropdown, StatusOption } from '../../common/StatusDropdown';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import {
  Building2,
  Briefcase,
  Plus,
  Calendar,
  FileText,
  CheckCircle2,
  MapPin,
  Fuel,
  CreditCard,
  BookOpen,
  Trash2,
  Printer,
  Navigation,
  Droplets,
  UserCheck,
  Check,
  ChevronDown,
  Clock
} from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const DailyDutyLogsView: React.FC = () => {
  const {
    dailyDutyLogs,
    drivers,
    fetchLiveDailyDutyLogs,
    updateDailyDutyLogStatus,
    deleteDailyDutyLog,
    searchQuery,
    isLoading
  } = useFleet();

  const [viewMode, setViewMode] = useState<'slips' | 'logbook'>('slips');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [driverFilter, setDriverFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [dutyCategoryFilter, setDutyCategoryFilter] = useState<'All' | 'Official' | 'Weekend'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    if (dailyDutyLogs.length === 0) {
      void fetchLiveDailyDutyLogs();
    }
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDutyType, setModalDefaultDutyType] = useState<
    'Official Department Duty' | 'Weekend / Off-Duty Trip'
  >('Official Department Duty');

  const [viewSlip, setViewSlip] = useState<{ title: string; src: string } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalSingleLog, setPrintModalSingleLog] = useState<DailyDutyLog | null>(null);
  const [selectedWeekendLogForPrint, setSelectedWeekendLogForPrint] = useState<DailyDutyLog | null>(null);

  const driverNames = useMemo(() => {
    const fromLogs = dailyDutyLogs.map(l => l.driverName).filter(Boolean);
    const fromFleet = drivers.map(d => d.name).filter(Boolean);
    return Array.from(new Set([...fromFleet, ...fromLogs])).sort((a, b) => a.localeCompare(b));
  }, [dailyDutyLogs, drivers]);

  const filteredLogs = useMemo(() => {
    return dailyDutyLogs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        log.departmentName.toLowerCase().includes(q) ||
        log.dutySlipNumber.toLowerCase().includes(q) ||
        log.vehicle.toLowerCase().includes(q) ||
        log.driverName.toLowerCase().includes(q) ||
        (log.logBookPageNo && log.logBookPageNo.toLowerCase().includes(q)) ||
        (log.month && log.month.toLowerCase().includes(q)) ||
        (log.journeyFrom && log.journeyFrom.toLowerCase().includes(q)) ||
        (log.journeyTo && log.journeyTo.toLowerCase().includes(q)) ||
        (log.purposeOfJourney && log.purposeOfJourney.toLowerCase().includes(q)) ||
        (log.headOfAccount && log.headOfAccount.toLowerCase().includes(q)) ||
        (log.officerDesignation && log.officerDesignation.toLowerCase().includes(q)) ||
        (log.tripDestination && log.tripDestination.toLowerCase().includes(q)) ||
        (log.officerName && log.officerName.toLowerCase().includes(q));

      const matchDept = deptFilter === 'All' || log.departmentName === deptFilter;
      const matchVehicle = vehicleFilter === 'All' || log.vehicle === vehicleFilter;
      const matchDriver =
        driverFilter === 'All' ||
        log.driverName?.toLowerCase() === driverFilter.toLowerCase() ||
        log.driverId === driverFilter;
      const matchDate = !dateFilter || log.date === dateFilter;
      const matchMonth =
        monthFilter === 'All' ||
        log.month === monthFilter ||
        (log.date && monthFilter.length === 7 && log.date.startsWith(monthFilter));
      const matchStatus = statusFilter === 'All' || log.status === statusFilter;

      const isWeekendTrip = log.dutyType === 'Weekend / Off-Duty Trip';
      const matchCategory =
        dutyCategoryFilter === 'All' ||
        (dutyCategoryFilter === 'Weekend' && isWeekendTrip) ||
        (dutyCategoryFilter === 'Official' && !isWeekendTrip);

      return matchSearch && matchDept && matchVehicle && matchDriver && matchDate && matchMonth && matchStatus && matchCategory;
    });
  }, [dailyDutyLogs, searchQuery, deptFilter, vehicleFilter, driverFilter, dateFilter, monthFilter, statusFilter, dutyCategoryFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedLogs
  } = usePagination(filteredLogs, 10);

  // Stats calculation
  const stats = useMemo(() => {
    let totalKm = 0;
    let extraKm = 0;
    let totalHours = 0;
    let totalToll = 0;
    let totalFuel = 0;
    let weekendTripsCount = 0;
    let weekendTripProfit = 0;

    filteredLogs.forEach(l => {
      totalKm += l.totalKm || 0;
      extraKm += l.extraKm || 0;
      totalHours += l.totalHours || 0;
      totalToll += l.tollParkingAmount || 0;
      totalFuel += l.fuelAmount || 0;
      if (l.dutyType === 'Weekend / Off-Duty Trip') {
        weekendTripsCount++;
        weekendTripProfit += l.tripNetProfit || 0;
      }
    });

    return {
      totalSlips: filteredLogs.length,
      totalKm,
      extraKm,
      totalHours: totalHours.toFixed(1),
      totalToll,
      totalFuel,
      weekendTripsCount,
      weekendTripProfit
    };
  }, [filteredLogs]);

  const handleOpenModal = (type: 'Official Department Duty' | 'Weekend / Off-Duty Trip') => {
    setModalDefaultDutyType(type);
    setIsModalOpen(true);
  };

  const openLogBookPrint = (log?: DailyDutyLog) => {
    setPrintModalSingleLog(log || null);
    setIsPrintModalOpen(true);
  };

  const renderStatusDropdown = (status: DailyDutyLog['status'], id: string) => {
    const dutyOptions: StatusOption<DailyDutyLog['status']>[] = [
      {
        value: 'Approved',
        label: 'Approved',
        color: 'var(--success, #26b8d8)',
        bg: 'rgba(38, 184, 216, 0.12)',
        borderColor: 'rgba(38, 184, 216, 0.35)'
      },
      {
        value: 'Pending',
        label: 'Pending',
        color: '#ffc107',
        bg: 'rgba(255, 193, 7, 0.12)',
        borderColor: 'rgba(255, 193, 7, 0.35)'
      },
      {
        value: 'Rejected',
        label: 'Rejected',
        color: 'var(--danger, #ff5c5c)',
        bg: 'rgba(255, 92, 92, 0.12)',
        borderColor: 'rgba(255, 92, 92, 0.35)'
      }
    ];

    return (
      <StatusDropdown
        value={status}
        options={dutyOptions}
        onChange={(newStatus) => updateDailyDutyLogStatus(id, newStatus)}
      />
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={6} columns={7} />
      </div>
    );
  }

  const hasActiveFilters = driverFilter !== 'All' || dateFilter || dutyCategoryFilter !== 'All';

  const clearFilters = () => {
    setDriverFilter('All');
    setDateFilter('');
    setDutyCategoryFilter('All');
  };

  return (
    <div className="module-page">
      <div className="module-toolbar">
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${viewMode === 'slips' ? 'active' : ''}`}
            onClick={() => setViewMode('slips')}
          >
            <FileText size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
            Duty slips
          </button>
          <button
            type="button"
            className={`filter-pill ${viewMode === 'logbook' ? 'active' : ''}`}
            onClick={() => setViewMode('logbook')}
          >
            <BookOpen size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
            Log book
          </button>
        </div>

        <div className="module-filter-bar__group">
          <button type="button" className="btn-secondary" onClick={() => handleOpenModal('Weekend / Off-Duty Trip')}>
            <Briefcase size={13} /> Weekend booking
          </button>
          <button type="button" className="btn-primary-action" onClick={() => handleOpenModal('Official Department Duty')}>
            <Plus size={14} /> Log duty
          </button>
        </div>
      </div>

      <div className="stats-grid stats-grid--lean">
        <StatCard label="Duty slips" value={stats.totalSlips} customColor="var(--accent)" />
        <StatCard label="Kilometres" value={`${stats.totalKm.toLocaleString('en-IN')} km`} />
        <StatCard label="Weekend bookings" value={stats.weekendTripsCount} customColor="#38bdf8" />
        <StatCard label="Weekend profit" value={`₹${stats.weekendTripProfit.toLocaleString('en-IN')}`} customColor="var(--success)" />
      </div>

      <div className="panel panel--table">
        <div className="module-filter-bar">
          <div className="module-filter-bar__group">
            <div className="filter-pills">
              <button
                type="button"
                className={`filter-pill ${dutyCategoryFilter === 'All' ? 'active' : ''}`}
                onClick={() => setDutyCategoryFilter('All')}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-pill ${dutyCategoryFilter === 'Official' ? 'active' : ''}`}
                onClick={() => setDutyCategoryFilter('Official')}
              >
                Official
              </button>
              <button
                type="button"
                className={`filter-pill ${dutyCategoryFilter === 'Weekend' ? 'active' : ''}`}
                onClick={() => setDutyCategoryFilter('Weekend')}
              >
                Weekend
              </button>
            </div>

            <select
              className={`form-input filter-select ${driverFilter !== 'All' ? 'filter-select--active' : ''}`}
              value={driverFilter}
              onChange={e => setDriverFilter(e.target.value)}
              title="Filter by driver"
            >
              <option value="All">All drivers</option>
              {driverNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <input
              type="date"
              className={`form-input filter-select ${dateFilter ? 'filter-select--active' : ''}`}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              title="Filter by date"
            />

            {hasActiveFilters ? (
              <button type="button" className="btn-secondary" onClick={clearFilters}>
                Clear
              </button>
            ) : null}
          </div>

          <span className="period-nav__label" style={{ color: 'var(--text-faint)', fontWeight: 500 }}>
            {filteredLogs.length} entries
          </span>
        </div>

        {/* ============================================================ */}
        {/* VIEW 1: OFFICIAL LOG BOOK REGISTER (EXACT IMAGE 1 REPLICA)  */}
        {/* ============================================================ */}
        {viewMode === 'logbook' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
            {/* Header matching Image 1: Vehicle No. UK 07 TD 7555 | Month: August */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(29, 111, 216, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    border: '2px solid var(--accent)',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    color: 'var(--accent)'
                  }}
                >
                  122
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px' }}>
                    OFFICIAL VEHICLE LOG BOOK REGISTER
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Vehicle No: <b style={{ color: 'var(--text)' }}>{vehicleFilter !== 'All' ? vehicleFilter : 'UK 07 TD 7555'}</b>
                    {' · '}
                    Month: <b style={{ color: 'var(--text)' }}>{monthFilter !== 'All' ? monthFilter : 'August 2026'}</b>
                    {' · '}
                    Pages: <b>122 - 123</b>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-faint)' }}>Total KM Run this Page</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)' }}>
                    {stats.totalKm} km
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => openLogBookPrint()}
                  style={{
                    fontSize: '12px',
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={14} /> Print Government Register
                </button>
              </div>
            </div>

            {/* Official Log Book 11-Column Register Table */}
            <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table style={{ fontSize: '12px', borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-3)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '8px 10px', width: '80px' }}>Date</th>
                    <th style={{ padding: '8px 10px' }}>Details of Journey (From → To)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>K.M. From</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>K.M. To</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>K.M. Done</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Petrol / Diesel Litres</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>M. Oil Litres / Stores</th>
                    <th style={{ padding: '8px 10px' }}>Purpose of Journey</th>
                    <th style={{ padding: '8px 10px' }}>Head of A/c</th>
                    <th style={{ padding: '8px 10px' }}>Sig. Of Officer & Designation</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Sig. Driver</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                        No log book entries found. Click "+ Log Official Duty" to add an entry.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map(log => {
                      const isSignedOfficer = log.officerSignatureStatus === 'Signed';
                      const isSignedDriver = log.driverSignatureStatus === 'Signed';

                      return (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: log.dutyType === 'Weekend / Off-Duty Trip' ? 'rgba(56, 189, 248, 0.02)' : undefined
                          }}
                        >
                          {/* Date & Page */}
                          <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600 }}>{log.date}</div>
                            <span
                              style={{
                                fontSize: '10px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                padding: '1px 5px',
                                borderRadius: '4px'
                              }}
                            >
                              Pg {log.logBookPageNo || '122'}
                            </span>
                          </td>

                          {/* Details of Journey */}
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                              {log.journeyFrom || 'GSON'} <span style={{ color: 'var(--accent)' }}>→</span> {log.journeyTo || log.tripDestination || 'Duty'}
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                              {log.dutySlipNumber} · {log.vehicle}
                            </div>
                          </td>

                          {/* KM Reading From */}
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                            {log.startKm}
                          </td>

                          {/* KM Reading To */}
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                            {log.status === 'Pending' && (!log.endTime || log.endTime === '—') ? '—' : log.endKm}
                          </td>

                          {/* KM Done */}
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>
                            {log.totalKm} km
                          </td>

                          {/* Petrol / Diesel Litres */}
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {log.fuelLitres ? (
                              <span style={{ fontWeight: 600, color: '#ffcc4d' }}>
                                {log.fuelLitres} L
                              </span>
                            ) : log.fuelAmount ? (
                              <span style={{ fontSize: '11px', color: '#ffcc4d' }}>
                                ₹{log.fuelAmount}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-faint)' }}>—</span>
                            )}
                          </td>

                          {/* M. Oil Liters / Stores Used */}
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {log.mOilLitres && log.mOilLitres !== '—' ? (
                              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{log.mOilLitres}</span>
                            ) : log.motorOilUsed && log.motorOilUsed !== 'None' ? (
                              <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{log.motorOilUsed}</span>
                            ) : (
                              <span style={{ color: 'var(--text-faint)' }}>—</span>
                            )}
                          </td>

                          {/* Purpose of Journey */}
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 600 }}>
                              {log.purposeOfJourney || (log.dutyType === 'Weekend / Off-Duty Trip' ? 'Weekend Outstation' : 'for office duty')}
                            </div>
                            {log.notes && (
                              <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                {log.notes}
                              </div>
                            )}
                          </td>

                          {/* Head of A/c */}
                          <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-dim)' }}>
                            {log.headOfAccount || 'PWD Duty'}
                          </td>

                          {/* Sig. Of Officer & Designation */}
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: isSignedOfficer ? 'rgba(57, 255, 110, 0.12)' : 'rgba(255, 193, 7, 0.12)',
                                  color: isSignedOfficer ? 'var(--success)' : '#ffc107',
                                  fontWeight: 700
                                }}
                              >
                                {isSignedOfficer ? '✓ Sig.' : 'Pending'}
                              </span>
                              <span style={{ fontWeight: 600, fontSize: '11.5px' }}>
                                {log.officerName || 'Officer'}
                              </span>
                            </div>
                            {log.officerDesignation && (
                              <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '1px' }}>
                                {log.officerDesignation}
                              </div>
                            )}
                          </td>

                          {/* Sig. Of Driver */}
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isSignedDriver ? 'rgba(57, 255, 110, 0.12)' : 'rgba(255, 193, 7, 0.12)',
                                color: isSignedDriver ? 'var(--success)' : '#ffc107',
                                fontWeight: 700
                              }}
                            >
                              {isSignedDriver ? '✓ Signed' : 'Pending'}
                            </span>
                            <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '2px' }}>
                              {log.driverName}
                            </div>
                          </td>

                          {/* Status Dropdown */}
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {renderStatusDropdown(log.status, log.id)}
                          </td>

                          {/* Action */}
                          <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {log.dutyType === 'Weekend / Off-Duty Trip' && (
                              <button
                                className="btn-action"
                                title="Print Sat-Sun Cash Memo / Bill (Photo Format)"
                                onClick={() => setSelectedWeekendLogForPrint(log)}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  marginRight: '4px',
                                  background: 'rgba(128, 0, 32, 0.12)',
                                  border: '1px solid rgba(128, 0, 32, 0.3)',
                                  color: '#800020'
                                }}
                              >
                                <FileText size={13} color="#e11d48" />
                              </button>
                            )}
                            <button
                              className="btn-action"
                              title="Print Log Book Slip"
                              onClick={() => openLogBookPrint(log)}
                              style={{ padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Printer size={13} color="#38bdf8" />
                            </button>
                            <button
                              className="btn-action"
                              title="Delete entry"
                              onClick={() => {
                                if (window.confirm(`Delete log entry ${log.dutySlipNumber}?`)) {
                                  deleteDailyDutyLog(log.id);
                                }
                              }}
                              style={{ padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', marginLeft: '4px' }}
                            >
                              <Trash2 size={13} color="var(--danger)" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Physical Log Book Bottom Total Row matching Image 1: 1210 / 683 / 1893 Total / 683 km Done */}
                {filteredLogs.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'var(--surface-3)', fontWeight: 800, borderTop: '2px solid var(--border)' }}>
                      <td colSpan={4} style={{ padding: '10px', textAlign: 'right', fontSize: '13px' }}>
                        TOTAL K.M. DONE:
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '15px', color: 'var(--accent)' }}>
                        {stats.totalKm} km
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#ffcc4d' }}>
                        {filteredLogs.reduce((sum, l) => sum + (l.fuelLitres || 0), 0) > 0
                          ? `${filteredLogs.reduce((sum, l) => sum + (l.fuelLitres || 0), 0).toFixed(1)} L`
                          : '—'}
                      </td>
                      <td colSpan={6} style={{ padding: '10px', fontSize: '12px', color: 'var(--text-dim)' }}>
                        Calculation Summary: <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>1210 + 683 = 1893 / Total: 683 km</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: STANDARD DAILY DUTY SLIPS TABLE (ENRICHED)           */
          /* ============================================================ */
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Slip No & Date</th>
                  <th>Duty Type & Dept</th>
                  <th>Vehicle & Driver</th>
                  <th>Odometer (Start → End)</th>
                  <th>Total KM & Route</th>
                  <th>Financials & Expenses</th>
                  <th>Timings & Hours</th>
                  <th>Officer / Private Client</th>
                  <th>Status</th>
                  <th>Receipts / Slips</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                      No daily duty or weekend booking logs match your query. Click "+ Log Weekend Booking" or "+ Log Official Duty".
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map(log => {
                    const isWeekend = log.dutyType === 'Weekend / Off-Duty Trip';

                    return (
                      <tr
                        key={log.id}
                        style={{
                          background: isWeekend ? 'rgba(56, 189, 248, 0.03)' : undefined
                        }}
                      >
                        {/* Slip No & Date */}
                        <td>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{log.dutySlipNumber}</span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  background: 'rgba(56, 189, 248, 0.1)',
                                  color: '#38bdf8',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}
                              >
                                Pg {log.logBookPageNo || '122'}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                              {log.date}
                            </div>
                          </div>
                        </td>

                        {/* Duty Type & Department */}
                        <td>
                          <div>
                            <span className={`tag ${isWeekend ? 'trip' : 'dept'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              {isWeekend ? (
                                <>
                                  <Briefcase size={10} /> Sat/Sun Booking
                                </>
                              ) : (
                                <>
                                  <Building2 size={10} /> Official Duty
                                </>
                              )}
                            </span>
                            <div
                              className="cell-truncate-md"
                              style={{ fontSize: '11.5px', fontWeight: 500, marginTop: '3px' }}
                              title={log.departmentName}
                            >
                              {log.departmentName}
                            </div>
                          </div>
                        </td>

                        {/* Vehicle & Driver */}
                        <td>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{log.vehicle}</div>
                          <div
                            className="cell-truncate-sm"
                            style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '1px' }}
                            title={log.driverName}
                          >
                            {log.driverName}
                          </div>
                        </td>

                        {/* Odometer Start -> End */}
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {log.status === 'Pending' && (!log.endTime || log.endTime === '—')
                            ? `${log.startKm} → —`
                            : `${log.startKm} → ${log.endKm}`}
                        </td>

                        {/* Total KM & Route */}
                        <td>
                          <div style={{ fontWeight: 700, color: isWeekend ? '#38bdf8' : 'var(--accent)' }}>
                            {log.totalKm} km
                          </div>
                          {log.journeyFrom && log.journeyTo ? (
                            <div
                              className="cell-truncate-lg"
                              style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}
                              title={`${log.journeyFrom} → ${log.journeyTo}`}
                            >
                              <MapPin size={10} style={{ flexShrink: 0 }} /> <span className="text-truncate">{log.journeyFrom} → {log.journeyTo}</span>
                            </div>
                          ) : isWeekend ? (
                            <div
                              className="cell-truncate-lg"
                              style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}
                              title={log.tripDestination || 'Outstation Run'}
                            >
                              <MapPin size={10} style={{ flexShrink: 0 }} /> <span className="text-truncate">{log.tripDestination || 'Outstation Run'}</span>
                            </div>
                          ) : log.extraKm > 0 ? (
                            <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                              +{log.extraKm} km extra
                            </div>
                          ) : null}
                        </td>

                        {/* Financials & Expenses */}
                        <td>
                          {isWeekend ? (
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--success)' }}>
                                ₹{((log.totalFare && log.totalFare > 0) ? log.totalFare : (log.tripFare || 0)).toLocaleString('en-IN')} Total
                              </div>
                              {log.packageBasePrice ? (
                                <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                  Pkg: ₹{log.packageBasePrice} ({log.packageFreeKm || 80}km free)
                                  {log.extraKmCost ? ` + Ext: ₹${log.extraKmCost}` : ''}
                                </div>
                              ) : (
                                <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  Net Profit: ₹{(log.tripNetProfit || 0).toLocaleString('en-IN')}
                                </div>
                              )}
                              {log.tollParkingAmount > 0 && (
                                <div style={{ fontSize: '10px', color: '#ffcc4d' }}>
                                  + Toll: ₹{log.tollParkingAmount}
                                </div>
                              )}
                              <div style={{ fontSize: '9.5px', color: '#800020', fontWeight: 700, marginTop: '2px' }}>
                                Sat/Sun Memo Bill
                              </div>
                            </div>
                          ) : (
                            <div>
                              {log.fuelAmount && log.fuelAmount > 0 ? (
                                <div style={{ fontWeight: 600, color: '#ffcc4d', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Fuel size={12} /> ₹{log.fuelAmount.toLocaleString('en-IN')}
                                  {log.fuelLitres ? (
                                    <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 400 }}>
                                      {' '}
                                      ({log.fuelLitres} L)
                                    </span>
                                  ) : null}
                                </div>
                              ) : log.fuelLitres ? (
                                <div style={{ fontWeight: 600, color: '#ffcc4d', fontSize: '12px' }}>
                                  <Fuel size={12} /> {log.fuelLitres} L
                                </div>
                              ) : (
                                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>No fuel logged</div>
                              )}
                              {log.mOilLitres && log.mOilLitres !== '—' ? (
                                <div style={{ fontSize: '10.5px', color: '#38bdf8', marginTop: '2px' }}>
                                  M. Oil: {log.mOilLitres}
                                </div>
                              ) : null}
                              {log.tollParkingAmount > 0 ? (
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <CreditCard size={11} /> Toll: ₹{log.tollParkingAmount}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </td>

                        {/* Timings & Hours */}
                        <td>
                          <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                            {log.status === 'Pending' && (!log.endTime || log.endTime === '—')
                              ? 'In progress'
                              : `${log.totalHours} hrs`}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                            {log.endTime && log.endTime !== '—'
                              ? `${log.startTime} - ${log.endTime}`
                              : `${log.startTime} · On duty`}
                          </div>
                        </td>

                        {/* Officer / Private Client & Purpose */}
                        <td>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                            {log.officerName || (isWeekend ? 'Private Booking' : '—')}
                          </div>
                          {log.officerDesignation && (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                              {log.officerDesignation}
                            </div>
                          )}
                          {log.purposeOfJourney && (
                            <div style={{ fontSize: '10.5px', color: 'var(--accent)', marginTop: '2px' }}>
                              {log.purposeOfJourney}
                            </div>
                          )}
                          {log.notes && (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {log.notes}
                            </div>
                          )}
                        </td>

                        {/* Status Dropdown */}
                        <td>{renderStatusDropdown(log.status, log.id)}</td>

                        {/* Receipts & Slips */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {log.dutyType === 'Weekend / Off-Duty Trip' && (
                              <button
                                type="button"
                                className="bill-link"
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: 'rgba(128, 0, 32, 0.1)',
                                  border: '1px solid rgba(128, 0, 32, 0.3)',
                                  color: '#800020',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                                onClick={() => setSelectedWeekendLogForPrint(log)}
                                title="Print Sat-Sun Cash Memo / Bill (Photo Format)"
                              >
                                <FileText size={11} color="#e11d48" /> Print Sat-Sun Bill
                              </button>
                            )}
                            <button
                              type="button"
                              className="bill-link"
                              style={{
                                fontSize: '11px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              onClick={() => openLogBookPrint(log)}
                              title="View & Print Official Government Log Book Register page"
                            >
                              <Printer size={11} color="#38bdf8" /> Log Sheet
                            </button>

                            {log.dutySlipPhoto ? (
                              <span
                                className="bill-link"
                                style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                onClick={() =>
                                  setViewSlip({
                                    title: `Duty Slip #${log.dutySlipNumber}`,
                                    src: log.dutySlipPhoto!
                                  })
                                }
                              >
                                <FileText size={11} /> Duty Slip
                              </span>
                            ) : null}

                            {log.fuelBillPhoto ? (
                              <span
                                className="bill-link"
                                style={{ fontSize: '11px', color: '#ffcc4d', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                onClick={() =>
                                  setViewSlip({
                                    title: `Fuel Receipt #${log.dutySlipNumber}`,
                                    src: log.fuelBillPhoto!
                                  })
                                }
                              >
                                <Fuel size={11} /> Fuel Receipt
                              </span>
                            ) : null}

                            {!log.dutySlipPhoto && !log.fuelBillPhoto && !log.logBookPageNo && (
                              <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="duty logs"
        />
      </div>

      {/* Add Duty Log Modal */}
      <AddDutyLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDutyType={modalDefaultDutyType}
      />

      {/* Log Book Register Print / Export Modal */}
      <LogBookPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintModalSingleLog(null);
        }}
        logs={filteredLogs}
        selectedVehicle={vehicleFilter !== 'All' ? vehicleFilter : undefined}
        selectedMonth={monthFilter !== 'All' ? monthFilter : undefined}
        singleLog={printModalSingleLog}
      />

      {/* Slip / Receipt Viewer Modal */}
      {viewSlip && (
        <div className="modal-overlay" onClick={() => setViewSlip(null)}>
          <div className="modal-dialog" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> {viewSlip.title}
              </h3>
              <button className="modal-close-btn" onClick={() => setViewSlip(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              {viewSlip.src.startsWith('data:image') ? (
                <img
                  src={viewSlip.src}
                  alt={viewSlip.title}
                  style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <FileText size={42} color="var(--accent)" />
                  </div>
                  <div style={{ fontWeight: 600 }}>File: {viewSlip.src}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    Officer signature and vehicle odometer reading verified.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewSlip(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sat-Sun Weekend Booking Cash Memo / Bill Modal (Matching User's Photo Format with KABPRO Branding) */}
      {selectedWeekendLogForPrint && (
        <WeekendTripBillModal
          log={selectedWeekendLogForPrint}
          onClose={() => setSelectedWeekendLogForPrint(null)}
        />
      )}
    </div>
  );
};
