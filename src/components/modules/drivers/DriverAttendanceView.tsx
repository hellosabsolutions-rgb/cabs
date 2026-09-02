import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { LogAttendanceModal } from './LogAttendanceModal';
import { AttendanceStatus, DriverAttendance } from '../../../types/fleet';

export const DriverAttendanceView: React.FC = () => {
  const {
    attendanceRecords,
    drivers,
    updateAttendanceStatus,
    markAttendance,
    searchQuery
  } = useFleet();

  const [selectedDate, setSelectedDate] = useState('2026-09-02');
  const [dutyFilter, setDutyFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter attendance records by date, searchQuery, and duty filter
  const currentDayRecords = useMemo(() => {
    return attendanceRecords.filter(r => r.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  // Combine drivers list with attendance records for full daily view
  const driverAttendanceList: DriverAttendance[] = useMemo(() => {
    return drivers.map(d => {
      const existing = currentDayRecords.find(r => r.driverId === d.id);
      if (existing) return existing;
      // Default placeholder if not marked yet
      return {
        id: 'temp_' + d.id,
        driverId: d.id,
        driverName: d.name,
        date: selectedDate,
        status: (d.status === 'On duty' ? 'Present' : 'Absent') as AttendanceStatus,
        checkIn: d.status === 'On duty' ? '08:30 AM' : '—',
        checkOut: d.status === 'On duty' ? '06:30 PM' : '—',
        assignedVehicle: d.assignedVehicle,
        dutyType: 'Department Duty' as const,
        workingHours: d.status === 'On duty' ? 10 : 0,
        notes: undefined
      };
    });
  }, [drivers, currentDayRecords, selectedDate]);

  const filteredRecords = useMemo(() => {
    return driverAttendanceList.filter(item => {
      const matchSearch =
        item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignedVehicle && item.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.dutyType && item.dutyType.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDuty = dutyFilter === 'All' || item.dutyType === dutyFilter;

      return matchSearch && matchDuty;
    });
  }, [driverAttendanceList, searchQuery, dutyFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    let present = 0;
    let onTrip = 0;
    let late = 0;
    let absent = 0;
    let totalHours = 0;

    driverAttendanceList.forEach(r => {
      if (r.status === 'Present') present++;
      else if (r.status === 'On Trip') onTrip++;
      else if (r.status === 'Late') late++;
      else absent++;

      totalHours += r.workingHours || 0;
    });

    const activeCount = present + onTrip + late;
    const avgHours = activeCount > 0 ? (totalHours / activeCount).toFixed(1) : '0.0';

    return {
      present: present + onTrip,
      onTrip,
      late,
      absent,
      totalHours: totalHours.toFixed(1),
      avgHours
    };
  }, [driverAttendanceList]);

  const getStatusBadge = (status: AttendanceStatus, id: string, record: typeof driverAttendanceList[0]) => {
    const handleStatusClick = (newStatus: AttendanceStatus) => {
      if (id.startsWith('temp_')) {
        markAttendance({
          driverId: record.driverId,
          driverName: record.driverName,
          date: selectedDate,
          status: newStatus,
          checkIn: newStatus === 'Absent' || newStatus === 'On Leave' ? '—' : '08:30 AM',
          checkOut: newStatus === 'Absent' || newStatus === 'On Leave' ? '—' : '06:30 PM',
          assignedVehicle: record.assignedVehicle,
          dutyType: record.dutyType,
          workingHours: newStatus === 'Absent' || newStatus === 'On Leave' ? 0 : 10,
          notes: record.notes
        });
      } else {
        updateAttendanceStatus(id, newStatus);
      }
    };

    switch (status) {
      case 'Present':
        return (
          <span
            className="status-chip running"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={() => handleStatusClick('Late')}
          >
            ● Present
          </span>
        );
      case 'On Trip':
        return (
          <span
            className="status-chip active"
            style={{ cursor: 'pointer', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}
            title="Click to toggle status"
            onClick={() => handleStatusClick('Present')}
          >
            ● On Trip
          </span>
        );
      case 'Late':
        return (
          <span
            className="status-chip idle"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={() => handleStatusClick('Absent')}
          >
            ● Late
          </span>
        );
      case 'Absent':
        return (
          <span
            className="status-chip maintenance"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={() => handleStatusClick('On Leave')}
          >
            ● Absent
          </span>
        );
      case 'On Leave':
        return (
          <span
            className="status-chip"
            style={{ cursor: 'pointer', background: 'var(--surface-3)', color: 'var(--text-dim)' }}
            title="Click to toggle status"
            onClick={() => handleStatusClick('Present')}
          >
            ● On Leave
          </span>
        );
      default:
        return <span className="status-chip">{status}</span>;
    }
  };

  const handleMarkAllPresent = () => {
    drivers.forEach(d => {
      const exists = currentDayRecords.find(r => r.driverId === d.id);
      if (exists) {
        updateAttendanceStatus(exists.id, 'Present');
      } else {
        markAttendance({
          driverId: d.id,
          driverName: d.name,
          date: selectedDate,
          status: 'Present',
          checkIn: '08:30 AM',
          checkOut: '06:30 PM',
          assignedVehicle: d.assignedVehicle,
          dutyType: 'Department Duty',
          workingHours: 10,
          notes: 'Auto-marked attendance'
        });
      }
    });
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formattedDateLabel = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [selectedDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Attendance Stats Cards */}
      <div className="stats-grid">
        <StatCard label="Present & On Duty" value={`${stats.present} / ${drivers.length}`} customColor="var(--accent)" />
        <StatCard label="On Trips" value={`${stats.onTrip}`} />
        <StatCard label="Late / Absent / Leave" value={`${stats.late + stats.absent}`} />
        <StatCard label="Avg Duty Hours" value={`${stats.avgHours} hrs`} />
      </div>

      {/* Date & Filter Toolbar */}
      <div
        className="panel"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => shiftDate(-1)}
          >
            ◀ Prev Day
          </button>
          <div
            style={{
              fontWeight: 600,
              fontSize: '13.5px',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>📅 {formattedDateLabel}</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', display: 'inline-block' }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => shiftDate(1)}
          >
            Next Day ▶
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--accent)' }}
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '7px 14px' }}
            onClick={handleMarkAllPresent}
            title="Mark all registered drivers present for this date"
          >
            ✓ Mark All Present
          </button>
          <button
            className="btn-primary-action"
            style={{ fontSize: '12px', padding: '7px 16px' }}
            onClick={() => setIsModalOpen(true)}
          >
            + Log Attendance
          </button>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Daily Attendance Roster</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['All', 'Department Duty', 'Trip Duty', 'Standby'].map(f => (
              <button
                key={f}
                className={`driver-type-option ${dutyFilter === f ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setDutyFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Assigned vehicle</th>
                <th>Duty type</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Duty hours</th>
                <th>Status (Click to toggle)</th>
                <th>Remarks / Route</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No attendance records match your search query.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className="driver-avatar-circle"
                          style={{ width: 28, height: 28, fontSize: 11 }}
                        >
                          {r.driverName.charAt(0)}
                        </div>
                        {r.driverName}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.assignedVehicle || '—'}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {r.dutyType || 'Department Duty'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.checkIn || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.checkOut || '—'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {r.workingHours ? `${r.workingHours} hrs` : '0 hrs'}
                    </td>
                    <td>{getStatusBadge(r.status, r.id, r)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-from-bottom Log Attendance Modal */}
      <LogAttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDate={selectedDate}
      />
    </div>
  );
};
