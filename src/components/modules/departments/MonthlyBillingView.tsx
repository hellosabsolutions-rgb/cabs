import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFleet } from '../../../context/FleetContext';
import { GenerateBillModal } from './GenerateBillModal';
import { BillPrintModal } from './BillPrintModal';
import { MonthlyDepartmentBill } from '../../../types/fleet';
import {
  ChevronDown,
  X
} from 'lucide-react';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const MonthlyBillingView: React.FC = () => {
  const navigate = useNavigate();
  const {
    monthlyBills,
    departmentContracts,
    activeGstRate,
    activeGstType,
    applyGstRate,
    updateBillStatus
  } = useFleet();

  // Selected Department Filter
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [billToPrint, setBillToPrint] = useState<MonthlyDepartmentBill | null>(null);

  // GST Settings Popover State
  const [isGstConfigOpen, setIsGstConfigOpen] = useState(false);
  const [customGstInput, setCustomGstInput] = useState<string>(String(activeGstRate ?? 5));
  const [customGstType, setCustomGstType] = useState<'CGST_SGST' | 'IGST'>(activeGstType || 'CGST_SGST');
  const [isApplyingGst, setIsApplyingGst] = useState(false);
  const gstPopoverRef = useRef<HTMLDivElement>(null);

  // Status dropdown popover on table rows
  const [activeStatusMenuBillId, setActiveStatusMenuBillId] = useState<string | null>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gstPopoverRef.current && !gstPopoverRef.current.contains(event.target as Node)) {
        setIsGstConfigOpen(false);
      }
      if (activeStatusMenuBillId) {
        setActiveStatusMenuBillId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeStatusMenuBillId]);

  const formatINR = (val: number) => '₹' + Math.round(val || 0).toLocaleString('en-IN');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatMonth = (monthStr?: string) => {
    if (!monthStr) return '';
    if (monthStr.includes('-')) {
      const [y, m] = monthStr.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const idx = parseInt(m, 10) - 1;
      if (idx >= 0 && idx < 12) {
        return `${months[idx]} ${y}`;
      }
    }
    return monthStr;
  };

  const getDepartmentInitials = (name: string) => {
    const clean = name.replace(/\([^)]*\)/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Distinct client departments from contracts and bills
  const clientDepartments = useMemo(() => {
    const deptMap = new Map<
      string,
      {
        name: string;
        initials: string;
        vehicles: string[];
        totalBilled: number;
        totalPaid: number;
        totalDue: number;
        invoiceCount: number;
      }
    >();

    // Seed from contracts
    departmentContracts.forEach(c => {
      if (!c.departmentName) return;
      if (!deptMap.has(c.departmentName)) {
        deptMap.set(c.departmentName, {
          name: c.departmentName,
          initials: getDepartmentInitials(c.departmentName),
          vehicles: c.vehicle ? [c.vehicle] : [],
          totalBilled: 0,
          totalPaid: 0,
          totalDue: 0,
          invoiceCount: 0
        });
      } else {
        const existing = deptMap.get(c.departmentName)!;
        if (c.vehicle && !existing.vehicles.includes(c.vehicle)) {
          existing.vehicles.push(c.vehicle);
        }
      }
    });

    // Accumulate from monthly bills
    monthlyBills.forEach(b => {
      if (!b.departmentName) return;
      if (!deptMap.has(b.departmentName)) {
        deptMap.set(b.departmentName, {
          name: b.departmentName,
          initials: getDepartmentInitials(b.departmentName),
          vehicles: b.vehicle ? [b.vehicle] : [],
          totalBilled: b.totalBill || 0,
          totalPaid: b.paidAmount || 0,
          totalDue: b.balanceDue || 0,
          invoiceCount: 1
        });
      } else {
        const existing = deptMap.get(b.departmentName)!;
        if (b.vehicle && !existing.vehicles.includes(b.vehicle)) {
          existing.vehicles.push(b.vehicle);
        }
        existing.totalBilled += (b.totalBill || 0);
        existing.totalPaid += (b.paidAmount || 0);
        existing.totalDue += (b.balanceDue || 0);
        existing.invoiceCount += 1;
      }
    });

    return Array.from(deptMap.values());
  }, [departmentContracts, monthlyBills]);

  // Set default selectedDept if needed
  useEffect(() => {
    if (clientDepartments.length > 0) {
      if (selectedDept !== 'All' && !clientDepartments.some(d => d.name === selectedDept)) {
        setSelectedDept(clientDepartments[0].name);
      }
    } else {
      setSelectedDept('All');
    }
  }, [clientDepartments, selectedDept]);

  // Overall Cycle Stats for right panel summary card
  const cycleStats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalGstEarned = 0;

    monthlyBills.forEach(b => {
      totalInvoiced += (b.totalBill || 0);
      totalPaid += (b.paidAmount || 0);
      totalDue += (b.balanceDue || 0);
      totalGstEarned += (b.gstAmount || 0);
    });

    const paidPercent = totalInvoiced > 0 ? Math.min(100, Math.round((totalPaid / totalInvoiced) * 100)) : 0;
    const duePercent = totalInvoiced > 0 ? 100 - paidPercent : 0;

    return {
      totalInvoiced,
      totalPaid,
      totalDue,
      totalGstEarned,
      paidPercent,
      duePercent
    };
  }, [monthlyBills]);

  // Available unique months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    monthlyBills.forEach(b => {
      if (b.billingMonth) set.add(b.billingMonth);
    });
    return Array.from(set).sort().reverse();
  }, [monthlyBills]);

  // Filtered bills for the currently selected department & filters
  const filteredInvoices = useMemo(() => {
    return monthlyBills.filter(b => {
      if (selectedDept !== 'All' && b.departmentName !== selectedDept) {
        return false;
      }
      if (monthFilter !== 'All' && b.billingMonth !== monthFilter) {
        return false;
      }
      if (statusFilter !== 'All' && b.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [monthlyBills, selectedDept, monthFilter, statusFilter]);

  // Selected Department specific KPI Stats (Main View)
  const currentDeptStats = useMemo(() => {
    let invoiced = 0;
    let received = 0;
    let outstanding = 0;

    filteredInvoices.forEach(b => {
      invoiced += (b.totalBill || 0);
      received += (b.paidAmount || 0);
      outstanding += (b.balanceDue || 0);
    });

    return { invoiced, received, outstanding };
  }, [filteredInvoices]);

  // Active department object for subtitle details
  const activeDepartmentObj = useMemo(() => {
    if (selectedDept === 'All') return null;
    return clientDepartments.find(d => d.name === selectedDept) || null;
  }, [clientDepartments, selectedDept]);

  // Pagination for main table
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedInvoices
  } = usePagination(filteredInvoices, 10);

  // Apply GST action
  const handleApplyGst = async () => {
    const rate = parseFloat(customGstInput);
    if (isNaN(rate) || rate < 0) return;
    setIsApplyingGst(true);
    try {
      await applyGstRate(rate, customGstType, selectedDept === 'All' ? undefined : selectedDept);
      setIsGstConfigOpen(false);
    } finally {
      setIsApplyingGst(false);
    }
  };

  const handlePrintActiveBill = () => {
    if (filteredInvoices.length > 0) {
      setBillToPrint(filteredInvoices[0]);
    } else {
      window.print();
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 280px',
        gap: '32px',
        alignItems: 'start',
        width: '100%',
        padding: '8px 4px'
      }}
      className="monthly-billing-layout-grid"
    >
      {/* ========================================================= */}
      {/* LEFT COLUMN: MAIN CONTENT (EXACTLY MATCHING SCREENSHOT)   */}
      {/* ========================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header: Title & Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '18px'
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--text, #111827)',
                letterSpacing: '-0.2px'
              }}
            >
              {selectedDept === 'All' ? 'All Client Departments' : selectedDept}
            </h2>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-faint, #6b7280)',
                marginTop: '3px'
              }}
            >
              {activeDepartmentObj ? (
                <>
                  <span>
                    {activeDepartmentObj.vehicles.length > 0
                      ? `Vehicle ${activeDepartmentObj.vehicles.join(', ')}`
                      : 'Contract vehicle'}
                  </span>
                  {' · '}
                  <span>billed monthly</span>
                </>
              ) : (
                <span>Overview across all {clientDepartments.length} client departments · billed monthly</span>
              )}
            </div>
          </div>

          {/* Top Right Action Buttons (exact look from screenshot) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrintActiveBill}
              style={{
                padding: '6px 14px',
                fontSize: '11.5px',
                fontWeight: 500,
                borderRadius: '6px',
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #d1d5db)',
                color: 'var(--text-dim, #374151)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Print bill
            </button>

            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              style={{
                padding: '6px 16px',
                fontSize: '11.5px',
                fontWeight: 600,
                borderRadius: '6px',
                background: '#1e3a5f',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              + Generate bill
            </button>
          </div>
        </div>

        {/* Filter Row: Dropdowns (exact pills from screenshot) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          {/* Month Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              style={{
                padding: '4px 24px 4px 10px',
                fontSize: '11.5px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid var(--border, #e5e7eb)',
                background: 'var(--surface, #ffffff)',
                color: 'var(--text-dim, #374151)',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              <option value="All">All months</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {formatMonth(m)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-faint, #6b7280)'
              }}
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '4px 24px 4px 10px',
                fontSize: '11.5px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid var(--border, #e5e7eb)',
                background: 'var(--surface, #ffffff)',
                color: 'var(--text-dim, #374151)',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              <option value="All">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Sent">Sent</option>
              <option value="Overdue">Overdue</option>
            </select>
            <ChevronDown
              size={12}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-faint, #6b7280)'
              }}
            />
          </div>
        </div>

        {/* Thin Divider under filter bar */}
        <div style={{ borderTop: '1px solid var(--border-soft, #f3f4f6)', marginBottom: '16px' }} />

        {/* 3 KPI Metrics Row (exact spacing and typography from screenshot) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '64px',
            marginBottom: '26px'
          }}
        >
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-faint, #6b7280)', fontWeight: 500 }}>
              Invoiced
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text, #111827)', marginTop: '4px' }}>
              {formatINR(currentDeptStats.invoiced)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-faint, #6b7280)', fontWeight: 500 }}>
              Received
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>
              {formatINR(currentDeptStats.received)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-faint, #6b7280)', fontWeight: 500 }}>
              Outstanding
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: currentDeptStats.outstanding > 0 ? '#ea580c' : 'var(--text, #111827)',
                marginTop: '4px'
              }}
            >
              {formatINR(currentDeptStats.outstanding)}
            </div>
          </div>
        </div>

        {/* Invoices Table (exact structure & clean style from screenshot) */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-soft, #f3f4f6)' }}>
                <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 500, color: 'var(--text-faint, #6b7280)' }}>
                  Invoice
                </th>
                <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 500, color: 'var(--text-faint, #6b7280)' }}>
                  Base + fuel
                </th>
                <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 500, color: 'var(--text-faint, #6b7280)' }}>
                  Total bill
                </th>
                <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 500, color: 'var(--text-faint, #6b7280)' }}>
                  Status
                </th>
                <th style={{ padding: '8px 12px', fontSize: '10.5px', fontWeight: 500, color: 'var(--text-faint, #6b7280)' }}>
                  Due date
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }} />
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '36px 12px',
                      color: 'var(--text-faint, #6b7280)',
                      fontSize: '12px'
                    }}
                  >
                    No invoices found for this department. Click <strong>+ Generate bill</strong> to create one.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map(b => {
                  const baseRent = b.baseContractAmount || 0;
                  const extraFuel = b.fuelCost || 0;
                  const extraNight = b.nightCost || 0;
                  const extraKm = b.extraKmCost || 0;
                  const hasExtras = extraFuel > 0 || extraNight > 0 || extraKm > 0;
                  const st = b.status || 'Pending';

                  return (
                    <tr
                      key={b.id || b.billNumber}
                      style={{ borderBottom: '1px solid var(--border-soft, #f9fafb)' }}
                    >
                      {/* Invoice # & Month */}
                      <td style={{ padding: '12px 12px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text, #111827)' }}>
                          {b.billNumber}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-faint, #6b7280)', marginTop: '2px' }}>
                          {formatMonth(b.billingMonth)}
                          {selectedDept === 'All' && ` · ${b.departmentName}`}
                        </div>
                      </td>

                      {/* Base + Fuel */}
                      <td style={{ padding: '12px 12px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-dim, #374151)' }}>
                          {formatINR(baseRent)} base {hasExtras ? '+ fuel/night' : ''}
                        </div>
                      </td>

                      {/* Total Bill */}
                      <td style={{ padding: '12px 12px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text, #111827)' }}>
                          {formatINR(b.totalBill)}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-faint, #6b7280)', marginTop: '2px' }}>
                          incl. GST {formatINR(b.gstAmount || 0)}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 12px', verticalAlign: 'top', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setActiveStatusMenuBillId(activeStatusMenuBillId === b.id ? null : b.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: st === 'Paid' ? '#ecfdf5' : st === 'Overdue' ? '#fef2f2' : '#fffbeb',
                            color: st === 'Paid' ? '#065f46' : st === 'Overdue' ? '#991b1b' : '#92400e',
                            border: `1px solid ${st === 'Paid' ? '#a7f3d0' : st === 'Overdue' ? '#fecaca' : '#fde68a'}`,
                            cursor: 'pointer'
                          }}
                          title="Click to change status"
                        >
                          <span style={{ fontSize: '7px' }}>●</span>
                          <span>{st}</span>
                        </button>

                        {/* Status update menu */}
                        {activeStatusMenuBillId === b.id && (
                          <div
                            onClick={e => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: '32px',
                              left: '12px',
                              background: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                              zIndex: 100,
                              minWidth: '100px',
                              padding: '3px',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {(['Paid', 'Pending', 'Sent', 'Overdue'] as const).map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  updateBillStatus(b.id, s);
                                  setActiveStatusMenuBillId(null);
                                }}
                                style={{
                                  background: b.status === s ? '#f3f4f6' : 'transparent',
                                  color: '#111827',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '5px 8px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  textAlign: 'left',
                                  cursor: 'pointer'
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '12px 12px', verticalAlign: 'top', fontSize: '11px', color: 'var(--text-dim, #374151)' }}>
                        {formatDate(b.dueDate || b.dutyEndDate)}
                      </td>

                      {/* Print Action link */}
                      <td style={{ padding: '12px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setBillToPrint(b)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#2563eb',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: '2px 4px'
                          }}
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination if multiple */}
        {filteredInvoices.length > 10 && (
          <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--border-soft, #f3f4f6)' }}>
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="invoices"
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: SIDE PANEL (EXACTLY MATCHING SCREENSHOT)   */}
      {/* ========================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Title */}
        <div style={{ marginBottom: '14px' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text, #111827)',
              letterSpacing: '-0.1px'
            }}
          >
            Departments & Contracts
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-faint, #6b7280)' }}>
            Contract vehicles, duty logs and billing
          </p>
        </div>

        {/* Total Invoiced Card (exact border, bar, and typography from screenshot) */}
        <div
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: '12px',
            padding: '16px 16px 14px 16px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-dim, #4b5563)', fontWeight: 500 }}>
            Total invoiced (this cycle)
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text, #111827)',
              marginTop: '4px',
              marginBottom: '10px',
              letterSpacing: '-0.4px'
            }}
          >
            {formatINR(cycleStats.totalInvoiced)}
          </div>

          {/* Two-tone Horizontal Bar */}
          <div
            style={{
              width: '100%',
              height: '5px',
              borderRadius: '3px',
              background: '#f3f4f6',
              display: 'flex',
              overflow: 'hidden',
              marginBottom: '6px'
            }}
          >
            <div
              style={{
                width: `${cycleStats.paidPercent}%`,
                background: '#15803d'
              }}
            />
            <div
              style={{
                width: `${cycleStats.duePercent}%`,
                background: '#c2410c'
              }}
            />
          </div>

          {/* Paid / Due breakdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10.5px',
              marginBottom: '12px'
            }}
          >
            <span style={{ color: '#15803d', fontWeight: 600 }}>
              Paid {formatINR(cycleStats.totalPaid)}
            </span>
            <span style={{ color: '#c2410c', fontWeight: 600 }}>
              Due {formatINR(cycleStats.totalDue)}
            </span>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-soft, #f3f4f6)', marginBottom: '8px' }} />

          {/* GST Info row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: 'var(--text-faint, #6b7280)',
              position: 'relative'
            }}
          >
            <div style={{ lineHeight: '1.3' }}>
              <div>GST rate applied: {activeGstRate}%</div>
              <div>({formatINR(cycleStats.totalGstEarned)} earned)</div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/profile?tab=tax')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 0',
                textDecoration: 'underline'
              }}
            >
              Change in Settings
            </button>

            {/* GST Configurator Popover */}
            {isGstConfigOpen && (
              <div
                ref={gstPopoverRef}
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  zIndex: 200,
                  padding: '12px',
                  width: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '11.5px', color: '#111827' }}>
                    Configure GST
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsGstConfigOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                  >
                    <X size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 5, 12, 18].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCustomGstInput(String(r))}
                      style={{
                        flex: 1,
                        padding: '3px 0',
                        fontSize: '10.5px',
                        borderRadius: '4px',
                        background: customGstInput === String(r) ? '#1e3a5f' : '#f3f4f6',
                        color: customGstInput === String(r) ? '#ffffff' : '#374151',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {r}%
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    value={customGstInput}
                    onChange={e => setCustomGstInput(e.target.value)}
                    style={{ width: '60px', padding: '3px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  />
                  <select
                    value={customGstType}
                    onChange={e => setCustomGstType(e.target.value as any)}
                    style={{ flex: 1, padding: '3px 6px', fontSize: '10.5px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                  >
                    <option value="CGST_SGST">CGST+SGST</option>
                    <option value="IGST">IGST</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isApplyingGst}
                  onClick={handleApplyGst}
                  style={{
                    padding: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    background: '#1e3a5f',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {isApplyingGst ? 'Applying...' : 'Apply GST'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Client Departments List Header */}
        <div style={{ fontSize: '11px', color: 'var(--text-faint, #6b7280)', fontWeight: 500, marginBottom: '8px' }}>
          {clientDepartments.length} client departments
        </div>

        {/* Departments List (exact avatar, typography, due amount from screenshot) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {clientDepartments.map(dept => {
            const isSelected = selectedDept === dept.name;
            const vehicleDesc =
              dept.vehicles.length === 0
                ? 'No vehicles'
                : dept.vehicles.length === 1
                ? `1 vehicle - ${dept.vehicles[0]}`
                : `${dept.vehicles.length} vehicles`;

            return (
              <div
                key={dept.name}
                onClick={() => setSelectedDept(dept.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--surface-3, #f1f5f9)' : 'transparent',
                  transition: 'background 0.1s ease'
                }}
              >
                {/* Left: Avatar & Text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '5px',
                      background: isSelected ? '#1e3a5f' : 'var(--surface-3, #f3f4f6)',
                      border: isSelected ? '1px solid #1e3a5f' : '1px solid var(--border, #e5e7eb)',
                      color: isSelected ? '#ffffff' : 'var(--text-dim, #374151)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    {dept.initials}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text, #111827)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={dept.name}
                    >
                      {dept.name}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-faint, #6b7280)',
                        marginTop: '1px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {dept.invoiceCount === 0 ? 'No invoices yet' : vehicleDesc}
                    </div>
                  </div>
                </div>

                {/* Right: Due Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '6px' }}>
                  <div
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: dept.totalDue > 0 ? '#c2410c' : 'var(--text-faint, #6b7280)'
                    }}
                  >
                    {formatINR(dept.totalDue)}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-faint, #9ca3af)', marginTop: '-1px' }}>
                    due
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Bill Modal */}
      <GenerateBillModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        defaultGstRate={activeGstRate}
        defaultGstType={activeGstType}
      />

      {/* Bill Print Modal */}
      {billToPrint && (
        <BillPrintModal
          bill={billToPrint}
          onClose={() => setBillToPrint(null)}
        />
      )}
    </div>
  );
};
