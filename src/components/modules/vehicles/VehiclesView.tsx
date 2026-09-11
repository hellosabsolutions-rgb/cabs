import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { StatusDropdown } from '../../common/StatusDropdown';
import { AddVehicleModal } from './AddVehicleModal';
import { EditVehicleModal } from './EditVehicleModal';
import { VehicleAvailabilityModal } from '../bookings/VehicleAvailabilityModal';
import { Vehicle, VehicleStatus, VehicleType } from '../../../types/fleet';
import { Truck, Briefcase, Building2, Plus, FileText, RotateCcw, MapPin, Fuel, AlertTriangle, Shield, Wind, FileCheck, Award, Eye, Calendar, Edit2, Trash2 } from 'lucide-react';
import { SkeletonCard, SkeletonTable, SoftRefreshBar } from '../../common/Skeleton';

export const VehiclesView: React.FC = () => {
  const { vehicles, searchQuery, updateVehicleStatus, switchVehicleMode, deleteVehicle, isLoading, isLoadingVehicles } = useFleet();

  const [typeFilter, setTypeFilter] = useState<'All' | VehicleType>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [viewRc, setViewRc] = useState<string | null>(null);
  const [selectedVehicleDocs, setSelectedVehicleDocs] = useState<Vehicle | null>(null);

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

  // First-time load: show full skeleton
  if (isLoadingVehicles && vehicles.length === 0) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={6} columns={7} />
      </div>
    );
  }

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <SoftRefreshBar visible={isLoadingVehicles && vehicles.length > 0} label="Syncing vehicles…" />
      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <StatCard label="Total Fleet Size" value={stats.total} customColor="var(--accent)" />
        <StatCard label="Booking Fleet (Rental / Taxi)" value={stats.tripCount} customColor="#38bdf8" />
        <StatCard label="Department Contract Fleet" value={stats.deptCount} customColor="#ffcc4d" />
        <StatCard label="Running / On Duty" value={stats.running} customColor="var(--success)" />
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
            {/* Vehicle Type Filter (All, Booking, Department) */}
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
              Booking Vehicles ({tripCount})
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

            {/* Check Date Availability Button */}
            <button
              className="btn-secondary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#38bdf8'
              }}
              onClick={() => setIsAvailabilityModalOpen(true)}
              title="Check which vehicles are free/booked on any selected date"
            >
              <Calendar size={13} /> Vehicle Availability
            </button>

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
                <th>Department / Client</th>
                <th>Designated Driver</th>
                <th>Odometer & Fuel</th>
                <th>FASTag Balance</th>
                <th>Vehicle Status</th>
                <th>Compliance (5 Docs)</th>
                <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No vehicles found matching your filter. Click "+ Add Vehicle" to register one.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => (
                  <tr key={v.id}>
                    {/* Registration & Model */}
                    <td>
                      <div>
                        <div
                          onClick={() => setEditingVehicle(v)}
                          style={{
                            fontWeight: 700,
                            color: 'var(--text)',
                            letterSpacing: '0.5px',
                            fontSize: '13.5px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Click to edit vehicle details"
                        >
                          <span>{v.registrationNumber}</span>
                          <Edit2 size={11} color="var(--accent)" style={{ opacity: 0.7 }} />
                        </div>
                        <div
                          className="cell-truncate-md"
                          style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}
                          title={v.model || (v.type === 'Department' ? 'Executive Sedan' : 'Commercial MPV')}
                        >
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
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}
                        >
                          {v.currentOperationMode === 'Trip-based' && v.type === 'Department' ? (
                            <>
                              <Briefcase size={10} /> Weekend Booking Active
                            </>
                          ) : v.type === 'Department' ? (
                            <>
                              <Building2 size={10} /> Dept (Mon-Fri)
                            </>
                          ) : (
                            <>
                              <Briefcase size={10} /> Booking-based
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
                            title="Click to switch vehicle between Department duty and Weekend commercial booking"
                          >
                            {v.currentOperationMode === 'Trip-based' ? (
                              <>
                                <Building2 size={10} /> Return to Dept
                              </>
                            ) : (
                              <>
                                <RotateCcw size={10} /> Sat/Sun Booking Mode
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Assigned Department / Fleet Category */}
                    <td>
                      <div style={{ maxWidth: '200px' }}>
                        <div
                          className="truncate-flex"
                          style={{ fontWeight: 600, color: 'var(--text)' }}
                          title={v.type === 'Department' ? (v.departmentName || v.assignedTo || 'Department Contract') : 'Booking / Rental Fleet'}
                        >
                          {v.type === 'Department' ? (
                            <Building2 size={13} color="#ffcc4d" style={{ flexShrink: 0 }} />
                          ) : (
                            <Briefcase size={13} color="#38bdf8" style={{ flexShrink: 0 }} />
                          )}
                          <span className="text-truncate">
                            {v.type === 'Department' ? (v.departmentName || v.assignedTo || 'Department Contract') : 'Booking / Rental Fleet'}
                          </span>
                        </div>
                        {v.type === 'Department' && (
                          <div
                            className="cell-truncate"
                            style={{ fontSize: '10.5px', color: 'var(--accent)', marginTop: '2px' }}
                            title="Govt Tender Contract"
                          >
                            Govt Tender Contract
                          </div>
                        )}
                        {v.type !== 'Department' && (
                          <div
                            className="cell-truncate"
                            style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}
                            title="Available for Bookings"
                          >
                            Available for Bookings
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Designated Driver */}
                    <td>
                      {v.assignedDriver ? (
                        <div style={{ maxWidth: '140px' }}>
                          <div
                            className="cell-truncate"
                            style={{ fontWeight: 500 }}
                            title={v.assignedDriver}
                          >
                            {v.assignedDriver}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>Assigned Driver</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px', whiteSpace: 'nowrap' }}>Pool / Unassigned</span>
                      )}
                    </td>

                    {/* Odometer & Fuel */}
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {v.odometer !== undefined && v.odometer !== null ? `${Number(v.odometer).toLocaleString('en-IN')} km` : '0 km'}
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

                    {/* Status Dropdown */}
                    <td>
                      <StatusDropdown
                        value={v.status}
                        options={[
                          { value: 'Running', label: 'Running / Active' },
                          { value: 'Idle', label: 'Idle in Yard' },
                          { value: 'Maintenance', label: 'In Maintenance' }
                        ]}
                        onChange={(newStatus) => updateVehicleStatus(v.id, newStatus as VehicleStatus)}
                        title="Change vehicle status"
                      />
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
                    {/* Actions: Edit & Delete */}
                    <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            color: 'var(--accent)',
                            borderColor: 'var(--border)'
                          }}
                          onClick={() => setEditingVehicle(v)}
                          title="Edit vehicle specifications, driver & documents"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            color: 'var(--danger)',
                            borderColor: 'rgba(255, 92, 92, 0.25)'
                          }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove vehicle ${v.registrationNumber} from fleet?`)) {
                              deleteVehicle(v.id);
                            }
                          }}
                          title="Delete vehicle from fleet"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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

      {/* Edit Vehicle Modal Form */}
      <EditVehicleModal
        isOpen={Boolean(editingVehicle)}
        onClose={() => setEditingVehicle(null)}
        vehicle={editingVehicle}
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
                  icon: <Wind size={15} color="var(--success)" />
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

      {/* Vehicle Availability Modal */}
      <VehicleAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
      />
    </div>
  );
};
