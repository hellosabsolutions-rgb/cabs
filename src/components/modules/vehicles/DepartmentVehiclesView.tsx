import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { AddVehicleModal } from './AddVehicleModal';

export const DepartmentVehiclesView: React.FC = () => {
  const { vehicles, searchQuery, departmentContracts } = useFleet();

  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deptVehicles = useMemo(() => {
    return vehicles.filter(v => v.type === 'Department');
  }, [vehicles]);

  const filtered = useMemo(() => {
    return deptVehicles.filter(v => {
      const matchSearch =
        v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.assignedDriver && v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept = deptFilter === 'All' || v.assignedTo === deptFilter;

      return matchSearch && matchDept;
    });
  }, [deptVehicles, searchQuery, deptFilter]);

  const availableDepts = useMemo(() => {
    const set = new Set<string>();
    deptVehicles.forEach(v => set.add(v.assignedTo));
    return Array.from(set);
  }, [deptVehicles]);

  const stats = useMemo(() => {
    let running = 0;
    let activeRevenue = 0;

    deptVehicles.forEach(v => {
      if (v.status === 'Running' || v.status === 'Active') running++;
      activeRevenue += v.revenue;
    });

    return {
      total: deptVehicles.length,
      running,
      contractsCount: departmentContracts.length,
      revenue: activeRevenue
    };
  }, [deptVehicles, departmentContracts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Department Fleet Stats */}
      <div className="stats-grid">
        <StatCard label="Department Fleet Size" value={stats.total} customColor="var(--accent)" />
        <StatCard label="On Active Duty" value={stats.running} />
        <StatCard label="Tender Contracts Active" value={stats.contractsCount} />
        <StatCard label="Contracted Revenue (₹)" value={`₹${stats.revenue.toLocaleString('en-IN')}`} />
      </div>

      {/* Department Vehicles Table Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Dedicated Department Vehicles</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filtered.length} vehicles)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="All">All Client Departments</option>
              {availableDepts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px' }}
              onClick={() => setIsModalOpen(true)}
            >
              + Add Department Vehicle
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle & Model</th>
                <th>Client Department</th>
                <th>Designated Driver</th>
                <th>Odometer & Fuel</th>
                <th>Monthly Contract Rate</th>
                <th>Duty Status</th>
                <th>Tender Contract</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No department vehicles found matching your filter.
                  </td>
                </tr>
              ) : (
                filtered.map(v => {
                  const linkedContract = departmentContracts.find(c => c.vehicle === v.registrationNumber);

                  return (
                    <tr key={v.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', letterSpacing: '0.5px' }}>
                            {v.registrationNumber}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                            {v.model || 'Executive Sedan (Sedan/SUV)'}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="tag dept" style={{ fontWeight: 500 }}>
                          🏛️ {v.assignedTo}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 500 }}>{v.assignedDriver || linkedContract?.driverName || 'Rahul Sharma'}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>Designated Driver</div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px' }}>
                          {v.odometer ? `${v.odometer.toLocaleString('en-IN')} km` : '45,345 km'}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          ⛽ {v.fuelType || 'Diesel'}
                        </div>
                      </td>

                      <td className="num" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        ₹{(linkedContract?.monthlyBaseAmount || v.revenue).toLocaleString('en-IN')}
                      </td>

                      <td>
                        <StatusChip status={v.status} />
                      </td>

                      <td>
                        {linkedContract ? (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 500 }}>{linkedContract.contractNumber}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                              Included: {linkedContract.includedKmPerMonth} km/mo
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>Tender #{v.assignedTo.substring(0, 3)}-2026</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType="Department"
      />
    </div>
  );
};
