import React, { useState, useMemo, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDriverExpenseModal } from './AddDriverExpenseModal';
import { EditDriverExpenseModal } from './EditDriverExpenseModal';
import { DriverExpenseCategory, DriverExpenseItem } from '../../../types/fleet';
import { DatePicker } from '../../common/DatePicker';
import {
  Calendar,
  CalendarDays,
  TrendingUp,
  FileText,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  CreditCard,
  PieChart,
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../../services/api';

type ExpenseTimeFrame = 'daily' | 'monthly' | 'yearly';

export const DriverExpensesView: React.FC = () => {
  const {
    driverExpenses,
    drivers,
    updateDriverExpenseStatus,
    deleteDriverExpense,
    fetchLiveDriverExpenses,
    searchQuery
  } = useFleet();

  // Active View Mode: 'daily' | 'monthly' | 'yearly'
  const [timeFrame, setTimeFrame] = useState<ExpenseTimeFrame>('monthly');

  // Daily State
  const [selectedDate, setSelectedDate] = useState('2026-09-01');

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState('2026-08'); // YYYY-MM
  const [monthSubTab, setMonthSubTab] = useState<'driverSummary' | 'dateWiseLogs'>('driverSummary');

  // Yearly State
  const [selectedYear, setSelectedYear] = useState('2026'); // YYYY

  // Filters
  const [driverFilter, setDriverFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals & previews
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DriverExpenseItem | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<string | null>(null);

  // Backend analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  // Fetch live expenses & analytics when timeFrame, date/month/year, or driverFilter changes
  useEffect(() => {
    if (timeFrame === 'daily') {
      fetchLiveDriverExpenses({ date: selectedDate, driverName: driverFilter });
    } else if (timeFrame === 'monthly') {
      fetchLiveDriverExpenses({ month: selectedMonth, driverName: driverFilter });
      fetchAnalytics('month', selectedMonth, driverFilter);
    } else if (timeFrame === 'yearly') {
      fetchLiveDriverExpenses({ year: selectedYear, driverName: driverFilter });
      fetchAnalytics('year', selectedYear, driverFilter);
    }
  }, [timeFrame, selectedDate, selectedMonth, selectedYear, driverFilter]);

  const fetchAnalytics = async (period: 'month' | 'year', value: string, drvFilter?: string) => {
    setIsLoadingAnalytics(true);
    try {
      const param = period === 'month' ? `month=${value}` : `year=${value}`;
      const drvParam = drvFilter && drvFilter !== 'All' ? `&driverName=${encodeURIComponent(drvFilter)}` : '';
      const res = await api.get(`/driver-expenses/analytics?period=${period}&${param}${drvParam}`);
      if (res && res.success) {
        setAnalyticsData(res);
      }
    } catch (err) {
      console.warn('Analytics endpoint fallback:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // -------------------------------------------------------------
  // STATUS DROPDOWN HELPER ("status har jgha drop down ayega")
  // -------------------------------------------------------------
  const getStatusColorStyle = (status: 'Approved' | 'Pending' | 'Paid') => {
    switch (status) {
      case 'Paid':
        return {
          background: 'rgba(34, 197, 94, 0.12)',
          color: '#22c55e',
          borderColor: 'rgba(34, 197, 94, 0.35)'
        };
      case 'Approved':
        return {
          background: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          borderColor: 'rgba(56, 189, 248, 0.35)'
        };
      case 'Pending':
        return {
          background: 'rgba(234, 179, 8, 0.12)',
          color: '#eab308',
          borderColor: 'rgba(234, 179, 8, 0.35)'
        };
      default:
        return {
          background: 'var(--surface-3)',
          color: 'var(--text-dim)',
          borderColor: 'var(--border)'
        };
    }
  };

  const renderStatusDropdown = (status: 'Approved' | 'Pending' | 'Paid', id: string) => {
    const handleStatusChange = async (newStatus: 'Approved' | 'Pending' | 'Paid') => {
      if (newStatus === status) return;
      await updateDriverExpenseStatus(id, newStatus);
      // Refresh analytics if monthly or yearly
      if (timeFrame === 'monthly') {
        fetchAnalytics('month', selectedMonth);
      } else if (timeFrame === 'yearly') {
        fetchAnalytics('year', selectedYear);
      }
    };

    const style = getStatusColorStyle(status);

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={status}
          onChange={e => handleStatusChange(e.target.value as 'Approved' | 'Pending' | 'Paid')}
          style={{
            background: style.background,
            color: style.color,
            border: `1px solid ${style.borderColor}`,
            padding: '4px 22px 4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            lineHeight: 1.4
          }}
          title="Select payout status"
        >
          <option value="Paid" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● Paid</option>
          <option value="Approved" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● Approved</option>
          <option value="Pending" style={{ background: 'var(--surface-1)', color: 'var(--text)' }}>● Pending</option>
        </select>
        <ChevronDown
          size={11}
          style={{
            position: 'absolute',
            right: '7px',
            pointerEvents: 'none',
            color: style.color,
            opacity: 0.8
          }}
        />
      </div>
    );
  };

  const getCategoryColor = (cat: DriverExpenseCategory) => {
    switch (cat) {
      case 'Daily Bata / Food':
        return 'rgba(57, 255, 110, 0.12)';
      case 'Night Halt Allowance':
        return 'rgba(168, 85, 247, 0.12)';
      case 'Advance Payout':
        return 'var(--warning-bg)';
      case 'Overtime':
        return 'rgba(56, 189, 248, 0.12)';
      case 'Toll / Cash Reimbursement':
        return 'rgba(249, 115, 22, 0.12)';
      default:
        return 'var(--surface-3)';
    }
  };

  const handleDeleteExpense = async (id: string, driverName: string, amount: number) => {
    if (window.confirm(`Are you sure you want to delete the expense entry of ₹${amount} for ${driverName}?`)) {
      await deleteDriverExpense(id);
      if (timeFrame === 'monthly') {
        fetchAnalytics('month', selectedMonth);
      } else if (timeFrame === 'yearly') {
        fetchAnalytics('year', selectedYear);
      }
    }
  };

  // -------------------------------------------------------------
  // 1. DAILY VIEW LOGIC
  // -------------------------------------------------------------
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

  const dailyExpenses = useMemo(() => {
    return driverExpenses.filter(r => r.date === selectedDate);
  }, [driverExpenses, selectedDate]);

  const filteredDailyExpenses = useMemo(() => {
    return dailyExpenses.filter(item => {
      const matchSearch =
        item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.remarks && item.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDriver = driverFilter === 'All' || item.driverName.toLowerCase() === driverFilter.toLowerCase();
      const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchSearch && matchDriver && matchCat && matchStatus;
    });
  }, [dailyExpenses, searchQuery, driverFilter, categoryFilter, statusFilter]);

  const dailyStats = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    let approved = 0;

    filteredDailyExpenses.forEach(r => {
      total += r.amount;
      if (r.status === 'Paid') paid += r.amount;
      else if (r.status === 'Approved') approved += r.amount;
      else pending += r.amount;
    });

    return { total, paid, approved, pending, count: filteredDailyExpenses.length };
  }, [filteredDailyExpenses]);

  // -------------------------------------------------------------
  // 2. MONTHLY VIEW LOGIC
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
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const formattedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return driverExpenses.filter(r => r.date && r.date.startsWith(selectedMonth));
  }, [driverExpenses, selectedMonth]);

  const filteredMonthlyExpenses = useMemo(() => {
    return monthlyExpenses.filter(item => {
      const matchSearch =
        item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.remarks && item.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDriver = driverFilter === 'All' || item.driverName.toLowerCase() === driverFilter.toLowerCase();
      const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchSearch && matchDriver && matchCat && matchStatus;
    });
  }, [monthlyExpenses, searchQuery, driverFilter, categoryFilter, statusFilter]);

  // Monthly stats calculated separately ("total alag se dikhe monthly wise")
  const monthlyStats = useMemo(() => {
    // If a specific driver is selected in the driverFilter
    if (driverFilter !== 'All') {
      if (
        analyticsData?.driverSpecificSummary &&
        analyticsData?.driverFilter?.toLowerCase() === driverFilter.toLowerCase()
      ) {
        const ds = analyticsData.driverSpecificSummary;
        return {
          labelSuffix: ` (${ds.driverName})`,
          total: ds.totalExpenses,
          paid: ds.paidAmount,
          approved: ds.approvedAmount,
          pending: ds.pendingAmount,
          bata: ds.categoryBreakdown?.bataTotal || 0,
          nightHaltAndOT: (ds.categoryBreakdown?.nightHaltTotal || 0) + (ds.categoryBreakdown?.overtimeTotal || 0),
          advanceAndMisc: (ds.categoryBreakdown?.advanceTotal || 0) + (ds.categoryBreakdown?.tollTotal || 0) + (ds.categoryBreakdown?.miscTotal || 0),
          count: ds.transactionCount
        };
      }

      // Local fallback for specific driver
      const drvRecords = monthlyExpenses.filter(
        exp => exp.driverName.toLowerCase() === driverFilter.toLowerCase()
      );
      let total = 0, paid = 0, approved = 0, pending = 0, bata = 0, nightHaltAndOT = 0, advanceAndMisc = 0;
      drvRecords.forEach(exp => {
        total += exp.amount;
        if (exp.status === 'Paid') paid += exp.amount;
        else if (exp.status === 'Approved') approved += exp.amount;
        else pending += exp.amount;

        if (exp.category === 'Daily Bata / Food') {
          bata += exp.amount;
        } else if (exp.category === 'Night Halt Allowance' || exp.category === 'Overtime') {
          nightHaltAndOT += exp.amount;
        } else {
          advanceAndMisc += exp.amount;
        }
      });

      return {
        labelSuffix: ` (${driverFilter})`,
        total,
        paid,
        approved,
        pending,
        bata,
        nightHaltAndOT,
        advanceAndMisc,
        count: drvRecords.length
      };
    }

    // Default: Overall monthly calculations for all drivers combined
    if (analyticsData?.period === 'month' && analyticsData?.month === selectedMonth && analyticsData?.summary) {
      return {
        labelSuffix: '',
        total: analyticsData.summary.totalExpenses,
        paid: analyticsData.summary.paidAmount,
        approved: analyticsData.summary.approvedAmount,
        pending: analyticsData.summary.pendingAmount,
        bata: analyticsData.summary.categoryBreakdown?.bataTotal || 0,
        nightHaltAndOT: (analyticsData.summary.categoryBreakdown?.nightHaltTotal || 0) + (analyticsData.summary.categoryBreakdown?.overtimeTotal || 0),
        advanceAndMisc: (analyticsData.summary.categoryBreakdown?.advanceTotal || 0) + (analyticsData.summary.categoryBreakdown?.tollTotal || 0) + (analyticsData.summary.categoryBreakdown?.miscTotal || 0),
        count: analyticsData.summary.transactionCount
      };
    }

    let total = 0, paid = 0, approved = 0, pending = 0, bata = 0, nightHaltAndOT = 0, advanceAndMisc = 0;
    monthlyExpenses.forEach(exp => {
      total += exp.amount;
      if (exp.status === 'Paid') paid += exp.amount;
      else if (exp.status === 'Approved') approved += exp.amount;
      else pending += exp.amount;

      if (exp.category === 'Daily Bata / Food') {
        bata += exp.amount;
      } else if (exp.category === 'Night Halt Allowance' || exp.category === 'Overtime') {
        nightHaltAndOT += exp.amount;
      } else {
        advanceAndMisc += exp.amount;
      }
    });

    return { labelSuffix: '', total, paid, approved, pending, bata, nightHaltAndOT, advanceAndMisc, count: monthlyExpenses.length };
  }, [analyticsData, monthlyExpenses, selectedMonth, driverFilter]);

  // Driver-wise Monthly Summary: "saare driver ka total kitna expense diya hai unko"
  const monthlyDriverSummary = useMemo(() => {
    let list = [];
    if (analyticsData?.period === 'month' && analyticsData?.month === selectedMonth && analyticsData?.driverTotals) {
      list = analyticsData.driverTotals;
    } else {
      // Fallback calculation from client-side state
      list = drivers.map(d => {
        const records = monthlyExpenses.filter(
          r => r.driverId === d.id || r.driverName.toLowerCase() === d.name.toLowerCase()
        );

        let total = 0, paid = 0, pending = 0, bata = 0, nightHalt = 0, advances = 0;
        records.forEach(r => {
          total += r.amount;
          if (r.status === 'Paid') paid += r.amount;
          else pending += r.amount;

          if (r.category === 'Daily Bata / Food') bata += r.amount;
          else if (r.category === 'Night Halt Allowance' || r.category === 'Overtime') nightHalt += r.amount;
          else advances += r.amount;
        });

        return {
          driverId: d.id,
          driverName: d.name,
          vehicle: d.assignedVehicle || '—',
          driverType: d.driverType || 'Permanent',
          totalAmount: total,
          paidAmount: paid,
          pendingAmount: pending,
          bataAmount: bata,
          nightHaltAmount: nightHalt,
          advanceAmount: advances,
          transactionCount: records.length,
          records
        };
      });
    }

    return list.filter((d: any) => {
      const matchSearch =
        d.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.vehicle && d.vehicle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDriver = driverFilter === 'All' || d.driverName.toLowerCase() === driverFilter.toLowerCase();
      return matchSearch && matchDriver;
    });
  }, [analyticsData, selectedMonth, drivers, monthlyExpenses, searchQuery, driverFilter]);

  // Handle clicking on "X entries" badge to immediately filter that driver and open history
  const handleDriverEntriesClick = (driverName: string) => {
    setDriverFilter(driverName);
    setMonthSubTab('dateWiseLogs');
  };

  // -------------------------------------------------------------
  // 3. YEARLY VIEW LOGIC
  // -------------------------------------------------------------
  const shiftYear = (deltaYears: number) => {
    const y = parseInt(selectedYear, 10) + deltaYears;
    setSelectedYear(String(y));
  };

  const yearlyExpenses = useMemo(() => {
    return driverExpenses.filter(r => r.date && r.date.startsWith(selectedYear));
  }, [driverExpenses, selectedYear]);

  const yearlyStats = useMemo(() => {
    if (analyticsData?.period === 'year' && analyticsData?.year === selectedYear && analyticsData?.summary) {
      return {
        total: analyticsData.summary.totalExpenses,
        paid: analyticsData.summary.paidAmount,
        pending: analyticsData.summary.pendingAmount,
        count: analyticsData.summary.transactionCount
      };
    }

    let total = 0, paid = 0, pending = 0;
    yearlyExpenses.forEach(r => {
      total += r.amount;
      if (r.status === 'Paid') paid += r.amount;
      else pending += r.amount;
    });

    return { total, paid, pending, count: yearlyExpenses.length };
  }, [analyticsData, yearlyExpenses, selectedYear]);

  const monthlyBreakdownCards = useMemo(() => {
    if (analyticsData?.period === 'year' && analyticsData?.year === selectedYear && analyticsData?.monthlyTrends) {
      return analyticsData.monthlyTrends;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((name, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      const prefix = `${selectedYear}-${monthNum}`;
      const recs = yearlyExpenses.filter(r => r.date.startsWith(prefix));

      let mTotal = 0, mPaid = 0, mPending = 0;
      recs.forEach(r => {
        mTotal += r.amount;
        if (r.status === 'Paid') mPaid += r.amount;
        else mPending += r.amount;
      });

      return {
        monthCode: prefix,
        monthName: name,
        totalAmount: mTotal,
        paidAmount: mPaid,
        pendingAmount: mPending,
        transactionCount: recs.length
      };
    });
  }, [analyticsData, selectedYear, yearlyExpenses]);

  const yearlyDriverSummary = useMemo(() => {
    if (analyticsData?.period === 'year' && analyticsData?.year === selectedYear && analyticsData?.driverTotals) {
      return analyticsData.driverTotals.filter((d: any) => {
        const matchSearch =
          d.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.vehicle && d.vehicle.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchDriver = driverFilter === 'All' || d.driverName.toLowerCase() === driverFilter.toLowerCase();
        return matchSearch && matchDriver;
      });
    }

    return drivers
      .map(d => {
        const records = yearlyExpenses.filter(
          r => r.driverId === d.id || r.driverName.toLowerCase() === d.name.toLowerCase()
        );

        let total = 0, paid = 0, pending = 0;
        records.forEach(r => {
          total += r.amount;
          if (r.status === 'Paid') paid += r.amount;
          else pending += r.amount;
        });

        return {
          driverId: d.id,
          driverName: d.name,
          vehicle: d.assignedVehicle || '—',
          driverType: d.driverType || 'Permanent',
          totalAmount: total,
          paidAmount: paid,
          pendingAmount: pending,
          transactionCount: records.length
        };
      })
      .filter(d => {
        const matchSearch =
          d.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.vehicle && d.vehicle.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchDriver = driverFilter === 'All' || d.driverName.toLowerCase() === driverFilter.toLowerCase();
        return matchSearch && matchDriver;
      });
  }, [analyticsData, selectedYear, drivers, yearlyExpenses, searchQuery, driverFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top View Mode Switcher Header */}
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
            <CalendarDays size={14} /> Monthly Overview
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
          onClick={() => setIsAddModalOpen(true)}
        >
          + Add Driver Expense
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. PARTICULAR DAY (DAILY) VIEW                                  */}
      {/* ============================================================== */}
      {timeFrame === 'daily' && (
        <>
          {/* Daily Stats Grid */}
          <div className="stats-grid">
            <StatCard
              label={`Daily Total Expenses${driverFilter !== 'All' ? ` (${driverFilter})` : ''}`}
              value={formatINR(dailyStats.total)}
              customColor="var(--accent)"
            />
            <StatCard label={`Paid Out Today${driverFilter !== 'All' ? ` (${driverFilter})` : ''}`} value={formatINR(dailyStats.paid)} />
            <StatCard label="Pending / In Review" value={formatINR(dailyStats.pending + dailyStats.approved)} />
            <StatCard label="Expense Claims Today" value={`${dailyStats.count} entries`} />
          </div>

          {/* Daily Table Panel */}
          <div className="panel">
            <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
              {/* Calendar Date Navigator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                  onClick={() => shiftDate(-1)}
                  title="Previous Day"
                >
                  <ChevronLeft size={14} />
                </button>

                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', minWidth: '150px' }}>
                  <DatePicker
                    value={selectedDate}
                    onChange={date => date && setSelectedDate(date)}
                  />
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                  onClick={() => shiftDate(1)}
                  title="Next Day"
                >
                  <ChevronRight size={14} />
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                >
                  Today
                </button>

                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginLeft: '6px' }}>
                  {formattedDateLabel}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                  ({filteredDailyExpenses.length} entries)
                </span>
              </div>

              {/* Filters (Driver, Category, Status) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Driver Filter Dropdown */}
                <select
                  className="form-input"
                  style={{
                    width: 'auto',
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderColor: driverFilter !== 'All' ? 'var(--accent)' : undefined
                  }}
                  value={driverFilter}
                  onChange={e => setDriverFilter(e.target.value)}
                  title="Filter by driver"
                >
                  <option value="All">All Drivers</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Daily Bata / Food">Daily Bata / Food</option>
                  <option value="Night Halt Allowance">Night Halt Allowance</option>
                  <option value="Advance Payout">Advance Payout</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Toll / Cash Reimbursement">Toll / Reimbursement</option>
                </select>

                <select
                  className="form-input"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Active Driver Filter Notification */}
            {driverFilter !== 'All' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '12px',
                  color: '#38bdf8'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} />
                  <span>
                    Filtering daily records for driver: <strong>{driverFilter}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '11px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)' }}
                  onClick={() => setDriverFilter('All')}
                >
                  ✕ Clear Driver Filter
                </button>
              </div>
            )}

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Status (Dropdown)</th>
                    <th>Remarks</th>
                    <th>Receipt / Proof</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                        No driver expenses recorded for {formattedDateLabel} {driverFilter !== 'All' ? `for ${driverFilter}` : ''}. Click "+ Add Driver Expense" above.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyExpenses.map(exp => (
                      <tr key={exp.id}>
                        <td style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {exp.date}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="driver-avatar-circle" style={{ width: 26, height: 26, fontSize: 11 }}>
                              {exp.driverName.charAt(0)}
                            </div>
                            {exp.driverName}
                          </div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{exp.vehicle}</td>
                        <td>
                          <span
                            className="driver-type-badge"
                            style={{ background: getCategoryColor(exp.category) }}
                          >
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {formatINR(exp.amount)}
                        </td>
                        <td>{renderStatusDropdown(exp.status, exp.id)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                          {exp.remarks || '—'}
                        </td>
                        <td>
                          {exp.receipt ? (
                            <span
                              className="bill-link"
                              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setActiveReceipt(exp.receipt!)}
                            >
                              <FileText size={12} /> {exp.receipt.startsWith('data:') ? 'View document' : exp.receipt}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setEditingExpense(exp)}
                              title="Edit expense"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              className="btn-secondary"
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                color: 'var(--danger)',
                                borderColor: 'rgba(255, 92, 92, 0.3)'
                              }}
                              onClick={() => handleDeleteExpense(exp.id, exp.driverName, exp.amount)}
                              title="Delete expense"
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
        </>
      )}

      {/* ============================================================== */}
      {/* 2. MONTHLY OVERVIEW                                            */}
      {/* ============================================================== */}
      {timeFrame === 'monthly' && (
        <>
          {/* Monthly Stats Cards: calculates separately for all drivers or specific driver */}
          <div className="stats-grid">
            <StatCard
              label={`Total Monthly Expenses${monthlyStats.labelSuffix}`}
              value={formatINR(monthlyStats.total)}
              customColor="var(--accent)"
            />
            <StatCard label={`Total Paid Out${monthlyStats.labelSuffix}`} value={formatINR(monthlyStats.paid)} />
            <StatCard label={`Pending / In Review${monthlyStats.labelSuffix}`} value={formatINR(monthlyStats.pending + monthlyStats.approved)} />
            <StatCard label={`Food & Daily Bata${monthlyStats.labelSuffix}`} value={formatINR(monthlyStats.bata)} />
            <StatCard label={`Night Halt & Overtime${monthlyStats.labelSuffix}`} value={formatINR(monthlyStats.nightHaltAndOT)} />
            <StatCard label={`Advances & Reimbursements${monthlyStats.labelSuffix}`} value={formatINR(monthlyStats.advanceAndMisc)} />
          </div>

          {/* Monthly Panel */}
          <div className="panel">
            <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
              {/* Calendar Month Navigator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                  onClick={() => shiftMonth(-1)}
                  title="Previous Month"
                >
                  <ChevronLeft size={14} />
                </button>

                <input
                  type="month"
                  className="form-input"
                  value={selectedMonth}
                  onChange={e => e.target.value && setSelectedMonth(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    width: 'auto',
                    cursor: 'pointer'
                  }}
                />

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                  onClick={() => shiftMonth(1)}
                  title="Next Month"
                >
                  <ChevronRight size={14} />
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                  onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
                >
                  This Month
                </button>

                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginLeft: '6px' }}>
                  {formattedMonthLabel}
                </span>

                {isLoadingAnalytics && (
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                )}
              </div>

              {/* Sub-tab Switcher: Driver Totals vs Date-wise History */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Driver Filter Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} style={{ color: 'var(--text-dim)' }} />
                  <select
                    className="form-input"
                    style={{
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderColor: driverFilter !== 'All' ? 'var(--accent)' : undefined
                    }}
                    value={driverFilter}
                    onChange={e => setDriverFilter(e.target.value)}
                    title="Filter by driver"
                  >
                    <option value="All">All Drivers</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="subtab-nav" style={{ margin: 0, padding: 0 }}>
                  <button
                    type="button"
                    className={`subtab-btn ${monthSubTab === 'driverSummary' ? 'active' : ''}`}
                    onClick={() => setMonthSubTab('driverSummary')}
                  >
                    <Users size={13} /> Driver Monthly Totals
                  </button>
                  <button
                    type="button"
                    className={`subtab-btn ${monthSubTab === 'dateWiseLogs' ? 'active' : ''}`}
                    onClick={() => setMonthSubTab('dateWiseLogs')}
                  >
                    <Calendar size={13} /> Date-wise History ({filteredMonthlyExpenses.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Active Driver Filter Indicator Banner */}
            {driverFilter !== 'All' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 16px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '12.5px',
                  color: '#38bdf8'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={15} />
                  <span>
                    Viewing details for driver: <strong>{driverFilter}</strong> — Monthly Total: <strong>{formatINR(monthlyStats.total)}</strong> ({monthlyStats.count} entries in {formattedMonthLabel})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    padding: '3px 10px',
                    fontSize: '11.5px',
                    color: '#38bdf8',
                    borderColor: 'rgba(56, 189, 248, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setDriverFilter('All')}
                >
                  ✕ Clear Filter (Show All Drivers)
                </button>
              </div>
            )}

            {/* SUBTAB 1: DRIVER MONTHLY SUMMARY ("saare driver ka total kitna expense diya hai unko") */}
            {monthSubTab === 'driverSummary' && (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Driver Name</th>
                      <th>Assigned Vehicle</th>
                      <th>Total Expense Given</th>
                      <th>Daily Bata / Food</th>
                      <th>Night Halt & OT</th>
                      <th>Advances & Reimbursements</th>
                      <th>Paid Out</th>
                      <th>Pending</th>
                      <th title="Click any entries badge to view history">Claims Count (Click to View History)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDriverSummary.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                          No drivers found matching your search.
                        </td>
                      </tr>
                    ) : (
                      monthlyDriverSummary.map((d: any) => {
                        const isFiltered = driverFilter === d.driverName;
                        return (
                          <tr
                            key={d.driverId || d.driverName}
                            style={{
                              background: isFiltered ? 'rgba(56, 189, 248, 0.06)' : undefined,
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="driver-avatar-circle" style={{ width: 28, height: 28, fontSize: 11 }}>
                                  {d.driverName.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{d.driverName}</span>
                                    {isFiltered && (
                                      <span
                                        style={{
                                          fontSize: '10px',
                                          background: 'rgba(56, 189, 248, 0.15)',
                                          color: '#38bdf8',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          fontWeight: 600
                                        }}
                                      >
                                        Filtered
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 400 }}>
                                    {d.driverType}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>{d.vehicle || '—'}</td>
                            <td style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--accent)' }}>
                              {formatINR(d.totalAmount)}
                            </td>
                            <td style={{ fontWeight: 500 }}>{formatINR(d.bataAmount || 0)}</td>
                            <td style={{ fontWeight: 500 }}>{formatINR(d.nightHaltAmount || 0)}</td>
                            <td style={{ fontWeight: 500 }}>{formatINR(d.advanceAmount || 0)}</td>
                            <td>
                              <span className="status-chip running" style={{ fontSize: '11px' }}>
                                ● {formatINR(d.paidAmount || 0)}
                              </span>
                            </td>
                            <td>
                              {d.pendingAmount > 0 ? (
                                <span className="status-chip idle" style={{ fontSize: '11px' }}>
                                  ● {formatINR(d.pendingAmount)}
                                </span>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>₹0</span>
                              )}
                            </td>
                            <td>
                              {/* Clickable entries badge leading directly to driver history */}
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleDriverEntriesClick(d.driverName)}
                                style={{
                                  cursor: 'pointer',
                                  background: d.transactionCount > 0 ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-2)',
                                  color: d.transactionCount > 0 ? '#38bdf8' : 'var(--text-faint)',
                                  borderColor: d.transactionCount > 0 ? 'rgba(56, 189, 248, 0.35)' : 'var(--border)',
                                  borderRadius: '16px',
                                  padding: '3px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease'
                                }}
                                title={`Click to view date-wise history entries for ${d.driverName}`}
                              >
                                {d.transactionCount} {d.transactionCount === 1 ? 'entry' : 'entries'}
                                {d.transactionCount > 0 && <ArrowUpRight size={12} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBTAB 2: DATE-WISE EXPENSE HISTORY ("history bhi ayegi kb kb diya date wise") */}
            {monthSubTab === 'dateWiseLogs' && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    flexWrap: 'wrap'
                  }}
                >
                  <select
                    className="form-input"
                    style={{
                      width: 'auto',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderColor: driverFilter !== 'All' ? 'var(--accent)' : undefined
                    }}
                    value={driverFilter}
                    onChange={e => setDriverFilter(e.target.value)}
                    title="Filter by driver"
                  >
                    <option value="All">All Drivers</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-input"
                    style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    <option value="Daily Bata / Food">Daily Bata / Food</option>
                    <option value="Night Halt Allowance">Night Halt Allowance</option>
                    <option value="Advance Payout">Advance Payout</option>
                    <option value="Overtime">Overtime</option>
                    <option value="Toll / Cash Reimbursement">Toll / Reimbursement</option>
                  </select>

                  <select
                    className="form-input"
                    style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Driver</th>
                        <th>Vehicle</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Status (Dropdown)</th>
                        <th>Remarks</th>
                        <th>Receipt / Proof</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMonthlyExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '36px 0' }}>
                            No driver expenses recorded for {formattedMonthLabel} {driverFilter !== 'All' ? `for driver ${driverFilter}` : ''}. Click "+ Add Driver Expense" above.
                          </td>
                        </tr>
                      ) : (
                        filteredMonthlyExpenses.map(exp => (
                          <tr key={exp.id}>
                            <td style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                              {exp.date}
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="driver-avatar-circle" style={{ width: 26, height: 26, fontSize: 11 }}>
                                  {exp.driverName.charAt(0)}
                                </div>
                                {exp.driverName}
                              </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>{exp.vehicle}</td>
                            <td>
                              <span
                                className="driver-type-badge"
                                style={{ background: getCategoryColor(exp.category) }}
                              >
                                {exp.category}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                              {formatINR(exp.amount)}
                            </td>
                            <td>{renderStatusDropdown(exp.status, exp.id)}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                              {exp.remarks || '—'}
                            </td>
                            <td>
                              {exp.receipt ? (
                                <span
                                  className="bill-link"
                                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => setActiveReceipt(exp.receipt!)}
                                >
                                  <FileText size={12} /> {exp.receipt.startsWith('data:') ? 'View attachment' : exp.receipt}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => setEditingExpense(exp)}
                                  title="Edit expense"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    color: 'var(--danger)',
                                    borderColor: 'rgba(255, 92, 92, 0.3)'
                                  }}
                                  onClick={() => handleDeleteExpense(exp.id, exp.driverName, exp.amount)}
                                  title="Delete expense"
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
              </>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 3. YEARLY OVERVIEW                                             */}
      {/* ============================================================== */}
      {timeFrame === 'yearly' && (
        <>
            {/* Annual Stats Grid */}
          <div className="stats-grid">
            <StatCard
              label={`Annual Driver Expenses${driverFilter !== 'All' ? ` (${driverFilter})` : ''}`}
              value={formatINR(yearlyStats.total)}
              customColor="var(--accent)"
            />
            <StatCard label={`Total Paid Out${driverFilter !== 'All' ? ` (${driverFilter})` : ''}`} value={formatINR(yearlyStats.paid)} />
            <StatCard label="Total Pending / Approved" value={formatINR(yearlyStats.pending)} />
            <StatCard label="Total Annual Transactions" value={`${yearlyStats.count} entries`} />
          </div>

          {/* Year Navigator Panel */}
          <div className="panel">
            <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                  onClick={() => shiftYear(-1)}
                  title="Previous Year"
                >
                  <ChevronLeft size={14} />
                </button>

                <select
                  className="form-input"
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    width: 'auto',
                    cursor: 'pointer'
                  }}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center' }}
                  onClick={() => shiftYear(1)}
                  title="Next Year"
                >
                  <ChevronRight size={14} />
                </button>

                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginLeft: '6px' }}>
                  Calendar Year {selectedYear}
                </span>

                {isLoadingAnalytics && (
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                )}
              </div>

              {/* Driver Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} style={{ color: 'var(--text-dim)' }} />
                <select
                  className="form-input"
                  style={{
                    width: 'auto',
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderColor: driverFilter !== 'All' ? 'var(--accent)' : undefined
                  }}
                  value={driverFilter}
                  onChange={e => setDriverFilter(e.target.value)}
                  title="Filter by driver"
                >
                  <option value="All">All Drivers</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Driver Filter Indicator Banner */}
            {driverFilter !== 'All' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 16px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '12.5px',
                  color: '#38bdf8'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={15} />
                  <span>
                    Viewing annual totals for driver: <strong>{driverFilter}</strong> ({yearlyStats.count} entries in {selectedYear})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    padding: '3px 10px',
                    fontSize: '11.5px',
                    color: '#38bdf8',
                    borderColor: 'rgba(56, 189, 248, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setDriverFilter('All')}
                >
                  ✕ Clear Filter (Show All Drivers)
                </button>
              </div>
            )}

            {/* 12-Month Distribution Matrix */}
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text)' }}>
                12-Month Expense Calendar Breakdown ({selectedYear})
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                  gap: '12px'
                }}
              >
                {monthlyBreakdownCards.map((m: any) => (
                  <div
                    key={m.monthCode}
                    style={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                        {m.monthName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        {m.transactionCount} claims
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: m.totalAmount > 0 ? 'var(--accent)' : 'var(--text-faint)' }}>
                      {formatINR(m.totalAmount)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                      <span>Paid: {formatINR(m.paidAmount)}</span>
                      {m.pendingAmount > 0 && (
                        <span style={{ color: '#eab308' }}>Pending: {formatINR(m.pendingAmount)}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        marginTop: '4px',
                        padding: '3px 6px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                      onClick={() => {
                        setSelectedMonth(m.monthCode);
                        setTimeFrame('monthly');
                      }}
                    >
                      View Month <ArrowUpRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Annual Driver Total Expenses Table */}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <div style={{ padding: '14px 16px', fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                Annual Driver Expense Totals ({selectedYear})
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Driver Name</th>
                      <th>Assigned Vehicle</th>
                      <th>Total Given In {selectedYear}</th>
                      <th>Paid Out</th>
                      <th>Pending Amount</th>
                      <th>Total Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyDriverSummary.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                          No driver records found.
                        </td>
                      </tr>
                    ) : (
                      yearlyDriverSummary.map((d: any) => (
                        <tr key={d.driverId || d.driverName}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="driver-avatar-circle" style={{ width: 28, height: 28, fontSize: 11 }}>
                                {d.driverName.charAt(0)}
                              </div>
                              <div>
                                <div>{d.driverName}</div>
                                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 400 }}>
                                  {d.driverType}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 500 }}>{d.vehicle || '—'}</td>
                          <td style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>
                            {formatINR(d.totalAmount)}
                          </td>
                          <td>
                            <span className="status-chip running" style={{ fontSize: '11px' }}>
                              ● {formatINR(d.paidAmount || 0)}
                            </span>
                          </td>
                          <td>
                            {d.pendingAmount > 0 ? (
                              <span className="status-chip idle" style={{ fontSize: '11px' }}>
                                ● {formatINR(d.pendingAmount)}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>₹0</span>
                            )}
                          </td>
                          <td>
                            <span className="driver-type-badge" style={{ background: 'var(--surface-2)' }}>
                              {d.transactionCount} entries
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slide-from-bottom Add Expense Modal */}
      <AddDriverExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          if (timeFrame === 'monthly') fetchAnalytics('month', selectedMonth);
          else if (timeFrame === 'yearly') fetchAnalytics('year', selectedYear);
        }}
      />

      {/* Edit Driver Expense Modal */}
      <EditDriverExpenseModal
        isOpen={!!editingExpense}
        expense={editingExpense}
        onClose={() => {
          setEditingExpense(null);
          if (timeFrame === 'monthly') fetchAnalytics('month', selectedMonth);
          else if (timeFrame === 'yearly') fetchAnalytics('year', selectedYear);
        }}
      />

      {/* Receipt View Modal */}
      {activeReceipt && (
        <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal-dialog" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Receipt / Voucher Document
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveReceipt(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center' }}>
              {activeReceipt.startsWith('data:image') ? (
                <img
                  src={activeReceipt}
                  alt="Receipt Document"
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '30px', color: 'var(--text-dim)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <FileText size={40} color="var(--accent)" />
                  </div>
                  <div>Document File: <b>{activeReceipt}</b></div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    Verified and stored in KABPRO storage.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setActiveReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

