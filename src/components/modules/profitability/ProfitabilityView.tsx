import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';

export const ProfitabilityView: React.FC = () => {
  const { vehicles, searchQuery } = useFleet();

  const filtered = vehicles.filter(v =>
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="section active">
      <div className="stats-grid">
        <StatCard label="Department profit" value="₹1,85,000" customColor="var(--accent)" />
        <StatCard label="Trip profit" value="₹3,30,000" customColor="var(--accent)" />
        <StatCard label="Overall profit" value="₹5,15,000" customColor="var(--accent)" />
        <StatCard label="Margin" value="46.8%" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Vehicle-wise profit and loss</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Model</th>
                <th>Revenue</th>
                <th>Expense</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.registrationNumber}</td>
                  <td>
                    <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`}>
                      {v.type}
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
