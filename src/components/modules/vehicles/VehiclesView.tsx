import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { AddVehicleModal } from './AddVehicleModal';
import { VehicleStatus, VehicleType } from '../../../types/fleet';
import { Truck, Briefcase, Building2, Plus, FileText, RotateCcw, MapPin, Fuel, AlertTriangle } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const VehiclesView: React.FC = () => {
  const { vehicles, searchQuery, updateVehicleStatus, switchVehicleMode, isLoading } = useFleet();

  const [typeFilter, setTypeFilter] = useState<'All' | VehicleType>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewRc, setViewRc] = useState<string | null>(null);

  const deptCount = vehicles.filter(v => v.type === 'Department').length;
  const tripCount = vehicles.filter(v => v.type === 'Trip-based' || v.currentOperationMode === 'Trip-based').length;

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch =
        v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.assignedDriver && v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType =
        typeFilter === 'All' ||
        v.type === typeFilter ||
        (typeFilter === 'Trip-based' && v.currentOperationMode === 'Trip-based');
      const matchStatus = statusFilter === 'All' || v.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [vehicles, searchQuery, typeFilter, statusFilter]);

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
      tripCount,
      deptCount,
      running,
      idle,
      maintenance
    };
  }, [vehicles, tripCount, deptCount]);

  const handleToggleStatus = (id: string, current: VehicleStatus) => {
    const nextStatus: Record<VehicleStatus, VehicleStatus> = {
      Running: 'Idle',
      Active: 'Idle',
      Idle: 'Maintenance',
      Maintenance: 'Running'
    };
    updateVehicleStatus(id, nextStatus[current]);
  };

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={6} columns={7} />
      </div>
    );
  }

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <StatCard label="Total Fleet Size" value={stats.total} customColor="var(--accent)" />
        <StatCard label="Trip Fleet (Rental / Taxi)" value={stats.tripCount} customColor="#38bdf8" />
        <StatCard label="Department Contract Fleet" value={stats.deptCount} customColor="#ffcc4d" />
        <StatCard label="Running / On Duty" value={stats.running} customColor="#39ff6e" />
      </div>

      {/* Main Vehicles Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Fleet Vehicles</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredVehicles.length} of {vehicles.length} vehicles)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Vehicle Type Filter (All, Trip, Department) */}
            <button
              className={`subtab-btn ${typeFilter === 'All' ? 'active' : ''}`}
              onClick={() => setTypeFilter('All')}
              style={{ padding: '5px 12px', fontSize: '12px' }}
            >
              <Truck size={13} />
              All Vehicles ({vehicles.length})
            </button>

            <button
              className={`subtab-btn ${typeFilter === 'Trip-based' ? 'active' : ''}`}
              onClick={() => setTypeFilter('Trip-based')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                color: typeFilter === 'Trip-based' ? '#38bdf8' : undefined
              }}
            >
              <Briefcase size={13} />
              Trip Vehicles ({tripCount})
            </button>

            <button
              className={`subtab-btn ${typeFilter === 'Department' ? 'active' : ''}`}
              onClick={() => setTypeFilter('Department')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                color: typeFilter === 'Department' ? '#ffcc4d' : undefined
              }}
            >
              <Building2 size={13} />
              Department Vehicles ({deptCount})
            </button>

            {/* Status Filter Dropdown */}
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Running">Running / Active</option>
              <option value="Idle">Idle in Yard</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            {/* Add Vehicle Button */}
            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={14} /> Add Vehicle
            </button>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Registration & Model</th>
                <th>Vehicle Type</th>
                <th>Department / Client (Konse Dept Mai Lagi Hai)</th>
                <th>Designated Driver</th>
                <th>Odometer & Fuel</th>
                <th>FASTag Balance</th>
                <th>Status (Click Toggle)</th>
                <th>RC Document</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No vehicles found matching your filter. Click "+ Add Vehicle" to register one.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => (
                  <tr key={v.id}>
                    {/* Registration & Model */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text)', letterSpacing: '0.5px', fontSize: '13.5px' }}>
                          {v.registrationNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {v.model || (v.type === 'Department' ? 'Executive Sedan' : 'Commercial MPV')}
                        </div>
                      </div>
                    </td>

                    {/* Vehicle Type (Trip vs Department) */}
                    <td>
                      <div>
                        <span
                          className={`tag ${
                            v.currentOperationMode === 'Trip-based'
                              ? 'trip'
                              : v.type === 'Department'
                              ? 'dept'
                              : 'trip'
                          }`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          {v.currentOperationMode === 'Trip-based' && v.type === 'Department' ? (
                            <>
                              <Briefcase size={10} /> Weekend Trip Active
                            </>
                          ) : v.type === 'Department' ? (
                            <>
                              <Building2 size={10} /> Dept (Mon-Fri)
                            </>
                          ) : (
                            <>
                              <Briefcase size={10} /> Trip-based
                            </>
                          )}
                        </span>
                        {v.type === 'Department' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              marginTop: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() =>
                              switchVehicleMode(
                                v.id,
                                v.currentOperationMode === 'Trip-based'
                                  ? 'Department'
                                  : 'Trip-based'
                              )
                            }
                            title="Click to switch vehicle between Department duty and Weekend commercial trip"
                          >
                            {v.currentOperationMode === 'Trip-based' ? (
                              <>
                                <Building2 size={10} /> Return to Dept
                              </>
                            ) : (
                              <>
                                <RotateCcw size={10} /> Sat/Sun Trip Mode
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Assigned Department / Stand (Konse Department Mai Lagi Hai) */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {v.type === 'Department' ? <Building2 size={13} color="#ffcc4d" /> : <MapPin size={13} color="#38bdf8" />} {v.departmentName || v.assignedTo}
                        </div>
                        {v.type === 'Department' && (
                          <div style={{ fontSize: '10.5px', color: 'var(--accent)', marginTop: '2px' }}>
                            Govt Tender Contract
                          </div>
                        )}
                        {v.type === 'Trip-based' && v.assignedTo && v.assignedTo !== v.departmentName && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Base: {v.assignedTo}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Designated Driver */}
                    <td>
                      {v.assignedDriver ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{v.assignedDriver}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Assigned Driver</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>Pool / Unassigned</span>
                      )}
                    </td>

                    {/* Odometer & Fuel */}
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {v.odometer ? `${v.odometer.toLocaleString('en-IN')} km` : '42,000 km'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Fuel size={11} /> {v.fuelType || 'Diesel'}
                      </div>
                    </td>

                    {/* FASTag Balance */}
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: (v.fastagBalance || 0) < 500 ? 'var(--danger)' : 'var(--accent)',
                          fontSize: '12.5px'
                        }}
                      >
                        ₹{(v.fastagBalance || 0).toLocaleString('en-IN')}
                      </span>
                      {(v.fastagBalance || 0) < 500 && (
                        <div style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={10} /> Low
                        </div>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td>
                      <span
                        style={{ cursor: 'pointer' }}
                        title="Click to toggle status"
                        onClick={() => handleToggleStatus(v.id, v.status)}
                      >
                        <StatusChip status={v.status} />
                      </span>
                    </td>

                    {/* RC Document */}
                    <td>
                      {v.rcPhoto ? (
                        <span
                          className="bill-link"
                          style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setViewRc(v.rcPhoto!)}
                        >
                          <FileText size={12} /> View RC
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

      {/* Add Vehicle Modal Form */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultType={typeFilter !== 'All' ? typeFilter : 'Trip-based'}
      />

      {/* RC Document Viewer Modal */}
      {viewRc && (
        <div className="modal-overlay" onClick={() => setViewRc(null)}>
          <div className="modal-dialog" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Vehicle Registration Certificate (RC)
              </h3>
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
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <FileText size={42} color="var(--accent)" />
                  </div>
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
