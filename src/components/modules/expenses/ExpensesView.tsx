import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';

export const ExpensesView: React.FC = () => {
  const { expenses, searchQuery } = useFleet();

  const filtered = expenses.filter(e =>
    e.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.linkedTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="section active">
      <div className="stats-grid">
        <StatCard label="Fuel" value="₹2,40,000" />
        <StatCard label="FASTag / toll" value="₹70,000" />
        <StatCard label="Driver" value="₹1,80,000" />
        <StatCard label="Maintenance" value="₹60,000" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Expense log</span>
          <span className="panel-link">+ Add expense</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Linked to</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td style={{ fontWeight: 600 }}>{e.vehicle}</td>
                  <td>{e.category}</td>
                  <td>{e.linkedTo}</td>
                  <td className="num">₹{e.amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
