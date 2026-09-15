import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RevenueItem, RevenueOverviewData } from '../../../types/revenue';
import { MaintenanceRecord } from '../../../types/fleet';
import { StatCard } from '../../common/StatCard';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import { RevenueDetailModal } from '../revenue/RevenueDetailModal';
import { X,
  ArrowLeft,
  ArrowUpRight,
  Search,
  Download,
  Car,
  Layers,
  Wrench,
  Fuel,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface PnLLedgerViewProps {
  ledgerType: 'bookings' | 'departments' | 'overheads';
  onBack: () => void;
  onChangeLedgerType: (type: 'bookings' | 'departments' | 'overheads') => void;
  revenueData: RevenueOverviewData | null;
  maintenanceRecords: MaintenanceRecord[];
  expenses: any[];
  metrics: {
    tripRevenue: number;
    tripFuel: number;
    tripDriver: number;
    tripFastag: number;
    tripDirectCost: number;
    tripProfit: number;
    tripMargin: number;

    deptRevenue: number;
    deptFuel: number;
    deptDriver: number;
    deptTolls: number;
    deptDirectCost: number;
    deptProfit: number;
    deptMargin: number;

    maintenanceCost: number;
    generalCost: number;
    otherOverhead: number;
    commonExpenses: number;
  };
}

export const PnLLedgerView: React.FC<PnLLedgerViewProps> = ({
  ledgerType,
  onBack,
  onChangeLedgerType,
  revenueData,
  maintenanceRecords,
  expenses,
  metrics
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<RevenueItem | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val || 0).toLocaleString('en-IN');

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Received':
      case 'Completed':
        return (
          <span className="status-chip running" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={11} /> {status}
          </span>
        );
      case 'Partial':
      case 'In Progress':
        return (
          <span className="status-chip idle" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} /> {status}
          </span>
        );
      case 'Overdue':
        return (
          <span className="status-chip offline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} /> Overdue
          </span>
        );
      default:
        return (
          <span className="status-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Clock size={11} /> {status || 'Pending'}
          </span>
        );
    }
  };

  // Vehicles list for filtering
  const availableVehicles = useMemo(() => {
    const set = new Set<string>();
    if (ledgerType === 'bookings' && revenueData?.trips) {
      revenueData.trips.forEach(t => t.vehicle && set.add(t.vehicle));
    } else if (ledgerType === 'departments' && revenueData?.departments) {
      revenueData.departments.forEach(d => d.vehicle && set.add(d.vehicle));
    } else if (ledgerType === 'overheads') {
      maintenanceRecords.forEach(m => m.vehicle && set.add(m.vehicle));
      expenses.forEach(e => e.vehicle && set.add(e.vehicle));
    }
    return Array.from(set).sort();
  }, [ledgerType, revenueData, maintenanceRecords, expenses]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    if (!revenueData?.trips) return [];
    let list = revenueData.trips;

    if (vehicleFilter !== 'All') {
      list = list.filter(t => t.vehicle?.toLowerCase() === vehicleFilter.toLowerCase());
    }
    if (statusFilter !== 'All') {
      list = list.filter(t => t.paymentStatus?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        t =>
          t.referenceNo?.toLowerCase().includes(q) ||
          t.customer?.toLowerCase().includes(q) ||
          t.vehicle?.toLowerCase().includes(q) ||
          t.route?.toLowerCase().includes(q) ||
          t.driver?.toLowerCase().includes(q) ||
          t.date?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [revenueData?.trips, searchTerm, vehicleFilter, statusFilter]);

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    if (!revenueData?.departments) return [];
    let list = revenueData.departments;

    if (vehicleFilter !== 'All') {
      list = list.filter(d => d.vehicle?.toLowerCase() === vehicleFilter.toLowerCase());
    }
    if (statusFilter !== 'All') {
      list = list.filter(d => d.paymentStatus?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        d =>
          d.referenceNo?.toLowerCase().includes(q) ||
          d.customer?.toLowerCase().includes(q) ||
          d.vehicle?.toLowerCase().includes(q) ||
          d.driver?.toLowerCase().includes(q) ||
          d.date?.toLowerCase().includes(q) ||
          d.billingMonth?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [revenueData?.departments, searchTerm, vehicleFilter, statusFilter]);

  // Filtered Overheads
  const filteredOverheads = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      vehicle: string;
      category: string;
      description: string;
      amount: number;
      status: string;
    }> = [];

    maintenanceRecords.forEach(m => {
      list.push({
        id: `m_${m.id}`,
        date: m.date || m.dateLabel || '—',
        vehicle: m.vehicle || 'Fleet',
        category: `Maintenance (${m.type || 'Service'})`,
        description: m.notes || `Vehicle Maintenance - ${m.type || 'Repair'}`,
        amount: m.cost || 0,
        status: m.status || 'Completed'
      });
    });

    expenses
      .filter(e => e.category === 'General' || e.category === 'Administrative')
      .forEach(e => {
        list.push({
          id: `e_${e.id}`,
          date: e.date || '—',
          vehicle: e.vehicle || 'Office / Fleet',
          category: 'General Overhead',
          description: e.linkedTo || 'Office & Administrative Expenses',
          amount: e.amount || 0,
          status: 'Recorded'
        });
      });

    let res = list;
    if (vehicleFilter !== 'All') {
      res = res.filter(o => o.vehicle.toLowerCase() === vehicleFilter.toLowerCase());
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      res = res.filter(
        o =>
          o.vehicle.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.date.toLowerCase().includes(q)
      );
    }
    return res;
  }, [maintenanceRecords, expenses, searchTerm, vehicleFilter]);

  // Pagination setups (10 items per page default for full page view)
  const {
    currentPage: bPage,
    setCurrentPage: setBPage,
    pageSize: bPageSize,
    setPageSize: setBPageSize,
    totalItems: bTotal,
    paginatedItems: paginatedBookings
  } = usePagination(filteredBookings, 10);

  const {
    currentPage: dPage,
    setCurrentPage: setDPage,
    pageSize: dPageSize,
    setPageSize: setDPageSize,
    totalItems: dTotal,
    paginatedItems: paginatedDepartments
  } = usePagination(filteredDepartments, 10);

  const {
    currentPage: oPage,
    setCurrentPage: setOPage,
    pageSize: oPageSize,
    setPageSize: setOPageSize,
    totalItems: oTotal,
    paginatedItems: paginatedOverheads
  } = usePagination(filteredOverheads, 10);

  // CSV Export
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (ledgerType === 'bookings') {
      filename = `bookings_pnl_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Booking ID',
        'Route',
        'Vehicle',
        'Customer',
        'Date',
        'Gross Fare',
        'Fuel Cost',
        'Driver Bata',
        'FASTag Cost',
        'Direct Cost',
        'Profit',
        'Margin %',
        'Status'
      ];
      rows = filteredBookings.map(b => [
        `"${b.referenceNo || b.id}"`,
        `"${b.route || ''}"`,
        `"${b.vehicle || ''}"`,
        `"${b.customer || ''}"`,
        `"${b.date || ''}"`,
        `${b.amount || 0}`,
        `${b.fuelCost || 0}`,
        `${b.driverCost || 0}`,
        `${b.fastagCost || 0}`,
        `${b.totalDirectCost || 0}`,
        `${b.profit || 0}`,
        `${b.margin || 0}`,
        `"${b.paymentStatus || ''}"`
      ]);
    } else if (ledgerType === 'departments') {
      filename = `department_contracts_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        'Invoice ID',
        'Department / Client',
        'Vehicle',
        'Date',
        'Invoiced Amount',
        'Fuel Cost',
        'Driver Cost',
        'Toll Cost',
        'Direct Cost',
        'Profit',
        'Margin %',
        'Status'
      ];
      rows = filteredDepartments.map(d => [
        `"${d.referenceNo || d.id}"`,
        `"${d.customer || ''}"`,
        `"${d.vehicle || ''}"`,
        `"${d.date || ''}"`,
        `${d.amount || 0}`,
        `${d.fuelCost || 0}`,
        `${d.driverCost || 0}`,
        `${d.fastagCost || 0}`,
        `${d.totalDirectCost || 0}`,
        `${d.profit || 0}`,
        `${d.margin || 0}`,
        `"${d.paymentStatus || ''}"`
      ]);
    } else {
      filename = `overhead_expenses_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ['Record ID', 'Date', 'Vehicle / Tag', 'Category', 'Description', 'Amount', 'Status'];
      rows = filteredOverheads.map(o => [
        `"${o.id}"`,
        `"${o.date}"`,
        `"${o.vehicle}"`,
        `"${o.category}"`,
        `"${o.description}"`,
        `${o.amount}`,
        `"${o.status}"`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = searchTerm !== '' || vehicleFilter !== 'All' || statusFilter !== 'All';

  const clearAllFilters = () => {
    setSearchTerm('');
    setVehicleFilter('All');
    setStatusFilter('All');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Navigation & Breadcrumb Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '12.5px',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={15} /> Back to Profitability Overview
          </button>

          {/* Quick Ledger Switcher Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--surface-1)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              onClick={() => onChangeLedgerType('bookings')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: ledgerType === 'bookings' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                background: ledgerType === 'bookings' ? 'var(--surface-2)' : 'transparent',
                color: ledgerType === 'bookings' ? '#38bdf8' : 'var(--text-faint)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Car size={13} /> Bookings ({bTotal})
            </button>
            <button
              type="button"
              onClick={() => onChangeLedgerType('departments')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: ledgerType === 'departments' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                background: ledgerType === 'departments' ? 'var(--surface-2)' : 'transparent',
                color: ledgerType === 'departments' ? '#22c55e' : 'var(--text-faint)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={13} /> Departments ({dTotal})
            </button>
            <button
              type="button"
              onClick={() => onChangeLedgerType('overheads')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: ledgerType === 'overheads' ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                background: ledgerType === 'overheads' ? 'var(--surface-2)' : 'transparent',
                color: ledgerType === 'overheads' ? '#f59e0b' : 'var(--text-faint)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Wrench size={13} /> Overheads ({oTotal})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/revenue?tab=trips&dateFilter=all')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600
            }}
            title="Open in full Revenue Center"
          >
            <span>Revenue Center</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Main Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>
            {ledgerType === 'bookings' && 'Booking Revenue & Direct Costs Ledger'}
            {ledgerType === 'departments' && 'Department Revenue & Direct Costs Ledger'}
            {ledgerType === 'overheads' && 'Common Overhead & Expenses Ledger'}
          </h2>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: '20px',
              background:
                ledgerType === 'bookings'
                  ? 'rgba(56, 189, 248, 0.15)'
                  : ledgerType === 'departments'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
              color:
                ledgerType === 'bookings'
                  ? '#38bdf8'
                  : ledgerType === 'departments'
                  ? '#22c55e'
                  : '#f59e0b'
            }}
          >
            {ledgerType === 'bookings' && `${bTotal} Bookings`}
            {ledgerType === 'departments' && `${dTotal} Contracts`}
            {ledgerType === 'overheads' && `${oTotal} Records`}
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-faint)' }}>
          {ledgerType === 'bookings' && 'Complete breakdown of all completed and active bookings with attached direct costs'}
          {ledgerType === 'departments' && 'Complete breakdown of monthly department billing duties and associated running costs'}
          {ledgerType === 'overheads' && 'Full ledger of vehicle maintenance, repairs, and general administrative overhead expenses'}
        </p>
      </div>

      {/* Primary KPI Stats Grid matching other pages */}
      <div className="stats-grid">
        {ledgerType === 'bookings' && (
          <>
            <StatCard
              label="Gross Revenue"
              value={formatINR(metrics.tripRevenue)}
              customColor="#38bdf8"
            />
            <StatCard
              label="Fuel Cost"
              value={`− ${formatINR(metrics.tripFuel)}`}
              customColor="#ef4444"
            />
            <StatCard
              label="Driver Bata"
              value={`− ${formatINR(metrics.tripDriver)}`}
              customColor="#ef4444"
            />
            <StatCard
              label="FASTag / Tolls"
              value={`− ${formatINR(metrics.tripFastag)}`}
              customColor="#ef4444"
            />
            <StatCard
              label="Direct Profit"
              value={formatINR(metrics.tripProfit)}
              customColor={metrics.tripProfit >= 0 ? '#22c55e' : '#ef4444'}
            />
            <StatCard
              label="Profit Margin"
              value={`${metrics.tripMargin}%`}
              customColor={metrics.tripProfit >= 0 ? '#22c55e' : '#ef4444'}
            />
          </>
        )}

        {ledgerType === 'departments' && (
          <>
            <StatCard
              label="Invoiced Revenue"
              value={formatINR(metrics.deptRevenue)}
              customColor="#22c55e"
            />
            <StatCard
              label="Fuel Cost"
              value={`− ${formatINR(metrics.deptFuel)}`}
              customColor="#ef4444"
            />
            <StatCard
              label="Driver Allowance"
              value={`− ${formatINR(metrics.deptDriver)}`}
              customColor="#ef4444"
            />
            <StatCard
              label="Tolls & Parking"
              value={`− ${formatINR(metrics.deptTolls)}`}
              customColor="#ef4444"
            />
            <StatCard
              label="Direct Profit"
              value={formatINR(metrics.deptProfit)}
              customColor={metrics.deptProfit >= 0 ? '#22c55e' : '#ef4444'}
            />
            <StatCard
              label="Profit Margin"
              value={`${metrics.deptMargin}%`}
              customColor={metrics.deptProfit >= 0 ? '#22c55e' : '#ef4444'}
            />
          </>
        )}

        {ledgerType === 'overheads' && (
          <>
            <StatCard
              label="Fleet Maintenance"
              value={`− ${formatINR(metrics.maintenanceCost)}`}
              customColor="#f59e0b"
            />
            <StatCard
              label="General & Admin Overheads"
              value={`− ${formatINR(metrics.generalCost + metrics.otherOverhead)}`}
              customColor="#f59e0b"
            />
            <StatCard
              label="Total Overhead Deducted"
              value={`− ${formatINR(metrics.commonExpenses)}`}
              customColor="#ef4444"
            />
          </>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div
        className="panel"
        style={{
          padding: '14px 18px',
          margin: 0,
          background: 'var(--surface-1)',
          border: '1px solid var(--border)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '420px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-faint)'
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder={
                ledgerType === 'bookings'
                  ? 'Search customer, route, vehicle, booking ID...'
                  : ledgerType === 'departments'
                  ? 'Search department name, vehicle, invoice ID...'
                  : 'Search vehicle, maintenance notes, expense...'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '13px' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-faint)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600 }}>Vehicle:</span>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                value={vehicleFilter}
                onChange={e => setVehicleFilter(e.target.value)}
              >
                <option value="All">All Vehicles</option>
                {availableVehicles.map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {ledgerType !== 'overheads' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600 }}>Payment:</span>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
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
            )}

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-secondary"
                onClick={clearAllFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: '#ef4444'
                }}
              >
                <RotateCcw size={12} /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Ledger Table Panel */}
      <div className="panel" style={{ margin: 0 }}>
        <div className="panel-head">
          <span className="panel-title">
            {ledgerType === 'bookings' && 'Booking Direct Contribution Ledger'}
            {ledgerType === 'departments' && 'Department Duties & Running Costs Ledger'}
            {ledgerType === 'overheads' && 'Fleet Overheads & Maintenance Ledger'}
          </span>
          <span className="panel-link">
            {ledgerType === 'bookings' && `Showing ${paginatedBookings.length} of ${bTotal} bookings`}
            {ledgerType === 'departments' && `Showing ${paginatedDepartments.length} of ${dTotal} contracts`}
            {ledgerType === 'overheads' && `Showing ${paginatedOverheads.length} of ${oTotal} records`}
          </span>
        </div>

        {/* Bookings Table */}
        {ledgerType === 'bookings' && (
          <>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Booking / Route</th>
                    <th>Vehicle</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th className="num">Booking Fare</th>
                    <th className="num">Fuel Cost</th>
                    <th className="num">Driver Bata</th>
                    <th className="num">FASTag / Tolls</th>
                    <th className="num">Direct Profit</th>
                    <th className="num">Margin</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                        No booking records found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map(t => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedItem(t)}
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                        title="Click to view full booking details and direct cost breakdown"
                      >
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{t.route || t.referenceNo}</span>
                            <ArrowUpRight size={12} style={{ color: 'var(--text-faint)' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{t.referenceNo}</span>
                        </td>
                        <td>
                          <span className="tag trip" style={{ fontWeight: 700 }}>
                            {t.vehicle}
                          </span>
                        </td>
                        <td>{t.customer}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{t.date}</td>
                        <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          {formatINR(t.amount)}
                        </td>
                        <td className="num" style={{ color: '#ef4444', fontWeight: 600 }}>
                          − {formatINR(t.fuelCost)}
                        </td>
                        <td className="num" style={{ color: '#ef4444', fontWeight: 600 }}>
                          − {formatINR(t.driverCost)}
                        </td>
                        <td className="num" style={{ color: '#ef4444', fontWeight: 600 }}>
                          − {formatINR(t.fastagCost)}
                        </td>
                        <td className="num" style={{ fontWeight: 800, color: t.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {formatINR(t.profit)}
                        </td>
                        <td className="num" style={{ fontWeight: 700, color: t.profit >= 0 ? '#22c55e' : '#ef4444' }}>
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
              currentPage={bPage}
              totalItems={bTotal}
              pageSize={bPageSize}
              onPageChange={setBPage}
              onPageSizeChange={setBPageSize}
              itemLabel="bookings"
            />
          </>
        )}

        {/* Departments Table */}
        {ledgerType === 'departments' && (
          <>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Department / Client</th>
                    <th>Vehicle</th>
                    <th>Invoice / Period</th>
                    <th>Date</th>
                    <th className="num">Invoiced Bill</th>
                    <th className="num">Fuel Cost</th>
                    <th className="num">Driver Allow.</th>
                    <th className="num">Tolls / FASTag</th>
                    <th className="num">Direct Profit</th>
                    <th className="num">Margin</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                        No department contract records found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedDepartments.map(d => (
                      <tr
                        key={d.id}
                        onClick={() => setSelectedItem(d)}
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                        title="Click to view full invoice details and direct cost breakdown"
                      >
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{d.customer}</span>
                            <ArrowUpRight size={12} style={{ color: 'var(--text-faint)' }} />
                          </div>
                        </td>
                        <td>
                          <span className="tag dept" style={{ fontWeight: 700 }}>
                            {d.vehicle}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{d.referenceNo}</div>
                          {d.billingMonth && (
                            <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{d.billingMonth}</span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{d.date}</td>
                        <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          {formatINR(d.amount)}
                        </td>
                        <td className="num" style={{ color: '#ef4444', fontWeight: 600 }}>
                          − {formatINR(d.fuelCost)}
                        </td>
                        <td className="num" style={{ color: '#ef4444', fontWeight: 600 }}>
                          − {formatINR(d.driverCost)}
                        </td>
                        <td className="num" style={{ color: '#ef4444', fontWeight: 600 }}>
                          − {formatINR(d.fastagCost)}
                        </td>
                        <td className="num" style={{ fontWeight: 800, color: d.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          {formatINR(d.profit)}
                        </td>
                        <td className="num" style={{ fontWeight: 700, color: d.profit >= 0 ? '#22c55e' : '#ef4444' }}>
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
              currentPage={dPage}
              totalItems={dTotal}
              pageSize={dPageSize}
              onPageChange={setDPage}
              onPageSizeChange={setDPageSize}
              itemLabel="contracts"
            />
          </>
        )}

        {/* Overheads Table */}
        {ledgerType === 'overheads' && (
          <>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Date</th>
                    <th>Vehicle / Target</th>
                    <th>Category</th>
                    <th>Expense Description</th>
                    <th className="num">Amount Deducted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOverheads.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                        No common overhead records found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedOverheads.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-faint)' }}>{o.id}</td>
                        <td>{o.date}</td>
                        <td style={{ fontWeight: 600 }}>{o.vehicle}</td>
                        <td>
                          <span
                            className="tag"
                            style={{
                              background: o.category.includes('Maintenance') ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                              color: o.category.includes('Maintenance') ? '#f59e0b' : '#38bdf8'
                            }}
                          >
                            {o.category}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--text)' }}>{o.description}</td>
                        <td className="num" style={{ fontWeight: 700, color: '#ef4444' }}>
                          − {formatINR(o.amount)}
                        </td>
                        <td>
                          <span className="status-chip running" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} /> {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={oPage}
              totalItems={oTotal}
              pageSize={oPageSize}
              onPageChange={setOPage}
              onPageSizeChange={setOPageSize}
              itemLabel="records"
            />
          </>
        )}
      </div>

      {/* Deep Detail Modal on Row Click */}
      <RevenueDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};
