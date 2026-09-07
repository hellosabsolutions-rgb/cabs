import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { WeekendTripBillModal } from './WeekendTripBillModal';
import { AddDutyLogModal } from './AddDutyLogModal';
import { DailyDutyLog, MonthlyDepartmentBill } from '../../../types/fleet';
import {
  Briefcase,
  Plus,
  Calendar,
  FileText,
  CheckCircle2,
  MapPin,
  Fuel,
  CreditCard,
  Printer,
  ChevronDown,
  Building2,
  Clock,
  Trash2,
  Search,
  Receipt
} from 'lucide-react';
import { MonthPicker } from '../../common/MonthPicker';

export const WeekendBillingView: React.FC = () => {
  const {
    dailyDutyLogs,
    monthlyBills,
    departmentContracts,
    searchQuery,
    deleteDailyDutyLog,
    updateDailyDutyLogStatus,
    updateBillStatus,
    addMonthlyBill,
    generateWeekendMemoBill
  } = useFleet();

  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'logs' | 'bills'>('logs');

  // Modal states
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [selectedLogForBill, setSelectedLogForBill] = useState<DailyDutyLog | null>(null);
  const [selectedBillForPreview, setSelectedBillForPreview] = useState<MonthlyDepartmentBill | null>(null);

  // All weekend duty logs
  const weekendLogs = useMemo(() => {
    return dailyDutyLogs.filter(l => l.dutyType === 'Weekend / Off-Duty Trip');
  }, [dailyDutyLogs]);

  // All weekend bills (either billType === 'Weekend / Off-Duty Cash Memo' or linked from weekend logs)
  const weekendBills = useMemo(() => {
    return monthlyBills.filter(b => b.billType === 'Weekend / Off-Duty Cash Memo' || b.billNumber === '3454');
  }, [monthlyBills]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const list = new Set<string>();
    weekendLogs.forEach(l => list.add(l.departmentName));
    weekendBills.forEach(b => list.add(b.departmentName));
    return Array.from(list).filter(Boolean);
  }, [weekendLogs, weekendBills]);

  // Unique vehicles for filter
  const vehicles = useMemo(() => {
    const list = new Set<string>();
    weekendLogs.forEach(l => list.add(l.vehicle));
    weekendBills.forEach(b => list.add(b.vehicle));
    return Array.from(list).filter(Boolean);
  }, [weekendLogs, weekendBills]);

  // Filtered weekend logs
  const filteredLogs = useMemo(() => {
    return weekendLogs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        log.departmentName.toLowerCase().includes(q) ||
        log.dutySlipNumber.toLowerCase().includes(q) ||
        log.vehicle.toLowerCase().includes(q) ||
        log.driverName.toLowerCase().includes(q) ||
        (log.tripDestination && log.tripDestination.toLowerCase().includes(q));

      const matchDept = deptFilter === 'All' || log.departmentName === deptFilter;
      const matchVehicle = vehicleFilter === 'All' || log.vehicle === vehicleFilter;
      const matchMonth = monthFilter === 'All' || (log.month || 'August 2026') === monthFilter;
      const matchStatus = billingStatusFilter === 'All' || (log.billingStatus || 'Unbilled') === billingStatusFilter;

      return matchSearch && matchDept && matchVehicle && matchMonth && matchStatus;
    });
  }, [weekendLogs, searchQuery, deptFilter, vehicleFilter, monthFilter, billingStatusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    let totalKm = 0;
    let totalRevenue = 0;
    let totalBilledCount = 0;
    let totalUnbilledCount = 0;
    let totalGst = 0;

    weekendLogs.forEach(l => {
      totalKm += l.totalKm || 0;
      const fare = (l.totalFare && l.totalFare > 0) ? l.totalFare : (l.tripFare || 0);
      totalRevenue += fare;
      totalGst += l.gstAmount || 0;
      if (l.billingStatus === 'Billed' || l.billingStatus === 'Paid') {
        totalBilledCount++;
      } else {
        totalUnbilledCount++;
      }
    });

    return {
      totalTrips: weekendLogs.length,
      totalKm,
      totalRevenue,
      totalBilledCount,
      totalUnbilledCount,
      totalGst
    };
  }, [weekendLogs]);

  const formatINR = (num: number) => '₹' + Math.round(num).toLocaleString('en-IN');

  // Convert weekend duty log directly to official Cash Memo bill via dedicated API
  const handleGenerateCashMemoBill = async (log: DailyDutyLog) => {
    await generateWeekendMemoBill(log.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Explaining Sat-Sun Off-Duty Billing Rule */}
      <div
        className="panel"
        style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, rgba(128, 0, 32, 0.08), rgba(225, 29, 72, 0.04))',
          border: '1.5px solid rgba(128, 0, 32, 0.25)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: '#800020',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Briefcase size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#800020' }}>
              Sat-Sun / Off-Duty Weekend Trip Billing & Register (Cash Memo System)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Fix Package (e.g. <strong>₹2,255/day with 80 KM Free Fuel Included</strong>) + Extra KM charge (@ <strong>₹14/km</strong>) + FASTag Toll actuals + 5% GST. Excluded from monthly tender rent.
            </div>
          </div>
        </div>

        <button
          className="btn-primary-action"
          onClick={() => setIsAddLogOpen(true)}
          style={{
            background: '#800020',
            borderColor: '#800020',
            fontSize: '12.5px',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(128, 0, 32, 0.25)'
          }}
        >
          <Plus size={15} /> + Log Weekend Sat/Sun Duty
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard label="Weekend Bookings Done" value={`${stats.totalTrips} Trips`} customColor="#800020" />
        <StatCard label="Total KM Logged" value={`${stats.totalKm} KM`} />
        <StatCard label="Total Weekend Billing" value={formatINR(stats.totalRevenue)} customColor="var(--success)" />
        <StatCard label="Total GST Collected" value={formatINR(stats.totalGst)} customColor="#f59e0b" />
        <StatCard label="Cash Memos Issued" value={`${stats.totalBilledCount} Billed`} />
      </div>

      {/* Main Toolbar & View Switcher */}
      <div
        className="panel"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`subtab-btn ${viewMode === 'logs' ? 'active' : ''}`}
            onClick={() => setViewMode('logs')}
            style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Briefcase size={14} />
            Sat-Sun Duty Log Register ({weekendLogs.length})
          </button>
          <button
            className={`subtab-btn ${viewMode === 'bills' ? 'active' : ''}`}
            onClick={() => setViewMode('bills')}
            style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Receipt size={14} />
            Generated Cash Memos ({weekendBills.length})
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

          {/* Vehicle Filter */}
          <select
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            value={vehicleFilter}
            onChange={e => setVehicleFilter(e.target.value)}
          >
            <option value="All">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          {/* Billing Status Filter (when viewing logs) */}
          {viewMode === 'logs' && (
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={billingStatusFilter}
              onChange={e => setBillingStatusFilter(e.target.value)}
            >
              <option value="All">All Billing Status</option>
              <option value="Unbilled">Unbilled</option>
              <option value="Billed">Billed (Cash Memo)</option>
              <option value="Paid">Paid</option>
            </select>
          )}
        </div>
      </div>

      {/* VIEW 1: SAT-SUN LOG REGISTER */}
      {viewMode === 'logs' && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Slip / Memo No & Date</th>
                  <th>Department & Client</th>
                  <th>Vehicle & Driver</th>
                  <th>Route & Journey</th>
                  <th style={{ textAlign: 'right' }}>Total KM & Free</th>
                  <th style={{ textAlign: 'right' }}>Extra KM (@ Rate)</th>
                  <th style={{ textAlign: 'right' }}>Fare Breakdown</th>
                  <th style={{ textAlign: 'right' }}>Grand Total (GST Inc)</th>
                  <th style={{ textAlign: 'center' }}>Bill Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                      No weekend duty logs found. Click "+ Log Weekend Sat/Sun Duty" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const basePrice = Number(log.packageBasePrice) || 2255;
                    const freeKm = Number(log.packageFreeKm) || 80;
                    const totalKm = Number(log.totalKm) || Math.max(0, (log.endKm || 0) - (log.startKm || 0));
                    const extraKm = Math.max(0, totalKm - freeKm);
                    const extraRate = Number(log.extraKmRate) || 14;
                    const extraCost = log.extraKmCost ?? (extraKm * extraRate);
                    const toll = Number(log.tollParkingAmount) || 0;
                    const grandTotal = (log.totalFare && log.totalFare > 0) ? log.totalFare : (log.tripFare || (basePrice + extraCost + toll));
                    const isBilled = log.billingStatus === 'Billed' || log.billingStatus === 'Paid';

                    return (
                      <tr key={log.id} style={{ background: 'rgba(128, 0, 32, 0.015)' }}>
                        {/* Slip No & Date */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#800020', fontSize: '13px' }}>
                            #{log.dutySlipNumber}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={11} /> {log.date}
                          </div>
                        </td>

                        {/* Dept & Client */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '12.5px' }}>
                            {log.departmentName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {log.officerName || 'Private / Department Guest'}
                          </div>
                        </td>

                        {/* Vehicle & Driver */}
                        <td>
                          <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '12.5px' }}>
                            {log.vehicle}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {log.driverName}
                          </div>
                        </td>

                        {/* Route & Journey */}
                        <td>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                            {log.journeyFrom} → {log.journeyTo || log.tripDestination}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                            Odo: {log.startKm} → {log.endKm}
                          </div>
                        </td>

                        {/* Total KM & Free */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                            {totalKm} KM
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                            Less {freeKm} KM Free
                          </div>
                        </td>

                        {/* Extra KM */}
                        <td style={{ textAlign: 'right' }}>
                          {extraKm > 0 ? (
                            <div>
                              <div style={{ fontWeight: 700, color: '#ea580c', fontSize: '12.5px' }}>
                                +{extraKm} KM
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                                @ ₹{extraRate}/KM = {formatINR(extraCost)}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--success)', fontSize: '11.5px', fontWeight: 600 }}>Within Free Limit</span>
                          )}
                        </td>

                        {/* Fare Breakdown */}
                        <td style={{ textAlign: 'right', fontSize: '11.5px', color: 'var(--text-dim)' }}>
                          <div>Base: <strong>₹{basePrice}</strong></div>
                          {toll > 0 && <div style={{ color: '#ffcc4d' }}>Toll: ₹{toll}</div>}
                          <div style={{ color: 'var(--text-faint)' }}>GST: {log.gstRate || 5}% ({formatINR(log.gstAmount || 0)})</div>
                        </td>

                        {/* Grand Total */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, fontSize: '14px', color: '#800020' }}>
                            {formatINR(grandTotal)}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 600 }}>
                            Net: +₹{(log.tripNetProfit || 2450).toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Billing Status */}
                        <td style={{ textAlign: 'center' }}>
                          {isBilled ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(57, 255, 110, 0.12)',
                                color: 'var(--success)',
                                border: '1px solid rgba(57, 255, 110, 0.3)',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              <CheckCircle2 size={11} /> Billed (#{log.weekendBillNumber || log.dutySlipNumber})
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(255, 193, 7, 0.12)',
                                color: '#ffc107',
                                border: '1px solid rgba(255, 193, 7, 0.3)',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              Unbilled
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {/* Print Official Cash Memo */}
                            <button
                              type="button"
                              className="btn-action"
                              title="Print Cash Memo / Bill (Photo Format)"
                              onClick={() => setSelectedLogForBill(log)}
                              style={{
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                background: 'rgba(128, 0, 32, 0.1)',
                                border: '1px solid rgba(128, 0, 32, 0.3)',
                                color: '#800020',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Printer size={13} color="#800020" /> Print Cash Memo
                            </button>

                            {/* Create Invoice in Invoices Ledger if unbilled */}
                            {!isBilled && (
                              <button
                                type="button"
                                className="btn-action"
                                title="Issue Official Cash Memo Bill"
                                onClick={() => handleGenerateCashMemoBill(log)}
                                style={{
                                  padding: '5px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background: 'rgba(22, 135, 245, 0.1)',
                                  border: '1px solid rgba(22, 135, 245, 0.3)',
                                  color: 'var(--accent)',
                                  borderRadius: '5px',
                                  cursor: 'pointer'
                                }}
                              >
                                + Bill Now
                              </button>
                            )}

                            {/* Delete log entry */}
                            <button
                              type="button"
                              className="btn-action"
                              title="Delete log entry"
                              onClick={() => {
                                if (window.confirm(`Delete weekend log #${log.dutySlipNumber}?`)) {
                                  deleteDailyDutyLog(log.id);
                                }
                              }}
                              style={{ padding: '5px 7px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} color="var(--danger)" />
                            </button>
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
      )}

      {/* VIEW 2: GENERATED CASH MEMOS / BILLS TABLE */}
      {viewMode === 'bills' && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Memo No & Date</th>
                  <th>Department / Client</th>
                  <th>Vehicle</th>
                  <th>Route Journey</th>
                  <th style={{ textAlign: 'right' }}>Base (Free KM)</th>
                  <th style={{ textAlign: 'right' }}>Extra KM Cost</th>
                  <th style={{ textAlign: 'right' }}>GST ({5}%)</th>
                  <th style={{ textAlign: 'right' }}>Total Memo Bill</th>
                  <th style={{ textAlign: 'center' }}>Payment Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {weekendBills.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                      No weekend cash memo bills found. Click "+ Bill Now" on any weekend duty log.
                    </td>
                  </tr>
                ) : (
                  weekendBills.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#800020', fontSize: '13px' }}>
                          #{b.billNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {b.dutyStartDate || b.billingMonth}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '12.5px' }}>
                          {b.departmentName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Party GSTN: {b.partyGstin || '05AAAGB1234F1Z5'}
                        </div>
                      </td>

                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                        {b.vehicle}
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                          {b.journeyFrom || 'D.Dun'} → {b.journeyTo || 'Vikasnagar'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                          Total: {b.totalKmRun || 169} KM
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>{formatINR(b.baseContractAmount || 2255)}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{b.packageFreeKm || 80} KM Free</div>
                      </td>

                      <td style={{ textAlign: 'right', color: '#ea580c', fontWeight: 600 }}>
                        {formatINR(b.extraKmCost || 0)}
                      </td>

                      <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>
                        {formatINR(b.gstAmount || 0)}
                        <div style={{ fontSize: '9.5px', color: 'var(--text-faint)' }}>CGST+SGST</div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '14.5px', color: '#800020' }}>
                          {formatINR(b.totalBill)}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: b.status === 'Paid' ? 'rgba(57, 255, 110, 0.12)' : 'rgba(255, 193, 7, 0.12)',
                            color: b.status === 'Paid' ? 'var(--success)' : '#ffc107',
                            border: `1px solid ${b.status === 'Paid' ? 'rgba(57, 255, 110, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          ● {b.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-action"
                          title="Print Cash Memo Bill (Photo Format)"
                          onClick={() => setSelectedBillForPreview(b)}
                          style={{
                            padding: '5px 12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: 'rgba(128, 0, 32, 0.1)',
                            border: '1px solid rgba(128, 0, 32, 0.3)',
                            color: '#800020',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Printer size={13} color="#800020" /> Print Bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Sat-Sun Duty Log Modal */}
      <AddDutyLogModal
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        defaultDutyType="Weekend / Off-Duty Trip"
      />

      {/* Weekend Trip Bill Modal (from log) */}
      {selectedLogForBill && (
        <WeekendTripBillModal
          log={selectedLogForBill}
          onClose={() => setSelectedLogForBill(null)}
        />
      )}

      {/* Weekend Trip Bill Modal (from bill) */}
      {selectedBillForPreview && (
        <WeekendTripBillModal
          bill={selectedBillForPreview}
          onClose={() => setSelectedBillForPreview(null)}
        />
      )}
    </div>
  );
};
