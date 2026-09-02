import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDutyLogModal } from './AddDutyLogModal';
import { DailyDutyLog } from '../../../types/fleet';

export const DailyDutyLogsView: React.FC = () => {
  const { dailyDutyLogs, updateDailyDutyLogStatus, searchQuery } = useFleet();

  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewSlip, setViewSlip] = useState<{ title: string; src: string } | null>(null);

  const filteredLogs = useMemo(() => {
    return dailyDutyLogs.filter(log => {
      const matchSearch =
        log.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.dutySlipNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.officerName && log.officerName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept = deptFilter === 'All' || log.departmentName === deptFilter;
      const matchStatus = statusFilter === 'All' || log.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [dailyDutyLogs, searchQuery, deptFilter, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    let totalKm = 0;
    let extraKm = 0;
    let totalHours = 0;
    let totalToll = 0;
    let totalFuel = 0;

    dailyDutyLogs.forEach(l => {
      totalKm += l.totalKm;
      extraKm += l.extraKm;
      totalHours += l.totalHours;
      totalToll += l.tollParkingAmount;
      totalFuel += l.fuelAmount || 0;
    });

    return {
      totalSlips: dailyDutyLogs.length,
      totalKm,
      extraKm,
      totalHours: totalHours.toFixed(1),
      totalToll,
      totalFuel
    };
  }, [dailyDutyLogs]);

  // Unique departments for filter
  const departments = useMemo(() => {
    return Array.from(new Set(dailyDutyLogs.map(l => l.departmentName)));
  }, [dailyDutyLogs]);

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
      default:
        return <span className="status-chip">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Duty Slips" value={stats.totalSlips} customColor="var(--accent)" />
        <StatCard label="Total KM Logged" value={`${stats.totalKm} km`} />
        <StatCard label="Fuel Expense Logged" value={`₹${stats.totalFuel.toLocaleString('en-IN')}`} customColor="#ffcc4d" />
        <StatCard label="Total Duty Hours Logged" value={`${stats.totalHours} hrs`} />
      </div>

      {/* Duty Logs Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Daily Duty Slips & Vehicle Logs</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredLogs.length} slips)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px' }}
              onClick={() => setIsModalOpen(true)}
            >
              + Log Duty Slip
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Slip No & Date</th>
                <th>Department</th>
                <th>Vehicle & Driver</th>
                <th>Odometer (Start → End)</th>
                <th>Total KM (Extra)</th>
                <th>Fuel & Toll Expenses</th>
                <th>Timings & Hours</th>
                <th>Officer / User</th>
                <th>Status (Toggle)</th>
                <th>Receipts / Slips</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No daily duty logs match your query. Click "+ Log Duty Slip" to record one.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{log.dutySlipNumber}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {log.date}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.departmentName}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{log.vehicle}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        {log.driverName}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {log.startKm} → {log.endKm}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        {log.totalKm} km
                      </div>
                      {log.extraKm > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--warning)' }}>
                          +{log.extraKm} km extra
                        </div>
                      )}
                    </td>
                    <td>
                      {log.fuelAmount && log.fuelAmount > 0 ? (
                        <div style={{ fontWeight: 600, color: '#ffcc4d', fontSize: '12px' }}>
                          ⛽ ₹{log.fuelAmount.toLocaleString('en-IN')}
                          {log.fuelLitres ? <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 400 }}> ({log.fuelLitres} L)</span> : null}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>⛽ No fuel logged</div>
                      )}
                      {log.tollParkingAmount > 0 ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          🛣️ Toll: ₹{log.tollParkingAmount}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                        {log.totalHours} hrs
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                        {log.startTime} - {log.endTime}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                        {log.officerName || '—'}
                      </div>
                      {log.notes && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {log.notes}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(log.status, log.id)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {log.dutySlipPhoto && (
                          <span
                            className="bill-link"
                            style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => setViewSlip({ title: 'Signed Duty Slip', src: log.dutySlipPhoto! })}
                          >
                            📄 Duty slip
                          </span>
                        )}
                        {log.fuelBillPhoto && (
                          <span
                            className="bill-link"
                            style={{ fontSize: '11.5px', color: '#ffcc4d', display: 'flex', alignItems: 'center', gap: '3px' }}
                            onClick={() => setViewSlip({ title: 'Fuel Pump Receipt', src: log.fuelBillPhoto! })}
                          >
                            ⛽ Fuel receipt
                          </span>
                        )}
                        {!log.dutySlipPhoto && !log.fuelBillPhoto && (
                          <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Duty Log Modal */}
      <AddDutyLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Slip / Fuel Receipt View Modal */}
      {viewSlip && (
        <div className="modal-overlay" onClick={() => setViewSlip(null)}>
          <div className="modal-dialog" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📄 {viewSlip.title}</h3>
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
                  <div style={{ fontSize: '42px', marginBottom: '10px' }}>
                    {viewSlip.title.includes('Fuel') ? '⛽' : '📑'}
                  </div>
                  <div style={{ fontWeight: 600 }}>File: {viewSlip.src}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    Document verified and archived in fleet records.
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
