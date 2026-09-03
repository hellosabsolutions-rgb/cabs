import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { AddVehicleModal } from './AddVehicleModal';
import { Briefcase, Fuel } from 'lucide-react';

export const TripVehiclesView: React.FC = () => {
  const { vehicles, searchQuery } = useFleet();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tripVehicles = useMemo(() => {
    return vehicles.filter(v => v.type === 'Trip-based');
  }, [vehicles]);

  const filtered = useMemo(() => {
    return tripVehicles.filter(v => {
      const matchSearch =
        v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.meta && v.meta.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.assignedDriver && v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'All' || v.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [tripVehicles, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    let onTrip = 0;
    let available = 0;
    let inMaintenance = 0;
    let totalRev = 0;

    tripVehicles.forEach(v => {
      if (v.status === 'Running' || v.status === 'Active') onTrip++;
      else if (v.status === 'Idle') available++;
      else if (v.status === 'Maintenance') inMaintenance++;
      totalRev += v.revenue;
    });

    return {
      total: tripVehicles.length,
      onTrip,
      available,
      inMaintenance,
      totalRev
    };
  }, [tripVehicles]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Trip Fleet Stats */}
      <div className="stats-grid">
        <StatCard label="Trip & Taxi Fleet" value={stats.total} customColor="var(--accent)" />
        <StatCard label="On Active Trip" value={stats.onTrip} />
        <StatCard label="Available in Stand / Hub" value={stats.available} />
        <StatCard label="Total Trip Revenue (₹)" value={`₹${stats.totalRev.toLocaleString('en-IN')}`} />
      </div>

      {/* Trip Vehicles Table Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Commercial Trip & Rental Fleet</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filtered.length} vehicles)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Trip Statuses</option>
              <option value="Running">On Active Trip (Running)</option>
              <option value="Idle">Available in Stand (Idle)</option>
              <option value="Maintenance">In Workshop (Maintenance)</option>
            </select>

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px' }}
              onClick={() => setIsModalOpen(true)}
            >
              + Add Trip Vehicle
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle & Model</th>
                <th>Operation</th>
                <th>Current Route / Stand</th>
                <th>Driver On Duty</th>
                <th>Odometer & Fuel</th>
                <th>Trip Revenue</th>
                <th>Booking Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No trip vehicles found matching your filter.
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
                          {v.model || 'Commercial MPV / Taxi'}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="tag trip" style={{ fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Briefcase size={11} /> Trip-based
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>
                        {v.meta || 'Delhi NCR Regional Stand'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        Base: Indira Gandhi Intl Airport
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500 }}>{v.assignedDriver || 'Vikas Kumar'}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Commercial Pilot</div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {v.odometer ? `${v.odometer.toLocaleString('en-IN')} km` : '61,200 km'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Fuel size={11} /> {v.fuelType || 'Diesel'}
                      </div>
                    </td>

                    <td className="num" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      ₹{v.revenue.toLocaleString('en-IN')}
                    </td>

                    <td>
                      <StatusChip status={v.status} />
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
        defaultType="Trip-based"
      />
    </div>
  );
};
