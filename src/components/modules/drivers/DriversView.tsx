import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatusChip } from '../../common/StatusChip';

export const DriversView: React.FC = () => {
  const { drivers, searchQuery } = useFleet();

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="section active">
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Driver list</span>
          <span className="panel-link">+ Add driver</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Assigned vehicle</th>
                <th>Joining date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>{d.assignedVehicle}</td>
                  <td>{d.joiningDate}</td>
                  <td>
                    <StatusChip status={d.status} />
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
