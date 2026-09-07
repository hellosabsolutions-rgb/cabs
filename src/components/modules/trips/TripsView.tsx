import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddTripModal } from './AddTripModal';
import { CompleteTripModal } from './CompleteTripModal';
import { TripFinancial, TripStatus } from '../../../types/fleet';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import { Navigation, Plus, CheckCircle2, Clock, MapPin, Gauge, Fuel, CreditCard, User, TrendingUp, RotateCcw, ArrowRight, Building2, ChevronDown } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const TripsView: React.FC = () => {
  const { trips, updateTripStatus, searchQuery, isLoading } = useFleet();

  const [statusFilter, setStatusFilter] = useState<'All' | 'Ongoing' | 'Completed' | 'Dept-Weekend'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState<TripFinancial | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const matchSearch =
        t.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.tripNumber && t.tripNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.departmentName && t.departmentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.customerName && t.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Dept-Weekend'
          ? Boolean(t.isDepartmentVehicle || t.weekendDutyType)
          : t.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [trips, searchQuery, statusFilter]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedTrips
  } = usePagination(filteredTrips, 10);

  const ongoingCount = trips.filter(t => t.status === 'Ongoing').length;
  const completedCount = trips.filter(t => t.status === 'Completed').length;
  const deptWeekendCount = trips.filter(t => t.isDepartmentVehicle || t.weekendDutyType).length;

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalFuel = 0;
    let totalFastag = 0;
    let totalDriver = 0;
    let totalProfit = 0;

    trips.forEach(t => {
      totalRevenue += t.revenue;
      totalFuel += t.fuelCost;
      totalFastag += t.fastagCost;
      totalDriver += t.driverBata;
      totalProfit += t.profit;
    });

    const totalExpenses = totalFuel + totalFastag + totalDriver;
    const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%';

    return {
      totalRevenue,
      totalFuel,
      totalFastag,
      totalDriver,
      totalExpenses,
      totalProfit,
      avgMargin
    };
  }, [trips]);

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={6} columns={7} />
      </div>
    );
  }

  const renderStatusDropdown = (trip: TripFinancial) => {
    const getStatusStyle = (s: TripFinancial['status']) => {
      switch (s) {
        case 'Completed':
          return {
            background: 'rgba(57, 255, 110, 0.12)',
            color: 'var(--success)',
            borderColor: 'rgba(57, 255, 110, 0.35)'
          };
        case 'Ongoing':
          return {
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            borderColor: 'rgba(56, 189, 248, 0.35)'
          };
        case ('Upcoming' as any):
          return {
            background: 'rgba(255, 193, 7, 0.12)',
            color: '#ffc107',
            borderColor: 'rgba(255, 193, 7, 0.35)'
          };
        case 'Cancelled':
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

    const style = getStatusStyle(trip.status);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={trip.status}
            onChange={e => {
              const newStatus = e.target.value as TripFinancial['status'];
              if (newStatus === 'Completed' && trip.status === 'Ongoing') {
                setCompletingTrip(trip);
              } else {
                updateTripStatus(trip.id, newStatus);
              }
            }}
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
            title="Change trip status"
          >
            <option value="Ongoing" style={{ background: 'var(--surface-1, #1e293b)', color: '#38bdf8' }}>● Ongoing</option>
            <option value="Completed" style={{ background: 'var(--surface-1, #1e293b)', color: 'var(--success)' }}>● Completed</option>
            <option value="Cancelled" style={{ background: 'var(--surface-1, #1e293b)', color: '#ff5c5c' }}>● Cancelled</option>
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
        {trip.status === 'Ongoing' && (
          <button
            className="btn-primary-action"
            style={{ fontSize: '10.5px', padding: '4px 8px', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            onClick={() => setCompletingTrip(trip)}
          >
            <CheckCircle2 size={11} /> Complete & Settle
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <StatCard label="Total Trips Revenue" value={formatINR(stats.totalRevenue)} customColor="var(--accent)" />
        <StatCard label="Total Trip Expenses" value={formatINR(stats.totalExpenses)} customColor="#ff5c5c" />
        <StatCard
          label="Total Net Profit"
          value={formatINR(stats.totalProfit)}
          customColor="var(--accent)"
        />
        <StatCard label="Live Ongoing Trips" value={ongoingCount} customColor="var(--success)" />
      </div>

      {/* Main Trips Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="panel-title">Commercial & Outstation Trips</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredTrips.length} of {trips.length} trips)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Filter Pills for All, Ongoing & Completed */}
            <button
              className={`subtab-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
              style={{ padding: '5px 12px', fontSize: '12px' }}
            >
              All Trips ({trips.length})
            </button>

            <button
              className={`subtab-btn ${statusFilter === 'Ongoing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Ongoing')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                color: ongoingCount > 0 ? 'var(--success)' : undefined
              }}
            >
              ● Ongoing ({ongoingCount})
            </button>

            <button
              className={`subtab-btn ${statusFilter === 'Completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Completed')}
              style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <CheckCircle2 size={13} /> Completed ({completedCount})
            </button>

            <button
              className={`subtab-btn ${statusFilter === 'Dept-Weekend' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Dept-Weekend')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: deptWeekendCount > 0 ? '#38bdf8' : undefined
              }}
            >
              <Building2 size={13} /> Dept Sat/Sun Trips ({deptWeekendCount})
            </button>

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={14} /> Book New Trip
            </button>
          </div>
        </div>

        {/* Trips Table / List */}
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Trip & Type</th>
                <th>Vehicle & Driver</th>
                <th>Route</th>
                <th>Odometer (KM)</th>
                <th>Agreed Fare</th>
                <th>Expenses (Fuel + FASTag + Driver)</th>
                <th>Net Profit</th>
                <th>Status & Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No trips found matching the selected filter. Click "+ Book New Trip" to add one.
                  </td>
                </tr>
              ) : (
                paginatedTrips.map(trip => (
                  <tr key={trip.id}>
                    {/* 1. Trip & Type */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>
                          {trip.tripNumber || `TRIP-${trip.id.slice(-4)}`}
                        </div>
                        <span
                          className={`tag ${trip.tripType === 'Round Trip' ? 'dept' : 'trip'}`}
                          style={{ marginTop: '3px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          {trip.tripType === 'Round Trip' ? (
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
                          {trip.startDate}
                        </div>
                      </div>
                    </td>

                    {/* 2. Vehicle & Driver */}
                    <td>
                      <div style={{ maxWidth: '170px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {trip.vehicle}
                        </div>
                        <div
                          className="cell-truncate-md"
                          style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '1px' }}
                          title={trip.vehicleModel || 'Commercial MPV'}
                        >
                          {trip.vehicleModel || 'Commercial MPV'}
                        </div>
                        <div
                          className="cell-truncate-md"
                          style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}
                          title={`Driver: ${trip.driverName}`}
                        >
                          Driver: <b>{trip.driverName}</b>
                        </div>
                        {(trip.isDepartmentVehicle || trip.weekendDutyType) && (
                          <div
                            className="cell-truncate-md"
                            title={`Dept Sat/Sun Trip (${trip.departmentName || 'Dept Fleet'})`}
                            style={{
                              fontSize: '10px',
                              color: '#38bdf8',
                              fontWeight: 600,
                              marginTop: '3px',
                              background: 'rgba(56, 189, 248, 0.1)',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <Building2 size={10} style={{ flexShrink: 0 }} /> Dept Sat/Sun Trip
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 3. Route */}
                    <td>
                      <div style={{ maxWidth: '200px' }}>
                        <div
                          className="cell-truncate-lg"
                          style={{ fontWeight: 600, color: 'var(--text)', fontSize: '12.5px' }}
                          title={trip.route}
                        >
                          {trip.route}
                        </div>
                        <div
                          className="cell-truncate-md"
                          style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}
                          title={`From: ${trip.pickupLocation}`}
                        >
                          From: {trip.pickupLocation}
                        </div>
                        <div
                          className="cell-truncate-md"
                          style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}
                          title={`To: ${trip.dropLocation}`}
                        >
                          To: {trip.dropLocation}
                        </div>
                      </div>
                    </td>

                    {/* 4. Odometer */}
                    <td>
                      <div>
                        <div style={{ fontSize: '12px' }}>
                          Start: <b>{trip.startOdometer.toLocaleString('en-IN')} km</b>
                        </div>
                        {trip.endOdometer ? (
                          <>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>
                              End: <b>{trip.endOdometer.toLocaleString('en-IN')} km</b>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>
                              Run: {trip.totalKmRun || (trip.endOdometer - trip.startOdometer)} km
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                            Trip in progress
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 5. Trip Fare (Customer Billing) */}
                    <td className="num">
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>
                        {formatINR(trip.revenue)}
                      </div>
                      {trip.customerName && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {trip.customerName}
                        </div>
                      )}
                    </td>

                    {/* 6. Expenses Breakdown: Fuel, FASTag, Driver Bata */}
                    <td>
                      <div style={{ fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Fuel size={12} color="#ffcc4d" /> Fuel:
                          </span>
                          <span style={{ fontWeight: 600, color: '#ffcc4d' }}>{formatINR(trip.fuelCost)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CreditCard size={12} color="#38bdf8" /> FASTag:
                          </span>
                          <span style={{ fontWeight: 600, color: '#38bdf8' }}>{formatINR(trip.fastagCost)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} /> Driver:
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatINR(trip.driverBata)}</span>
                        </div>
                        <div
                          style={{
                            borderTop: '1px solid var(--border-soft)',
                            paddingTop: '2px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: 'var(--danger)',
                            fontWeight: 700
                          }}
                        >
                          <span>Total Exp:</span>
                          <span>-{formatINR(trip.expenses)}</span>
                        </div>
                      </div>
                    </td>

                    {/* 7. COUNT NET PROFIT */}
                    <td className="num">
                      <div>
                        <div
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            color: trip.profit >= 0 ? 'var(--accent)' : 'var(--danger)'
                          }}
                        >
                          {formatINR(trip.profit)}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: trip.profit >= 0 ? 'var(--accent)' : 'var(--danger)',
                            marginTop: '1px'
                          }}
                        >
                          Margin: {trip.margin}
                        </div>
                      </div>
                    </td>

                    {/* 8. Status Dropdown & Action Button */}
                    <td>{renderStatusDropdown(trip)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="trips"
        />
      </div>

      {/* Add Trip Modal */}
      <AddTripModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Complete Trip & Calculate Profit Modal */}
      <CompleteTripModal
        isOpen={!!completingTrip}
        onClose={() => setCompletingTrip(null)}
        trip={completingTrip}
      />
    </div>
  );
};
