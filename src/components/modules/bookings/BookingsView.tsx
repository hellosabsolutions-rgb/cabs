import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddBookingModal } from './AddBookingModal';
import { CompleteBookingModal } from './CompleteBookingModal';
import { CollectPaymentModal } from './CollectPaymentModal';
import { VehicleAvailabilityModal } from './VehicleAvailabilityModal';
import { DatePicker } from '../../common/DatePicker';
import { MonthPicker } from '../../common/MonthPicker';
import { TripFinancial, TripStatus, PaymentStatus } from '../../../types/fleet';
import {
  Navigation,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  IndianRupee,
  RotateCcw,
  ArrowRight,
  Building2,
  Car,
  Filter,
  AlertTriangle,
  CreditCard,
  User,
  Fuel,
  RefreshCw
} from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const BookingsView: React.FC = () => {
  const { bookings, trips, searchQuery, isLoading, fetchLiveBookings, completeTrip } = useFleet();

  // All bookings list
  const bookingList: TripFinancial[] = bookings || trips || [];

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Ongoing' | 'Completed' | 'PendingPayment' | 'Dept-Weekend'>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All'); // 'All' | 'YYYY-MM'
  const [selectedDate, setSelectedDate] = useState<string>(''); // '' for any, or 'YYYY-MM-DD'
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [completingBooking, setCompletingBooking] = useState<TripFinancial | null>(null);
  const [collectingPaymentBooking, setCollectingPaymentBooking] = useState<TripFinancial | null>(null);

  // Prefill state from availability modal
  const [prefillVehicle, setPrefillVehicle] = useState<string | undefined>(undefined);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  // Available unique months from booking dates
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    bookingList.forEach(b => {
      if (b.startDate && b.startDate.length >= 7) {
        months.add(b.startDate.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [bookingList]);

  // Filter logic
  const filteredBookings = useMemo(() => {
    return bookingList.filter(b => {
      // 1. Search Query
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        b.route?.toLowerCase().includes(q) ||
        b.vehicle?.toLowerCase().includes(q) ||
        (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q)) ||
        (b.tripNumber && b.tripNumber.toLowerCase().includes(q)) ||
        b.driverName?.toLowerCase().includes(q) ||
        (b.customerName && b.customerName.toLowerCase().includes(q)) ||
        (b.departmentName && b.departmentName.toLowerCase().includes(q));

      // 2. Month Filter
      const matchMonth =
        selectedMonth === 'All' ||
        (b.startDate && b.startDate.startsWith(selectedMonth));

      // 3. Date / Daily Filter
      const matchDate =
        !selectedDate ||
        b.startDate === selectedDate;

      // 4. Status Filter
      let matchStatus = true;
      if (statusFilter === 'All') {
        matchStatus = true;
      } else if (statusFilter === 'PendingPayment') {
        const total = Number(b.revenue || b.totalAmount || 0);
        const paid = (Number(b.advanceAmount) || 0) + (Number(b.balancePaid) || 0);
        matchStatus = total - paid > 0;
      } else if (statusFilter === 'Dept-Weekend') {
        matchStatus = Boolean(b.isDepartmentVehicle || b.weekendDutyType);
      } else {
        matchStatus = b.status === statusFilter;
      }

      return matchSearch && matchMonth && matchDate && matchStatus;
    });
  }, [bookingList, searchQuery, selectedMonth, selectedDate, statusFilter]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalAdvance = 0;
    let totalBalancePaid = 0;
    let totalPending = 0;
    let totalExpenses = 0;
    let totalProfit = 0;
    let scheduledCount = 0;
    let ongoingCount = 0;
    let completedCount = 0;
    let pendingAccountsCount = 0;

    bookingList.forEach(b => {
      const rev = Number(b.revenue || b.totalAmount || 0);
      const adv = Number(b.advanceAmount || 0);
      const bal = Number(b.balancePaid || 0);
      const pend = Math.max(0, rev - (adv + bal));
      const exp = Number(b.expenses || 0);
      const prof = Number(b.profit || (rev - exp));

      totalRevenue += rev;
      totalAdvance += adv;
      totalBalancePaid += bal;
      totalPending += pend;
      totalExpenses += exp;
      totalProfit += prof;

      if (pend > 0) pendingAccountsCount++;
      if (b.status === 'Scheduled') scheduledCount++;
      else if (b.status === 'Ongoing') ongoingCount++;
      else if (b.status === 'Completed') completedCount++;
    });

    return {
      totalRevenue,
      totalAdvance,
      totalBalancePaid,
      totalCollected: totalAdvance + totalBalancePaid,
      totalPending,
      totalExpenses,
      totalProfit,
      scheduledCount,
      ongoingCount,
      completedCount,
      pendingAccountsCount
    };
  }, [bookingList]);

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={6} columns={8} />
      </div>
    );
  }

  const handleBookSelectedVehicle = (vehicleReg: string, date: string) => {
    setPrefillVehicle(vehicleReg);
    setPrefillDate(date);
    setIsAddModalOpen(true);
  };

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Stat Cards (Revenue, Advance, Pending Payment, Active) */}
      <div className="stats-grid">
        <StatCard
          label="Total Bookings Revenue"
          value={formatINR(stats.totalRevenue)}
          customColor="var(--accent)"
        />
        <StatCard
          label="Advance & Collected"
          value={formatINR(stats.totalCollected)}
          customColor="#38bdf8"
        />
        <StatCard
          label="Pending Payment Due"
          value={formatINR(stats.totalPending)}
          customColor={stats.totalPending > 0 ? '#ffb400' : 'var(--accent)'}
        />
        <StatCard
          label="Active & Scheduled"
          value={`${stats.ongoingCount} Live • ${stats.scheduledCount} Advance`}
          customColor="#39ff6e"
        />
      </div>

      {/* Main Bookings Panel */}
      <div className="panel">
        {/* Panel Header & Global Actions */}
        <div
          className="panel-head"
          style={{
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-soft)',
            paddingBottom: '14px'
          }}
        >
          <div>
            <span className="panel-title" style={{ fontSize: '17px', fontWeight: 800 }}>
              Commercial & Outstation Bookings
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)', marginLeft: '8px' }}>
              ({filteredBookings.length} of {bookingList.length} bookings)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Check Vehicle Availability Button */}
            <button
              className="subtab-btn"
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--accent)',
                borderColor: 'var(--accent)'
              }}
              onClick={() => setIsAvailabilityModalOpen(true)}
            >
              <Car size={14} /> Check Car Availability by Date
            </button>

            {/* Create New Booking Button */}
            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setPrefillVehicle(undefined);
                setPrefillDate(undefined);
                setIsAddModalOpen(true);
              }}
            >
              <Plus size={14} /> Create New Booking
            </button>
          </div>
        </div>

        {/* FILTERS TOOLBAR: Month Filter + Date Filter + Status Pills */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--surface-2)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: '1px solid var(--border-soft)'
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`subtab-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              All ({bookingList.length})
            </button>

            <button
              className={`subtab-btn ${statusFilter === 'Scheduled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Scheduled')}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                color: stats.scheduledCount > 0 ? '#38bdf8' : undefined
              }}
            >
              📅 Advance / Scheduled ({stats.scheduledCount})
            </button>

            <button
              className={`subtab-btn ${statusFilter === 'Ongoing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Ongoing')}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                color: stats.ongoingCount > 0 ? '#39ff6e' : undefined
              }}
            >
              ● Ongoing ({stats.ongoingCount})
            </button>

            <button
              className={`subtab-btn ${statusFilter === 'Completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Completed')}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              ✓ Completed ({stats.completedCount})
            </button>

            <button
              className={`subtab-btn ${statusFilter === 'PendingPayment' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PendingPayment')}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                color: stats.pendingAccountsCount > 0 ? '#ffb400' : undefined
              }}
            >
              ⚠️ Pending Payment ({stats.pendingAccountsCount})
            </button>
          </div>

          {/* Date and Month Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Monthly Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>Month:</span>
              <MonthPicker
                value={selectedMonth}
                onChange={v => { setSelectedMonth(v); setSelectedDate(''); }}
                availableMonths={availableMonths}
                placeholder="All Months"
                align="left"
              />
            </div>

            {/* Daily Date Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>Date:</span>
              <div style={{ width: '165px' }}>
                <DatePicker
                  value={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  placeholder="All Dates"
                  align="right"
                  inputStyle={{ padding: '4px 10px', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Booking # & Dates</th>
                <th>Vehicle & Driver</th>
                <th>Route & Passenger</th>
                <th>Odometer</th>
                <th>Total Fare (Agreed)</th>
                <th>Advance & Pending Balance</th>
                <th>Net Profit</th>
                <th>Status & Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                    No bookings found matching your selected date and status filters. Click "+ Create New Booking" to add one.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const fare = Number(b.revenue || b.totalAmount || 0);
                  const adv = Number(b.advanceAmount || 0);
                  const bal = Number(b.balancePaid || 0);
                  const totalPaid = adv + bal;
                  const pendingDue = Math.max(0, fare - totalPaid);

                  return (
                    <tr key={b.id || b._id}>
                      {/* 1. Booking # & Dates */}
                      <td>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '13px' }}>
                            {b.bookingNumber || b.tripNumber || `BKG-${b.id?.slice(-4)}`}
                          </div>
                          <span
                            className={`tag ${b.tripType === 'Round Trip' ? 'dept' : 'trip'}`}
                            style={{ marginTop: '3px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            {b.tripType === 'Round Trip' ? (
                              <>
                                <RotateCcw size={10} /> Round Trip
                              </>
                            ) : (
                              <>
                                <ArrowRight size={10} /> One-way
                              </>
                            )}
                          </span>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '3px' }}>
                            📅 {b.startDate} {b.startTime && `• ${b.startTime}`}
                          </div>
                          {b.endDate && b.endDate !== b.startDate && (
                            <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                              Till: {b.endDate}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. Vehicle & Driver */}
                      <td>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>
                            {b.vehicle}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '1px' }}>
                            {b.vehicleModel || 'Commercial Vehicle'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Driver: <b>{b.driverName}</b>
                          </div>
                        </div>
                      </td>

                      {/* 3. Route & Passenger */}
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '12.5px' }}>
                            {b.route}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '3px' }}>
                            Client: <b>{b.customerName || 'Customer'}</b>
                          </div>
                          {b.customerPhone && (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                              📞 {b.customerPhone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Odometer */}
                      <td>
                        <div>
                          <div style={{ fontSize: '12px' }}>
                            Start: <b>{b.startOdometer?.toLocaleString('en-IN') || 0} km</b>
                          </div>
                          {b.endOdometer ? (
                            <>
                              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>
                                End: <b>{b.endOdometer.toLocaleString('en-IN')} km</b>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>
                                Run: {b.totalKmRun || (b.endOdometer - b.startOdometer)} km
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                              {b.status === 'Scheduled' ? 'Not started' : 'In progress'}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Total Booking Fare */}
                      <td className="num">
                        <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>
                          {formatINR(fare)}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          Agreed Fare
                        </div>
                      </td>

                      {/* 6. ADVANCE & PENDING PAYMENT BREAKDOWN (User's specific highlight!) */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {/* Advance */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Advance:</span>
                            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                              {formatINR(adv)} {adv > 0 && <span style={{ fontSize: '9.5px', color: 'var(--text-faint)' }}>({b.advancePaymentMode || 'UPI'})</span>}
                            </span>
                          </div>

                          {/* Balance Paid if any */}
                          {bal > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                              <span style={{ color: 'var(--text-dim)' }}>Balance Paid:</span>
                              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatINR(bal)}</span>
                            </div>
                          )}

                          {/* Pending Balance */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '11.5px',
                              borderTop: '1px solid var(--border-soft)',
                              paddingTop: '3px'
                            }}
                          >
                            <span style={{ color: 'var(--text-faint)' }}>Pending Due:</span>
                            <span
                              style={{
                                fontWeight: 800,
                                color: pendingDue > 0 ? '#ffb400' : 'var(--accent)'
                              }}
                            >
                              {pendingDue > 0 ? formatINR(pendingDue) : '✓ Paid Full'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 7. Munafa / Profit */}
                      <td className="num">
                        <div>
                          <div
                            style={{
                              fontSize: '14.5px',
                              fontWeight: 800,
                              color: Number(b.profit) >= 0 ? 'var(--accent)' : 'var(--danger)'
                            }}
                          >
                            {formatINR(Number(b.profit) || 0)}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '1px' }}>
                            Exp: {formatINR(Number(b.expenses) || 0)}
                          </div>
                        </div>
                      </td>

                      {/* 8. Status & Action Button */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                          {b.status === 'Scheduled' && (
                            <>
                              <span
                                className="driver-type-badge"
                                style={{
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38bdf8',
                                  borderColor: 'rgba(56, 189, 248, 0.3)',
                                  fontSize: '10.5px'
                                }}
                              >
                                📅 Advance Booking
                              </span>
                              <button
                                className="btn-primary-action"
                                style={{ fontSize: '11px', padding: '4px 8px', width: '100%', textAlign: 'center' }}
                                onClick={() => setCompletingBooking(b)}
                              >
                                Start / Complete
                              </button>
                            </>
                          )}

                          {b.status === 'Ongoing' && (
                            <>
                              <span
                                className="driver-type-badge"
                                style={{
                                  background: 'rgba(57, 255, 110, 0.15)',
                                  color: '#39ff6e',
                                  borderColor: 'rgba(57, 255, 110, 0.3)',
                                  fontSize: '10.5px'
                                }}
                              >
                                ● Ongoing
                              </span>
                              <button
                                className="btn-primary-action"
                                style={{ fontSize: '11px', padding: '5px 8px', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                onClick={() => setCompletingBooking(b)}
                              >
                                <CheckCircle2 size={12} /> Complete & Settle
                              </button>
                            </>
                          )}

                          {b.status === 'Completed' && (
                            <>
                              <span
                                className="driver-type-badge"
                                style={{
                                  background: 'var(--surface-3)',
                                  color: 'var(--text)',
                                  fontSize: '10.5px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <CheckCircle2 size={11} color="var(--accent)" /> Completed
                              </span>

                              {pendingDue > 0 && (
                                <button
                                  type="button"
                                  className="subtab-btn"
                                  style={{
                                    fontSize: '10.5px',
                                    padding: '3px 8px',
                                    width: '100%',
                                    color: '#ffb400',
                                    borderColor: 'rgba(255, 180, 0, 0.4)'
                                  }}
                                  onClick={() => setCollectingPaymentBooking(b)}
                                >
                                  Collect ₹{pendingDue.toLocaleString('en-IN')}
                                </button>
                              )}
                            </>
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

      {/* Add Booking Modal */}
      <AddBookingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        prefillVehicle={prefillVehicle}
        prefillDate={prefillDate}
      />

      {/* Complete Booking & Payment Settlement Modal */}
      <CompleteBookingModal
        isOpen={!!completingBooking}
        onClose={() => setCompletingBooking(null)}
        trip={completingBooking}
      />

      {/* Record Pending Balance Payment Modal */}
      <CollectPaymentModal
        isOpen={!!collectingPaymentBooking}
        onClose={() => setCollectingPaymentBooking(null)}
        booking={collectingPaymentBooking}
      />

      {/* Vehicle Availability Checker Modal */}
      <VehicleAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        onSelectVehicleForBooking={handleBookSelectedVehicle}
      />
    </div>
  );
};
