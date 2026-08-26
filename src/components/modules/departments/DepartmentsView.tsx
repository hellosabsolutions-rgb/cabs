import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatusChip } from '../../common/StatusChip';

export const DepartmentsView: React.FC = () => {
  const { contracts, searchQuery } = useFleet();

  const filtered = contracts.filter(c =>
    c.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.vehicle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="section active">
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Contract vehicles — monthly billing</span>
          <span className="panel-link">Generate bill</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Vehicle</th>
                <th>Contract amount</th>
                <th>Extra KM / Hours</th>
                <th>Total bill</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.departmentName}</td>
                  <td>{c.vehicle}</td>
                  <td className="num">₹{c.contractAmount.toLocaleString('en-IN')}</td>
                  <td className="num">₹{c.extraKmHoursCost.toLocaleString('en-IN')}</td>
                  <td className="num profit-pos">₹{c.totalBill.toLocaleString('en-IN')}</td>
                  <td>
                    <StatusChip status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
