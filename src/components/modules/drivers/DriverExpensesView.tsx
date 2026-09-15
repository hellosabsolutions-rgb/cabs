import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDriverExpenseModal } from './AddDriverExpenseModal';
import { EditDriverExpenseModal } from './EditDriverExpenseModal';
import { DriverExpenseCategory, DriverExpenseItem, TripExpenseRecord } from '../../../types/fleet';
import { StatusDropdown, StatusOption } from '../../common/StatusDropdown';
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
  Loader2,
  ArrowUpRight,
  Banknote,
  Filter,
  X
} from 'lucide-react';
import { api } from '../../../services/api';

type ExpenseTimeFrame = 'daily' | 'monthly' | 'yearly';

const FILTER_CATEGORIES: DriverExpenseCategory[] = [
  'Daily Bata / Food',
  'Night Halt Allowance',
  'Advance Payout',
  'Overtime',
  'Toll / Cash Reimbursement',
  'Uniform / Misc',
  'Toll',
  'Food',
  'Parking',
  'Repair',
  'Loading',
  'Maintenance',
  'Other'
];

function todayIST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function expenseKey(exp: { source?: string; id: string }) {
  return `${exp.source === 'trip' ? 'trip' : 'driver'}:${exp.id}`;
}

function isBataCategory(cat: string) {
  return cat === 'Daily Bata / Food' || cat === 'Food';
}

function isNightHaltCategory(cat: string) {
  return cat === 'Night Halt Allowance' || cat === 'Overtime';
}

