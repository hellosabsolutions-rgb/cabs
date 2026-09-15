import React, { useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { IndianRupee, CreditCard, TrendingUp, Truck, RefreshCw } from 'lucide-react';
import { SkeletonDashboard, SoftRefreshBar } from '../../common/Skeleton';

const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
const inrLakh = (n: number) => {
  const val = n || 0;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return inr(val);
};

const NX_SLICE: Record<string, string> = {
  Fuel: '#6366F1',
  Driver: '#8B5CF6',
  Maintenance: '#38BDF8',
  FASTag: '#2DD4BF',
  Other: '#C4B5FD'
};

export const DashboardView: React.FC = () => {
  const {
    dashboardStats,
    isLoadingDashboard,
    fetchLiveDashboardStats,
    vehicles,
    searchQuery,
    setActivePage,
  } = useFleet();

  useEffect(() => {
    fetchLiveDashboardStats();
  }, []);

  if (isLoadingDashboard && !dashboardStats) {
    return (
      <div className="section active module-page dash-nexus">
        <SkeletonDashboard />
      </div>
    );
  }

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

  const expenseSlices = (dashboardStats?.expenseMix || [])
    .filter(s => s.value > 0)
    .map(s => ({ ...s, color: NX_SLICE[s.label] || s.color }));
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

  const lastMonth = monthly[monthly.length - 1];
  const prevMonth = monthly[monthly.length - 2];
  const revenueDelta = lastMonth && prevMonth && prevMonth.revenue
    ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
    : null;

  return (
    <div className="section active module-page dash-nexus">
      <SoftRefreshBar visible={isLoadingDashboard && !!dashboardStats} label="Syncing dashboard metrics…" />

      <div className="stats-grid">
        <StatCard
          variant="nexus"
          label="Total revenue"
          value={inr(summary.totalRevenue)}
          delta={`Dept ${inrLakh(summary.deptRevenue)} · Trip ${inrLakh(summary.tripRevenue)}`}
          isUp
          icon={<IndianRupee size={16} />}
        />
        <StatCard
          variant="nexus"
          label="Total expense"
          value={inr(summary.totalExpense)}
          delta={`Fuel ${inrLakh(summary.fuelExpense)} · Toll ${inrLakh(summary.tollExpense)} · Driver ${inrLakh(summary.driverExpense)}`}
          isDown
          icon={<CreditCard size={16} />}
        />
        <StatCard
          variant="nexus"
          label="Net profit"
          value={inr(summary.netProfit)}
          delta={`${summary.profitMargin.toFixed(1)}% margin`}
          isUp={summary.netProfit >= 0}
          isDown={summary.netProfit < 0}
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          variant="nexus"
          label="Active vehicles"
          value={`${summary.runningVehicles} / ${summary.totalVehicles}`}
          delta={`${summary.idleVehicles} idle · ${summary.maintenanceVehicles} workshop · ${summary.onDutyDrivers} on duty`}
          icon={<Truck size={16} />}
        />
      </div>

      <div className="grid-2">
        <div className="panel dash-chart-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Revenue vs expense</div>
              <div className="dash-chart-sub">Last 6 months · duty logs, invoices and trips</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn-icon-subtle"
                title="Refresh Live Metrics"
                onClick={() => fetchLiveDashboardStats()}
                disabled={isLoadingDashboard}
              >
                <RefreshCw size={14} className={isLoadingDashboard ? 'spin' : ''} />
              </button>
              <span className="panel-link" onClick={() => setActivePage('profitability')}>
                View report
              </span>
            </div>
          </div>

          {lastMonth && (
            <div className="nx-chart-hero">
              <b>{inr(lastMonth.revenue)}</b>
              {revenueDelta !== null && (
                <span className={revenueDelta >= 0 ? 'up' : 'down'}>
                  {revenueDelta >= 0 ? '+' : ''}
                  {revenueDelta.toFixed(1)}% vs previous month · {inrLakh(Math.abs(lastMonth.revenue - (prevMonth?.revenue || 0)))} change
                </span>
              )}
            </div>
          )}

          <div className="nx-legend">
            <span><i style={{ background: 'var(--nx-indigo)' }} /> Profit</span>
            <span><i style={{ background: 'var(--nx-violet)' }} /> Expense</span>
          </div>

          <StackedMonthChart monthly={monthly} maxBar={maxBar} />
        </div>

        <div className="panel dash-chart-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Operations snapshot</div>
              <div className="dash-chart-sub">Drivers, live trips, fuel fills and fleet mix</div>
            </div>
            <span className="panel-link" onClick={() => setActivePage('compliance')}>
              Compliance Docs
            </span>
          </div>

          <div className="nx-chart-hero">
            <b>{opsSnapshot.totalDrivers || summary.totalDrivers}</b>
            <span>
              {summary.onDutyDrivers} on duty · {opsSnapshot.liveTrips} live trips · {opsSnapshot.fuelFillsLogged} fills ({opsSnapshot.totalFuelLitres}L)
            </span>
          </div>

          <OpsBars
            items={[
              { label: 'Dept', value: opsSnapshot.departmentCabs },
              { label: 'Trip', value: opsSnapshot.tripCabs },
              { label: 'Fuel', value: opsSnapshot.fuelFillsLogged },
              { label: 'Live', value: opsSnapshot.liveTrips },
              { label: 'Drivers', value: opsSnapshot.totalDrivers || summary.totalDrivers },
            ]}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="panel dash-chart-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Expense mix</div>
              <div className="dash-chart-sub">Fuel, FASTag, driver and operational costs</div>
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
            <>
              <div className="nx-list-head">
                <span>Vehicle</span>
                <span>Type</span>
                <span>Driver</span>
                <span>Status</span>
              </div>
              {liveVehicles.slice(0, 5).map(v => (
                <div className="nx-list-row" key={v.id}>
                  <div className="nx-list-app">
                    <div
                      className={`pulse ${
                        v.status === 'Idle' ? 'idle' : v.status === 'Maintenance' ? 'maint' : ''
                      }`}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div className="status-name">{v.registrationNumber}</div>
                      <div className="status-meta">{v.meta || v.assignedTo || v.model}</div>
                    </div>
                  </div>
                  <div className="status-meta">{v.type === 'Department' ? 'Department' : 'Trip'}</div>
                  <div className="status-meta cell-truncate-sm" title={v.assignedDriver || 'Unassigned'}>
                    {v.assignedDriver || 'Unassigned'}
                  </div>
                  <StatusChip status={v.status as any} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="panel nx-table-panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Vehicle-wise profit ranking</div>
            <div className="dash-chart-sub">Highest earners first · aggregated revenue, expenses and margins</div>
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
                          {v.assignedDriver || '-'}
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

function StackedMonthChart({
  monthly,
  maxBar,
}: {
  monthly: { month: string; monthKey?: string; revenue: number; expense: number }[];
  maxBar: number;
}) {
  if (monthly.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
        No monthly logs recorded yet.
      </div>
    );
  }

  return (
    <div className="nx-stack">
      {monthly.map(m => {
        const profit = Math.max(0, (m.revenue || 0) - (m.expense || 0));
        const loss = Math.max(0, (m.expense || 0) - (m.revenue || 0));
        const pile = Math.max(m.revenue || 0, m.expense || 0, 1);
        const pileH = Math.max(8, (pile / maxBar) * 100);
        const expenseH = ((m.expense || 0) / pile) * 100;
        const profitH = (profit / pile) * 100;
        const lossH = (loss / pile) * 100;

        return (
          <div className="nx-stack-col" key={m.monthKey || m.month}>
            <div className="nx-stack-amount">{inrLakh(m.revenue)}</div>
            <div className="nx-stack-track">
              <div className="nx-stack-pile" style={{ height: `${pileH}%` }}>
                {profitH > 0 && <div className="nx-seg nx-seg-profit" style={{ flexGrow: profitH, flexBasis: 0 }} />}
                {expenseH > 0 && <div className="nx-seg nx-seg-expense" style={{ flexGrow: Math.max(8, expenseH - lossH), flexBasis: 0 }} />}
                {lossH > 0 && <div className="nx-seg nx-seg-loss" style={{ flexGrow: lossH, flexBasis: 0 }} />}
              </div>
            </div>
            <div className="nx-stack-lbl">{m.month}</div>
          </div>
        );
      })}
    </div>
  );
}

function OpsBars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map(i => i.value), 1);
  const peak = Math.max(...items.map(i => i.value));

  return (
    <div className="nx-ops-bars">
      {items.map(item => {
        const h = Math.max(8, (item.value / max) * 100);
        return (
          <div className="nx-ops-col" key={item.label}>
            <div className="nx-ops-val">{item.value}</div>
            <div className="nx-ops-track">
              <div
                className={`nx-ops-bar${item.value === peak && peak > 0 ? ' is-peak' : ''}`}
                style={{ height: `${h}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <div className="nx-ops-lbl">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

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
  const gap = slices.length > 1 ? 6 : 0;

  return (
    <div className="dash-donut">
      <svg viewBox="0 0 140 140" width="140" height="140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--nx-bar-track)" strokeWidth="18" />
        {slices.map(s => {
          const raw = (s.value / validTotal) * c;
          const len = Math.max(0, raw - gap);
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 70 70)"
            />
          );
          offset += raw;
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
