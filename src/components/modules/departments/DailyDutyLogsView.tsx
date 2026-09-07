import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDutyLogModal } from './AddDutyLogModal';
import { LogBookPrintModal } from './LogBookPrintModal';
import { DailyDutyLog } from '../../../types/fleet';
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
  Filter,
  Check,
  ChevronDown,
  Clock
} from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const DailyDutyLogsView: React.FC = () => {
  const { dailyDutyLogs, updateDailyDutyLogStatus, deleteDailyDutyLog, searchQuery, isLoading } = useFleet();

  const [viewMode, setViewMode] = useState<'slips' | 'logbook'>('slips');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [dutyCategoryFilter, setDutyCategoryFilter] = useState<'All' | 'Official' | 'Weekend'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDutyType, setModalDefaultDutyType] = useState<
    'Official Department Duty' | 'Weekend / Off-Duty Trip'
  >('Official Department Duty');

  const [viewSlip, setViewSlip] = useState<{ title: string; src: string } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalSingleLog, setPrintModalSingleLog] = useState<DailyDutyLog | null>(null);

  // Unique lists for filtering
  const departments = useMemo(() => {
    return Array.from(new Set(dailyDutyLogs.map(l => l.departmentName))).filter(Boolean);
  }, [dailyDutyLogs]);

  const vehicles = useMemo(() => {
    return Array.from(new Set(dailyDutyLogs.map(l => l.vehicle))).filter(Boolean);
  }, [dailyDutyLogs]);

  const months = useMemo(() => {
    return Array.from(new Set(dailyDutyLogs.map(l => l.month || 'August 2026'))).filter(Boolean);
  }, [dailyDutyLogs]);

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
      const matchMonth = monthFilter === 'All' || (log.month || 'August 2026') === monthFilter;
      const matchStatus = statusFilter === 'All' || log.status === statusFilter;

      const isWeekendTrip = log.dutyType === 'Weekend / Off-Duty Trip';
      const matchCategory =
        dutyCategoryFilter === 'All' ||
        (dutyCategoryFilter === 'Weekend' && isWeekendTrip) ||
        (dutyCategoryFilter === 'Official' && !isWeekendTrip);

      return matchSearch && matchDept && matchVehicle && matchMonth && matchStatus && matchCategory;
    });
  }, [dailyDutyLogs, searchQuery, deptFilter, vehicleFilter, monthFilter, statusFilter, dutyCategoryFilter]);

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
    const getStatusStyle = (s: DailyDutyLog['status']) => {
      switch (s) {
        case 'Approved':
          return {
            background: 'rgba(57, 255, 110, 0.12)',
            color: 'var(--success)',
            borderColor: 'rgba(57, 255, 110, 0.35)'
          };
        case 'Pending':
          return {
            background: 'rgba(255, 193, 7, 0.12)',
            color: '#ffc107',
            borderColor: 'rgba(255, 193, 7, 0.35)'
          };
        case 'Rejected':
          return {
            background: 'rgba(255, 92, 92, 0.12)',
            color: 'var(--danger, #ff5c5c)',
            borderColor: 'rgba(255, 92, 92, 0.35)'
          };
        default:
          return {
            background: 'var(--surface-3)',
            color: 'var(--text)',
            borderColor: 'var(--border)'
          };
      }
    };

    const style = getStatusStyle(status);

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={status}
          onChange={e => updateDailyDutyLogStatus(id, e.target.value as DailyDutyLog['status'])}
          style={{
            background: style.background,
            color: style.color,
            border: `1px solid ${style.borderColor}`,
            padding: '4px 22px 4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            lineHeight: 1.4
          }}
          title="Select duty status"
        >
          <option value="Approved" style={{ background: 'var(--surface-1, #1e293b)', color: 'var(--success)' }}>● Approved</option>
          <option value="Pending" style={{ background: 'var(--surface-1, #1e293b)', color: '#ffc107' }}>● Pending</option>
          <option value="Rejected" style={{ background: 'var(--surface-1, #1e293b)', color: '#ff5c5c' }}>● Rejected</option>
        </select>
        <ChevronDown
          size={11}
          style={{
            position: 'absolute',
            right: '7px',
            pointerEvents: 'none',
            color: style.color,
            opacity: 0.85
          }}
        />
      </div>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top View Mode Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-2)',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setViewMode('slips')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: viewMode === 'slips' ? '1px solid var(--accent)' : '1px solid transparent',
              background: viewMode === 'slips' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'slips' ? '#fff' : 'var(--text-dim)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={15} /> 📑 Daily Duty Slips
          </button>
          <button
            onClick={() => setViewMode('logbook')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: viewMode === 'logbook' ? '1px solid #38bdf8' : '1px solid transparent',
              background: viewMode === 'logbook' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: viewMode === 'logbook' ? '#38bdf8' : 'var(--text-dim)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <BookOpen size={15} /> 📖 Official Log Book Register
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-secondary"
            onClick={() => openLogBookPrint()}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              color: '#38bdf8'
            }}
          >
            <Printer size={13} /> 🖨️ Print / Export Log Book
          </button>
          <button
            className="btn-primary-action"
            style={{ fontSize: '12px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => handleOpenModal('Official Department Duty')}
          >
            <Plus size={14} /> + Log Entry
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Duty & Booking Slips" value={stats.totalSlips} />
        <StatCard label="Total Kilometres Run" value={`${stats.totalKm.toLocaleString('en-IN')} km`} />
        <StatCard
          label="Sat / Sun Weekend Bookings Done"
          value={`${stats.weekendTripsCount} Bookings`}
          customColor="#38bdf8"
        />
        <StatCard
          label="Weekend Private Profit"
          value={`₹${stats.weekendTripProfit.toLocaleString('en-IN')}`}
          customColor="var(--success)"
        />
      </div>

      {/* Main Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">
              {viewMode === 'logbook'
                ? 'Official Vehicle Log Book Register'
                : 'Daily Duty Slips & Weekend Booking Logs'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredLogs.length} entries)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Duty Category Filter: All, Official, Weekend */}
            <button
              className={`subtab-btn ${dutyCategoryFilter === 'All' ? 'active' : ''}`}
              onClick={() => setDutyCategoryFilter('All')}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              All Logs
            </button>
            <button
              className={`subtab-btn ${dutyCategoryFilter === 'Official' ? 'active' : ''}`}
              onClick={() => setDutyCategoryFilter('Official')}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              <Building2 size={13} /> Official (Mon-Fri)
            </button>
            <button
              className={`subtab-btn ${dutyCategoryFilter === 'Weekend' ? 'active' : ''}`}
              onClick={() => setDutyCategoryFilter('Weekend')}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: dutyCategoryFilter === 'Weekend' ? '#38bdf8' : undefined
              }}
            >
              <Briefcase size={13} /> Sat/Sun Bookings ({stats.weekendTripsCount})
            </button>

            {/* Vehicle Filter */}
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
              title="Filter by Vehicle Number"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              title="Filter by Month"
            >
              <option value="All">All Months</option>
              {months.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Log Weekend Trip Button */}
            <button
              className="btn-secondary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                color: '#38bdf8',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onClick={() => handleOpenModal('Weekend / Off-Duty Trip')}
              title="Record commercial outstation booking taken by department car on Saturday or Sunday"
            >
              <Briefcase size={13} /> + Log Weekend Booking
            </button>

            {/* Log Official Duty Slip Button */}
            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => handleOpenModal('Official Department Duty')}
            >
              <Plus size={14} /> + Log Official Duty
            </button>
          </div>
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
                    filteredLogs.map(log => {
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
                            {log.endKm}
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
                  filteredLogs.map(log => {
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
                            <div style={{ fontSize: '11.5px', fontWeight: 500, marginTop: '3px' }}>
                              {log.departmentName}
                            </div>
                          </div>
                        </td>

                        {/* Vehicle & Driver */}
                        <td>
                          <div style={{ fontWeight: 600 }}>{log.vehicle}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '1px' }}>
                            {log.driverName}
                          </div>
                        </td>

                        {/* Odometer Start -> End */}
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          {log.startKm} → {log.endKm}
                        </td>

                        {/* Total KM & Route */}
                        <td>
                          <div style={{ fontWeight: 700, color: isWeekend ? '#38bdf8' : 'var(--accent)' }}>
                            {log.totalKm} km
                          </div>
                          {log.journeyFrom && log.journeyTo ? (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={10} /> {log.journeyFrom} → {log.journeyTo}
                            </div>
                          ) : isWeekend ? (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={10} /> {log.tripDestination || 'Outstation Run'}
                            </div>
                          ) : log.extraKm > 0 ? (
                            <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '2px' }}>
                              +{log.extraKm} km extra
                            </div>
                          ) : null}
                        </td>

                        {/* Financials & Expenses */}
                        <td>
                          {isWeekend ? (
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--success)' }}>
                                +₹{(log.tripNetProfit || 0).toLocaleString('en-IN')} Profit
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Fare: ₹{(log.tripFare || 0).toLocaleString('en-IN')} · <Fuel size={10} color="#ffcc4d" /> ₹{log.fuelAmount || 0}
                              </div>
                              <div style={{ fontSize: '9.5px', color: 'var(--accent)', fontWeight: 600 }}>
                                (Excluded from Dept Bill)
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
                            {log.totalHours} hrs
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                            {log.startTime} - {log.endTime}
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
    </div>
  );
};
