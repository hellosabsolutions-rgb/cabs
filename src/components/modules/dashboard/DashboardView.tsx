import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { chartData } from '../../../data/mockFleetData';
import { IndianRupee, CreditCard, TrendingUp, Truck } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const DashboardView: React.FC = () => {
  const { vehicles, searchQuery, setActivePage, isLoading } = useFleet();

  const filteredVehicles = vehicles.filter(v => 
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.meta && v.meta.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total revenue"
          value="₹11,00,000"
          delta="↑ Dept ₹4.8L · Trip ₹6.2L"
          isUp
          icon={<IndianRupee size={16} />}
        />
        <StatCard
          label="Total expense"
          value="₹5,85,000"
          delta="Fuel · FASTag · Driver · Maint."
          isDown
          icon={<CreditCard size={16} />}
        />
        <StatCard
          label="Net profit"
          value="₹5,15,000"
          delta="↑ 46.8% margin"
          isUp
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Active vehicles"
          value="18 / 21"
          delta="2 idle · 1 in maintenance"
          icon={<Truck size={16} />}
        />
      </div>

      {/* Grid 2 Panels: Revenue Chart & Vehicle Status */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Revenue vs expense — last 6 months</span>
            <span className="panel-link" onClick={() => setActivePage('profitability')}>
              View report
            </span>
          </div>
          <div className="bars">
            {chartData.map((bar, idx) => (
              <div className="bar-col" key={idx}>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ height: `${bar.revenueHeight}%` }}
                  />
                </div>
                <div className="bar-lbl">{bar.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Vehicle status</span>
            <span className="panel-link" onClick={() => setActivePage('vehicles')}>
              All vehicles
            </span>
          </div>

          {vehicles.slice(0, 4).map(v => (
            <div className="status-row" key={v.id}>
              <div className="status-left">
                <div
                  className={`pulse ${
                    v.status === 'Idle'
                      ? 'idle'
                      : v.status === 'Maintenance'
                      ? 'maint'
                      : ''
                  }`}
                />
                <div>
                  <div className="status-name">{v.registrationNumber}</div>
                  <div className="status-meta">{v.meta || v.assignedTo}</div>
                </div>
              </div>
              <StatusChip status={v.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle-wise profit Table */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Vehicle-wise profit</span>
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
                <th>Revenue</th>
                <th>Expense</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.slice(0, 3).map(v => (
                <tr key={v.id}>
                  <td>{v.registrationNumber}</td>
                  <td>
                    <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`}>
                      {v.type === 'Department' ? 'Department' : 'Trip-based'}
                    </span>
                  </td>
                  <td className="num">₹{v.revenue.toLocaleString('en-IN')}</td>
                  <td className="num">₹{v.expense.toLocaleString('en-IN')}</td>
                  <td className="num profit-pos">₹{v.profit.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
