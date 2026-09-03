import React, { useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatusChip } from '../../common/StatusChip';
import { StatCard } from '../../common/StatCard';
import { AddDriverModal } from './AddDriverModal';
import { DriverAttendanceView } from './DriverAttendanceView';
import { DriverExpensesView } from './DriverExpensesView';
import { DriverType } from '../../../types/fleet';
import { Users, CalendarCheck, Receipt, MapPin } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const DriversView: React.FC = () => {
  const {
    drivers,
    searchQuery,
    driverSubTab,
    setDriverSubTab,
    attendanceRecords,
    driverExpenses,
    isLoading
  } = useFleet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  const filtered = drivers.filter(d => {
    const matchSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.phone && d.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.driverType && d.driverType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchType = selectedTypeFilter === 'All' || d.driverType === selectedTypeFilter;
    const matchStatus = selectedStatusFilter === 'All' || d.status === selectedStatusFilter;

    return matchSearch && matchType && matchStatus;
  });

  const getTypeBadgeClass = (type?: DriverType) => {
    switch (type) {
      case 'Full Time':
        return 'driver-type-badge full-time';
      case 'Part Time':
        return 'driver-type-badge part-time';
      case 'Contract':
        return 'driver-type-badge contract';
      case 'Owner Driver':
        return 'driver-type-badge owner-driver';
      default:
        return 'driver-type-badge';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Summary counts
  const onDutyCount = drivers.filter(d => d.status === 'On duty').length;
  const fullTimeCount = drivers.filter(d => d.driverType === 'Full Time').length;
  const totalExpenseSum = driverExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={6} columns={6} />
      </div>
    );
  }

  return (
    <div className="section active">
      {/* Driver Sub-tabs Navigation */}
      <div className="subtab-nav">
        <button
          className={`subtab-btn ${driverSubTab === 'list' ? 'active' : ''}`}
          onClick={() => setDriverSubTab('list')}
        >
          <Users size={16} />
          Driver list
          <span className="subtab-counter">{drivers.length}</span>
        </button>

        <button
          className={`subtab-btn ${driverSubTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setDriverSubTab('attendance')}
        >
          <CalendarCheck size={16} />
          Attendance
          <span className="subtab-counter">
            {attendanceRecords.filter(a => a.status === 'Present' || a.status === 'On Trip').length} Active
          </span>
        </button>

        <button
          className={`subtab-btn ${driverSubTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setDriverSubTab('expenses')}
        >
          <Receipt size={16} />
          Driver expenses
          <span className="subtab-counter">
            ₹{totalExpenseSum.toLocaleString('en-IN')}
          </span>
        </button>
      </div>

      {/* Sub-view Content */}
      {driverSubTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Roster Stats */}
          <div className="stats-grid">
            <StatCard label="Total Registered Drivers" value={drivers.length} customColor="var(--accent)" />
            <StatCard label="On Duty Right Now" value={onDutyCount} />
            <StatCard label="Full Time Staff" value={fullTimeCount} />
            <StatCard
              label="Contract / Owner Drivers"
              value={drivers.filter(d => d.driverType === 'Contract' || d.driverType === 'Owner Driver').length}
            />
          </div>

          <div className="panel">
            <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="panel-title">Driver Roster & Profiles</span>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                  ({filtered.length} drivers)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Owner Driver">Owner Driver</option>
                </select>

                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="On duty">On duty</option>
                  <option value="Off duty">Off duty</option>
                </select>

                <button
                  className="btn-primary-action"
                  style={{ fontSize: '12px', padding: '7px 16px' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  + Add Driver
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Type</th>
                    <th>Assigned vehicle</th>
                    <th>Emergency contact</th>
                    <th>License No.</th>
                    <th>Joining date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                        No drivers match your criteria. Click "+ Add Driver" to create one.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div className="driver-info-cell">
                            {d.photo ? (
                              <img src={d.photo} alt={d.name} className="driver-avatar-circle" />
                            ) : (
                              <div className="driver-avatar-circle">
                                {getInitials(d.name)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{d.name}</div>
                              {d.phone && (
                                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                                  {d.phone}
                                </div>
                              )}
                              {d.address && (
                                <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <MapPin size={10} /> {d.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={getTypeBadgeClass(d.driverType)}>
                            {d.driverType || 'Full Time'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{d.assignedVehicle || '—'}</td>
                        <td style={{ color: d.emergencyContact ? 'var(--text)' : 'var(--text-faint)' }}>
                          {d.emergencyContact || '—'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-dim)' }}>
                          {d.licenseNumber || '—'}
                        </td>
                        <td>{d.joiningDate}</td>
                        <td>
                          <StatusChip status={d.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Slide-from-bottom Animated Modal */}
          <AddDriverModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      )}

      {driverSubTab === 'attendance' && <DriverAttendanceView />}

      {driverSubTab === 'expenses' && <DriverExpensesView />}
    </div>
  );
};
