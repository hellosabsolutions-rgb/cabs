import React, { useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { IndianRupee, CreditCard, TrendingUp, Truck, Fuel, Radio, RefreshCw } from 'lucide-react';
import { SkeletonDashboard, SoftRefreshBar } from '../../common/Skeleton';

const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const inrLakh = (n: number) => {
  const val = n || 0;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return inr(val);
};

export const DashboardView: React.FC = () => {
  const {
    dashboardStats,
    isLoadingDashboard,
    fetchLiveDashboardStats,
    vehicles,
    searchQuery,
    setActivePage,
    isLoading,
  } = useFleet();

  useEffect(() => {
    fetchLiveDashboardStats();
    // Tab change auto-fetch is handled in FleetContext via activePage useEffect
    // This ensures fresh data on initial component mount as well
  }, []);

  // First-time load: show full dashboard skeleton
  if (isLoadingDashboard && !dashboardStats) {
    return (
      <div className="section active">
        <SkeletonDashboard />
      </div>
    );
  }

  // Live Aggregated Data from MongoDB
  const summary = dashboardStats?.summary || {
    totalRevenue: vehicles.reduce((s, v) => s + (v.revenue || 0), 0),
    deptRevenue: vehicles.filter(v => v.type === 'Department').reduce((s, v) => s + (v.revenue || 0), 0),
    tripRevenue: vehicles.filter(v => v.type !== 'Department').reduce((s, v) => s + (v.revenue || 0), 0),
    totalExpense: vehicles.reduce((s, v) => s + (v.expense || 0), 0),
    fuelExpense: 0,
    tollExpense: 0,
    driverExpense: 0,
    maintenanceExpense: 0,
    otherExpense: 0,
    netProfit: vehicles.reduce((s, v) => s + (v.revenue || 0) - (v.expense || 0), 0),
    profitMargin: 0,
    totalVehicles: vehicles.length,
    runningVehicles: vehicles.filter(v => v.status === 'Running' || v.status === 'Active').length,
    idleVehicles: vehicles.filter(v => v.status === 'Idle').length,
    maintenanceVehicles: vehicles.filter(v => v.status === 'Maintenance').length,
    departmentVehicles: vehicles.filter(v => v.type === 'Department').length,
    tripVehicles: vehicles.filter(v => v.type !== 'Department').length,
    totalDrivers: 0,
    onDutyDrivers: 0,
    offDutyDrivers: 0,
  };

  const monthly = dashboardStats?.monthly || [];
  const maxBar = Math.max(...monthly.flatMap(m => [m.revenue, m.expense]), 1);

  const expenseSlices = (dashboardStats?.expenseMix || []).filter(s => s.value > 0);
  const expenseTotal = dashboardStats?.expenseTotal ?? expenseSlices.reduce((s, x) => s + x.value, 0);

  const opsSnapshot = dashboardStats?.operationsSnapshot || {
    departmentCabs: summary.departmentVehicles,
    tripCabs: summary.tripVehicles,
    fuelFillsLogged: 0,
    totalFuelLitres: 0,
    liveTrips: summary.runningVehicles,
    totalDrivers: summary.totalDrivers,
  };

  const rankingVehicles = (dashboardStats?.profitabilityRanking || []).filter(v =>
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.assignedTo && v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.assignedDriver && v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const liveVehicles = (dashboardStats?.vehicles || vehicles).filter(v =>
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.assignedTo && v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.assignedDriver && v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="section active">
      {/* Background sync indicator — shows when data exists but is being refreshed */}
      <SoftRefreshBar visible={isLoadingDashboard && !!dashboardStats} label="Syncing dashboard metrics…" />
      {/* 4 Primary KPI Cards Powered by MongoDB Aggregations */}
      <div className="stats-grid">
        <StatCard
          label="Total revenue"
          value={inr(summary.totalRevenue)}
          delta={`Dept ${inrLakh(summary.deptRevenue)} · Trip ${inrLakh(summary.tripRevenue)}`}
          isUp
          icon={<IndianRupee size={16} />}
        />
        <StatCard
          label="Total expense"
          value={inr(summary.totalExpense)}
          delta={`Fuel ${inrLakh(summary.fuelExpense)} · Toll ${inrLakh(summary.tollExpense)} · Driver ${inrLakh(summary.driverExpense)}`}
          isDown
          icon={<CreditCard size={16} />}
        />
        <StatCard
          label="Net profit"
          value={inr(summary.netProfit)}
          delta={`${summary.profitMargin.toFixed(1)}% margin (Live Aggregated)`}
          isUp
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Active vehicles"
          value={`${summary.runningVehicles} / ${summary.totalVehicles}`}
          delta={`${summary.idleVehicles} idle · ${summary.maintenanceVehicles} workshop · ${summary.onDutyDrivers} drivers on duty`}
          icon={<Truck size={16} />}
        />
      </div>

      {/* 6-Month Real Trend & Real Expense Mix */}
      <div className="grid-2">
        <div className="panel dash-chart-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Revenue vs expense</div>
              <div className="dash-chart-sub">Last 6 months · aggregated from duty logs, invoices & trips</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="btn-icon-subtle"
                title="Refresh Live Metrics"
                onClick={() => fetchLiveDashboardStats()}
                disabled={isLoadingDashboard}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #888)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <RefreshCw size={14} className={isLoadingDashboard ? 'spin' : ''} />
              </button>
              <span className="panel-link" onClick={() => setActivePage('profitability')}>
                View report
              </span>
            </div>
          </div>

          <div className="dash-legend">
            <span><i className="dash-dot rev" /> Revenue</span>
            <span><i className="dash-dot exp" /> Expense</span>
          </div>

          <div className="dash-grouped-bars">
            {monthly.length > 0 ? (
              monthly.map(m => (
                <div className="dash-gcol" key={m.monthKey || m.month}>
                  <div className="dash-gpair">
                    <div
                      className="dash-gbar rev"
                      style={{ height: m.revenue > 0 ? `${Math.max(6, (m.revenue / maxBar) * 100)}%` : '0%' }}
                      title={`Revenue ${inr(m.revenue)}`}
                    />
                    <div
                      className="dash-gbar exp"
                      style={{ height: m.expense > 0 ? `${Math.max(6, (m.expense / maxBar) * 100)}%` : '0%' }}
                      title={`Expense ${inr(m.expense)}`}
                    />
                  </div>
                  <div className="bar-lbl">{m.month}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                No monthly logs recorded yet.
              </div>
            )}
          </div>
        </div>

        <div className="panel dash-chart-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Expense mix</div>
              <div className="dash-chart-sub">Real breakdown: Fuel, FASTag, Driver & Operational costs</div>
            </div>
            <span className="panel-link" onClick={() => setActivePage('expenses')}>
              Fuel & FASTag
            </span>
          </div>

          <div className="dash-donut-wrap">
            <ExpenseDonut slices={expenseSlices} total={expenseTotal} />
            <div className="dash-donut-legend">
              {expenseSlices.length > 0 ? (
                expenseSlices.map(s => (
                  <div key={s.label} className="dash-donut-row">
                    <span className="dash-donut-lab">
                      <i style={{ background: s.color }} />
                      {s.label}
                    </span>
                    <strong>{inrLakh(s.value)}</strong>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  No expense records logged
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Vehicle Status & Operations Snapshot */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Live vehicle status</div>
              <div className="dash-chart-sub">{summary.totalVehicles} in fleet · {summary.runningVehicles} active on road</div>
            </div>
            <span className="panel-link" onClick={() => setActivePage('vehicles')}>
              All vehicles
            </span>
          </div>

          <div className="dash-status-pills">
            <span className="dash-pill run">{summary.runningVehicles} running</span>
            <span className="dash-pill idle">{summary.idleVehicles} idle</span>
            <span className="dash-pill maint">{summary.maintenanceVehicles} workshop</span>
          </div>

          {liveVehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No vehicles in fleet. Onboard a vehicle to track live status.
            </div>
          ) : (
            liveVehicles.slice(0, 5).map(v => (
              <div className="status-row" key={v.id}>
                <div className="status-left">
                  <div
                    className={`pulse ${
                      v.status === 'Idle' ? 'idle' : v.status === 'Maintenance' ? 'maint' : ''
                    }`}
                  />
                  <div>
                    <div className="status-name">{v.registrationNumber}</div>
                    <div className="status-meta">
                      {v.assignedDriver ? `${v.assignedDriver} · ` : ''}
                      {v.meta || v.assignedTo}
                    </div>
                  </div>
                </div>
                <StatusChip status={v.status as any} />
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Operations snapshot</div>
              <div className="dash-chart-sub">Drivers, live trips, fuel fills and compliance</div>
            </div>
            <span className="panel-link" onClick={() => setActivePage('compliance')}>
              Compliance Docs
            </span>
          </div>
          <div className="dash-ops-grid">
            <div className="dash-ops-card">
              <Truck size={16} />
              <div>
                <b>{opsSnapshot.departmentCabs}</b>
                <span>Department cabs</span>
              </div>
            </div>
            <div className="dash-ops-card">
              <Radio size={16} />
              <div>
                <b>{opsSnapshot.tripCabs}</b>
                <span>Trip cabs</span>
              </div>
            </div>
            <div className="dash-ops-card">
              <Fuel size={16} />
              <div>
                <b>{opsSnapshot.fuelFillsLogged}</b>
                <span>Fuel fills ({opsSnapshot.totalFuelLitres}L)</span>
              </div>
            </div>
            <div className="dash-ops-card">
              <TrendingUp size={16} />
              <div>
                <b>{opsSnapshot.liveTrips}</b>
                <span>Live trips / duties</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle-wise Profit Table: Ranked by Real Aggregated Profit & Margin */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Vehicle-wise profit ranking</div>
            <div className="dash-chart-sub">Highest earners first · aggregated real revenue, expenses and margins</div>
          </div>
          <span className="panel-link" onClick={() => setActivePage('profitability')}>
            Full report
          </span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Revenue</th>
                <th>Expense</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {rankingVehicles.length > 0 ? (
                rankingVehicles.slice(0, 7).map(v => {
                  const margin = v.margin ?? (v.revenue > 0 ? ((v.profit || 0) / v.revenue) * 100 : 0);
                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="status-name" style={{ whiteSpace: 'nowrap' }}>{v.registrationNumber}</div>
                        <div className="status-meta cell-truncate-md" title={v.model}>{v.model}</div>
                      </td>
                      <td>
                        <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`} style={{ whiteSpace: 'nowrap' }}>
                          {v.type === 'Department' ? 'Department' : 'Trip-based'}
                        </span>
                      </td>
                      <td>
                        <span className="cell-truncate-sm" title={v.assignedDriver || 'Unassigned'}>
                          {v.assignedDriver || '—'}
                        </span>
                      </td>
                      <td>
                        <StatusChip status={v.status as any} />
                      </td>
                      <td className="num">{inr(v.revenue)}</td>
                      <td className="num">{inr(v.expense)}</td>
                      <td className="num profit-pos">{inr(v.profit)}</td>
                      <td>
                        <div className="dash-margin">
                          <div className="dash-margin-track">
                            <div className="dash-margin-fill" style={{ width: `${Math.min(100, Math.max(6, margin))}%` }} />
                          </div>
                          <span>{margin.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No vehicle records found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function ExpenseDonut({
  slices,
  total,
}: {
  slices: { label: string; value: number; color: string }[];
  total: number;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const validTotal = total > 0 ? total : 1;

  return (
    <div className="dash-donut">
      <svg viewBox="0 0 140 140" width="140" height="140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border, rgba(255,255,255,0.1))" strokeWidth="16" />
        {slices.map(s => {
          const len = (s.value / validTotal) * c;
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="dash-donut-center">
        <b>{inrLakh(total)}</b>
        <span>spent</span>
      </div>
    </div>
  );
}