function buildDriverExpenseSummary(
  drivers: Array<{ id: string; name: string; assignedVehicle?: string; driverType?: string }>,
  records: DriverExpenseItem[]
) {
  return drivers.map(d => {
    const driverRecords = records.filter(
      r => r.driverId === d.id || r.driverName.toLowerCase() === d.name.toLowerCase()
    );

    let total = 0;
    let paid = 0;
    let pending = 0;
    let bata = 0;
    let nightHalt = 0;
    let advances = 0;

    driverRecords.forEach(r => {
      total += r.amount;
      if (r.status === 'Paid') paid += r.amount;
      else pending += r.amount;

      if (isBataCategory(r.category)) bata += r.amount;
      else if (isNightHaltCategory(r.category)) nightHalt += r.amount;
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
      transactionCount: driverRecords.length,
      records: driverRecords
    };
  });
}

function mapTripToDriverExpense(e: TripExpenseRecord): DriverExpenseItem {
  return {
    id: e.id,
    driverId: e.driverId,
    driverName: e.driverName || '—',
    vehicle: e.vehicle || '—',
    date: e.date,
    category: e.category,
    amount: Number(e.amount || 0),
    status: e.status === 'Paid' ? 'Paid' : e.status === 'Approved' ? 'Approved' : 'Pending',
    remarks: e.notes || (e.bookingNumber ? `Trip ${e.bookingNumber}` : ''),
    receipt: e.receipt,
    source: 'trip',
    createdBy: e.createdBy,
    createdByName: e.createdByName,
    bookingId: e.bookingId,
    bookingNumber: e.bookingNumber
  };
}

export const DriverExpensesView: React.FC = () => {
  const {
    driverExpenses,
    tripExpenses,
    drivers,
    updateDriverExpenseStatus,
    updateTripExpenseStatus,
    deleteDriverExpense,
    deleteTripExpense,
    bulkMarkExpensesPaid,
    fetchLiveDriverExpenses,
    fetchLiveTripExpenses,
    searchQuery
  } = useFleet();

  const today = todayIST();

  // Active View Mode: 'daily' | 'monthly' | 'yearly'
  const [timeFrame, setTimeFrame] = useState<ExpenseTimeFrame>('monthly');

  // Daily State
  const [selectedDate, setSelectedDate] = useState(today);

  // Monthly State
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7)); // YYYY-MM
  const [monthSubTab, setMonthSubTab] = useState<'driverSummary' | 'dateWiseLogs'>('driverSummary');

  // Yearly State
  const [selectedYear, setSelectedYear] = useState(today.slice(0, 4)); // YYYY

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Filters
  const [driverFilter, setDriverFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown popover on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFilterOpen]);

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
    fetchLiveTripExpenses();
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

  const allExpenses = useMemo<DriverExpenseItem[]>(() => {
    const fromDrivers = driverExpenses.map(e => ({
      ...e,
      source: e.source || ('driver' as const),
      amount: Number(e.amount || 0)
    }));
    const fromTrips = tripExpenses.map(mapTripToDriverExpense);
    return [...fromDrivers, ...fromTrips].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [driverExpenses, tripExpenses]);

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

  const renderStatusDropdown = (exp: DriverExpenseItem) => {
    const handleStatusChange = async (newStatus: 'Approved' | 'Pending' | 'Paid') => {
      if (newStatus === exp.status) return;
      if (exp.source === 'trip') {
        await updateTripExpenseStatus(exp.id, newStatus);
      } else {
        await updateDriverExpenseStatus(exp.id, newStatus);
      }
    };

    const expenseOptions: StatusOption<'Approved' | 'Pending' | 'Paid'>[] = (
      ['Paid', 'Approved', 'Pending'] as const
    ).map(status => {
      const style = getStatusColorStyle(status);
      return {
        value: status,
        label: status,
        color: style.color,
        bg: style.background,
        borderColor: style.borderColor
      };
    });

    return (
      <StatusDropdown
        value={exp.status}
        options={expenseOptions}
        onChange={handleStatusChange}
        title="Select payout status"
      />
    );
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Daily Bata / Food':
      case 'Food':
        return 'rgba(57, 255, 110, 0.12)';
      case 'Night Halt Allowance':
        return 'rgba(168, 85, 247, 0.12)';
      case 'Advance Payout':
        return 'var(--warning-bg)';
      case 'Overtime':
        return 'rgba(56, 189, 248, 0.12)';
      case 'Toll / Cash Reimbursement':
      case 'Toll':
        return 'rgba(249, 115, 22, 0.12)';
      case 'Parking':
        return 'rgba(168, 85, 247, 0.12)';
      case 'Repair':
        return 'rgba(239, 68, 68, 0.12)';
      case 'Loading':
        return 'rgba(34, 197, 94, 0.12)';
      case 'Maintenance':
        return 'rgba(245, 158, 11, 0.12)';
      default:
        return 'var(--surface-3)';
    }
  };

  const handleDeleteExpense = async (exp: DriverExpenseItem) => {
    if (window.confirm(`Are you sure you want to delete the expense entry of ₹${exp.amount} for ${exp.driverName}?`)) {
      if (exp.source === 'trip') {
        await deleteTripExpense(exp.id);
      } else {
        await deleteDriverExpense(exp.id);
      }
      setSelectedKeys(prev => prev.filter(k => k !== expenseKey(exp)));
    }
  };

  const toggleSelected = (key: string) => {
    setSelectedKeys(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const payItems = async (items: DriverExpenseItem[]) => {
    const unpaid = items.filter(e => e.status !== 'Paid');
    if (unpaid.length === 0) return;
    await bulkMarkExpensesPaid(
      unpaid.map(e => ({ id: e.id, source: e.source === 'trip' ? 'trip' : 'driver' }))
    );
    setSelectedKeys([]);
  };

  const renderPayControls = (rows: DriverExpenseItem[]) => {
    const unpaid = rows.filter(e => e.status !== 'Paid');
    const selectedRows = unpaid.filter(e => selectedKeys.includes(expenseKey(e)));
    const allSelected = unpaid.length > 0 && unpaid.every(e => selectedKeys.includes(expenseKey(e)));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-secondary"
          disabled={selectedRows.length === 0}
          onClick={() => payItems(selectedRows)}
          style={{ fontSize: '12px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: selectedRows.length ? 1 : 0.5 }}
        >
          <Banknote size={13} /> Pay selected ({selectedRows.length})
        </button>
        <button
          type="button"
          className="btn-primary-action"
          disabled={unpaid.length === 0}
          onClick={() => payItems(unpaid)}
          style={{ fontSize: '12px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: unpaid.length ? 1 : 0.5 }}
        >
          <Banknote size={13} /> Pay all pending ({unpaid.length})
        </button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)', cursor: unpaid.length ? 'pointer' : 'default' }}>
          <input
            type="checkbox"
            checked={allSelected}
            disabled={unpaid.length === 0}
            onChange={() => {
              if (allSelected) {
                setSelectedKeys(prev => prev.filter(k => !unpaid.some(e => expenseKey(e) === k)));
              } else {
                setSelectedKeys(prev => Array.from(new Set([...prev, ...unpaid.map(expenseKey)])));
              }
            }}
          />
          Select all unpaid
        </label>
      </div>
    );
  };

  const receiptLabel = (receipt: string) => {
    if (receipt.startsWith('data:')) return 'View document';
    if (receipt.startsWith('http')) return 'View receipt';
    return receipt;
  };

  const renderCompactDriverCell = (name: string, sub?: string) => (
    <div className="driver-info-cell">
      <div className="driver-avatar-circle">{name.charAt(0)}</div>
      <div className="cell-stack">
        <span className="cell-primary">{name}</span>
        {sub ? <span className="cell-meta">{sub}</span> : null}
      </div>
    </div>
  );

  const renderExpenseDetailsCell = (exp: DriverExpenseItem) => (
    <div className="cell-stack">
      <span className="cell-primary">{exp.category}</span>
      <span className="cell-meta">
        {exp.vehicle}
        {' · '}
        {exp.source === 'trip' ? `Trip${exp.bookingNumber ? ` ${exp.bookingNumber}` : ''}` : 'Driver claim'}
      </span>
      {exp.remarks ? <span className="cell-meta" title={exp.remarks}>{exp.remarks}</span> : null}
    </div>
  );

  const renderExpenseActions = (exp: DriverExpenseItem) => (
    <div className="table-actions">
      {exp.receipt ? (
        <button
          type="button"
          className="icon-btn"
          onClick={() => setActiveReceipt(exp.receipt!)}
          title="View receipt"
        >
          <FileText size={14} />
        </button>
      ) : null}
      <button type="button" className="icon-btn" onClick={() => setEditingExpense(exp)} title="Edit expense">
        <Edit2 size={14} />
      </button>
      <button type="button" className="icon-btn icon-btn--danger" onClick={() => handleDeleteExpense(exp)} title="Delete expense">
        <Trash2 size={14} />
      </button>
    </div>
  );

  const renderBreakdownCell = (d: {
    bataAmount?: number;
    nightHaltAmount?: number;
    advanceAmount?: number;
  }) => (
    <div className="cell-breakdown">
      <span>Bata {formatINR(d.bataAmount || 0)}</span>
      <span>Night {formatINR(d.nightHaltAmount || 0)}</span>
      <span>Adv {formatINR(d.advanceAmount || 0)}</span>
    </div>
  );

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
    return allExpenses.filter(r => r.date === selectedDate);
  }, [allExpenses, selectedDate]);

  // Drivers who have actual recorded expenses on the selected date
  const dailyDriversWithEntries = useMemo(() => {
    const names = Array.from(new Set(dailyExpenses.map(e => e.driverName).filter(Boolean)));
    names.sort();
    return names;
  }, [dailyExpenses]);

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
    setDriverFilter('All');
  };

  const formattedMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return allExpenses.filter(r => r.date && r.date.startsWith(selectedMonth));
  }, [allExpenses, selectedMonth]);

  const allAvailableDrivers = useMemo(() => {
    const byName = new Map<string, { id: string; name: string; vehicle?: string }>();
    drivers.forEach(d => {
      byName.set(d.name.toLowerCase(), {
        id: d.id,
        name: d.name,
        vehicle: d.assignedVehicle
      });
    });
    allExpenses.forEach(e => {
      if (!e.driverName) return;
      const key = e.driverName.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, { id: e.driverId || key, name: e.driverName, vehicle: e.vehicle });
      }
    });
    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [drivers, allExpenses]);

  // Drivers who have actual recorded expenses in the selected month
  const monthlyDriversWithEntries = useMemo(() => {
    const names = Array.from(new Set(monthlyExpenses.map(e => e.driverName).filter(Boolean)));
    names.sort();
    return names;
  }, [monthlyExpenses]);

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
    const source =
      driverFilter !== 'All'
        ? monthlyExpenses.filter(exp => exp.driverName.toLowerCase() === driverFilter.toLowerCase())
        : monthlyExpenses;

    let total = 0, paid = 0, approved = 0, pending = 0, bata = 0, nightHaltAndOT = 0, advanceAndMisc = 0;
    source.forEach(exp => {
      total += exp.amount;
      if (exp.status === 'Paid') paid += exp.amount;
      else if (exp.status === 'Approved') approved += exp.amount;
      else pending += exp.amount;

      if (isBataCategory(exp.category)) bata += exp.amount;
      else if (isNightHaltCategory(exp.category)) nightHaltAndOT += exp.amount;
      else advanceAndMisc += exp.amount;
    });

    return {
      labelSuffix: driverFilter !== 'All' ? ` (${driverFilter})` : '',
      total,
      paid,
      approved,
      pending,
      bata,
      nightHaltAndOT,
      advanceAndMisc,
      count: source.length
    };
  }, [monthlyExpenses, driverFilter]);

  // Driver-wise Monthly Summary — always from live expense state (updates instantly on pay/approve)
  const monthlyDriverSummary = useMemo(() => {
    const list = buildDriverExpenseSummary(drivers, monthlyExpenses);

    return list.filter((d: any) => {
      const matchSearch =
        d.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.vehicle && d.vehicle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDriver = driverFilter === 'All' || d.driverName.toLowerCase() === driverFilter.toLowerCase();
      return matchSearch && matchDriver;
    });
  }, [drivers, monthlyExpenses, searchQuery, driverFilter]);

  const clearDriverDrilldown = () => {
    setDriverFilter('All');
    setMonthSubTab('driverSummary');
  };

  const handleDriverEntriesClick = (driverName: string) => {
    setDriverFilter(driverName);
    setMonthSubTab('dateWiseLogs');
  };

  const isDriverDrilldown = driverFilter !== 'All' && monthSubTab === 'dateWiseLogs';

  // -------------------------------------------------------------
  // 3. YEARLY VIEW LOGIC
  // -------------------------------------------------------------
  const shiftYear = (deltaYears: number) => {
    const y = parseInt(selectedYear, 10) + deltaYears;
    setSelectedYear(String(y));
  };

  const yearlyExpenses = useMemo(() => {
    return allExpenses.filter(r => r.date && r.date.startsWith(selectedYear));
  }, [allExpenses, selectedYear]);

  const yearlyStats = useMemo(() => {
    const source =
      driverFilter !== 'All'
        ? yearlyExpenses.filter(r => r.driverName.toLowerCase() === driverFilter.toLowerCase())
        : yearlyExpenses;
    let total = 0, paid = 0, pending = 0;
    source.forEach(r => {
      total += r.amount;
      if (r.status === 'Paid') paid += r.amount;
      else pending += r.amount;
    });
    return { total, paid, pending, count: source.length };
  }, [yearlyExpenses, driverFilter]);

  const monthlyBreakdownCards = useMemo(() => {
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
  }, [selectedYear, yearlyExpenses]);

  const yearlyDriverSummary = useMemo(() => {
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
        if (!d.transactionCount || d.transactionCount <= 0) return false;
        const matchSearch =
          d.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (d.vehicle ? d.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) : false);
        const matchDriver = driverFilter === 'All' || d.driverName.toLowerCase() === driverFilter.toLowerCase();
        return matchSearch && matchDriver;
      });
  }, [selectedYear, drivers, yearlyExpenses, searchQuery, driverFilter]);

  const renderFilterControls = () => {
    const hasDriverFilter = driverFilter !== 'All';
    const hasStatusFilter = timeFrame === 'daily' && statusFilter !== 'All';
    const activeFilterCount = (hasDriverFilter ? 1 : 0) + (hasStatusFilter ? 1 : 0);

    const currentMonthIST = todayIST().slice(0, 7);
    const lastMonthObj = new Date();
    lastMonthObj.setMonth(lastMonthObj.getMonth() - 1);
    const lastMonthIST = `${lastMonthObj.getFullYear()}-${String(lastMonthObj.getMonth() + 1).padStart(2, '0')}`;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Filter Trigger Button with Dropdown Popover */}
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsFilterOpen(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: 550,
              borderRadius: '6px',
              borderColor: (isFilterOpen || activeFilterCount > 0) ? 'var(--accent)' : 'var(--border)',
              background: (isFilterOpen || activeFilterCount > 0) ? 'rgba(56, 189, 248, 0.08)' : 'var(--surface)',
              color: (isFilterOpen || activeFilterCount > 0) ? 'var(--accent)' : 'var(--text)',
              cursor: 'pointer'
            }}
          >
            <Filter size={13} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  lineHeight: '1.2'
                }}
              >
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              size={12}
              style={{
                transform: isFilterOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
                opacity: 0.8
              }}
            />
          </button>

          {/* Popover Dropdown */}
          {isFilterOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 100,
                width: '320px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text)' }}>Filter Expenses</span>
                {(hasDriverFilter || hasStatusFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDriverFilter('All');
                      setStatusFilter('All');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600
                    }}
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Date / Period Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {timeFrame === 'monthly' ? 'Month' : timeFrame === 'daily' ? 'Date' : 'Year'}
                </label>

                {timeFrame === 'monthly' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => shiftMonth(-1)}
                        title="Previous month"
                        style={{ padding: '6px 8px', height: '34px' }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <input
                        type="month"
                        className="form-input"
                        value={selectedMonth}
                        onChange={e => e.target.value && setSelectedMonth(e.target.value)}
                        style={{ flex: 1, height: '34px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => shiftMonth(1)}
                        title="Next month"
                        style={{ padding: '6px 8px', height: '34px' }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedMonth(currentMonthIST);
                          setDriverFilter('All');
                        }}
                        style={{ flex: 1, fontSize: '11.5px', padding: '4px', textAlign: 'center' }}
                      >
                        This month
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedMonth(lastMonthIST);
                          setDriverFilter('All');
                        }}
                        style={{ flex: 1, fontSize: '11.5px', padding: '4px', textAlign: 'center' }}
                      >
                        Last month
                      </button>
                    </div>
                  </div>
                )}

                {timeFrame === 'daily' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => shiftDate(-1)}
                      title="Previous day"
                      style={{ padding: '6px 8px', height: '34px' }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <div style={{ flex: 1 }}>
                      <DatePicker value={selectedDate} onChange={date => date && setSelectedDate(date)} />
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => shiftDate(1)}
                      title="Next day"
                      style={{ padding: '6px 8px', height: '34px' }}
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedDate(todayIST())}
                      style={{ padding: '6px 8px', fontSize: '11px', height: '34px' }}
                    >
                      Today
                    </button>
                  </div>
                )}

                {timeFrame === 'yearly' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => shiftYear(-1)}
                      title="Previous year"
                      style={{ padding: '6px 8px', height: '34px' }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <select
                      className="form-input"
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                      style={{ flex: 1, height: '34px', fontSize: '12px', fontWeight: 600 }}
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => shiftYear(1)}
                      title="Next year"
                      style={{ padding: '6px 8px', height: '34px' }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Driver Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Driver
                </label>
                <select
                  className={`form-input filter-select ${driverFilter !== 'All' ? 'filter-select--active' : ''}`}
                  value={driverFilter}
                  onChange={e => setDriverFilter(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px' }}
                >
                  <option value="All">All drivers</option>
                  {allAvailableDrivers.map(d => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name}{d.vehicle ? ` · ${d.vehicle}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter (in daily mode) */}
              {timeFrame === 'daily' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Status
                  </label>
                  <select
                    className="form-input filter-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ width: '100%', height: '34px', fontSize: '12px' }}
                  >
                    <option value="All">All status</option>
                    <option value="Paid">Paid</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsFilterOpen(false)}
                style={{
                  width: '100%',
                  padding: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  justifyContent: 'center',
                  marginTop: '4px'
                }}
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Active Selection Chips (Date & Driver) */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-dim)',
            background: 'var(--surface-2, rgba(255, 255, 255, 0.05))',
            padding: '4px 8px',
            borderRadius: '5px',
            border: '1px solid var(--border)'
          }}
        >
          <Calendar size={12} style={{ color: 'var(--accent)' }} />
          {timeFrame === 'monthly' && formattedMonthLabel}
          {timeFrame === 'daily' && formattedDateLabel}
          {timeFrame === 'yearly' && selectedYear}
        </span>

        {hasDriverFilter && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'rgba(56, 189, 248, 0.1)',
              padding: '4px 8px',
              borderRadius: '5px',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}
          >
            Driver: {driverFilter}
            <button
              type="button"
              onClick={() => setDriverFilter('All')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '2px'
              }}
              title="Clear driver filter"
            >
              <X size={12} />
            </button>
          </span>
        )}

        {isLoadingAnalytics && <Loader2 size={13} className="animate-spin" style={{ color: 'var(--accent)' }} />}
      </div>
    );
  };

  return (
    <div className="module-page">
      {/* Top View Mode Switcher Header */}
      <div className="module-toolbar">
        <div className="subtab-nav" style={{ margin: 0, padding: 0 }}>
          <button
            type="button"
            className={`subtab-btn ${timeFrame === 'daily' ? 'active' : ''}`}
            onClick={() => setTimeFrame('daily')}
          >
            <Calendar size={14} /> Daily
          </button>
          <button
            type="button"
            className={`subtab-btn ${timeFrame === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeFrame('monthly')}
          >
            <CalendarDays size={14} /> Monthly
          </button>
          <button
            type="button"
            className={`subtab-btn ${timeFrame === 'yearly' ? 'active' : ''}`}
            onClick={() => setTimeFrame('yearly')}
          >
            <TrendingUp size={14} /> Yearly
          </button>
        </div>

        <button type="button" className="btn-primary-action" onClick={() => setIsAddModalOpen(true)}>
          + Add expense
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. PARTICULAR DAY (DAILY) VIEW                                  */}
      {/* ============================================================== */}
      {timeFrame === 'daily' && (
        <>
          <div className="stats-grid stats-grid--lean">
            <StatCard label="Today total" value={formatINR(dailyStats.total)} customColor="var(--accent)" />
            <StatCard label="Paid" value={formatINR(dailyStats.paid)} />
            <StatCard label="Due" value={formatINR(dailyStats.pending + dailyStats.approved)} />
            <StatCard label="Claims" value={`${dailyStats.count}`} />
          </div>

          <div className="panel panel--table" style={{ overflow: 'visible' }}>
            <div className="module-filter-bar">
              <div className="module-filter-bar__group">
                {renderFilterControls()}
              </div>

              {renderPayControls(filteredDailyExpenses)}
            </div>

            {driverFilter !== 'All' && (
              <div className="module-drilldown-bar">
                <button type="button" className="module-drilldown-bar__back" onClick={() => setDriverFilter('All')}>
                  <ChevronLeft size={14} />
                  All drivers
                </button>
                <span>
                  Showing <strong>{driverFilter}</strong> · {formattedDateLabel} · {filteredDailyExpenses.length} claims
                </span>
              </div>
            )}

            <div className="table-responsive table-dense">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Date</th>
                    <th>Driver</th>
                    <th>Expense details</th>
                    <th className="td-right">Amount</th>
                    <th>Status</th>
                    <th className="td-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '28px 0' }}>
                        No driver expenses recorded for {formattedDateLabel} {driverFilter !== 'All' ? `for ${driverFilter}` : ''}. Click "+ Add Driver Expense" above.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyExpenses.map(exp => {
                      const key = expenseKey(exp);
                      const unpaid = exp.status !== 'Paid';
                      return (
                      <tr key={key}>
                        <td>
                          <input
                            type="checkbox"
                            disabled={!unpaid}
                            checked={unpaid && selectedKeys.includes(key)}
                            onChange={() => toggleSelected(key)}
                          />
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                          {exp.date}
                        </td>
                        <td>{renderCompactDriverCell(exp.driverName)}</td>
                        <td>{renderExpenseDetailsCell(exp)}</td>
                        <td className="td-amount td-right">{formatINR(exp.amount)}</td>
                        <td>{renderStatusDropdown(exp)}</td>
                        <td className="td-right">{renderExpenseActions(exp)}</td>
                      </tr>
                      );
                    })
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
          <div className="stats-grid stats-grid--lean">
            <StatCard label="Monthly total" value={formatINR(monthlyStats.total)} customColor="var(--accent)" />
            <StatCard label="Paid out" value={formatINR(monthlyStats.paid)} />
            <StatCard label="Due" value={formatINR(monthlyStats.pending + monthlyStats.approved)} />
            <StatCard label="Claims" value={`${monthlyStats.count}`} />
          </div>

          <div className="panel panel--table" style={{ overflow: 'visible' }}>
            <div className="module-filter-bar">
              <div className="module-filter-bar__group">
                {renderFilterControls()}
              </div>

              <div className="filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${monthSubTab === 'driverSummary' ? 'active' : ''}`}
                  onClick={() => {
                    if (driverFilter !== 'All') clearDriverDrilldown();
                    else setMonthSubTab('driverSummary');
                  }}
                >
                  By driver
                </button>
                <button
                  type="button"
                  className={`filter-pill ${monthSubTab === 'dateWiseLogs' ? 'active' : ''}`}
                  onClick={() => setMonthSubTab('dateWiseLogs')}
                >
                  By date ({filteredMonthlyExpenses.length})
                </button>
              </div>
            </div>

            {isDriverDrilldown && (
              <div className="module-drilldown-bar">
                <button type="button" className="module-drilldown-bar__back" onClick={clearDriverDrilldown}>
                  <ChevronLeft size={14} />
                  All drivers
                </button>
                <span>
                  Showing <strong>{driverFilter}</strong> · {formattedMonthLabel} · {filteredMonthlyExpenses.length} claims · {formatINR(monthlyStats.total)}
                </span>
              </div>
            )}

            {monthSubTab === 'driverSummary' && (
              <div className="table-responsive table-dense">
                <table>
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Vehicle</th>
                      <th className="td-right">Total</th>
                      <th>Category breakdown</th>
                      <th className="td-right">Paid / Pending</th>
                      <th>Claims</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDriverSummary.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '28px 0' }}>
                          No drivers found matching your search.
                        </td>
                      </tr>
                    ) : (
                      monthlyDriverSummary.map((d: any) => {
                        const isFiltered = driverFilter === d.driverName;
                        return (
                          <tr
                            key={d.driverId || d.driverName}
                            onClick={() => handleDriverEntriesClick(d.driverName)}
                            className={`table-row-clickable${isFiltered ? ' table-row-active' : ''}`}
                            title={`View all expenses for ${d.driverName}`}
                          >
                            <td>
                              {renderCompactDriverCell(
                                d.driverName,
                                `${d.driverType || 'Driver'}${isFiltered ? ' · Filtered' : ''}`
                              )}
                            </td>
                            <td style={{ fontWeight: 500 }}>{d.vehicle || '—'}</td>
                            <td className="td-amount td-right" style={{ color: 'var(--accent)' }}>
                              {formatINR(d.totalAmount)}
                            </td>
                            <td>{renderBreakdownCell(d)}</td>
                            <td className="td-right">
                              <div className="cell-money-pair">
                                <span className="paid">Paid {formatINR(d.paidAmount || 0)}</span>
                                <span className="pending">Due {formatINR(d.pendingAmount || 0)}</span>
                              </div>
                            </td>
                            <td>
                              <div className="table-actions" style={{ justifyContent: 'flex-start' }}>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDriverEntriesClick(d.driverName);
                                  }}
                                  style={{
                                    padding: '3px 10px',
                                    fontSize: '11px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title={`View date-wise history for ${d.driverName}`}
                                >
                                  {d.transactionCount} {d.transactionCount === 1 ? 'entry' : 'entries'}
                                  {d.transactionCount > 0 ? <ArrowUpRight size={12} /> : null}
                                </button>
                                {d.pendingAmount > 0 ? (
                                  <button
                                    type="button"
                                    className="btn-primary-action"
                                    style={{ padding: '3px 10px', fontSize: '11px' }}
                                    onClick={e => {
                                      e.stopPropagation();
                                      payItems(d.records || []);
                                    }}
                                  >
                                    Pay
                                  </button>
                                ) : null}
                              </div>
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
                <div className="module-filter-bar" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="module-filter-bar__group">
                    <select
                      className="form-input filter-select"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All status</option>
                      <option value="Paid">Paid</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  {renderPayControls(filteredMonthlyExpenses)}
                </div>

                <div className="table-responsive table-dense">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 32 }}></th>
                        <th>Date</th>
                        <th>Driver</th>
                        <th>Expense details</th>
                        <th className="td-right">Amount</th>
                        <th>Status</th>
                        <th className="td-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMonthlyExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '28px 0' }}>
                            No driver expenses recorded for {formattedMonthLabel} {driverFilter !== 'All' ? `for driver ${driverFilter}` : ''}. Click "+ Add Driver Expense" above.
                          </td>
                        </tr>
                      ) : (
                        filteredMonthlyExpenses.map(exp => {
                          const key = expenseKey(exp);
                          const unpaid = exp.status !== 'Paid';
                          return (
                          <tr key={key}>
                            <td>
                              <input
                                type="checkbox"
                                disabled={!unpaid}
                                checked={unpaid && selectedKeys.includes(key)}
                                onChange={() => toggleSelected(key)}
                              />
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                              {exp.date}
                            </td>
                            <td>{renderCompactDriverCell(exp.driverName)}</td>
                            <td>{renderExpenseDetailsCell(exp)}</td>
                            <td className="td-amount td-right">{formatINR(exp.amount)}</td>
                            <td>{renderStatusDropdown(exp)}</td>
                            <td className="td-right">{renderExpenseActions(exp)}</td>
                          </tr>
                          );
                        })
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
          <div className="stats-grid stats-grid--lean">
            <StatCard label="Year total" value={formatINR(yearlyStats.total)} customColor="var(--accent)" />
            <StatCard label="Paid out" value={formatINR(yearlyStats.paid)} />
            <StatCard label="Due" value={formatINR(yearlyStats.pending)} />
            <StatCard label="Claims" value={`${yearlyStats.count}`} />
          </div>

          <div className="panel panel--table" style={{ overflow: 'visible' }}>
            <div className="module-filter-bar">
              <div className="module-filter-bar__group">
                {renderFilterControls()}
              </div>
            </div>

            {driverFilter !== 'All' && (
              <div className="module-drilldown-bar">
                <button type="button" className="module-drilldown-bar__back" onClick={() => setDriverFilter('All')}>
                  <ChevronLeft size={14} />
                  All drivers
                </button>
                <span>
                  Showing <strong>{driverFilter}</strong> · {selectedYear} · {yearlyStats.count} claims · {formatINR(yearlyStats.total)}
                </span>
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
              <div className="table-responsive table-dense">
                <table>
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Vehicle</th>
                      <th className="td-right">Total {selectedYear}</th>
                      <th className="td-right">Paid / Pending</th>
                      <th>Claims</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyDriverSummary.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '28px 0' }}>
                          No driver records found.
                        </td>
                      </tr>
                    ) : (
                      yearlyDriverSummary.map((d: any) => (
                        <tr
                          key={d.driverId || d.driverName}
                          onClick={() => {
                            setDriverFilter(d.driverName);
                            setMonthSubTab('dateWiseLogs');
                            if (!selectedMonth.startsWith(selectedYear)) {
                              setSelectedMonth(`${selectedYear}-${todayIST().slice(5, 7)}`);
                            }
                            setTimeFrame('monthly');
                          }}
                          className="table-row-clickable"
                          title={`View ${d.driverName}'s expenses`}
                        >
                          <td>{renderCompactDriverCell(d.driverName, d.driverType)}</td>
                          <td style={{ fontWeight: 500 }}>{d.vehicle || '—'}</td>
                          <td className="td-amount td-right" style={{ color: 'var(--accent)' }}>
                            {formatINR(d.totalAmount)}
                          </td>
                          <td className="td-right">
                            <div className="cell-money-pair">
                              <span className="paid">Paid {formatINR(d.paidAmount || 0)}</span>
                              <span className="pending">Due {formatINR(d.pendingAmount || 0)}</span>
                            </div>
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
              {activeReceipt.startsWith('data:image') || activeReceipt.startsWith('http') ? (
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

