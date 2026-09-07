import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { GenerateBillModal } from './GenerateBillModal';
import { BillPrintModal, CashMemoBillView } from './BillPrintModal';
import { WeekendTripBillModal } from './WeekendTripBillModal';
import { MonthlyDepartmentBill, DailyDutyLog } from '../../../types/fleet';
import {
  Building2,
  Layers,
  ListFilter,
  FileText,
  ChevronDown,
  Printer,
  Percent,
  Zap,
  Check,
  Briefcase,
  MapPin,
  Fuel,
  CreditCard,
  Plus
} from 'lucide-react';
import { MonthPicker } from '../../common/MonthPicker';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const MonthlyBillingView: React.FC = () => {
  const {
    monthlyBills,
    dailyDutyLogs,
    updateDailyDutyLogStatus,
    updateBillStatus,
    generateWeekendMemoBill,
    searchQuery,
    departmentContracts,
    activeGstRate,
    activeGstType,
    applyGstRate
  } = useFleet();

  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'by-dept' | 'flat' | 'invoice'>('by-dept');
  const [activeInvoiceBill, setActiveInvoiceBill] = useState<MonthlyDepartmentBill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillForPreview, setSelectedBillForPreview] = useState<MonthlyDepartmentBill | null>(null);
  const [selectedWeekendLogForBill, setSelectedWeekendLogForBill] = useState<DailyDutyLog | null>(null);
  const [selectedWeekendBillForPreview, setSelectedWeekendBillForPreview] = useState<MonthlyDepartmentBill | null>(null);
  const [deptRecordTabs, setDeptRecordTabs] = useState<Record<string, 'all' | 'tender' | 'weekend'>>({});

  // Active GST Configurator State
  const [customGstInput, setCustomGstInput] = useState<string>(String(activeGstRate ?? 5));
  const [customGstType, setCustomGstType] = useState<'CGST_SGST' | 'IGST'>(activeGstType || 'CGST_SGST');
  const [isApplyingGst, setIsApplyingGst] = useState(false);

  const handleApplyGstToBills = async () => {
    const rate = parseFloat(customGstInput);
    if (isNaN(rate) || rate < 0) return;
    setIsApplyingGst(true);
    try {
      await applyGstRate(rate, customGstType, deptFilter === 'All' ? undefined : deptFilter);
    } finally {
      setIsApplyingGst(false);
    }
  };

  const handleGenerateCashMemoBill = async (log: DailyDutyLog) => {
    try {
      await generateWeekendMemoBill(log.id);
    } catch (err) {
      console.error('Failed to generate cash memo bill:', err);
    }
  };

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  // List of all unique departments from contracts, bills and duty logs
  const allDepartmentNames = useMemo(() => {
    const set = new Set<string>();
    departmentContracts.forEach(c => set.add(c.departmentName));
    monthlyBills.forEach(b => set.add(b.departmentName));
    dailyDutyLogs.forEach(l => {
      if (l.departmentName) set.add(l.departmentName);
    });
    return Array.from(set).filter(Boolean);
  }, [departmentContracts, monthlyBills, dailyDutyLogs]);

  // Months available
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    monthlyBills.forEach(b => set.add(b.billingMonth));
    dailyDutyLogs.forEach(l => {
      if (l.month) set.add(l.month);
    });
    return Array.from(set);
  }, [monthlyBills, dailyDutyLogs]);

  // Filtered bills (Only Monthly Tender Rent contracts, Weekend cash memos have their own dedicated section & tab)
  const filteredBills = useMemo(() => {
    return monthlyBills.filter(bill => {
      if (bill.billType === 'Weekend / Off-Duty Cash Memo') {
        return false;
      }

      const matchSearch =
        bill.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.billingMonth.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = deptFilter === 'All' || bill.departmentName === deptFilter;
      const matchStatus = statusFilter === 'All' || bill.status === statusFilter;
      const matchMonth = monthFilter === 'All' || bill.billingMonth === monthFilter;

      return matchSearch && matchDept && matchStatus && matchMonth;
    });
  }, [monthlyBills, searchQuery, deptFilter, statusFilter, monthFilter]);

  // Department-wise grouping (includes both Tender Monthly bills AND Weekend / Sat-Sun off-duty logs & memos)
  const departmentGroups = useMemo(() => {
    const groupsMap: Record<
      string,
      {
        departmentName: string;
        bills: MonthlyDepartmentBill[];
        weekendLogs: DailyDutyLog[];
        totalTenderBilled: number;
        totalTenderPaid: number;
        totalTenderPending: number;
        totalWeekendBilled: number;
        totalWeekendPaid: number;
        totalWeekendPending: number;
        totalBilled: number;
        totalPaid: number;
        totalPending: number;
        vehicles: string[];
        activeContractNo?: string;
      }
    > = {};

    allDepartmentNames.forEach(dept => {
      const contract = departmentContracts.find(c => c.departmentName === dept);
      const contractVehicles = departmentContracts.filter(c => c.departmentName === dept).map(c => c.vehicle);

      // Find weekend logs for this department
      const deptWeekendLogs = dailyDutyLogs.filter(l => {
        if (l.dutyType !== 'Weekend / Off-Duty Trip') return false;
        const matchDept = l.departmentName === dept || contractVehicles.includes(l.vehicle);
        if (!matchDept) return false;

        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          l.departmentName.toLowerCase().includes(q) ||
          l.dutySlipNumber.toLowerCase().includes(q) ||
          l.vehicle.toLowerCase().includes(q) ||
          (l.driverName && l.driverName.toLowerCase().includes(q)) ||
          (l.officerName && l.officerName.toLowerCase().includes(q));

        const matchMonth =
          monthFilter === 'All' ||
          (l.month && l.month.toLowerCase().includes(monthFilter.toLowerCase())) ||
          (l.date && l.date.startsWith(monthFilter));

        const matchStatus =
          statusFilter === 'All' ||
          (l.billingStatus || 'Unbilled').toLowerCase() === statusFilter.toLowerCase() ||
          l.status.toLowerCase() === statusFilter.toLowerCase();

        return matchSearch && matchMonth && matchStatus;
      });

      // Find tender bills for this department
      const deptBills = filteredBills.filter(b => b.departmentName === dept);

      // Calculate totals
      let tenderBilled = 0;
      let tenderPaid = 0;
      let tenderPending = 0;
      deptBills.forEach(b => {
        tenderBilled += b.totalBill;
        tenderPaid += b.paidAmount;
        tenderPending += b.balanceDue;
      });

      let weekendBilled = 0;
      let weekendPaid = 0;
      let weekendPending = 0;
      deptWeekendLogs.forEach(l => {
        const fare = (l.totalFare && l.totalFare > 0) ? l.totalFare : (l.tripFare || 0);
        weekendBilled += fare;
        if (l.billingStatus === 'Paid' || l.billingStatus === 'Billed') {
          weekendPaid += fare;
        } else {
          weekendPending += fare;
        }
      });

      // Collect vehicles
      const vehiclesSet = new Set<string>();
      if (contract?.vehicle) vehiclesSet.add(contract.vehicle);
      deptBills.forEach(b => vehiclesSet.add(b.vehicle));
      deptWeekendLogs.forEach(l => vehiclesSet.add(l.vehicle));

      groupsMap[dept] = {
        departmentName: dept,
        bills: deptBills,
        weekendLogs: deptWeekendLogs,
        totalTenderBilled: tenderBilled,
        totalTenderPaid: tenderPaid,
        totalTenderPending: tenderPending,
        totalWeekendBilled: weekendBilled,
        totalWeekendPaid: weekendPaid,
        totalWeekendPending: weekendPending,
        totalBilled: tenderBilled + weekendBilled,
        totalPaid: tenderPaid + weekendPaid,
        totalPending: tenderPending + weekendPending,
        vehicles: Array.from(vehiclesSet),
        activeContractNo: contract?.contractNumber
      };
    });

    // If deptFilter is specific, only show that department
    if (deptFilter !== 'All') {
      return Object.values(groupsMap).filter(g => g.departmentName === deptFilter);
    }

    // Filter out empty groups if search or other filters are applied
    if (searchQuery || statusFilter !== 'All' || monthFilter !== 'All') {
      return Object.values(groupsMap).filter(g => g.bills.length > 0 || g.weekendLogs.length > 0);
    }

    return Object.values(groupsMap);
  }, [allDepartmentNames, departmentContracts, filteredBills, dailyDutyLogs, deptFilter, searchQuery, statusFilter, monthFilter]);

  const {
    currentPage: deptPage,
    setCurrentPage: setDeptPage,
    pageSize: deptPageSize,
    setPageSize: setDeptPageSize,
    totalItems: totalDeptGroups,
    paginatedItems: paginatedDeptGroups
  } = usePagination(departmentGroups, 10);

  const {
    currentPage: flatPage,
    setCurrentPage: setFlatPage,
    pageSize: flatPageSize,
    setPageSize: setFlatPageSize,
    totalItems: totalFlatBills,
    paginatedItems: paginatedFlatBills
  } = usePagination(filteredBills, 10);

  // Quick stats
  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalGstEarned = 0;

    monthlyBills.forEach(b => {
      totalBilled += b.totalBill;
      totalPaid += b.paidAmount;
      totalPending += b.balanceDue;
      totalGstEarned += (b.gstAmount || 0);
    });

    // Also include weekend logs that aren't already represented in monthlyBills
    dailyDutyLogs.forEach(l => {
      if (l.dutyType === 'Weekend / Off-Duty Trip') {
        const fare = (l.totalFare && l.totalFare > 0) ? l.totalFare : (l.tripFare || 0);
        const hasBill = monthlyBills.some(b => b.dailyDutyLogId === l.id || (l.weekendBillNumber && b.billNumber === l.weekendBillNumber));
        if (!hasBill) {
          totalBilled += fare;
          totalGstEarned += (l.gstAmount || 0);
          if (l.billingStatus === 'Paid') {
            totalPaid += fare;
          } else {
            totalPending += fare;
          }
        }
      }
    });

    return {
      totalBilled,
      totalPaid,
      totalPending,
      totalGstEarned,
      totalCount: monthlyBills.length,
      deptCount: allDepartmentNames.length
    };
  }, [monthlyBills, dailyDutyLogs, allDepartmentNames]);

  const renderDutyLogStatusDropdown = (status: DailyDutyLog['status'], id: string) => {
    const isApproved = status === 'Approved';
    const isRejected = status === 'Rejected';
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={status}
          onChange={e => updateDailyDutyLogStatus(id, e.target.value as DailyDutyLog['status'])}
          style={{
            background: isApproved
              ? 'rgba(57, 255, 110, 0.12)'
              : isRejected
              ? 'rgba(255, 92, 92, 0.12)'
              : 'rgba(255, 193, 7, 0.12)',
            color: isApproved
              ? 'var(--success)'
              : isRejected
              ? '#ff5c5c'
              : '#ffc107',
            border: `1px solid ${
              isApproved
                ? 'rgba(57, 255, 110, 0.35)'
                : isRejected
                ? 'rgba(255, 92, 92, 0.35)'
                : 'rgba(255, 193, 7, 0.35)'
            }`,
            padding: '4px 20px 4px 8px',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none'
          }}
          title="Change duty log status"
        >
          <option value="Approved" style={{ background: 'var(--surface-1, #1e293b)', color: 'var(--success)' }}>● Approved</option>
          <option value="Pending" style={{ background: 'var(--surface-1, #1e293b)', color: '#ffc107' }}>● Pending</option>
          <option value="Rejected" style={{ background: 'var(--surface-1, #1e293b)', color: '#ff5c5c' }}>● Rejected</option>
        </select>
        <ChevronDown
          size={10}
          style={{
            position: 'absolute',
            right: '6px',
            pointerEvents: 'none',
            color: isApproved ? 'var(--success)' : isRejected ? '#ff5c5c' : '#ffc107'
          }}
        />
      </div>
    );
  };

  const renderStatusDropdown = (status: MonthlyDepartmentBill['status'], id: string) => {
    const getStatusStyle = (s: MonthlyDepartmentBill['status']) => {
      switch (s) {
        case 'Paid':
          return {
            background: 'rgba(57, 255, 110, 0.12)',
            color: 'var(--success)',
            borderColor: 'rgba(57, 255, 110, 0.35)'
          };
        case 'Sent':
          return {
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            borderColor: 'rgba(56, 189, 248, 0.35)'
          };
        case 'Overdue':
          return {
            background: 'rgba(255, 92, 92, 0.12)',
            color: 'var(--danger, #ff5c5c)',
            borderColor: 'rgba(255, 92, 92, 0.35)'
          };
        case 'Pending':
        case 'Draft':
          return {
            background: 'rgba(255, 193, 7, 0.12)',
            color: '#ffc107',
            borderColor: 'rgba(255, 193, 7, 0.35)'
          };
        default:
          return {
            background: 'var(--surface-3)',
            color: 'var(--text)',
            borderColor: 'var(--border)'
          };
      }
    };

    const style = getStatusStyle(status);

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={status}
          onChange={e => updateBillStatus(id, e.target.value as MonthlyDepartmentBill['status'])}
          style={{
            background: style.background,
            color: style.color,
            border: `1px solid ${style.borderColor}`,
            padding: '4px 22px 4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            lineHeight: 1.4
          }}
          title="Change invoice status"
        >
          <option value="Paid" style={{ background: 'var(--surface-1, #1e293b)', color: 'var(--success)' }}>● Paid</option>
          <option value="Sent" style={{ background: 'var(--surface-1, #1e293b)', color: '#38bdf8' }}>● Sent</option>
          <option value="Pending" style={{ background: 'var(--surface-1, #1e293b)', color: '#ffc107' }}>● Pending</option>
          <option value="Overdue" style={{ background: 'var(--surface-1, #1e293b)', color: '#ff5c5c' }}>● Overdue</option>
          <option value="Draft" style={{ background: 'var(--surface-1, #1e293b)', color: 'var(--text-dim)' }}>● Draft</option>
        </select>
        <ChevronDown
          size={11}
          style={{
            position: 'absolute',
            right: '7px',
            pointerEvents: 'none',
            color: style.color,
            opacity: 0.85
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Invoiced Billing" value={formatINR(stats.totalBilled)} customColor="var(--accent)" />
        <StatCard label="Total GST Earned" value={formatINR(stats.totalGstEarned)} customColor="#ffcc4d" />
        <StatCard label="Payments Realized (Paid)" value={formatINR(stats.totalPaid)} />
        <StatCard label="Outstanding Balance Due" value={formatINR(stats.totalPending)} customColor={stats.totalPending > 0 ? 'var(--danger)' : undefined} />
        <StatCard label="Client Departments" value={stats.deptCount} />
      </div>

      {/* Department Quick Filter Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}
      >
        <button
          className={`subtab-btn ${deptFilter === 'All' ? 'active' : ''}`}
          onClick={() => setDeptFilter('All')}
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          <Building2 size={14} />
          All Departments
          <span className="subtab-counter">{monthlyBills.length}</span>
        </button>

        {allDepartmentNames.map(dept => {
          const deptBills = monthlyBills.filter(b => b.departmentName === dept);
          const deptTotal = deptBills.reduce((acc, curr) => acc + curr.totalBill, 0);
          const hasPending = deptBills.some(b => b.balanceDue > 0);

          return (
            <button
              key={dept}
              className={`subtab-btn ${deptFilter === dept ? 'active' : ''}`}
              onClick={() => setDeptFilter(dept)}
              style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              {dept}
              <span
                className="subtab-counter"
                style={{
                  background: hasPending ? 'rgba(255, 92, 92, 0.18)' : undefined,
                  color: hasPending ? 'var(--danger)' : undefined,
                  borderColor: hasPending ? 'rgba(255, 92, 92, 0.3)' : undefined
                }}
              >
                {formatINR(deptTotal)}
              </span>
            </button>
          );
        })}
      </div>

      {/* GST CONFIGURATION BAR FOR MONTHLY BILLING */}
      <div
        className="panel"
        style={{
          padding: '12px 18px',
          background: 'linear-gradient(135deg, rgba(22, 135, 245, 0.07), rgba(99, 102, 241, 0.04))',
          border: '1.5px solid rgba(22, 135, 245, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderRadius: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 800, fontSize: '13.5px' }}>
            <Percent size={17} /> GST Configuration for Bills:
          </div>

          {/* Quick GST Presets */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 5, 12, 18].map(rate => (
              <button
                key={rate}
                type="button"
                onClick={() => setCustomGstInput(String(rate))}
                className={`subtab-btn ${customGstInput === String(rate) ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}
              >
                {rate === 0 ? '0% (Exempt)' : `${rate}%`}
              </button>
            ))}
          </div>

          {/* Custom GST Input Field */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 500 }}>Custom:</span>
            <div style={{ position: 'relative', width: '85px' }}>
              <input
                type="number"
                min="0"
                max="28"
                step="0.5"
                className="form-input"
                style={{ padding: '4px 22px 4px 8px', fontSize: '12.5px', fontWeight: 700, textAlign: 'right' }}
                value={customGstInput}
                onChange={e => setCustomGstInput(e.target.value)}
                placeholder="Rate"
              />
              <span
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '12px',
                  color: 'var(--text-faint)',
                  fontWeight: 700
                }}
              >
                %
              </span>
            </div>
          </div>

          {/* GST Type Selector */}
          <select
            className="form-input"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', fontWeight: 500 }}
            value={customGstType}
            onChange={e => setCustomGstType(e.target.value as 'CGST_SGST' | 'IGST')}
          >
            <option value="CGST_SGST">CGST + SGST (Intra-state 50/50)</option>
            <option value="IGST">IGST (Inter-state Full)</option>
          </select>
        </div>

        {/* Apply Button & Live Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', textAlign: 'right' }}>
            <div>Total GST Earned:</div>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#f59e0b' }}>
              {formatINR(stats.totalGstEarned)}
            </div>
          </div>
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleApplyGstToBills}
            disabled={isApplyingGst}
            style={{
              padding: '7px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #1687f5, #2563eb)',
              boxShadow: '0 2px 8px rgba(22, 135, 245, 0.3)'
            }}
          >
            <Zap size={14} /> {isApplyingGst ? 'Applying...' : `Apply ${customGstInput}% GST to Bills`}
          </button>
        </div>
      </div>

      {/* Main Filter & View Mode Toolbar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Mode Toggle */}
          <button
            className={`subtab-btn ${viewMode === 'by-dept' ? 'active' : ''}`}
            onClick={() => setViewMode('by-dept')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            <Layers size={14} />
            Group by Department
          </button>
          <button
            className={`subtab-btn ${viewMode === 'flat' ? 'active' : ''}`}
            onClick={() => setViewMode('flat')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            <ListFilter size={14} />
            All Invoices Table
          </button>
          <button
            className={`subtab-btn ${viewMode === 'invoice' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('invoice');
              if (!activeInvoiceBill && filteredBills.length > 0) {
                setActiveInvoiceBill(filteredBills[0]);
              }
            }}
            style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FileText size={14} />
            Cash Memo / Bill View
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Department Select */}
          <select
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            {allDepartmentNames.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Month Select */}
          <MonthPicker
            value={monthFilter}
            onChange={setMonthFilter}
            availableMonths={availableMonths}
            placeholder="All Months"
            align="left"
          />

          {/* Status Select */}
          <select
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Draft">Draft</option>
          </select>

          <button
            className="btn-primary-action"
            style={{ fontSize: '12px', padding: '7px 16px' }}
            onClick={() => setIsModalOpen(true)}
          >
            + Generate Monthly Bill
          </button>
        </div>
      </div>

      {/* VIEW 1: ACCORDING TO DEPARTMENT (GROUPED VIEW) */}
      {viewMode === 'by-dept' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {departmentGroups.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px 0' }}>
              No department billing records found matching your filters.
            </div>
          ) : (
<<<<<<< HEAD
            paginatedDeptGroups.map(group => (
              <div key={group.departmentName} className="dept-billing-card">
                {/* Department Header Card */}
                <div className="dept-billing-header">
                  <div className="dept-billing-title-group">
                    <div className="dept-billing-icon">
                      <Building2 size={18} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                        {group.departmentName}
=======
            departmentGroups.map(group => {
              const deptTab = deptRecordTabs[group.departmentName] || 'all';

              return (
                <div key={group.departmentName} className="dept-billing-card">
                  {/* Department Header Card */}
                  <div className="dept-billing-header">
                    <div className="dept-billing-title-group">
                      <div className="dept-billing-icon">
                        <Building2 size={18} color="var(--accent)" />
>>>>>>> 4aae514f48bb459be9972b8dc413492dcefb62db
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                            {group.departmentName}
                          </span>
                          {group.weekendLogs.length > 0 && (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                background: 'rgba(128, 0, 32, 0.12)',
                                border: '1px solid rgba(128, 0, 32, 0.3)',
                                color: '#800020',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Briefcase size={11} color="#e11d48" /> {group.weekendLogs.length} Weekend Bookings ({formatINR(group.totalWeekendBilled)})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {group.vehicles.length > 0 ? (
                            <span>Vehicles: <b>{group.vehicles.join(', ')}</b></span>
                          ) : null}
                          {group.activeContractNo ? (
                            <span> · Tender: <b>{group.activeContractNo}</b></span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="dept-billing-stats-strip">
                      <div className="dept-stat-item">
                        <span className="dept-stat-label">Total Invoiced</span>
                        <span className="dept-stat-val" style={{ color: 'var(--accent)' }}>
                          {formatINR(group.totalBilled)}
                        </span>
                        {group.totalWeekendBilled > 0 && (
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                            (Tender: {formatINR(group.totalTenderBilled)} + Wknd: {formatINR(group.totalWeekendBilled)})
                          </span>
                        )}
                      </div>

                      <div className="dept-stat-item">
                        <span className="dept-stat-label">Received / Paid</span>
                        <span className="dept-stat-val" style={{ color: 'var(--text)' }}>
                          {formatINR(group.totalPaid)}
                        </span>
                      </div>

                      <div className="dept-stat-item">
                        <span className="dept-stat-label">Outstanding Due</span>
                        <span
                          className="dept-stat-val"
                          style={{ color: group.totalPending > 0 ? 'var(--danger)' : 'var(--text-dim)' }}
                        >
                          {formatINR(group.totalPending)}
                        </span>
                      </div>

                      <button
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '6px 12px' }}
                        onClick={() => setIsModalOpen(true)}
                      >
                        + Bill Dept
                      </button>
                    </div>
                  </div>

                  {/* Subtabs for this department when weekend bookings exist */}
                  {group.weekendLogs.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        background: 'var(--surface-2)',
                        borderBottom: '1px solid var(--border)',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className={`subtab-btn ${deptTab === 'all' ? 'active' : ''}`}
                          onClick={() => setDeptRecordTabs(prev => ({ ...prev, [group.departmentName]: 'all' }))}
                          style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        >
                          All Records ({group.bills.length + group.weekendLogs.length})
                        </button>
                        <button
                          type="button"
                          className={`subtab-btn ${deptTab === 'tender' ? 'active' : ''}`}
                          onClick={() => setDeptRecordTabs(prev => ({ ...prev, [group.departmentName]: 'tender' }))}
                          style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        >
                          Monthly Tender Invoices ({group.bills.length})
                        </button>
                        <button
                          type="button"
                          className={`subtab-btn ${deptTab === 'weekend' ? 'active' : ''}`}
                          onClick={() => setDeptRecordTabs(prev => ({ ...prev, [group.departmentName]: 'weekend' }))}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            background: deptTab === 'weekend' ? '#800020' : 'rgba(128, 0, 32, 0.08)',
                            color: deptTab === 'weekend' ? '#ffffff' : '#800020',
                            borderColor: 'rgba(128, 0, 32, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600
                          }}
                        >
                          <Briefcase size={12} color={deptTab === 'weekend' ? '#ffffff' : '#e11d48'} />
                          Sat/Sun Weekend Logs & Memos ({group.weekendLogs.length})
                        </button>
                      </div>

                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {group.bills.length} Tender Monthly Bills · {group.weekendLogs.length} Weekend Bookings
                      </span>
                    </div>
                  )}

                  {/* Section A: Monthly Tender Invoices Table */}
                  {(deptTab === 'all' || deptTab === 'tender') && (
                    <div>
                      {deptTab === 'all' && group.weekendLogs.length > 0 && (
                        <div
                          style={{
                            padding: '8px 16px',
                            background: 'var(--surface-1)',
                            borderBottom: '1px solid var(--border)',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <FileText size={13} color="var(--accent)" />
                          Monthly Tender Contract Invoices ({group.bills.length})
                        </div>
                      )}

                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Invoice No & Month</th>
                              <th>Vehicle</th>
                              <th>Base Rent</th>
                              <th>Fuel</th>
                              <th>Night + Extra</th>
                              <th>Total bill</th>
                              <th>Status</th>
                              <th>Due date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.bills.length === 0 ? (
                              <tr>
                                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '20px 0' }}>
                                  No monthly invoices generated yet for this department.
                                </td>
                              </tr>
                            ) : (
                              group.bills.map(b => (
                                <tr key={b.id}>
                                  <td>
                                    <div>
                                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{b.billNumber}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                                        Month: {b.billingMonth}
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{ fontWeight: 500 }}>{b.vehicle}</td>
                                  <td className="num">{formatINR(b.baseContractAmount)}</td>
                                  <td className="num" style={{ color: '#f97316' }}>
                                    {formatINR(b.fuelCost || 0)}
                                    {(b.fuelLitresUsed || 0) > 0 && (
                                      <div style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 400 }}>
                                        {b.fuelLitresUsed?.toFixed(0)}L
                                      </div>
                                    )}
                                  </td>
                                  <td className="num" style={{ color: 'var(--warning)' }}>
                                    {formatINR((b.nightCost || 0) + b.extraKmCost + b.extraHoursCost + b.tollParkingCost)}
                                  </td>
                                  <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                                    {formatINR(b.totalBill)}
                                    {b.gstRate !== undefined && b.gstRate > 0 && (
                                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 400 }}>
                                        {b.gstRate}% {b.gstType === 'IGST' ? 'IGST' : 'CGST+SGST'} ({formatINR(b.gstAmount || 0)})
                                      </div>
                                    )}
                                  </td>
                                  <td>{renderStatusDropdown(b.status, b.id)}</td>
                                  <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{b.dueDate}</td>
                                  <td>
                                    <span
                                      className="bill-link"
                                      style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => setSelectedBillForPreview(b)}
                                    >
                                      <Printer size={12} /> Print Bill
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Section B: Weekend / Sat-Sun Off-Duty Bookings & Cash Memos Table */}
                  {((deptTab === 'all' && group.weekendLogs.length > 0) || deptTab === 'weekend') && (
                    <div style={{ marginTop: deptTab === 'all' ? '8px' : '0', borderTop: deptTab === 'all' ? '2px dashed rgba(128, 0, 32, 0.25)' : 'none' }}>
                      <div
                        style={{
                          padding: '10px 16px',
                          background: 'linear-gradient(90deg, rgba(128, 0, 32, 0.08), transparent)',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#800020' }}>
                          <Briefcase size={14} color="#e11d48" /> Sat/Sun Off-Duty Duty Slips & Cash Memos ({group.weekendLogs.length} entries · {formatINR(group.totalWeekendBilled)})
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                          Fixed pkg 80km + extra km @ rate + toll (Department Sat/Sun Cash Memo)
                        </span>
                      </div>

                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Slip No & Date</th>
                              <th>Duty Type & Dept</th>
                              <th>Vehicle & Driver</th>
                              <th>Odometer (Start → End)</th>
                              <th>Total KM & Route</th>
                              <th>Financials & Expenses</th>
                              <th>Timings & Hours</th>
                              <th>Officer / Private Client</th>
                              <th>Status</th>
                              <th>Receipts / Slips</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.weekendLogs.length === 0 ? (
                              <tr>
                                <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '20px 0' }}>
                                  No weekend off-duty bookings logged for this department.
                                </td>
                              </tr>
                            ) : (
                              group.weekendLogs.map(log => {
                                const fare = (log.totalFare && log.totalFare > 0) ? log.totalFare : (log.tripFare || 0);

                                return (
                                  <tr
                                    key={log.id}
                                    style={{
                                      background: 'rgba(56, 189, 248, 0.02)'
                                    }}
                                  >
                                    {/* Slip No & Date */}
                                    <td>
                                      <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span>{log.dutySlipNumber}</span>
                                          <span
                                            style={{
                                              fontSize: '10px',
                                              background: 'rgba(56, 189, 248, 0.1)',
                                              color: '#38bdf8',
                                              padding: '1px 5px',
                                              borderRadius: '4px',
                                              fontWeight: 600
                                            }}
                                          >
                                            Pg {log.logBookPageNo || '122'}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                                          {log.date}
                                        </div>
                                      </div>
                                    </td>

                                    {/* Duty Type & Dept */}
                                    <td>
                                      <div>
                                        <span className="tag trip" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                          <Briefcase size={10} /> Sat/Sun Booking
                                        </span>
                                        <div style={{ fontSize: '11.5px', fontWeight: 500, marginTop: '3px' }}>
                                          {log.departmentName}
                                        </div>
                                      </div>
                                    </td>

                                    {/* Vehicle & Driver */}
                                    <td>
                                      <div style={{ fontWeight: 600 }}>{log.vehicle}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '1px' }}>
                                        {log.driverName}
                                      </div>
                                    </td>

                                    {/* Odometer */}
                                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                      {log.startKm} → {log.endKm}
                                    </td>

                                    {/* Total KM & Route */}
                                    <td>
                                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                                        {log.totalKm} km
                                      </div>
                                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <MapPin size={10} /> {log.journeyFrom && log.journeyTo ? `${log.journeyFrom} → ${log.journeyTo}` : (log.tripDestination || 'Outstation Run')}
                                      </div>
                                    </td>

                                    {/* Financials & Expenses */}
                                    <td>
                                      <div>
                                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--success)' }}>
                                          {formatINR(fare)} Total
                                        </div>
                                        {log.packageBasePrice ? (
                                          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                            Pkg: ₹{log.packageBasePrice} ({log.packageFreeKm || 80}km free)
                                            {log.extraKmCost ? ` + Ext: ₹${log.extraKmCost}` : ''}
                                          </div>
                                        ) : (
                                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                                            Net Profit: {formatINR(log.tripNetProfit || 0)}
                                          </div>
                                        )}
                                        {log.tollParkingAmount > 0 && (
                                          <div style={{ fontSize: '10px', color: '#ffcc4d' }}>
                                            + Toll: ₹{log.tollParkingAmount}
                                          </div>
                                        )}
                                        <div style={{ fontSize: '9.5px', color: '#800020', fontWeight: 700, marginTop: '2px' }}>
                                          Sat/Sun Memo Bill
                                        </div>
                                      </div>
                                    </td>

                                    {/* Timings & Hours */}
                                    <td>
                                      <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                                        {log.totalHours} hrs
                                      </div>
                                      <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                                        {log.startTime} - {log.endTime}
                                      </div>
                                    </td>

                                    {/* Officer / Private Client */}
                                    <td>
                                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                                        {log.officerName || 'Private Client'}
                                      </div>
                                      {log.officerDesignation && (
                                        <div style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>
                                          {log.officerDesignation}
                                        </div>
                                      )}
                                      {log.purposeOfJourney && (
                                        <div style={{ fontSize: '10.5px', color: 'var(--accent)', marginTop: '2px' }}>
                                          {log.purposeOfJourney}
                                        </div>
                                      )}
                                    </td>

                                    {/* Status Dropdown */}
                                    <td>
                                      {renderDutyLogStatusDropdown(log.status, log.id)}
                                    </td>

                                    {/* Receipts / Slips */}
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <button
                                          className="btn-secondary"
                                          style={{
                                            fontSize: '11px',
                                            padding: '4px 8px',
                                            background: 'rgba(128, 0, 32, 0.08)',
                                            borderColor: 'rgba(128, 0, 32, 0.3)',
                                            color: '#800020',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontWeight: 600
                                          }}
                                          onClick={() => setSelectedWeekendLogForBill(log)}
                                        >
                                          <FileText size={11} color="#e11d48" /> Print Sat-Sun Bill
                                        </button>
                                        {log.billingStatus !== 'Billed' ? (
                                          <button
                                            className="btn-primary-action"
                                            style={{
                                              fontSize: '10px',
                                              padding: '3px 6px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '3px'
                                            }}
                                            onClick={() => handleGenerateCashMemoBill(log)}
                                          >
                                            + Issue Cash Memo
                                          </button>
                                        ) : (
                                          <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            ✓ Memo {log.weekendBillNumber || 'Issued'}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <Pagination
            currentPage={deptPage}
            totalItems={totalDeptGroups}
            pageSize={deptPageSize}
            onPageChange={setDeptPage}
            onPageSizeChange={setDeptPageSize}
            itemLabel="departments"
          />
        </div>
      )}

      {/* VIEW 2: ALL INVOICES FLAT TABLE VIEW */}
      {viewMode === 'flat' && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Master Billing Register</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredBills.length} invoices)
            </span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Invoice No & Month</th>
                  <th>Department</th>
                  <th>Vehicle</th>
                  <th>Base Rent</th>
                  <th>Fuel</th>
                  <th>Night + Extra + Toll</th>
                  <th>Total bill</th>
                  <th>Status</th>
                  <th>Due date</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                      No department monthly invoices found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedFlatBills.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{b.billNumber}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                            Month: {b.billingMonth}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{b.departmentName}</td>
                      <td style={{ fontWeight: 500 }}>{b.vehicle}</td>
                      <td className="num">{formatINR(b.baseContractAmount)}</td>
                      <td className="num" style={{ color: '#f97316' }}>
                        {formatINR(b.fuelCost || 0)}
                        {(b.fuelLitresUsed || 0) > 0 && (
                          <div style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 400 }}>
                            {b.fuelLitresUsed?.toFixed(0)}L
                          </div>
                        )}
                      </td>
                      <td className="num" style={{ color: 'var(--warning)' }}>
                        {formatINR((b.nightCost || 0) + b.extraKmCost + b.extraHoursCost + b.tollParkingCost)}
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {formatINR(b.totalBill)}
                        {b.gstRate !== undefined && b.gstRate > 0 && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 400 }}>
                            {b.gstRate}% {b.gstType === 'IGST' ? 'IGST' : 'CGST+SGST'} ({formatINR(b.gstAmount || 0)})
                          </div>
                        )}
                      </td>
                      <td>{renderStatusDropdown(b.status, b.id)}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{b.dueDate}</td>
                      <td>
                        <span
                          className="bill-link"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setSelectedBillForPreview(b)}
                        >
                          <Printer size={12} /> Print Bill
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={flatPage}
            totalItems={totalFlatBills}
            pageSize={flatPageSize}
            onPageChange={setFlatPage}
            onPageSizeChange={setFlatPageSize}
            itemLabel="invoices"
          />
        </div>
      )}

      {/* VIEW 3: CASH MEMO / INVOICE DOCUMENT VIEW */}
      {viewMode === 'invoice' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '16px', alignItems: 'start' }}>
          {/* Left Invoices Sidebar */}
          <div className="panel" style={{ padding: '14px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="panel-title" style={{ fontSize: '13px' }}>Select Invoice</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>{filteredBills.length} found</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredBills.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '20px 0', fontSize: '12px' }}>
                  No invoices match filters.
                </div>
              ) : (
                filteredBills.map(b => {
                  const currentSelected = activeInvoiceBill || filteredBills[0];
                  const isSelected = currentSelected?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setActiveInvoiceBill(b)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--surface-3)' : 'var(--surface-1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                          {b.billNumber}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>
                          {formatINR(b.totalBill)}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '2px', fontWeight: 500 }}>
                        {b.departmentName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                        <span>Taxi: <strong>{b.vehicle}</strong></span>
                        <span>{b.billingMonth}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Cash Memo View */}
          <div>
            {(activeInvoiceBill || filteredBills[0]) ? (
              <div>
                <div
                  className="panel"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 18px',
                    marginBottom: '14px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                      {(activeInvoiceBill || filteredBills[0]).billNumber}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-faint)', marginLeft: '8px' }}>
                      • {(activeInvoiceBill || filteredBills[0]).departmentName}
                    </span>
                  </div>
                  <button
                    className="btn-primary-action"
                    style={{ padding: '7px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setSelectedBillForPreview(activeInvoiceBill || filteredBills[0])}
                  >
                    <Printer size={14} /> Print / Save as PDF
                  </button>
                </div>

                <div
                  style={{
                    background: '#e2e8f0',
                    padding: '24px 16px',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'center',
                    overflow: 'auto'
                  }}
                >
                  <CashMemoBillView bill={activeInvoiceBill || filteredBills[0]} />
                </div>
              </div>
            ) : (
              <div className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>
                No invoice selected.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      <GenerateBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultGstRate={Number(customGstInput) || 5}
        defaultGstType={customGstType}
      />

      {/* Printable Cash Memo / Invoice Modal */}
      {selectedBillForPreview && (
        <BillPrintModal
          bill={selectedBillForPreview}
          onClose={() => setSelectedBillForPreview(null)}
        />
      )}

      {/* Weekend Trip Sat/Sun Cash Memo Bill Modal */}
      {selectedWeekendLogForBill && (
        <WeekendTripBillModal
          log={selectedWeekendLogForBill}
          onClose={() => setSelectedWeekendLogForBill(null)}
        />
      )}

      {selectedWeekendBillForPreview && (
        <WeekendTripBillModal
          bill={selectedWeekendBillForPreview}
          onClose={() => setSelectedWeekendBillForPreview(null)}
        />
      )}
    </div>
  );
};
