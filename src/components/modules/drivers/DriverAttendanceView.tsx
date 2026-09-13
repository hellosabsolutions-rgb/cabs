import React, { useState, useMemo, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { LogAttendanceModal } from './LogAttendanceModal';
import { EditAttendanceModal } from './EditAttendanceModal';
import { AttendanceStatus, DriverAttendance } from '../../../types/fleet';
import { StatusDropdown, StatusOption } from '../../common/StatusDropdown';
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
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

type AttendanceTimeFrame = 'daily' | 'monthly' | 'yearly';

function istTodayString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function istCurrentMonthString() {
  return istTodayString().slice(0, 7);
}

function istCurrentYearString() {
  return istTodayString().slice(0, 4);
}

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
  const [selectedDate, setSelectedDate] = useState(istTodayString);
  const [dutyFilter, setDutyFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isBulkMarking, setIsBulkMarking] = useState(false);

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState(istCurrentMonthString);
  const [monthSubTab, setMonthSubTab] = useState<'summary' | 'logs'>('summary');

  // Yearly State
  const [selectedYear, setSelectedYear] = useState(istCurrentYearString);

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
      // No duty log / attendance yet → absent until driver starts duty from mobile app
      return {
        id: 'temp_' + d.id,
        driverId: d.id,
        driverName: d.name,
        date: selectedDate,
        status: 'Absent' as AttendanceStatus,
        checkIn: '—',
        checkOut: '—',
        assignedVehicle: d.assignedVehicle || '—',
        dutyType: 'Department Duty' as const,
        workingHours: 0,
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
        (dutyFilter === 'Booking Duty' && (item.dutyType === 'Trip Duty' || (item.dutyType as string) === 'Booking Duty'));

      const matchStatus =
        statusFilter === 'All' ||
        item.status === statusFilter ||
        (statusFilter === 'Active' && (item.status === 'Present' || item.status === 'On Trip'));

      return matchSearch && matchDuty && matchStatus;
    });
  }, [driverAttendanceList, searchQuery, dutyFilter, statusFilter]);

  const {
    currentPage: dailyPage,
    setCurrentPage: setDailyPage,
    pageSize: dailyPageSize,
    setPageSize: setDailyPageSize,
    totalItems: totalDailyItems,
    paginatedItems: paginatedDailyRecords
  } = usePagination(filteredDailyRecords, 10);

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
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

      if (!isMongoId || id.startsWith('temp_') || id.startsWith('att')) {
        // Not yet in MongoDB or using mock placeholder ID: upsert via markAttendance
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
        await updateAttendanceStatus(id, newStatus, {
          driverId: record.driverId,
          driverName: record.driverName,
          date: record.date || selectedDate,
          assignedVehicle: record.assignedVehicle,
          dutyType: record.dutyType,
          workingHours: newStatus === 'Absent' || newStatus === 'On Leave' ? 0 : (record.workingHours || 10),
          checkIn: newStatus === 'Absent' || newStatus === 'On Leave' ? '—' : (record.checkIn && record.checkIn !== '—' ? record.checkIn : '08:30 AM'),
          checkOut: newStatus === 'Absent' || newStatus === 'On Leave' ? '—' : (record.checkOut && record.checkOut !== '—' ? record.checkOut : '06:30 PM')
        });
      }
    };

    const attendanceOptions: StatusOption<AttendanceStatus>[] = [
      {
        value: 'Present',
        label: 'Present',
        color: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.12)',
        borderColor: 'rgba(34, 197, 94, 0.35)'
      },
      {
        value: 'On Trip',
        label: 'On Booking',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)',
        borderColor: 'rgba(56, 189, 248, 0.35)'
      },
      {
        value: 'Late',
        label: 'Late',
        color: '#eab308',
        bg: 'rgba(234, 179, 8, 0.12)',
        borderColor: 'rgba(234, 179, 8, 0.35)'
      },
      {
        value: 'Absent',
        label: 'Absent',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)'
      },
      {
        value: 'On Leave',
        label: 'On Leave',
        color: 'var(--text-dim)',
        bg: 'var(--surface-3)',
        borderColor: 'var(--border)'
      }
    ];

    return (
      <StatusDropdown
        value={status}
        options={attendanceOptions}
        onChange={handleStatusSelect}
      />
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
        (dutyFilter === 'Booking Duty' && (item.dutyType === 'Trip Duty' || (item.dutyType as string) === 'Booking Duty'));
      return matchSearch && matchDuty;
    });
  }, [monthlyRecords, searchQuery, dutyFilter]);

  const {
    currentPage: monthlyLogsPage,
    setCurrentPage: setMonthlyLogsPage,
    pageSize: monthlyLogsPageSize,
    setPageSize: setMonthlyLogsPageSize,
    totalItems: totalMonthlyLogsItems,
    paginatedItems: paginatedMonthlyLogs
  } = usePagination(filteredMonthlyLogs, 10);

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

  const {
    currentPage: summaryPage,
    setCurrentPage: setSummaryPage,
    pageSize: summaryPageSize,
    setPageSize: setSummaryPageSize,
    totalItems: totalSummaryItems,
    paginatedItems: paginatedDriverSummary
  } = usePagination(monthlyDriverSummary, 10);

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

  const renderAttendanceDriverCell = (name: string, vehicle?: string) => (
    <div className="driver-info-cell">
      <div className="driver-avatar-circle">{name.charAt(0)}</div>
      <div className="cell-stack">
        <span className="cell-primary">{name}</span>
        <span className="cell-meta">{vehicle || '—'}</span>
      </div>
    </div>
  );

  const renderShiftCell = (r: DriverAttendance) => {
    const start = r.checkIn && r.checkIn !== '—' ? r.checkIn : null;
    const end = r.checkOut && r.checkOut !== '—' ? r.checkOut : null;
    const onDuty = Boolean(start && !end);

    return (
      <div className="cell-stack">
        <span className="cell-primary" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {start ? `Start ${start}` : '—'}
          {end ? ` → End ${end}` : onDuty ? ' → On duty' : ''}
        </span>
        <span className="cell-meta">
          {onDuty ? 'Duty in progress' : r.workingHours ? `${r.workingHours} hrs duty` : 'No duty logged'}
        </span>
      </div>
    );
  };

  return (
    <div className="att-page-wrap">
      {/* View Mode Switcher Header */}
      <div className="att-view-row">
        <div className="att-view-switch">
          <button
            type="button"
            className={timeFrame === 'daily' ? 'active' : ''}
            onClick={() => setTimeFrame('daily')}
          >
            <span>📅</span> Particular day
          </button>
          <button
            type="button"
            className={timeFrame === 'monthly' ? 'active' : ''}
            onClick={() => setTimeFrame('monthly')}
          >
            <span>🗓</span> Monthly view
          </button>
          <button
            type="button"
            className={timeFrame === 'yearly' ? 'active' : ''}
            onClick={() => setTimeFrame('yearly')}
          >
            <span>📈</span> Yearly view
          </button>
        </div>

        <button
          type="button"
          className="btn-att primary"
          onClick={() => setIsLogModalOpen(true)}
        >
          + Log attendance
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. PARTICULAR DAY (DAILY) VIEW                                  */}
      {/* ============================================================== */}
      {timeFrame === 'daily' && (
        <>
          {/* Daily Stats Cards */}
          <div className="att-stats-grid">
            <div className="att-stat-card present">
              <div className="label">Present & on duty</div>
              <div className="value">{dailyStats.present} / {drivers.length}</div>
            </div>
            <div className="att-stat-card">
              <div className="label">On bookings</div>
              <div className="value">{dailyStats.onTrip}</div>
            </div>
            <div className="att-stat-card alert">
              <div className="label">Late / absent / leave</div>
              <div className="value">{dailyStats.late + dailyStats.absent}</div>
            </div>
            <div className="att-stat-card">
              <div className="label">Avg. duty hours</div>
              <div className="value">{dailyStats.avgHours} hrs</div>
            </div>
          </div>

          {/* Consolidated Date Control Card */}
          <div className="att-card">
            <div className="att-date-bar">
              <div className="att-date-nav">
                <button
                  type="button"
                  className="att-date-step"
                  onClick={() => shiftDate(-1)}
                  title="Previous day"
                >
                  ◀
                </button>
                <div
                  className="att-date-display"
                  onClick={() => {
                    const el = document.getElementById('att-date-native-picker');
                    if (el) (el as HTMLInputElement).showPicker?.() || el.click();
                  }}
                  title="Click to select date"
                >
                  <span className="cal">📅</span>
                  <span>{formattedDateLabel}</span>
                  <input
                    id="att-date-native-picker"
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      pointerEvents: 'none',
                      width: 0,
                      height: 0
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="att-date-step"
                  onClick={() => shiftDate(1)}
                  title="Next day"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="att-today-link"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                >
                  Today
                </button>
              </div>

              <button
                type="button"
                className="btn-att"
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
                    <CheckCircle2 size={14} color="#16a34a" /> Mark all present
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="att-card">
            <div className="att-table-head">
              <div>
                <h2>Daily attendance</h2>
                <div className="sub">{formattedDateLabel}</div>
              </div>

              {/* Side Filter Dropdowns */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  className="driver-select"
                  value={dutyFilter}
                  onChange={e => setDutyFilter(e.target.value)}
                  style={{ minWidth: '150px' }}
                >
                  <option value="All">All Duties</option>
                  <option value="Department Duty">Department duty</option>
                  <option value="Booking Duty">Booking duty</option>
                  <option value="Standby">Standby</option>
                </select>

                <select
                  className="driver-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ minWidth: '135px' }}
                >
                  <option value="All">Status: All</option>
                  <option value="Present">Present</option>
                  <option value="On Trip">On Booking</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="att-divider" />

            {paginatedDailyRecords.length === 0 ? (
              <div className="att-empty-box">
                <div className="icon">🗓</div>
                <h3>No attendance logged for this day</h3>
                <p>Log attendance for your drivers, or mark everyone present at once if it's a normal working day.</p>
                <button
                  type="button"
                  className="btn-att primary"
                  onClick={() => setIsLogModalOpen(true)}
                >
                  + Log attendance
                </button>
              </div>
            ) : (
              <>
                <div className="table-responsive table-dense">
                  <table>
                    <thead>
                      <tr>
                        <th>Driver</th>
                        <th>Duty times</th>
                        <th>Duty</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th className="td-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDailyRecords.map(r => (
                        <tr key={r.id}>
                          <td>{renderAttendanceDriverCell(r.driverName, r.assignedVehicle)}</td>
                          <td>{renderShiftCell(r)}</td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                              {r.dutyType || 'Department Duty'}
                            </span>
                          </td>
                          <td>{renderStatusDropdown(r.status, r.id, r)}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: 180 }} className="cell-truncate">
                            {r.notes || '—'}
                          </td>
                          <td className="td-right">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => setEditingAttendance(r)}
                              title="Edit attendance details"
                            >
                              <Edit2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={dailyPage}
                  totalItems={totalDailyItems}
                  pageSize={dailyPageSize}
                  onPageChange={setDailyPage}
                  onPageSizeChange={setDailyPageSize}
                  itemLabel="records"
                />
              </>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 2. MONTHLY OVERVIEW                                            */}
      {/* ============================================================== */}
      {timeFrame === 'monthly' && (
        <>
          {/* Monthly Stats Cards */}
          <div className="att-stats-grid">
            <div className="att-stat-card">
              <div className="label">Monthly duty hours</div>
              <div className="value">{monthStats.totalHours} hrs</div>
            </div>
            <div className="att-stat-card present">
              <div className="label">Present shifts</div>
              <div className="value">{monthStats.presentCount}</div>
            </div>
            <div className="att-stat-card alert">
              <div className="label">Late / absent</div>
              <div className="value">{monthStats.lateCount + monthStats.absentCount}</div>
            </div>
            <div className="att-stat-card">
              <div className="label">Attendance rate</div>
              <div className="value">{monthStats.rate}%</div>
            </div>
          </div>

          {/* Month Navigator Control Card */}
          <div className="att-card">
            <div className="att-date-bar">
              <div className="att-date-nav">
                <button
                  type="button"
                  className="att-date-step"
                  onClick={() => shiftMonth(-1)}
                  title="Previous month"
                >
                  ◀
                </button>
                <div
                  className="att-date-display"
                  onClick={() => {
                    const el = document.getElementById('att-month-native-picker');
                    if (el) (el as HTMLInputElement).showPicker?.() || el.click();
                  }}
                  title="Click to select month"
                >
                  <span className="cal">🗓</span>
                  <span>{formattedMonthLabel}</span>
                  <input
                    id="att-month-native-picker"
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      pointerEvents: 'none',
                      width: 0,
                      height: 0
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="att-date-step"
                  onClick={() => shiftMonth(1)}
                  title="Next month"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="att-today-link"
                  onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
                >
                  This Month
                </button>
              </div>

              {/* Subtabs for Monthly view in unified pill group */}
              <div className="att-pill-group">
                <button
                  type="button"
                  className={monthSubTab === 'summary' ? 'active' : ''}
                  onClick={() => setMonthSubTab('summary')}
                >
                  Driver summary ({monthlyDriverSummary.length})
                </button>
                <button
                  type="button"
                  className={monthSubTab === 'logs' ? 'active' : ''}
                  onClick={() => setMonthSubTab('logs')}
                >
                  All monthly logs ({monthlyRecords.length})
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Driver Summary Table */}
          {monthSubTab === 'summary' && (
            <div className="att-card">
              <div className="att-table-head">
                <div>
                  <h2>Monthly driver attendance</h2>
                  <div className="sub">{formattedMonthLabel}</div>
                </div>
              </div>

              <div className="att-divider" />

              <div className="table-responsive table-dense">
                <table>
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Type</th>
                      <th>Days breakdown</th>
                      <th className="td-right">Hours</th>
                      <th className="td-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDriverSummary.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                          No drivers registered for this month.
                        </td>
                      </tr>
                    ) : (
                      paginatedDriverSummary.map((item: any) => (
                        <tr key={item.driverId}>
                          <td>{renderAttendanceDriverCell(item.driverName, item.assignedVehicle)}</td>
                          <td>
                            <span className="badge-chip">{item.driverType || 'Full Time'}</span>
                          </td>
                          <td>
                            <div className="cell-breakdown">
                              <span style={{ color: '#16a34a' }}>Present {item.presentDays}</span>
                              <span>Booking {item.onTripDays || 0}</span>
                              <span style={{ color: item.lateDays > 0 ? 'var(--warning)' : undefined }}>Late {item.lateDays}</span>
                              <span style={{ color: item.absentDays + (item.leaveDays || 0) > 0 ? '#dc2626' : undefined }}>
                                Absent {item.absentDays + (item.leaveDays || 0)}
                              </span>
                            </div>
                          </td>
                          <td className="td-right">
                            <div className="cell-money-pair" style={{ alignItems: 'flex-end' }}>
                              <span className="paid">{item.totalHours} hrs total</span>
                              <span className="pending">{item.avgDutyHours} hrs avg</span>
                            </div>
                          </td>
                          <td className="td-right">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '12px' }}>{item.attendanceRate}%</span>
                              <div
                                style={{
                                  width: '36px',
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
                                    background: item.attendanceRate >= 80 ? '#16a34a' : 'var(--warning)'
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
            <div className="att-card">
              <div className="att-table-head">
                <div>
                  <h2>Monthly shift logs</h2>
                  <div className="sub">{formattedMonthLabel}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    className="driver-select"
                    value={dutyFilter}
                    onChange={e => setDutyFilter(e.target.value)}
                    style={{ minWidth: '150px' }}
                  >
                    <option value="All">All Duties</option>
                    <option value="Department Duty">Department duty</option>
                    <option value="Booking Duty">Booking duty</option>
                    <option value="Standby">Standby</option>
                  </select>
                </div>
              </div>

              <div className="att-divider" />

              <div className="table-responsive table-dense">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Driver</th>
                      <th>Duty times</th>
                      <th>Duty</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th className="td-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMonthlyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                          No shift logs found for this month matching criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedMonthlyLogs.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{r.date}</td>
                          <td>{renderAttendanceDriverCell(r.driverName, r.assignedVehicle)}</td>
                          <td>{renderShiftCell(r)}</td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                              {r.dutyType || 'Department Duty'}
                            </span>
                          </td>
                          <td>{renderStatusDropdown(r.status, r.id, r)}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: 180 }} className="cell-truncate">
                            {r.notes || '—'}
                          </td>
                          <td className="td-right">
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => setEditingAttendance(r)}
                              title="Edit this attendance log"
                            >
                              <Edit2 size={14} />
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
          <div className="att-stats-grid">
            <div className="att-stat-card">
              <div className="label">Annual total hours</div>
              <div className="value">{yearlyStats.totalHours} hrs</div>
            </div>
            <div className="att-stat-card">
              <div className="label">Total driver roster</div>
              <div className="value">{drivers.length}</div>
            </div>
            <div className="att-stat-card">
              <div className="label">Annual shifts</div>
              <div className="value">{yearlyStats.totalShifts}</div>
            </div>
            <div className="att-stat-card present">
              <div className="label">Annual attendance rate</div>
              <div className="value">{yearlyStats.rate}%</div>
            </div>
          </div>

          {/* Year Navigator Control Card */}
          <div className="att-card">
            <div className="att-date-bar">
              <div className="att-date-nav">
                <button
                  type="button"
                  className="att-date-step"
                  onClick={() => setSelectedYear(String(parseInt(selectedYear, 10) - 1))}
                  title="Previous year"
                >
                  ◀
                </button>
                <div className="att-date-display">
                  <TrendingUp size={15} color="var(--accent)" />
                  <span>Year:</span>
                  <select
                    className="driver-select"
                    style={{ padding: '2px 24px 2px 8px', fontSize: '13px', height: '28px', border: 'none' }}
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
                  type="button"
                  className="att-date-step"
                  onClick={() => setSelectedYear(String(parseInt(selectedYear, 10) + 1))}
                  title="Next year"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="att-today-link"
                  onClick={() => setSelectedYear(new Date().getFullYear().toString())}
                >
                  Current Year
                </button>
              </div>
            </div>
          </div>

          {/* 12-Month Distribution Matrix */}
          <div className="att-card">
            <div className="att-table-head">
              <div>
                <h2>12-Month attendance matrix</h2>
                <div className="sub">Click any month to view detailed breakdown ({selectedYear})</div>
              </div>
            </div>

            <div className="att-divider" />

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
                      background: isCurrentSelected ? 'var(--accent-dim)' : 'var(--surface-2)',
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
                          color: rate >= 80 ? '#16a34a' : mRecs.length === 0 ? 'var(--text-faint)' : '#eab308',
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
                        <span style={{ color: mAbsent > 0 ? '#dc2626' : 'inherit' }}>{mAbsent}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Annual Driver Roster Table */}
          <div className="att-card">
            <div className="att-table-head">
              <div>
                <h2>Annual driver roster</h2>
                <div className="sub">{selectedYear}</div>
              </div>
            </div>

            <div className="att-divider" />

            <div className="table-responsive table-dense">
              <table>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Type</th>
                    <th>Days breakdown</th>
                    <th className="td-right">Hours</th>
                    <th className="td-right">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyDriverSummary.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                        No attendance data logged for year {selectedYear}.
                      </td>
                    </tr>
                  ) : (
                    yearlyDriverSummary.map((item: any) => (
                      <tr key={item.driverId}>
                        <td>{renderAttendanceDriverCell(item.driverName, item.assignedVehicle)}</td>
                        <td>
                          <span className="badge-chip">{item.driverType || 'Full Time'}</span>
                        </td>
                        <td>
                          <div className="cell-breakdown">
                            <span>Shifts {item.totalLogged}</span>
                            <span style={{ color: '#16a34a' }}>Present {item.presentDays}</span>
                            <span style={{ color: item.lateDays > 0 ? 'var(--warning)' : undefined }}>Late {item.lateDays}</span>
                            <span style={{ color: item.absentDays > 0 ? '#dc2626' : undefined }}>Absent {item.absentDays}</span>
                          </div>
                        </td>
                        <td className="td-right">
                          <div className="cell-money-pair" style={{ alignItems: 'flex-end' }}>
                            <span className="paid">{item.totalHours} hrs total</span>
                            <span className="pending">{item.avgDutyHours} hrs avg</span>
                          </div>
                        </td>
                        <td className="td-right">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
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
                                  background: item.attendanceRate >= 80 ? '#16a34a' : 'var(--warning)'
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
