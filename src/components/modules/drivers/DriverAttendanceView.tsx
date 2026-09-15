import React, { useState, useMemo, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { EditAttendanceModal } from './EditAttendanceModal';
import { FilterDropdown } from '../../common/FilterDropdown';
import {
  AttendanceStatus,
  DriverAttendance,
  isPresentAttendance,
  normalizeAttendanceStatus
} from '../../../types/fleet';
import { StatusDropdown, StatusOption } from '../../common/StatusDropdown';
import { DatePicker } from '../../common/DatePicker';
import {
  Calendar,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { api } from '../../../services/api';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

type AttendanceTimeFrame = 'daily' | 'monthly' | 'yearly';

const DUTY_FILTER_OPTIONS = [
  { value: 'All', label: 'All duties' },
  { value: 'Department Duty', label: 'Department duty' },
  { value: 'Booking Duty', label: 'Booking duty' },
  { value: 'Standby', label: 'Standby' }
];

const STATUS_FILTER_OPTIONS = [
  { value: 'All', label: 'All status' },
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' }
];

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
        (statusFilter === 'Present' && isPresentAttendance(item.status)) ||
        (statusFilter === 'Absent' && !isPresentAttendance(item.status));

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
    let absent = 0;
    let totalHours = 0;

    driverAttendanceList.forEach(r => {
      if (isPresentAttendance(r.status)) present++;
      else absent++;
      totalHours += r.workingHours || 0;
    });

    const avgHours = present > 0 ? (totalHours / present).toFixed(1) : '0.0';

    return {
      present,
      absent,
      totalHours: totalHours.toFixed(1),
      avgHours
    };
  }, [driverAttendanceList]);

  const renderStatusDropdown = (status: AttendanceStatus, id: string, record: DriverAttendance) => {
    const displayStatus = normalizeAttendanceStatus(status);

    const handleStatusSelect = async (newStatus: AttendanceStatus) => {
      if (newStatus === displayStatus) return;
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);

      if (!isMongoId || id.startsWith('temp_') || id.startsWith('att')) {
        // Not yet in MongoDB or using mock placeholder ID: upsert via markAttendance
        await markAttendance({
          driverId: record.driverId,
          driverName: record.driverName,
          date: record.date || selectedDate,
          status: newStatus,
          checkIn: newStatus === 'Absent' ? '—' : (record.checkIn && record.checkIn !== '—' ? record.checkIn : '08:30 AM'),
          checkOut: newStatus === 'Absent' ? '—' : (record.checkOut && record.checkOut !== '—' ? record.checkOut : '06:30 PM'),
          assignedVehicle: record.assignedVehicle,
          dutyType: record.dutyType,
          workingHours: newStatus === 'Absent' ? 0 : (record.workingHours || 10),
          notes: record.notes
        });
      } else {
        await updateAttendanceStatus(id, newStatus, {
          driverId: record.driverId,
          driverName: record.driverName,
          date: record.date || selectedDate,
          assignedVehicle: record.assignedVehicle,
          dutyType: record.dutyType,
          workingHours: newStatus === 'Absent' ? 0 : (record.workingHours || 10),
          checkIn: newStatus === 'Absent' ? '—' : (record.checkIn && record.checkIn !== '—' ? record.checkIn : '08:30 AM'),
          checkOut: newStatus === 'Absent' ? '—' : (record.checkOut && record.checkOut !== '—' ? record.checkOut : '06:30 PM')
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
        value: 'Absent',
        label: 'Absent',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.35)'
      }
    ];

    return (
      <StatusDropdown
        value={displayStatus}
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
      let absent = 0;
      let hours = 0;

      recs.forEach(r => {
        if (isPresentAttendance(r.status)) present++;
        else absent++;
        hours += r.workingHours || 0;
      });

      const totalLogged = recs.length;
      const rate = totalLogged > 0 ? Math.round((present / totalLogged) * 100) : 0;

      return {
        driverId: d.id,
        driverName: d.name,
        assignedVehicle: d.assignedVehicle,
        driverType: d.driverType,
        totalLogged,
        presentDays: present,
        absentDays: absent,
        totalHours: Number(hours.toFixed(1)),
        avgDutyHours: present > 0 ? Number((hours / present).toFixed(1)) : 0,
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
    let absentCount = 0;

    monthlyRecords.forEach(r => {
      if (isPresentAttendance(r.status)) presentCount++;
      else absentCount++;
      totalHours += r.workingHours || 0;
    });

    const avgDutyHours = presentCount > 0 ? (totalHours / presentCount).toFixed(1) : '0.0';
    const rate = monthlyRecords.length > 0 ? Math.round((presentCount / monthlyRecords.length) * 100) : 0;

    return {
      totalHours: totalHours.toFixed(1),
      presentCount,
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
      let absent = 0;
      let hours = 0;

      recs.forEach(r => {
        if (isPresentAttendance(r.status)) present++;
        else absent++;
        hours += r.workingHours || 0;
      });

      const totalLogged = recs.length;
      const rate = totalLogged > 0 ? Math.round((present / totalLogged) * 100) : 0;

      return {
        driverId: d.id,
        driverName: d.name,
        assignedVehicle: d.assignedVehicle,
        driverType: d.driverType,
        totalLogged,
        presentDays: present,
        absentDays: absent,
        totalHours: Number(hours.toFixed(1)),
        avgDutyHours: present > 0 ? Number((hours / present).toFixed(1)) : 0,
        attendanceRate: rate
      };
    });
  }, [drivers, yearlyRecords, analyticsData, selectedYear]);

  const yearlyStats = useMemo(() => {
    let totalHours = 0;
    let presentCount = 0;
    let absentCount = 0;

    yearlyRecords.forEach(r => {
      if (isPresentAttendance(r.status)) presentCount++;
      else absentCount++;
      totalHours += r.workingHours || 0;
    });

    const rate = yearlyRecords.length > 0 ? Math.round((presentCount / yearlyRecords.length) * 100) : 0;

    return {
      totalHours: totalHours.toFixed(1),
      presentCount,
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

  return (
    <div className="att-page-wrap">
      <div className="att-view-row">
        <div className="att-view-switch">
          <button
            type="button"
            className={timeFrame === 'daily' ? 'active' : ''}
            onClick={() => setTimeFrame('daily')}
          >
            <Calendar size={14} /> Day
          </button>
          <button
            type="button"
            className={timeFrame === 'monthly' ? 'active' : ''}
            onClick={() => setTimeFrame('monthly')}
          >
            <CalendarDays size={14} /> Month
          </button>
          <button
            type="button"
            className={timeFrame === 'yearly' ? 'active' : ''}
            onClick={() => setTimeFrame('yearly')}
          >
            <TrendingUp size={14} /> Year
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. PARTICULAR DAY (DAILY) VIEW                                  */}
      {/* ============================================================== */}
      {timeFrame === 'daily' && (
        <>
          {/* Daily Stats Cards */}
          <div className="att-stats-grid att-stats-grid--3">
            <div className="att-stat-card present">
              <div className="label">Present</div>
              <div className="value">{dailyStats.present} / {drivers.length}</div>
            </div>
            <div className="att-stat-card alert">
              <div className="label">Absent</div>
              <div className="value">{dailyStats.absent}</div>
            </div>
            <div className="att-stat-card">
              <div className="label">Avg. duty hours</div>
              <div className="value">{dailyStats.avgHours} hrs</div>
            </div>
          </div>

          <div className="att-card">
            <div className="module-filter-bar">
              <div className="module-filter-bar__group">
                <div className="period-nav">
                  <button
                    type="button"
                    className="att-date-step"
                    onClick={() => shiftDate(-1)}
                    title="Previous day"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <DatePicker value={selectedDate} onChange={date => date && setSelectedDate(date)} />
                  <button
                    type="button"
                    className="att-date-step"
                    onClick={() => shiftDate(1)}
                    title="Next day"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="att-today-link"
                    onClick={() => setSelectedDate(istTodayString())}
                  >
                    Today
                  </button>
                </div>

                <FilterDropdown
                  value={dutyFilter}
                  options={DUTY_FILTER_OPTIONS}
                  onChange={setDutyFilter}
                  icon={<Briefcase size={13} />}
                  title="Filter by duty"
                />
                <FilterDropdown
                  value={statusFilter}
                  options={STATUS_FILTER_OPTIONS}
                  onChange={setStatusFilter}
                  icon={<CheckCircle2 size={13} />}
                  title="Filter by status"
                />
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
                    <Loader2 size={13} className="spin-loader" /> Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Mark all present
                  </>
                )}
              </button>
            </div>

            {paginatedDailyRecords.length === 0 ? (
              <div className="att-empty-box">
                <div className="icon">
                  <CalendarDays size={22} />
                </div>
                <h3>
                  {drivers.length === 0
                    ? 'No drivers on the roster'
                    : dutyFilter !== 'All' || statusFilter !== 'All'
                      ? 'No records match these filters'
                      : 'No attendance for this day'}
                </h3>
                <p>
                  {drivers.length === 0
                    ? 'Add drivers first. Attendance is logged when they start duty from the app.'
                    : dutyFilter !== 'All' || statusFilter !== 'All'
                      ? 'Try another duty type or status, or clear the filters.'
                      : 'Attendance is logged when a driver starts duty from the app, or use Mark all present.'}
                </p>
                {(dutyFilter !== 'All' || statusFilter !== 'All') && (
                  <button
                    type="button"
                    className="btn-att"
                    onClick={() => {
                      setDutyFilter('All');
                      setStatusFilter('All');
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-responsive table-dense">
                  <table>
                    <thead>
                      <tr>
                        <th>Driver</th>
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
              <div className="label">Absent</div>
              <div className="value">{monthStats.absentCount}</div>
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
                  <ChevronLeft size={16} />
                </button>
                <div className="att-date-display">
                  <CalendarDays size={15} />
                  <span>{formattedMonthLabel}</span>
                  <input
                    id="att-month-native-picker"
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    aria-label="Select month"
                  />
                </div>
                <button
                  type="button"
                  className="att-date-step"
                  onClick={() => shiftMonth(1)}
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="att-today-link"
                  onClick={() => setSelectedMonth(istCurrentMonthString())}
                >
                  This month
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
                              <span style={{ color: item.absentDays > 0 ? '#dc2626' : undefined }}>
                                Absent {item.absentDays}
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
                <FilterDropdown
                  value={dutyFilter}
                  options={DUTY_FILTER_OPTIONS}
                  onChange={setDutyFilter}
                  icon={<Briefcase size={13} />}
                  title="Filter by duty"
                />
              </div>

              <div className="att-divider" />

              <div className="table-responsive table-dense">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Driver</th>
                      <th>Duty</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th className="td-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMonthlyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0' }}>
                          No shift logs found for this month matching criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedMonthlyLogs.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{r.date}</td>
                          <td>{renderAttendanceDriverCell(r.driverName, r.assignedVehicle)}</td>
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
                  <ChevronLeft size={16} />
                </button>
                <FilterDropdown
                  value={selectedYear}
                  options={Array.from(new Set(['2024', '2025', '2026', '2027', '2028', selectedYear]))
                    .sort()
                    .map(y => ({ value: y, label: y }))}
                  onChange={setSelectedYear}
                  icon={<TrendingUp size={13} />}
                  title="Select year"
                  showActive={false}
                />
                <button
                  type="button"
                  className="att-date-step"
                  onClick={() => setSelectedYear(String(parseInt(selectedYear, 10) + 1))}
                  title="Next year"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="att-today-link"
                  onClick={() => setSelectedYear(istCurrentYearString())}
                >
                  This year
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
                let mAbsent = 0;

                mRecs.forEach(r => {
                  if (isPresentAttendance(r.status)) mPresent++;
                  else mAbsent++;
                  mHours += r.workingHours || 0;
                });

                const rate = mRecs.length > 0 ? Math.round((mPresent / mRecs.length) * 100) : 0;
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
                        <span>Present:</span>
                        <span style={{ color: 'var(--text)' }}>{mPresent}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Absent:</span>
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

      <EditAttendanceModal
        isOpen={!!editingAttendance}
        record={editingAttendance}
        onClose={() => setEditingAttendance(null)}
      />
    </div>
  );
};
