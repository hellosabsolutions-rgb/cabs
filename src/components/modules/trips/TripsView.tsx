import React from 'react';
import { useFleet } from '../../../context/FleetContext';

export const TripsView: React.FC = () => {
  const { trips, searchQuery } = useFleet();

  const filtered = trips.filter(t =>
    t.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.vehicle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="section active">
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Trip financials</span>
          <span className="panel-link">+ New trip</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Revenue</th>
                <th>Expenses</th>
                <th>Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.route}</td>
                  <td>{t.vehicle}</td>
                  <td className="num">₹{t.revenue.toLocaleString('en-IN')}</td>
                  <td className="num">₹{t.expenses.toLocaleString('en-IN')}</td>
                  <td className="num profit-pos">₹{t.profit.toLocaleString('en-IN')}</td>
                  <td className="num">{t.margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
