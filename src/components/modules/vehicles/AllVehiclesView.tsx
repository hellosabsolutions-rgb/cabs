import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { AddVehicleModal } from './AddVehicleModal';
import { Vehicle, VehicleStatus } from '../../../types/fleet';
import { Building2, Briefcase, Fuel, FileText, Shield, Wind, FileCheck, Award, Eye } from 'lucide-react';

export const AllVehiclesView: React.FC = () => {
  const { vehicles, searchQuery, updateVehicleStatus } = useFleet();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewRc, setViewRc] = useState<string | null>(null);
  const [selectedVehicleDocs, setSelectedVehicleDocs] = useState<Vehicle | null>(null);

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
              <option value="Trip-based">Booking-based</option>
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
                <th>Compliance (5 Docs)</th>
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
                      <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {v.type === 'Department' ? (
                          <>
                            <Building2 size={11} /> Department
                          </>
                        ) : (
                          <>
                            <Briefcase size={11} /> Booking-based
                          </>
                        )}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>
                        {v.departmentName || v.assignedTo}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {v.type === 'Department' ? 'Tender Contract' : 'Booking Stand'}
                      </div>
                    </td>

                    <td>
                      {v.assignedDriver ? (
                        <span style={{ fontWeight: 500 }}>{v.assignedDriver}</span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>Unassigned</span>
                      )}
                    </td>

                    <td>
                      <div>{v.odometer ? `${v.odometer.toLocaleString('en-IN')} km` : '0 km'}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Fuel size={11} /> {v.fuelType || 'Diesel'}
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

                    {/* 5 Compliance Documents */}
                    <td>
                      {(() => {
                        const docs = [
                          { name: 'RC', photo: v.rcPhoto, exp: v.rcExpiry },
                          { name: 'Insurance', photo: v.insurancePhoto, exp: v.insuranceExpiry },
                          { name: 'Pollution', photo: v.pollutionPhoto, exp: v.pollutionExpiry },
                          { name: 'Permit', photo: v.permitPhoto, exp: v.permitExpiry },
                          { name: 'Auth', photo: v.authPhoto, exp: v.authExpiry }
                        ];
                        const count = docs.filter(d => d.photo || d.exp).length;
                        const photoCount = docs.filter(d => d.photo).length;

                        return (
                          <button
                            type="button"
                            className="subtab-btn"
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: count > 0 ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-2)',
                              color: count > 0 ? '#38bdf8' : 'var(--text-faint)',
                              borderColor: count > 0 ? 'rgba(56, 189, 248, 0.3)' : 'var(--border)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedVehicleDocs(v)}
                            title="Click to view all 5 Compliance Documents & Photos"
                          >
                            <FileCheck size={12} />
                            <span>{photoCount > 0 ? `${photoCount}/5 Photos` : `${count}/5 Docs`}</span>
                          </button>
                        );
                      })()}
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

      {/* 5 Compliance Documents Viewer Modal */}
      {selectedVehicleDocs && (
        <div className="modal-overlay" onClick={() => setSelectedVehicleDocs(null)}>
          <div className="modal-dialog" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={18} color="var(--accent)" /> 5 Vehicle Compliance Documents
                </h3>
                <span className="modal-subtitle">
                  {selectedVehicleDocs.registrationNumber} · {selectedVehicleDocs.model || 'Commercial Vehicle'}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedVehicleDocs(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  id: 'rc',
                  name: '1. Registration Certificate (RC)',
                  exp: selectedVehicleDocs.rcExpiry,
                  photo: selectedVehicleDocs.rcPhoto,
                  icon: <FileText size={15} color="#38bdf8" />
                },
                {
                  id: 'insurance',
                  name: '2. Commercial Insurance Policy',
                  exp: selectedVehicleDocs.insuranceExpiry,
                  photo: selectedVehicleDocs.insurancePhoto,
                  icon: <Shield size={15} color="#38bdf8" />
                },
                {
                  id: 'pollution',
                  name: '3. Pollution Under Control (PUCC)',
                  exp: selectedVehicleDocs.pollutionExpiry,
                  photo: selectedVehicleDocs.pollutionPhoto,
                  icon: <Wind size={15} color="#39ff6e" />
                },
                {
                  id: 'permit',
                  name: '4. Commercial Vehicle Permit',
                  exp: selectedVehicleDocs.permitExpiry,
                  photo: selectedVehicleDocs.permitPhoto,
                  icon: <FileCheck size={15} color="#ffcc4d" />
                },
                {
                  id: 'auth',
                  name: '5. Permit Authorization (Auth)',
                  exp: selectedVehicleDocs.authExpiry,
                  photo: selectedVehicleDocs.authPhoto,
                  icon: <Award size={15} color="#a78bfa" />
                }
              ].map(doc => {
                let badgeClass = 'idle';
                let badgeLabel = 'No date set';
                if (doc.exp) {
                  const exp = new Date(doc.exp);
                  const now = new Date();
                  const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  if (diff < 0) {
                    badgeClass = 'maintenance';
                    badgeLabel = `Expired ${Math.abs(diff)}d ago`;
                  } else if (diff <= 30) {
                    badgeClass = 'active';
                    badgeLabel = `Expires in ${diff}d`;
                  } else {
                    badgeClass = 'running';
                    badgeLabel = `Valid (${diff}d left)`;
                  }
                }

                return (
                  <div
                    key={doc.id}
                    style={{
                      background: 'var(--surface-2)',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ flexShrink: 0 }}>{doc.icon}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          Expiry: <b>{doc.exp || 'Not recorded'}</b>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span className={`status-chip ${badgeClass}`} style={{ fontSize: '10.5px' }}>
                        {badgeLabel}
                      </span>
                      {doc.photo ? (
                        <button
                          type="button"
                          className="subtab-btn"
                          style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}
                          onClick={() => setViewRc(doc.photo!)}
                        >
                          <Eye size={11} /> Proof
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>No Photo</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedVehicleDocs(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Document Proof Viewer Modal */}
      {viewRc && (
        <div className="modal-overlay" onClick={() => setViewRc(null)}>
          <div className="modal-dialog" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--accent)" /> Verified Document Scan Copy
              </h3>
              <button className="modal-close-btn" onClick={() => setViewRc(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '16px' }}>
              {viewRc.startsWith('data:image') ? (
                <img
                  src={viewRc}
                  alt="Document Proof"
                  style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <FileText size={42} color="var(--accent)" />
                  </div>
                  <div style={{ fontWeight: 600 }}>File: {viewRc}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    Document stored & verified in KABPRO compliance storage.
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
