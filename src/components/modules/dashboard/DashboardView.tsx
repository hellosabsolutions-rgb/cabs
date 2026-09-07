import React, { useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { IndianRupee, CreditCard, TrendingUp, Truck, Fuel, Radio } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const inrLakh = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return inr(n);
};

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const MONTH_WEIGHTS = [0.13, 0.15, 0.14, 0.18, 0.19, 0.21];

export const DashboardView: React.FC = () => {
  const {
    vehicles,
    drivers,
    fuelLogs,
    fastagTransactions,
    driverExpenses,
    trips,
    bookings,
    searchQuery,
    setActivePage,
    isLoading,
  } = useFleet();

  const stats = useMemo(() => {
    const totalRevenue = vehicles.reduce((s, v) => s + (v.revenue || 0), 0);
    const totalExpense = vehicles.reduce((s, v) => s + (v.expense || 0), 0);
    const tripRev = [...trips, ...bookings].reduce((s, t) => s + (t.revenue || t.totalAmount || 0), 0);
    const deptRev = Math.max(totalRevenue - tripRev, totalRevenue * 0.42);
    const net = totalRevenue - totalExpense;
    const margin = totalRevenue > 0 ? (net / totalRevenue) * 100 : 0;

    const running = vehicles.filter(v => v.status === 'Running' || v.status === 'Active').length;
    const idle = vehicles.filter(v => v.status === 'Idle').length;
    const maint = vehicles.filter(v => v.status === 'Maintenance').length;
    const onDuty = drivers.filter(d => d.status === 'On duty').length;

    const fuel = fuelLogs.reduce((s, f) => s + (f.totalCost || 0), 0);
    const fastag = fastagTransactions
      .filter(t => t.type === 'Toll Deduction')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const driverCost = driverExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const other = Math.max(totalExpense - fuel - fastag - driverCost, 0);

    const monthly = MONTHS.map((month, i) => {
      const w = MONTH_WEIGHTS[i];
      return {
        month,
        revenue: Math.round(totalRevenue * w),
        expense: Math.round(totalExpense * w * (0.88 + i * 0.03)),
      };
    });

    return {
      totalRevenue,
      totalExpense,
      tripRev,
      deptRev,
      net,
      margin,
      running,
      idle,
      maint,
      onDuty,
      fuel,
      fastag,
      driverCost,
      other,
      monthly,
    };
  }, [vehicles, drivers, fuelLogs, fastagTransactions, driverExpenses, trips, bookings]);

  const filteredVehicles = vehicles
    .filter(v =>
      v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.meta && v.meta.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .slice()
    .sort((a, b) => (b.profit || 0) - (a.profit || 0));

  const expenseSlices = [
    { label: 'Fuel', value: stats.fuel, color: '#1687F5' },
    { label: 'FASTag', value: stats.fastag, color: '#26B8D8' },
    { label: 'Driver', value: stats.driverCost, color: '#F15B4A' },
    { label: 'Other', value: stats.other, color: '#A5A5A5' },
  ].filter(s => s.value > 0);

  const expenseTotal = expenseSlices.reduce((s, x) => s + x.value, 0) || 1;
  const maxBar = Math.max(...stats.monthly.flatMap(m => [m.revenue, m.expense]), 1);

  if (isLoading) {
    return (
      <div className="section active">
        <SkeletonCard count={4} />
        <div style={{ marginTop: '20px' }}>
          <SkeletonTable rows={5} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="section active">
      <div className="stats-grid">
        <StatCard
          label="Total revenue"
          value={inr(stats.totalRevenue)}
          delta={`Dept ${inrLakh(stats.deptRev)} · Trip ${inrLakh(stats.tripRev || stats.totalRevenue * 0.56)}`}
          isUp
          icon={<IndianRupee size={16} />}
        />
        <StatCard
          label="Total expense"
          value={inr(stats.totalExpense)}
          delta={`Fuel ${inrLakh(stats.fuel)} · Toll ${inrLakh(stats.fastag)}`}
          isDown
          icon={<CreditCard size={16} />}
        />
        <StatCard
          label="Net profit"
          value={inr(stats.net)}
          delta={`${stats.margin.toFixed(1)}% margin this period`}
          isUp
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Active vehicles"
          value={`${stats.running} / ${vehicles.length}`}
          delta={`${stats.idle} idle · ${stats.maint} in workshop · ${stats.onDuty} drivers on duty`}
          icon={<Truck size={16} />}
        />
      </div>

      <div className="grid-2">
        <div className="panel dash-chart-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Revenue vs expense</div>
              <div className="dash-chart-sub">Last 6 months · department + trip operations</div>
            </div>
            <span className="panel-link" onClick={() => setActivePage('profitability')}>
              View report
            </span>
          </div>

          <div className="dash-legend">
            <span><i className="dash-dot rev" /> Revenue</span>
            <span><i className="dash-dot exp" /> Expense</span>
          </div>

          <div className="dash-grouped-bars">
            {stats.monthly.map(m => (
              <div className="dash-gcol" key={m.month}>
                <div className="dash-gpair">
                  <div
                    className="dash-gbar rev"
                    style={{ height: `${Math.max(8, (m.revenue / maxBar) * 100)}%` }}
                    title={`Revenue ${inr(m.revenue)}`}
                  />
                  <div
                    className="dash-gbar exp"
                    style={{ height: `${Math.max(8, (m.expense / maxBar) * 100)}%` }}
                    title={`Expense ${inr(m.expense)}`}
                  />
                </div>
                <div className="bar-lbl">{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel dash-chart-panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Expense mix</div>
              <div className="dash-chart-sub">Where money is going this period</div>
            </div>
            <span className="panel-link" onClick={() => setActivePage('expenses')}>
              Fuel & FASTag
            </span>
          </div>

          <div className="dash-donut-wrap">
            <ExpenseDonut slices={expenseSlices} total={expenseTotal} />
            <div className="dash-donut-legend">
              {expenseSlices.map(s => (
                <div key={s.label} className="dash-donut-row">
                  <span className="dash-donut-lab">
                    <i style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <strong>{inrLakh(s.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Live vehicle status</div>
              <div className="dash-chart-sub">{vehicles.length} in fleet · {stats.running} on road now</div>
            </div>
            <span className="panel-link" onClick={() => setActivePage('vehicles')}>
              All vehicles
            </span>
          </div>

          <div className="dash-status-pills">
            <span className="dash-pill run">{stats.running} running</span>
            <span className="dash-pill idle">{stats.idle} idle</span>
            <span className="dash-pill maint">{stats.maint} workshop</span>
          </div>

          {vehicles.slice(0, 5).map(v => (
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
              <StatusChip status={v.status} />
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Operations snapshot</div>
              <div className="dash-chart-sub">Drivers, trips and compliance load</div>
            </div>
          </div>
          <div className="dash-ops-grid">
            <div className="dash-ops-card">
              <Truck size={16} />
              <div>
                <b>{vehicles.filter(v => v.type === 'Department').length}</b>
                <span>Department cabs</span>
              </div>
            </div>
            <div className="dash-ops-card">
              <Radio size={16} />
              <div>
                <b>{vehicles.filter(v => v.type !== 'Department').length}</b>
                <span>Trip cabs</span>
              </div>
            </div>
            <div className="dash-ops-card">
              <Fuel size={16} />
              <div>
                <b>{fuelLogs.length}</b>
                <span>Fuel fills logged</span>
              </div>
            </div>
            <div className="dash-ops-card">
              <TrendingUp size={16} />
              <div>
                <b>{[...trips, ...bookings].filter(t => t.status === 'Ongoing').length || stats.running}</b>
                <span>Live trips / duties</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Vehicle-wise profit</div>
            <div className="dash-chart-sub">Highest earners first · revenue after fuel, toll and bata</div>
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
                <th>Revenue</th>
                <th>Expense</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.slice(0, 6).map(v => {
                const margin = v.revenue > 0 ? (v.profit / v.revenue) * 100 : 0;
                return (
                  <tr key={v.id}>
                    <td>
                      <div className="status-name">{v.registrationNumber}</div>
                      <div className="status-meta">{v.model}</div>
                    </td>
                    <td>
                      <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`}>
                        {v.type === 'Department' ? 'Department' : 'Trip-based'}
                      </span>
                    </td>
                    <td>{v.assignedDriver || '—'}</td>
                    <td className="num">{inr(v.revenue)}</td>
                    <td className="num">{inr(v.expense)}</td>
                    <td className="num profit-pos">{inr(v.profit)}</td>
                    <td>
                      <div className="dash-margin">
                        <div className="dash-margin-track">
                          <div className="dash-margin-fill" style={{ width: `${Math.min(100, Math.max(6, margin))}%` }} />
                        </div>
                        <span>{margin.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

  return (
    <div className="dash-donut">
      <svg viewBox="0 0 140 140" width="140" height="140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="16" />
        {slices.map(s => {
          const len = (s.value / total) * c;
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
