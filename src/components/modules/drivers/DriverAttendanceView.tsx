import React, { useState, useMemo, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { LogAttendanceModal } from './LogAttendanceModal';
import { EditAttendanceModal } from './EditAttendanceModal';
import { AttendanceStatus, DriverAttendance } from '../../../types/fleet';
import { DatePicker } from '../../common/DatePicker';
import {
  Calendar,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Edit2,
  Clock,
  Car,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter
} from 'lucide-react';
import { api } from '../../../services/api';

type AttendanceTimeFrame = 'daily' | 'monthly' | 'yearly';

export const DriverAttendanceView: React.FC = () => {
  const {
    attendanceRecords,
    drivers,
    vehicles,
    updateAttendanceStatus,
    markAttendance,
    bulkMarkAttendance,
    fetchLiveAttendance,
    searchQuery
  } = useFleet();

  // Active View Mode: 'daily' | 'monthly' | 'yearly'
  const [timeFrame, setTimeFrame] = useState<AttendanceTimeFrame>('daily');

  // Daily State
  const [selectedDate, setSelectedDate] = useState('2026-09-02');
  const [dutyFilter, setDutyFilter] = useState<string>('All');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isBulkMarking, setIsBulkMarking] = useState(false);

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState('2026-09'); // YYYY-MM
  const [monthSubTab, setMonthSubTab] = useState<'summary' | 'logs'>('summary');

  // Yearly State
  const [selectedYear, setSelectedYear] = useState('2026'); // YYYY

  // Editing Record State
  const [editingAttendance, setEditingAttendance] = useState<DriverAttendance | null>(null);

  // Live analytics state for monthly and yearly views
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Sync attendance with backend when date, month, or year changes
  useEffect(() => {
    if (timeFrame === 'daily') {
      fetchLiveAttendance(selectedDate);
    } else if (timeFrame === 'monthly') {
      fetchLiveAttendance(selectedMonth);
      fetchAnalytics('month', selectedMonth);
    } else if (timeFrame === 'yearly') {
      fetchLiveAttendance(selectedYear);
      fetchAnalytics('year', selectedYear);
    }
  }, [timeFrame, selectedDate, selectedMonth, selectedYear]);

  const fetchAnalytics = async (period: 'month' | 'year', value: string) => {
    setIsLoadingAnalytics(true);
    try {
      const param = period === 'month' ? `month=${value}` : `year=${value}`;
      const res = await api.get(`/attendance/analytics?period=${period}&${param}`);
      if (res.success) {
        setAnalyticsData(res);
      }
    } catch (err) {
      console.warn('Analytics endpoint fallback:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // -------------------------------------------------------------
  // DAILY VIEW CALCULATIONS
  // -------------------------------------------------------------
  const currentDayRecords = useMemo(() => {
    return attendanceRecords.filter(r => r.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

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

  const filteredDailyRecords = useMemo(() => {
    return driverAttendanceList.filter(item => {
      const matchSearch =
        item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignedVehicle && item.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.dutyType && item.dutyType.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDuty =
        dutyFilter === 'All' ||
        item.dutyType === dutyFilter ||
        (dutyFilter === 'Booking Duty' && (item.dutyType === 'Trip Duty' || item.dutyType === 'Booking Duty'));
      return matchSearch && matchDuty;
    });
  }, [driverAttendanceList, searchQuery, dutyFilter]);

  const dailyStats = useMemo(() => {
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

  const getStatusColorStyle = (st: AttendanceStatus) => {
    switch (st) {
      case 'Present':
        return {
          background: 'rgba(34, 197, 94, 0.12)',
          color: '#22c55e',
          borderColor: 'rgba(34, 197, 94, 0.35)'
        };
      case 'On Trip':
        return {
          background: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          borderColor: 'rgba(56, 189, 248, 0.35)'
        };
      case 'Late':
        return {
          background: 'rgba(234, 179, 8, 0.12)',
          color: '#eab308',
          borderColor: 'rgba(234, 179, 8, 0.35)'
        };
      case 'Absent':
        return {
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          borderColor: 'rgba(239, 68, 68, 0.35)'
        };
      case 'On Leave':
        return {
          background: 'var(--surface-3)',
          color: 'var(--text-dim)',
          borderColor: 'var(--border)'
        };
      default:
        return {
          background: 'var(--surface-2)',
          color: 'var(--text)',
          borderColor: 'var(--border)'
        };
    }
  };

  const renderStatusDropdown = (status: AttendanceStatus, id: string, record: DriverAttendance) => {
    const handleStatusSelect = async (newStatus: AttendanceStatus) => {
      if (newStatus === status) return;
      if (id.startsWith('temp_')) {
        await markAttendance({
          driverId: record.driverId,
          driverName: record.driverName,
          date: record.date || selectedDate,
          status: newStatus,
          checkIn: newStatus === 'Absent' || newStatus === 'On Leave' ? '—' : (record.checkIn && record.checkIn !== '—' ? record.checkIn : '08:30 AM'),
          checkOut: newStatus === 'Absent' || newStatus === 'On Leave' ? '—' : (record.checkOut && record.checkOut !== '—' ? record.checkOut : '06:30 PM'),
          assignedVehicle: record.assignedVehicle,
          dutyType: record.dutyType,
          workingHours: newStatus === 'Absent' || newStatus === 'On Leave' ? 0 : (record.workingHours || 10),
          notes: record.notes
        });
      } else {
        await updateAttendanceStatus(id, newStatus);
      }
    };

    const style = getStatusColorStyle(status);

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={status}
          onChange={e => handleStatusSelect(e.target.value as AttendanceStatus)}
          style={{
            background: style.background,
            color: style.color,
            border: `1px solid ${style.borderColor}`,
            padding: '4px 24px 4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            lineHeight: 1.4
          }}
          title="Click to select status from dropdown"
        >
          <option value="Present" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● Present</option>
          <option value="On Trip" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● On Booking</option>
          <option value="Late" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● Late</option>
          <option value="Absent" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● Absent</option>
          <option value="On Leave" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● On Leave</option>
        </select>
        <ChevronDown
          size={11}
          style={{
            position: 'absolute',
            right: '8px',
            pointerEvents: 'none',
            color: style.color,
            opacity: 0.8
          }}
        />
      </div>
    );
  };

  const handleMarkAllPresent = async () => {
    if (isBulkMarking || drivers.length === 0) return;
    setIsBulkMarking(true);
    try {
      const recordsToMark = drivers.map(d => {
        const exists = currentDayRecords.find(r => r.driverId === d.id);
        return {
          driverId: d.id,
          driverName: d.name,
          date: selectedDate,
          status: 'Present' as AttendanceStatus,
          checkIn: '08:30 AM',
          checkOut: '06:30 PM',
          assignedVehicle: d.assignedVehicle,
          dutyType: (exists?.dutyType || 'Department Duty') as any,
          workingHours: 10,
          notes: exists?.notes || 'Marked present'
        };
      });
      await bulkMarkAttendance(selectedDate, recordsToMark);
    } finally {
      setIsBulkMarking(false);
    }
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

  // -------------------------------------------------------------
  // MONTHLY VIEW CALCULATIONS
  // -------------------------------------------------------------
  const shiftMonth = (deltaMonths: number) => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10) + deltaMonths;
    if (m < 1) {
      m = 12;
      y--;
    } else if (m > 12) {
      m = 1;
      y++;
    }
    const newMonth = `${y}-${String(m).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const formattedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const monthlyRecords = useMemo(() => {
    return attendanceRecords.filter(r => r.date && r.date.startsWith(selectedMonth));
  }, [attendanceRecords, selectedMonth]);

  const filteredMonthlyLogs = useMemo(() => {
    return monthlyRecords.filter(item => {
      const matchSearch =
        item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignedVehicle && item.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.dutyType && item.dutyType.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDuty =
        dutyFilter === 'All' ||
        item.dutyType === dutyFilter ||
        (dutyFilter === 'Booking Duty' && (item.dutyType === 'Trip Duty' || item.dutyType === 'Booking Duty'));
      return matchSearch && matchDuty;
    });
  }, [monthlyRecords, searchQuery, dutyFilter]);

  const monthlyDriverSummary = useMemo(() => {
    if (analyticsData?.period === 'month' && analyticsData?.month === selectedMonth && analyticsData?.driverTotals) {
      return analyticsData.driverTotals;
    }
    // Local fallback calculation
    return drivers.map(d => {
      const recs = monthlyRecords.filter(r => r.driverId === d.id || r.driverName.toLowerCase() === d.name.toLowerCase());
      let present = 0;
      let onTrip = 0;
      let late = 0;
      let absent = 0;
      let leave = 0;
      let hours = 0;

      recs.forEach(r => {
        if (r.status === 'Present') present++;
        else if (r.status === 'On Trip') onTrip++;
        else if (r.status === 'Late') late++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'On Leave') leave++;
        hours += r.workingHours || 0;
      });

      const activeDays = present + onTrip + late;
      const totalLogged = recs.length;
      const rate = totalLogged > 0 ? Math.round((activeDays / totalLogged) * 100) : 0;

      return {
        driverId: d.id,
        driverName: d.name,
        assignedVehicle: d.assignedVehicle,
        driverType: d.driverType,
        totalLogged,
        presentDays: present + onTrip,
        onTripDays: onTrip,
        lateDays: late,
        absentDays: absent,
        leaveDays: leave,
        totalHours: Number(hours.toFixed(1)),
        avgDutyHours: activeDays > 0 ? Number((hours / activeDays).toFixed(1)) : 0,
        attendanceRate: rate
      };
    });
  }, [drivers, monthlyRecords, analyticsData, selectedMonth]);

  const monthStats = useMemo(() => {
    let totalHours = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    monthlyRecords.forEach(r => {
      if (r.status === 'Present' || r.status === 'On Trip') presentCount++;
      else if (r.status === 'Late') lateCount++;
      else if (r.status === 'Absent' || r.status === 'On Leave') absentCount++;
      totalHours += r.workingHours || 0;
    });

    const activeCount = presentCount + lateCount;
    const avgDutyHours = activeCount > 0 ? (totalHours / activeCount).toFixed(1) : '0.0';
    const rate = monthlyRecords.length > 0 ? Math.round((activeCount / monthlyRecords.length) * 100) : 0;

    return {
      totalHours: totalHours.toFixed(1),
      presentCount,
      lateCount,
      absentCount,
      avgDutyHours,
      rate,
      totalShifts: monthlyRecords.length
    };
  }, [monthlyRecords]);

  // -------------------------------------------------------------
  // YEARLY VIEW CALCULATIONS
  // -------------------------------------------------------------
  const yearlyRecords = useMemo(() => {
    return attendanceRecords.filter(r => r.date && r.date.startsWith(selectedYear));
  }, [attendanceRecords, selectedYear]);

  const yearlyDriverSummary = useMemo(() => {
    if (analyticsData?.period === 'year' && analyticsData?.year === selectedYear && analyticsData?.driverTotals) {
      return analyticsData.driverTotals;
    }
    // Local fallback
    return drivers.map(d => {
      const recs = yearlyRecords.filter(r => r.driverId === d.id || r.driverName.toLowerCase() === d.name.toLowerCase());
      let present = 0;
      let late = 0;
      let absent = 0;
      let leave = 0;
      let hours = 0;

      recs.forEach(r => {
        if (r.status === 'Present' || r.status === 'On Trip') present++;
        else if (r.status === 'Late') late++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'On Leave') leave++;
        hours += r.workingHours || 0;
      });

      const totalLogged = recs.length;
      const rate = totalLogged > 0 ? Math.round(((present + late) / totalLogged) * 100) : 0;

      return {
        driverId: d.id,
        driverName: d.name,
        assignedVehicle: d.assignedVehicle,
        driverType: d.driverType,
        totalLogged,
        presentDays: present,
        lateDays: late,
        absentDays: absent,
        leaveDays: leave,
        totalHours: Number(hours.toFixed(1)),
        avgDutyHours: (present + late > 0) ? Number((hours / (present + late)).toFixed(1)) : 0,
        attendanceRate: rate
      };
    });
  }, [drivers, yearlyRecords, analyticsData, selectedYear]);

  const yearlyStats = useMemo(() => {
    let totalHours = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    yearlyRecords.forEach(r => {
      if (r.status === 'Present' || r.status === 'On Trip') presentCount++;
      else if (r.status === 'Late') lateCount++;
      else absentCount++;
      totalHours += r.workingHours || 0;
    });

    const activeCount = presentCount + lateCount;
    const rate = yearlyRecords.length > 0 ? Math.round((activeCount / yearlyRecords.length) * 100) : 0;

    return {
      totalHours: totalHours.toFixed(1),
      presentCount,
      lateCount,
      absentCount,
      rate,
      totalShifts: yearlyRecords.length
    };
  }, [yearlyRecords]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* View Mode Switcher Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div className="subtab-nav" style={{ margin: 0, padding: 0 }}>
          <button
            type="button"
            className={`subtab-btn ${timeFrame === 'daily' ? 'active' : ''}`}
            onClick={() => setTimeFrame('daily')}
          >
            <Calendar size={14} /> Particular Day
          </button>
          <button
            type="button"
            className={`subtab-btn ${timeFrame === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeFrame('monthly')}
          >
            <CalendarDays size={14} /> Monthly View
          </button>
          <button
            type="button"
            className={`subtab-btn ${timeFrame === 'yearly' ? 'active' : ''}`}
            onClick={() => setTimeFrame('yearly')}
          >
            <TrendingUp size={14} /> Yearly View
          </button>
        </div>

        <button
          className="btn-primary-action"
          style={{ fontSize: '12px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setIsLogModalOpen(true)}
        >
          + Log Attendance
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. PARTICULAR DAY (DAILY) VIEW                                  */}
      {/* ============================================================== */}
      {timeFrame === 'daily' && (
        <>
          {/* Daily Stats Cards */}
          <div className="stats-grid">
            <StatCard
              label="Present & On Duty"
              value={`${dailyStats.present} / ${drivers.length}`}
              customColor="var(--accent)"
            />
            <StatCard label="On Bookings" value={`${dailyStats.onTrip}`} />
            <StatCard label="Late / Absent / Leave" value={`${dailyStats.late + dailyStats.absent}`} />
            <StatCard label="Avg Duty Hours" value={`${dailyStats.avgHours} hrs`} />
          </div>

          {/* Daily Date & Navigation Toolbar */}
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={14} color="var(--accent)" /> {formattedDateLabel}
                </span>
                <div style={{ minWidth: '150px' }}>
                  <DatePicker
                    value={selectedDate}
                    onChange={date => setSelectedDate(date)}
                  />
                </div>
              </div>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => shiftDate(1)}
              >
                Next Day &rarr;
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
                style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleMarkAllPresent}
                disabled={isBulkMarking}
                title="Mark all registered drivers present for this date"
              >
                {isBulkMarking ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Marking All...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} /> Mark All Present
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Daily Table */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Daily Attendance Roster</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['All', 'Department Duty', 'Booking Duty', 'Standby'].map(f => (
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
                    <th>Status</th>
                    <th>Remarks / Route</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                        No attendance records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyRecords.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="driver-avatar-circle" style={{ width: 28, height: 28, fontSize: 11 }}>
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
                        <td style={{ fontWeight: 600 }}>{r.workingHours ? `${r.workingHours} hrs` : '0 hrs'}</td>
                        <td>{renderStatusDropdown(r.status, r.id, r)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{r.notes || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setEditingAttendance(r)}
                            title="Edit attendance details"
                          >
                            <Edit2 size={11} color="var(--accent)" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 2. MONTHLY OVERVIEW                                            */}
      {/* ============================================================== */}
      {timeFrame === 'monthly' && (
        <>
          {/* Monthly Stats Cards */}
          <div className="stats-grid">
            <StatCard label="Monthly Duty Hours" value={`${monthStats.totalHours} hrs`} customColor="var(--accent)" />
            <StatCard label="Present Shifts" value={`${monthStats.presentCount}`} />
            <StatCard label="Late / Absent" value={`${monthStats.lateCount + monthStats.absentCount}`} />
            <StatCard label="Attendance Rate" value={`${monthStats.rate}%`} />
          </div>

          {/* Month Navigator Toolbar */}
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
                onClick={() => shiftMonth(-1)}
              >
                ◀ Prev Month
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <CalendarDays size={15} color="var(--accent)" /> {formattedMonthLabel}
                </span>
                <input
                  type="month"
                  className="form-input"
                  style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', display: 'inline-block' }}
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </div>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => shiftMonth(1)}
              >
                Next Month &rarr;
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--accent)' }}
                onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
              >
                This Month
              </button>
            </div>

            {/* Subtabs for Monthly view: Driver Summary vs Detailed Daily Logs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`driver-type-option ${monthSubTab === 'summary' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '12px' }}
                onClick={() => setMonthSubTab('summary')}
              >
                Driver Summary ({monthlyDriverSummary.length})
              </button>
              <button
                className={`driver-type-option ${monthSubTab === 'logs' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: '12px' }}
                onClick={() => setMonthSubTab('logs')}
              >
                All Monthly Logs ({monthlyRecords.length})
              </button>
            </div>
          </div>

          {/* Monthly Driver Summary Table */}
          {monthSubTab === 'summary' && (
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Monthly Driver Attendance Breakdown</span>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{formattedMonthLabel}</span>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Assigned vehicle</th>
                      <th>Type</th>
                      <th>Present days</th>
                      <th>On booking</th>
                      <th>Late</th>
                      <th>Absent / leave</th>
                      <th>Total hours</th>
                      <th>Avg duty / day</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDriverSummary.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                          No drivers registered for this month.
                        </td>
                      </tr>
                    ) : (
                      monthlyDriverSummary.map((item: any) => (
                        <tr key={item.driverId}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="driver-avatar-circle" style={{ width: 28, height: 28, fontSize: 11 }}>
                                {item.driverName.charAt(0)}
                              </div>
                              {item.driverName}
                            </div>
                          </td>
                          <td style={{ fontWeight: 500 }}>{item.assignedVehicle || '—'}</td>
                          <td>
                            <span className="badge-chip">{item.driverType || 'Full Time'}</span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                            {item.presentDays} days
                          </td>
                          <td>{item.onTripDays || 0}</td>
                          <td style={{ color: item.lateDays > 0 ? 'var(--warning)' : 'inherit' }}>
                            {item.lateDays}
                          </td>
                          <td style={{ color: item.absentDays + (item.leaveDays || 0) > 0 ? 'var(--danger)' : 'inherit' }}>
                            {item.absentDays + (item.leaveDays || 0)}
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.totalHours} hrs</td>
                          <td>{item.avgDutyHours} hrs</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, fontSize: '12px' }}>{item.attendanceRate}%</span>
                              <div
                                style={{
                                  width: '40px',
                                  height: '5px',
                                  background: 'var(--surface-3)',
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(100, item.attendanceRate)}%`,
                                    background: item.attendanceRate >= 80 ? 'var(--accent)' : 'var(--warning)'
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Monthly Logs Table with Edit Actions */}
          {monthSubTab === 'logs' && (
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Detailed Monthly Shift Logs</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['All', 'Department Duty', 'Booking Duty', 'Standby'].map(f => (
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
                      <th>Date</th>
                      <th>Driver</th>
                      <th>Assigned vehicle</th>
                      <th>Duty type</th>
                      <th>Check in</th>
                      <th>Check out</th>
                      <th>Duty hours</th>
                      <th>Status</th>
                      <th>Remarks / Route</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonthlyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                          No shift logs found for this month matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredMonthlyLogs.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '12px' }}>{r.date}</td>
                          <td style={{ fontWeight: 600 }}>{r.driverName}</td>
                          <td style={{ fontWeight: 500 }}>{r.assignedVehicle || '—'}</td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                              {r.dutyType || 'Department Duty'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.checkIn || '—'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.checkOut || '—'}</td>
                          <td style={{ fontWeight: 600 }}>{r.workingHours ? `${r.workingHours} hrs` : '0 hrs'}</td>
                          <td>{renderStatusDropdown(r.status, r.id, r)}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{r.notes || '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setEditingAttendance(r)}
                              title="Edit this attendance log"
                            >
                              <Edit2 size={11} color="var(--accent)" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 3. YEARLY ANALYTICS VIEW                                       */}
      {/* ============================================================== */}
      {timeFrame === 'yearly' && (
        <>
          {/* Yearly Stats Cards */}
          <div className="stats-grid">
            <StatCard label="Annual Total Hours" value={`${yearlyStats.totalHours} hrs`} customColor="var(--accent)" />
            <StatCard label="Total Driver Roster" value={`${drivers.length}`} />
            <StatCard label="Annual Shifts" value={`${yearlyStats.totalShifts}`} />
            <StatCard label="Annual Attendance Rate" value={`${yearlyStats.rate}%`} />
          </div>

          {/* Year Navigator Toolbar */}
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
                onClick={() => setSelectedYear(String(parseInt(selectedYear, 10) - 1))}
              >
                ◀ Prev Year
              </button>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <TrendingUp size={16} color="var(--accent)" /> Year:
                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '13px' }}
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                >
                  {['2024', '2025', '2026', '2027', '2028'].map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setSelectedYear(String(parseInt(selectedYear, 10) + 1))}
              >
                Next Year &rarr;
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--accent)' }}
                onClick={() => setSelectedYear(new Date().getFullYear().toString())}
              >
                Current Year
              </button>
            </div>
          </div>

          {/* 12-Month Distribution Matrix */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">12-Month Attendance Matrix ({selectedYear})</span>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Click any month to view detailed breakdown</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
                padding: '16px'
              }}
            >
              {[
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
              ].map((monthName, idx) => {
                const monthCode = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
                const mRecs = yearlyRecords.filter(r => r.date && r.date.startsWith(monthCode));
                let mHours = 0;
                let mPresent = 0;
                let mLate = 0;
                let mAbsent = 0;

                mRecs.forEach(r => {
                  if (r.status === 'Present' || r.status === 'On Trip') mPresent++;
                  else if (r.status === 'Late') mLate++;
                  else mAbsent++;
                  mHours += r.workingHours || 0;
                });

                const rate = mRecs.length > 0 ? Math.round(((mPresent + mLate) / mRecs.length) * 100) : 0;
                const isCurrentSelected = selectedMonth === monthCode;

                return (
                  <div
                    key={monthCode}
                    onClick={() => {
                      setSelectedMonth(monthCode);
                      setTimeFrame('monthly');
                    }}
                    style={{
                      background: isCurrentSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface-2)',
                      border: isCurrentSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, border-color 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = isCurrentSelected ? 'var(--accent)' : 'var(--border)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>{monthName}</span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: rate >= 80 ? 'rgba(34, 197, 94, 0.12)' : mRecs.length === 0 ? 'var(--surface-3)' : 'rgba(234, 179, 8, 0.12)',
                          color: rate >= 80 ? '#22c55e' : mRecs.length === 0 ? 'var(--text-faint)' : '#eab308',
                          fontWeight: 600
                        }}
                      >
                        {mRecs.length > 0 ? `${rate}%` : 'No logs'}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Duty Hours:</span>
                        <strong style={{ color: 'var(--text)' }}>{mHours.toFixed(1)} hrs</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Present / Late:</span>
                        <span style={{ color: 'var(--text)' }}>{mPresent} / {mLate}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Absent / Leave:</span>
                        <span style={{ color: mAbsent > 0 ? 'var(--danger)' : 'inherit' }}>{mAbsent}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Annual Driver Roster Table */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Annual Driver Roster Summary ({selectedYear})</span>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Type</th>
                    <th>Assigned vehicle</th>
                    <th>Total shifts</th>
                    <th>Present days</th>
                    <th>Late days</th>
                    <th>Absent days</th>
                    <th>Annual hours</th>
                    <th>Avg hours/day</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyDriverSummary.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                        No attendance data logged for year {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    yearlyDriverSummary.map((item: any) => (
                      <tr key={item.driverId}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="driver-avatar-circle" style={{ width: 28, height: 28, fontSize: 11 }}>
                              {item.driverName.charAt(0)}
                            </div>
                            {item.driverName}
                          </div>
                        </td>
                        <td>
                          <span className="badge-chip">{item.driverType || 'Full Time'}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{item.assignedVehicle || '—'}</td>
                        <td>{item.totalLogged}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.presentDays}</td>
                        <td style={{ color: item.lateDays > 0 ? 'var(--warning)' : 'inherit' }}>{item.lateDays}</td>
                        <td style={{ color: item.absentDays > 0 ? 'var(--danger)' : 'inherit' }}>{item.absentDays}</td>
                        <td style={{ fontWeight: 600 }}>{item.totalHours} hrs</td>
                        <td>{item.avgDutyHours} hrs</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '12px' }}>{item.attendanceRate}%</span>
                            <div
                              style={{
                                width: '40px',
                                height: '5px',
                                background: 'var(--surface-3)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.min(100, item.attendanceRate)}%`,
                                  background: item.attendanceRate >= 80 ? 'var(--accent)' : 'var(--warning)'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Slide-from-bottom Log Attendance Modal */}
      <LogAttendanceModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        defaultDate={selectedDate}
      />

      {/* Slide-from-bottom Edit Attendance Modal */}
      <EditAttendanceModal
        isOpen={!!editingAttendance}
        record={editingAttendance}
        onClose={() => setEditingAttendance(null)}
      />
    </div>
  );
};
