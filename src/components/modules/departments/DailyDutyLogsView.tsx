import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDutyLogModal } from './AddDutyLogModal';
import { DailyDutyLog } from '../../../types/fleet';
import { Building2, Briefcase, Plus, Calendar, FileText, CheckCircle2, MapPin, Fuel, CreditCard } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const DailyDutyLogsView: React.FC = () => {
  const { dailyDutyLogs, updateDailyDutyLogStatus, searchQuery, isLoading } = useFleet();

  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [dutyCategoryFilter, setDutyCategoryFilter] = useState<'All' | 'Official' | 'Weekend'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultDutyType, setModalDefaultDutyType] = useState<
    'Official Department Duty' | 'Weekend / Off-Duty Trip'
  >('Official Department Duty');
  const [viewSlip, setViewSlip] = useState<{ title: string; src: string } | null>(null);

  const filteredLogs = useMemo(() => {
    return dailyDutyLogs.filter(log => {
      const matchSearch =
        log.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.dutySlipNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.tripDestination && log.tripDestination.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.officerName && log.officerName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept = deptFilter === 'All' || log.departmentName === deptFilter;
      const matchStatus = statusFilter === 'All' || log.status === statusFilter;

      const isWeekendTrip = log.dutyType === 'Weekend / Off-Duty Trip';
      const matchCategory =
        dutyCategoryFilter === 'All' ||
        (dutyCategoryFilter === 'Weekend' && isWeekendTrip) ||
        (dutyCategoryFilter === 'Official' && !isWeekendTrip);

      return matchSearch && matchDept && matchStatus && matchCategory;
    });
  }, [dailyDutyLogs, searchQuery, deptFilter, statusFilter, dutyCategoryFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    let totalKm = 0;
    let extraKm = 0;
    let totalHours = 0;
    let totalToll = 0;
    let totalFuel = 0;
    let weekendTripsCount = 0;
    let weekendTripProfit = 0;

    dailyDutyLogs.forEach(l => {
      totalKm += l.totalKm;
      extraKm += l.extraKm;
      totalHours += l.totalHours;
      totalToll += l.tollParkingAmount;
      totalFuel += l.fuelAmount || 0;
      if (l.dutyType === 'Weekend / Off-Duty Trip') {
        weekendTripsCount++;
        weekendTripProfit += l.tripNetProfit || 0;
      }
    });

    return {
      totalSlips: dailyDutyLogs.length,
      totalKm,
      extraKm,
      totalHours: totalHours.toFixed(1),
      totalToll,
      totalFuel,
      weekendTripsCount,
      weekendTripProfit
    };
  }, [dailyDutyLogs]);

  // Unique departments for filter
  const departments = useMemo(() => {
    return Array.from(new Set(dailyDutyLogs.map(l => l.departmentName)));
  }, [dailyDutyLogs]);

  const handleOpenModal = (type: 'Official Department Duty' | 'Weekend / Off-Duty Trip') => {
    setModalDefaultDutyType(type);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: DailyDutyLog['status'], id: string) => {
    const handleToggle = () => {
      if (status === 'Approved') updateDailyDutyLogStatus(id, 'Pending');
      else if (status === 'Pending') updateDailyDutyLogStatus(id, 'Rejected');
      else updateDailyDutyLogStatus(id, 'Approved');
    };

    switch (status) {
      case 'Approved':
        return (
          <span
            className="status-chip running"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={handleToggle}
          >
            ● Approved
          </span>
        );
      case 'Pending':
        return (
          <span
            className="status-chip idle"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={handleToggle}
          >
            ● Pending
          </span>
        );
      case 'Rejected':
        return (
          <span
            className="status-chip maintenance"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={handleToggle}
          >
            ● Rejected
          </span>
        );
    }
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
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Duty & Trip Slips" value={stats.totalSlips} />
        <StatCard label="Total Kilometres Run" value={`${stats.totalKm.toLocaleString('en-IN')} km`} />
        <StatCard
          label="Sat / Sun Weekend Trips Done"
          value={`${stats.weekendTripsCount} Trips`}
          customColor="#38bdf8"
        />
        <StatCard
          label="Weekend Private Profit (Munafa)"
          value={`₹${stats.weekendTripProfit.toLocaleString('en-IN')}`}
          customColor="#39ff6e"
        />
      </div>

      {/* Main Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Daily Duty Slips & Weekend Trip Logs</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredLogs.length} logs)
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
              <Briefcase size={13} /> Sat/Sun Trips ({stats.weekendTripsCount})
            </button>

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
              title="Record commercial outstation trip taken by department car on Saturday or Sunday"
            >
              <Briefcase size={13} /> + Log Weekend Trip (Sat/Sun)
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
                <th>Status (Toggle)</th>
                <th>Receipts / Slips</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No daily duty or weekend trip logs match your query. Click "+ Log Weekend Trip" or "+ Log Official Duty".
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
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                            {log.dutySlipNumber}
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
                                <Briefcase size={10} /> Sat/Sun Trip
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
                        {isWeekend ? (
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
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#39ff6e' }}>
                              +₹{(log.tripNetProfit || 0).toLocaleString('en-IN')} Munafa
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
                            ) : (
                              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>No fuel logged</div>
                            )}
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

                      {/* Officer / Private Client */}
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                          {log.officerName || (isWeekend ? 'Private Booking' : '—')}
                        </div>
                        {log.notes && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {log.notes}
                          </div>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td>{getStatusBadge(log.status, log.id)}</td>

                      {/* Receipts & Slips */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                          {!log.dutySlipPhoto && !log.fuelBillPhoto && (
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
      </div>

      {/* Add Duty Log Modal */}
      <AddDutyLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDutyType={modalDefaultDutyType}
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
