import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatusChip } from '../../common/StatusChip';

export const VehiclesView: React.FC = () => {
  const { vehicles, searchQuery } = useFleet();

  const filtered = vehicles.filter(v =>
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="section active">
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Vehicle list</span>
          <span className="panel-link">+ Add vehicle</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Assigned to</th>
                <th>Status</th>
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
                  <td>{v.assignedTo}</td>
                  <td>
                    <StatusChip status={v.status} />
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
