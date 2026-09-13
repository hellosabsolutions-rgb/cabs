import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFleet } from '../../../context/FleetContext';
import {
  RevenueItem,
  RevenueOverviewData,
  RevenueType,
  RevenuePaymentStatus,
  VehicleEconomicsItem
} from '../../../types/revenue';
import { StatCard } from '../../common/StatCard';
import { DatePicker } from '../../common/DatePicker';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import { RevenueTimeSeriesChart } from './RevenueTimeSeriesChart';
import { RevenueDetailModal } from './RevenueDetailModal';
import { AddRevenueModal } from './AddRevenueModal';
import { EditBookingModal } from '../bookings/EditBookingModal';
import { TripFinancial } from '../../../types/fleet';
import {
  IndianRupee,
  Plus,
  Filter,
  Car,
  Calendar,
  Fuel,
  CreditCard,
  UserCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  ChevronRight,
  Layers
} from 'lucide-react';

export const RevenueView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { vehicles, searchQuery, setSearchQuery, bookings, trips } = useFleet();

  // Active Tab: 'overview' | 'trips' | 'departments' | 'vehicles' | 'outstanding' | 'recent'
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'departments' | 'vehicles' | 'outstanding' | 'recent'>('overview');

  // Primary Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom'>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Data & State
  const [revenueData, setRevenueData] = useState<RevenueOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RevenueItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBookingFromRevenue, setEditingBookingFromRevenue] = useState<TripFinancial | null>(null);

  const handleEditBookingFromRevenue = (sourceId: string) => {
    const allBookings = bookings || trips || [];
    const found = allBookings.find(b => b.id === sourceId || b._id === sourceId || b.bookingNumber === sourceId || b.tripNumber === sourceId);
    if (found) {
      setSelectedItem(null);
      setEditingBookingFromRevenue(found);
    }
  };

  // Sync tab and dateFilter from URL search params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'trips', 'departments', 'vehicles', 'outstanding', 'recent'].includes(tab)) {
      setActiveTab(tab as any);
    }
    const dFilter = searchParams.get('dateFilter');
    if (dFilter && ['all', 'today', 'this_week', 'this_month', 'last_month', 'custom'].includes(dFilter)) {
      setDateFilter(dFilter as any);
    }
  }, [searchParams]);

  // Fetch live revenue overview from API
  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);
      if (dateFilter === 'custom') {
        if (customStartDate) params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      }
      if (vehicleFilter !== 'All') params.append('vehicle', vehicleFilter);
      if (deptFilter !== 'All') params.append('department', deptFilter);
      if (typeFilter !== 'All') params.append('type', typeFilter);
      if (statusFilter !== 'All') params.append('paymentStatus', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`http://localhost:5001/api/revenue?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRevenueData(json);
      }
    } catch (err) {
      console.warn('Failed to fetch live revenue data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [dateFilter, customStartDate, customEndDate, vehicleFilter, deptFilter, typeFilter, statusFilter, searchQuery]);

  // Unique customer / department options from live records
  const departmentOptions = useMemo(() => {
    if (!revenueData?.records) return [];
    const set = new Set<string>();
    revenueData.records.forEach(r => {
      if (r.customer && r.customer !== '—') set.add(r.customer);
    });
    return Array.from(set).sort();
  }, [revenueData]);

  const formatINR = (val: number) => '₹' + Math.round(val || 0).toLocaleString('en-IN');

  const summary = revenueData?.summary || {
    totalRevenue: 0,
    tripRevenue: 0,
    deptRevenue: 0,
    otherRevenue: 0,
    totalDirectCost: 0,
    fuelCost: 0,
    driverCost: 0,
    fastagCost: 0,
    totalContribution: 0,
    tripProfit: 0,
    deptProfit: 0,
    margin: 0,
    tripMargin: 0,
    deptMargin: 0,
    collection: { totalReceived: 0, totalPending: 0, totalOverdue: 0 },
    counts: { total: 0, trips: 0, departments: 0, manual: 0, outstanding: 0 }
  };

  // Pagination for Trips
  const {
    currentPage: tripPage,
    setCurrentPage: setTripPage,
    pageSize: tripPageSize,
    setPageSize: setTripPageSize,
    totalItems: tripTotal,
    paginatedItems: paginatedTrips
  } = usePagination(revenueData?.trips || [], 10);

  // Pagination for Departments
  const {
    currentPage: deptPage,
    setCurrentPage: setDeptPage,
    pageSize: deptPageSize,
    setPageSize: setDeptPageSize,
    totalItems: deptTotal,
    paginatedItems: paginatedDepts
  } = usePagination(revenueData?.departments || [], 10);

  // Pagination for Outstanding
  const {
    currentPage: outPage,
    setCurrentPage: setOutPage,
    pageSize: outPageSize,
    setPageSize: setOutPageSize,
    totalItems: outTotal,
    paginatedItems: paginatedOutstanding
  } = usePagination(revenueData?.outstanding || [], 10);

  // Pagination for Recent Revenue
  const {
    currentPage: recPage,
    setCurrentPage: setRecPage,
    pageSize: recPageSize,
    setPageSize: setRecPageSize,
    totalItems: recTotal,
    paginatedItems: paginatedRecent
  } = usePagination(revenueData?.records || [], 15);

  const getStatusChip = (status: RevenuePaymentStatus) => {
    switch (status) {
      case 'Received':
        return <span className="status-chip running" style={{ fontSize: '11px' }}>● Received</span>;
      case 'Partial':
        return <span className="status-chip idle" style={{ fontSize: '11px' }}>● Partial</span>;
      case 'Overdue':
        return <span className="status-chip offline" style={{ fontSize: '11px' }}>● Overdue</span>;
      default:
        return (
          <span className="status-chip" style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            ● Pending
          </span>
        );
    }
  };

  return (
    <div className="section active module-page">
      {/* Top Header Controls: Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
            Revenue Management
          </h2>
          <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--text-faint)' }}>
            Track Booking & Department revenues, attached direct costs, and cash collections
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchRevenueData}
            title="Refresh Revenue"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600 }}
          >
            <Plus size={15} /> Add Revenue
          </button>
        </div>
      </div>

      {/* Primary Filters Toolbar */}
      <div
        className="panel"
        style={{
          padding: '14px 18px',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--surface-1)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          {/* Date Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600, marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> Period:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' }
            ].map(df => (
              <button
                key={df.id}
                type="button"
                className={`subtab-btn ${dateFilter === df.id ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11.5px', height: 'auto' }}
                onClick={() => setDateFilter(df.id as any)}
              >
                {df.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '12px', height: '32px' }}
              placeholder="Search customer, vehicle, ref…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          {/* Custom Date Pickers if selected */}
          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DatePicker value={customStartDate} onChange={setCustomStartDate} />
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>to</span>
              <DatePicker value={customEndDate} onChange={setCustomEndDate} />
            </div>
          )}

          {/* Vehicle Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', fontWeight: 600 }}>Vehicle:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
            >
              <option value="All">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.registrationNumber}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Customer / Department Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', fontWeight: 600 }}>Client:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="All">All Clients / Depts</option>
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Revenue Type Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', fontWeight: 600 }}>Type:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="All">All Revenue Types</option>
              <option value="Trip">Bookings</option>
              <option value="Department">Departments</option>
              <option value="Other">Other Revenue</option>
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', fontWeight: 600 }}>Payment:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Clear Filter Reset Button */}
          {(vehicleFilter !== 'All' || deptFilter !== 'All' || typeFilter !== 'All' || statusFilter !== 'All' || searchQuery) && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11.5px', color: '#ef4444' }}
              onClick={() => {
                setVehicleFilter('All');
                setDeptFilter('All');
                setTypeFilter('All');
                setStatusFilter('All');
                setSearchQuery('');
              }}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Top KPI Cards (Section 4) */}
      <div className="stats-grid">
        <StatCard
          label="Total Revenue"
          value={formatINR(summary.totalRevenue)}
          customColor="var(--accent)"
        />
        <StatCard
          label="Booking Revenue"
          value={formatINR(summary.tripRevenue)}
          customColor="#38bdf8"
        />
        <StatCard
          label="Department Revenue"
          value={formatINR(summary.deptRevenue)}
          customColor="#22c55e"
        />
        <StatCard
          label="Direct Costs (Fuel, Driver, FASTag)"
          value={formatINR(summary.totalDirectCost)}
          customColor="#f59e0b"
        />
        <StatCard
          label={`Activity Profit (${summary.margin}% margin)`}
          value={formatINR(summary.totalContribution)}
          customColor={summary.totalContribution >= 0 ? '#22c55e' : '#ef4444'}
        />
      </div>

      {/* Secondary Collection Metrics Banner (Section 4) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: '10px',
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IndianRupee size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
            Cash Collections:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: '12.5px', color: 'var(--text-faint)' }}>Received:</span>
            <strong style={{ fontSize: '13px', color: '#22c55e' }}>{formatINR(summary.collection.totalReceived)}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
            <span style={{ fontSize: '12.5px', color: 'var(--text-faint)' }}>Pending:</span>
            <strong style={{ fontSize: '13px', color: '#38bdf8' }}>{formatINR(summary.collection.totalPending)}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: '12.5px', color: 'var(--text-faint)' }}>Overdue:</span>
            <strong style={{ fontSize: '13px', color: '#ef4444' }}>{formatINR(summary.collection.totalOverdue)}</strong>
          </div>
        </div>
      </div>

      {/* Subtab Navigation (Section 18) */}
      <div className="subtab-nav" style={{ margin: 0 }}>
        <button
          type="button"
          className={`subtab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('overview');
            setSearchParams(prev => {
              const p = new URLSearchParams(prev);
              p.set('tab', 'overview');
              return p;
            });
          }}
        >
          <TrendingUp size={14} /> Overview & Analytics
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'trips' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('trips');
            setSearchParams(prev => {
              const p = new URLSearchParams(prev);
              p.set('tab', 'trips');
              return p;
            });
          }}
        >
          <Car size={14} /> Bookings ({summary.counts.trips})
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('departments');
            setSearchParams(prev => {
              const p = new URLSearchParams(prev);
              p.set('tab', 'departments');
              return p;
            });
          }}
        >
          <Layers size={14} /> Departments ({summary.counts.departments})
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('vehicles');
            setSearchParams(prev => {
              const p = new URLSearchParams(prev);
              p.set('tab', 'vehicles');
              return p;
            });
          }}
        >
          <Car size={14} /> Vehicle Economics
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'outstanding' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('outstanding');
            setSearchParams(prev => {
              const p = new URLSearchParams(prev);
              p.set('tab', 'outstanding');
              return p;
            });
          }}
        >
          <Clock size={14} /> Outstanding & Collections ({summary.counts.outstanding})
        </button>

        <button
          type="button"
          className={`subtab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('recent');
            setSearchParams(prev => {
              const p = new URLSearchParams(prev);
              p.set('tab', 'recent');
              return p;
            });
          }}
        >
          <CreditCard size={14} /> Recent Revenue Log ({summary.counts.total})
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Time Series Chart */}
          <div className="panel" style={{ padding: '20px', margin: 0 }}>
            <RevenueTimeSeriesChart data={revenueData?.trends || []} />
          </div>

          {/* Direct Cost Distribution breakdown */}
          <div className="grid-2">
            <div className="panel" style={{ padding: '20px', margin: 0 }}>
              <div className="panel-head" style={{ marginBottom: '14px' }}>
                <span className="panel-title">Direct Costs Breakdown</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  Total: {formatINR(summary.totalDirectCost)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                      <Fuel size={14} color="#f59e0b" /> Fuel Cost
                    </span>
                    <strong>{formatINR(summary.fuelCost)}</strong>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '3px',
                        background: '#f59e0b',
                        width: `${summary.totalDirectCost > 0 ? (summary.fuelCost / summary.totalDirectCost) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                      <UserCheck size={14} color="#38bdf8" /> Driver Payment / Bata
                    </span>
                    <strong>{formatINR(summary.driverCost)}</strong>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '3px',
                        background: '#38bdf8',
                        width: `${summary.totalDirectCost > 0 ? (summary.driverCost / summary.totalDirectCost) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)' }}>
                      <CreditCard size={14} color="#a855f7" /> FASTag / Toll Cost
                    </span>
                    <strong>{formatINR(summary.fastagCost)}</strong>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-2)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '3px',
                        background: '#a855f7',
                        width: `${summary.totalDirectCost > 0 ? (summary.fastagCost / summary.totalDirectCost) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Trip vs Department Economics Card */}
            <div className="panel" style={{ padding: '20px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="panel-head" style={{ marginBottom: '14px' }}>
                <span className="panel-title">Activity Revenue Split</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Bookings Profit
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>
                    {formatINR(summary.tripProfit)}
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>
                    Revenue: {formatINR(summary.tripRevenue)} ({summary.tripMargin}% margin)
                  </span>
                </div>

                <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Departments Profit
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#22c55e', margin: '4px 0' }}>
                    {formatINR(summary.deptProfit)}
                  </div>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>
                    Revenue: {formatINR(summary.deptRevenue)} ({summary.deptMargin}% margin)
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '11.5px',
                  color: 'var(--text-faint)'
                }}
              >
                Total Activity Contribution = <strong>{formatINR(summary.totalContribution)}</strong>. Fixed fleet overheads flow to the Profitability module.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TRIPS REVENUE SECTION */}
      {/* ============================================================== */}
      {activeTab === 'trips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Booking Economics Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0.02) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>
                Booking Economics Summary
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8' }}>
                {formatINR(summary.tripRevenue)} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-faint)' }}>Total Booking Revenue</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Fuel Cost</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{formatINR(revenueData?.trips.reduce((acc, t) => acc + t.fuelCost, 0) || 0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Driver Payment</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{formatINR(revenueData?.trips.reduce((acc, t) => acc + t.driverCost, 0) || 0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>FASTag</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{formatINR(revenueData?.trips.reduce((acc, t) => acc + t.fastagCost, 0) || 0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Booking Profit</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e' }}>{formatINR(summary.tripProfit)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Margin</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e' }}>{summary.tripMargin}%</div>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="panel" style={{ margin: 0 }}>
            <div className="panel-head">
              <span className="panel-title">Completed & Active Bookings</span>
              <span className="panel-link">{tripTotal} bookings</span>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Booking / Route</th>
                    <th>Vehicle</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Booking Fare</th>
                    <th>Fuel</th>
                    <th>Driver</th>
                    <th>FASTag</th>
                    <th>Booking Profit</th>
                    <th>Margin</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrips.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                        No bookings found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedTrips.map(t => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedItem(t)}
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                        title="Click to view details and cost breakdown"
                      >
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{t.route || t.referenceNo}</span>
                            <ArrowUpRight size={12} style={{ color: 'var(--text-faint)' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{t.referenceNo}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.vehicle}</td>
                        <td>{t.date}</td>
                        <td>{t.customer}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatINR(t.amount)}</td>
                        <td style={{ color: 'var(--text-faint)' }}>{formatINR(t.fuelCost)}</td>
                        <td style={{ color: 'var(--text-faint)' }}>{formatINR(t.driverCost)}</td>
                        <td style={{ color: 'var(--text-faint)' }}>{formatINR(t.fastagCost)}</td>
                        <td style={{ fontWeight: 700, color: t.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {formatINR(t.profit)}
                        </td>
                        <td style={{ fontWeight: 600, color: t.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {t.margin}%
                        </td>
                        <td>{getStatusChip(t.paymentStatus)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={tripPage}
              totalItems={tripTotal}
              pageSize={tripPageSize}
              onPageChange={setTripPage}
              onPageSizeChange={setTripPageSize}
              itemLabel="bookings"
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DEPARTMENTS REVENUE SECTION */}
      {/* ============================================================== */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Department Economics Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.02) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>
                Department / Contract Revenue Summary
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e' }}>
                {formatINR(summary.deptRevenue)} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-faint)' }}>Total Invoiced</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Fuel Cost</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{formatINR(revenueData?.departments.reduce((acc, d) => acc + d.fuelCost, 0) || 0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Driver Allowance</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{formatINR(revenueData?.departments.reduce((acc, d) => acc + d.driverCost, 0) || 0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Toll / Parking</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{formatINR(revenueData?.departments.reduce((acc, d) => acc + d.fastagCost, 0) || 0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Dept Profit</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e' }}>{formatINR(summary.deptProfit)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Margin</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e' }}>{summary.deptMargin}%</div>
              </div>
            </div>
          </div>

          {/* Departments Table */}
          <div className="panel" style={{ margin: 0 }}>
            <div className="panel-head">
              <span className="panel-title">Department Bills & Invoices</span>
              <span className="panel-link">{deptTotal} invoices</span>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Vehicle</th>
                    <th>Invoice / Month</th>
                    <th>Bill Amount</th>
                    <th>Fuel</th>
                    <th>Driver Allow.</th>
                    <th>Toll / FASTag</th>
                    <th>Direct Profit</th>
                    <th>Margin</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDepts.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                        No department bills found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedDepts.map(d => (
                      <tr
                        key={d.id}
                        onClick={() => setSelectedItem(d)}
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                        title="Click to view invoice details and direct costs"
                      >
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{d.customer}</span>
                            <ArrowUpRight size={12} style={{ color: 'var(--text-faint)' }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{d.vehicle}</td>
                        <td>
                          <div>{d.referenceNo}</div>
                          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{d.billingMonth || d.date}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatINR(d.amount)}</td>
                        <td style={{ color: 'var(--text-faint)' }}>{formatINR(d.fuelCost)}</td>
                        <td style={{ color: 'var(--text-faint)' }}>{formatINR(d.driverCost)}</td>
                        <td style={{ color: 'var(--text-faint)' }}>{formatINR(d.fastagCost)}</td>
                        <td style={{ fontWeight: 700, color: d.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {formatINR(d.profit)}
                        </td>
                        <td style={{ fontWeight: 600, color: d.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {d.margin}%
                        </td>
                        <td>{getStatusChip(d.paymentStatus)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={deptPage}
              totalItems={deptTotal}
              pageSize={deptPageSize}
              onPageChange={setDeptPage}
              onPageSizeChange={setDeptPageSize}
              itemLabel="invoices"
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: VEHICLE-WISE REVENUE (Section 8) */}
      {/* ============================================================== */}
      {activeTab === 'vehicles' && (
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-head">
            <div>
              <span className="panel-title">Vehicle-wise Revenue & Direct Economics</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-faint)' }}>
                Aggregates both booking and department revenue per vehicle. Click any vehicle to filter.
              </p>
            </div>
            <span className="panel-link">{revenueData?.vehicleEconomics.length || 0} vehicles</span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Operations (Bookings / Dept)</th>
                  <th>Gross Revenue</th>
                  <th>Fuel Cost</th>
                  <th>Driver Payment</th>
                  <th>FASTag / Toll</th>
                  <th>Total Direct Cost</th>
                  <th>Direct Profit</th>
                  <th>Profit Margin</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(!revenueData?.vehicleEconomics || revenueData.vehicleEconomics.length === 0) ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                      No vehicle revenue records found.
                    </td>
                  </tr>
                ) : (
                  revenueData.vehicleEconomics.map(v => (
                    <tr key={v.vehicle}>
                      <td style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Car size={15} style={{ color: 'var(--accent)' }} />
                          <span>{v.vehicle}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                          {v.tripCount} bookings • {v.deptCount} contracts
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatINR(v.revenue)}</td>
                      <td>{formatINR(v.fuelCost)}</td>
                      <td>{formatINR(v.driverCost)}</td>
                      <td>{formatINR(v.fastagCost)}</td>
                      <td style={{ fontWeight: 600, color: '#f59e0b' }}>{formatINR(v.directCost)}</td>
                      <td style={{ fontWeight: 700, color: v.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                        {formatINR(v.profit)}
                      </td>
                      <td style={{ fontWeight: 700, color: v.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                        {v.margin}%
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '3px 10px', fontSize: '11.5px' }}
                          onClick={() => {
                            setVehicleFilter(v.vehicle);
                            setActiveTab('overview');
                          }}
                        >
                          Filter by this vehicle
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

      {/* ============================================================== */}
      {/* TAB 5: OUTSTANDING / COLLECTION (Section 9) */}
      {/* ============================================================== */}
      {activeTab === 'outstanding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Outstanding KPI Summary */}
          <div className="stats-grid">
            <StatCard label="Total Invoiced" value={formatINR(summary.totalRevenue)} />
            <StatCard label="Cash Collected" value={formatINR(summary.collection.totalReceived)} customColor="#22c55e" />
            <StatCard label="Pending Receivables" value={formatINR(summary.collection.totalPending)} customColor="#38bdf8" />
            <StatCard label="Overdue Payments" value={formatINR(summary.collection.totalOverdue)} customColor="#ef4444" />
          </div>

          {/* Outstanding Table */}
          <div className="panel" style={{ margin: 0 }}>
            <div className="panel-head">
              <span className="panel-title">Outstanding Receivables Ledger</span>
              <span className="panel-link">{outTotal} pending items</span>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Customer / Department</th>
                    <th>Invoice / Reference #</th>
                    <th>Type</th>
                    <th>Vehicle</th>
                    <th>Total Amount</th>
                    <th>Received Amount</th>
                    <th>Pending Balance</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOutstanding.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                        All payments have been fully collected! No outstanding balance.
                      </td>
                    </tr>
                  ) : (
                    paginatedOutstanding.map(o => (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedItem(o)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view details"
                      >
                        <td style={{ fontWeight: 600 }}>{o.customer}</td>
                        <td>{o.referenceNo}</td>
                        <td>
                          <span className={`tag ${o.type === 'Trip' ? 'trip' : 'dept'}`}>
                            {o.type === 'Trip' ? 'Booking' : o.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{o.vehicle}</td>
                        <td style={{ fontWeight: 700 }}>{formatINR(o.amount)}</td>
                        <td style={{ color: '#22c55e' }}>{formatINR(o.receivedAmount)}</td>
                        <td style={{ fontWeight: 700, color: o.paymentStatus === 'Overdue' ? '#ef4444' : '#f59e0b' }}>
                          {formatINR(o.pendingAmount)}
                        </td>
                        <td>
                          <span style={{ color: o.paymentStatus === 'Overdue' ? '#ef4444' : 'var(--text)' }}>
                            {o.dueDate || o.date}
                          </span>
                        </td>
                        <td>{getStatusChip(o.paymentStatus)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={outPage}
              totalItems={outTotal}
              pageSize={outPageSize}
              onPageChange={setOutPage}
              onPageSizeChange={setOutPageSize}
              itemLabel="outstanding"
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: RECENT REVENUE LOG (Section 10) */}
      {/* ============================================================== */}
      {activeTab === 'recent' && (
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-head">
            <span className="panel-title">All Revenue Entries Ledger</span>
            <span className="panel-link">{recTotal} records</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Customer / Department</th>
                  <th>Vehicle</th>
                  <th>Reference #</th>
                  <th>Gross Amount</th>
                  <th>Received</th>
                  <th>Direct Cost</th>
                  <th>Direct Profit</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecent.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                      No revenue records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRecent.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedItem(r)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view details"
                    >
                      <td>{r.date}</td>
                      <td>
                        <span className={`tag ${r.type === 'Trip' ? 'trip' : r.type === 'Department' ? 'dept' : ''}`}>
                          {r.type === 'Trip' ? 'Booking' : r.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.customer}</td>
                      <td style={{ fontWeight: 600 }}>{r.vehicle}</td>
                      <td>{r.referenceNo}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatINR(r.amount)}</td>
                      <td style={{ color: '#22c55e' }}>{formatINR(r.receivedAmount)}</td>
                      <td style={{ color: 'var(--text-faint)' }}>{formatINR(r.totalDirectCost)}</td>
                      <td style={{ fontWeight: 700, color: r.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                        {formatINR(r.profit)}
                      </td>
                      <td>{getStatusChip(r.paymentStatus)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={recPage}
            totalItems={recTotal}
            pageSize={recPageSize}
            onPageChange={setRecPage}
            onPageSizeChange={setRecPageSize}
            itemLabel="entries"
          />
        </div>
      )}

      {/* Drill-Down Detail Modal */}
      {selectedItem && (
        <RevenueDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEditBooking={handleEditBookingFromRevenue}
        />
      )}

      {/* Edit Booking & Expenses Modal */}
      {editingBookingFromRevenue && (
        <EditBookingModal
          isOpen={!!editingBookingFromRevenue}
          onClose={() => {
            setEditingBookingFromRevenue(null);
            fetchRevenueData();
          }}
          booking={editingBookingFromRevenue}
        />
      )}

      {/* Add Manual Revenue Modal */}
      <AddRevenueModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchRevenueData}
      />
    </div>
  );
};
