import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { AddVehicleModal } from './AddVehicleModal';
import { VehicleStatus } from '../../../types/fleet';

export const AllVehiclesView: React.FC = () => {
  const { vehicles, searchQuery, updateVehicleStatus } = useFleet();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewRc, setViewRc] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch =
        v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.assignedDriver && v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'All' || v.status === statusFilter;
      const matchType = typeFilter === 'All' || v.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [vehicles, searchQuery, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    let running = 0;
    let idle = 0;
    let maintenance = 0;

    vehicles.forEach(v => {
      if (v.status === 'Running' || v.status === 'Active') running++;
      else if (v.status === 'Idle') idle++;
      else if (v.status === 'Maintenance') maintenance++;
    });

    return {
      total: vehicles.length,
      running,
      idle,
      maintenance
    };
  }, [vehicles]);

  const handleToggleStatus = (id: string, current: VehicleStatus) => {
    const nextStatus: Record<VehicleStatus, VehicleStatus> = {
      Running: 'Idle',
      Active: 'Idle',
      Idle: 'Maintenance',
      Maintenance: 'Running'
    };
    updateVehicleStatus(id, nextStatus[current]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Fleet Stats */}
      <div className="stats-grid">
        <StatCard label="Total Fleet Size" value={stats.total} customColor="var(--accent)" />
        <StatCard label="Running / On Duty" value={stats.running} />
        <StatCard label="Idle in Stand / Yard" value={stats.idle} />
        <StatCard label="Under Maintenance" value={stats.maintenance} customColor={stats.maintenance > 0 ? 'var(--danger)' : undefined} />
      </div>

      {/* Vehicle List Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Master Fleet Roster</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filtered.length} vehicles)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Department">Department</option>
              <option value="Trip-based">Trip-based</option>
            </select>

            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Running">Running / Active</option>
              <option value="Idle">Idle</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px' }}
              onClick={() => setIsModalOpen(true)}
            >
              + Add vehicle
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Registration & Model</th>
                <th>Operation Type</th>
                <th>Assigned Client / Hub</th>
                <th>Designated Driver</th>
                <th>Odometer & Fuel</th>
                <th>FASTag Balance</th>
                <th>Status (Click Toggle)</th>
                <th>RC Document</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No vehicles found. Click "+ Add vehicle" to register one.
                  </td>
                </tr>
              ) : (
                filtered.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)', letterSpacing: '0.5px' }}>
                          {v.registrationNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {v.model || (v.type === 'Department' ? 'Executive Sedan' : 'Commercial MPV')}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`}>
                        {v.type === 'Department' ? '🏛️ Department' : '🧳 Trip-based'}
                      </span>
                    </td>

                    <td style={{ fontWeight: 500 }}>
                      {v.assignedTo}
                    </td>

                    <td>
                      {v.assignedDriver ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{v.assignedDriver}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Assigned</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>Pool / Unassigned</span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {v.odometer ? `${v.odometer.toLocaleString('en-IN')} km` : '42,000 km'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        ⛽ {v.fuelType || 'Diesel'}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '12.5px' }}>
                        ₹{v.fastagBalance ? v.fastagBalance.toLocaleString('en-IN') : '2,450'}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{ cursor: 'pointer' }}
                        title="Click to toggle status"
                        onClick={() => handleToggleStatus(v.id, v.status)}
                      >
                        <StatusChip status={v.status} />
                      </span>
                    </td>

                    <td>
                      {v.rcPhoto ? (
                        <span
                          className="bill-link"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setViewRc(v.rcPhoto!)}
                        >
                          📄 View RC
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* RC Photo Modal */}
      {viewRc && (
        <div className="modal-overlay" onClick={() => setViewRc(null)}>
          <div className="modal-dialog" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📄 Registration Certificate (RC)</h3>
              <button className="modal-close-btn" onClick={() => setViewRc(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              {viewRc.startsWith('data:image') ? (
                <img
                  src={viewRc}
                  alt="Vehicle RC"
                  style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '30px' }}>
                  <div style={{ fontSize: '42px', marginBottom: '10px' }}>📑</div>
                  <div style={{ fontWeight: 600 }}>File: {viewRc}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    Government transport authority registration verified.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewRc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
