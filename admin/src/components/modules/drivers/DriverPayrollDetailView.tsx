import React, { useState, useEffect, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Wallet,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GiveAdvanceModal } from './GiveAdvanceModal';
import { AddChallanPenaltyModal } from './AddChallanPenaltyModal';
import { SettleSalaryModal } from './SettleSalaryModal';
import { EditAdvanceModal } from './EditAdvanceModal';
import { EditPenaltyModal } from './EditPenaltyModal';

interface DriverPayrollDetailViewProps {
  driverId: string;
  onBack: () => void;
}

type TabType = 'ledger' | 'advances' | 'penalties' | 'history';

export const DriverPayrollDetailView: React.FC<DriverPayrollDetailViewProps> = ({
  driverId,
  onBack
}) => {
  const {
    drivers,
    payrollItems,
    fetchDriverPayrollDetail,
    deleteDriverAdvance,
    deleteDriverPenalty,
    unsettleDriverSalary,
    deletePayrollSettlement,
    fetchPayrollSummary
  } = useFleet();

  // Selected Month: defaults to current YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [activeTab, setActiveTab] = useState<TabType>('ledger');
  const [detailData, setDetailData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Edit modals
  const [editingAdvance, setEditingAdvance] = useState<any>(null);
  const [editingPenalty, setEditingPenalty] = useState<any>(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'advance' | 'penalty' | 'settlement';
    id: string;
    title: string;
  } | null>(null);

  const driver = useMemo(() => {
    return drivers.find(d => d.id === driverId || d.id === detailData?.driver?.id) || detailData?.driver;
  }, [drivers, driverId, detailData]);

  const loadData = async () => {
    setIsLoading(true);
    const res = await fetchDriverPayrollDetail(driverId, selectedMonth);
    if (res.success && res.data) {
      setDetailData(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [driverId, selectedMonth]);

  const handleMonthChange = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const formattedMonthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }, [selectedMonth]);

  // Derived calculations from detailData or fallback
  const summary = detailData?.summary || {};
  const baseSalary = summary.baseSalary ?? driver?.monthlySalary ?? 0;
  const advanceBalance = summary.advanceBalance ?? 0;
  const challanBalance = summary.challanBalance ?? 0;
  const netPayable = summary.netPayable ?? Math.max(0, baseSalary - advanceBalance - challanBalance);
  const isPaid = summary.status === 'PAID';

  const ledger = detailData?.ledger || [];
  const advances = detailData?.advances || [];
  const penalties = detailData?.penalties || [];
  const settlements = detailData?.settlements || [];

  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    if (type === 'advance') {
      await deleteDriverAdvance(id);
    } else if (type === 'penalty') {
      await deleteDriverPenalty(id);
    } else if (type === 'settlement') {
      await deletePayrollSettlement(id);
    }
    setDeleteConfirm(null);
    await loadData();
    await fetchPayrollSummary(selectedMonth);
  };

  const getDriverInitials = (name?: string) => {
    if (!name) return 'DR';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '8px 4px 40px 4px',
        animation: 'fadeIn 0.2s ease-in-out',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      {/* 1. Back Navigation & Month Selector Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: '13.5px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'color 0.15s ease',
            fontFamily: "'Poppins', sans-serif"
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
        >
          <ArrowLeft size={16} />
          Back to all drivers
        </button>

        {/* Month Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '4px 8px'
          }}
        >
          <button
            onClick={() => handleMonthChange(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              borderRadius: '4px'
            }}
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text)',
              padding: '0 4px',
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            <Calendar size={14} style={{ color: 'var(--accent)' }} />
            <span>{formattedMonthLabel}</span>
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              borderRadius: '4px'
            }}
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. Driver Header matching Screenshot 2 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Avatar circle matching software style */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#0b0b0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '15px',
              fontFamily: "'Poppins', sans-serif",
              flexShrink: 0
            }}
          >
            {getDriverInitials(driver?.name)}
          </div>

          {/* Name & details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  margin: 0,
                  letterSpacing: '-0.02em'
                }}
              >
                {driver?.name || 'Driver Payroll'}
              </h1>
              {driver?.assignedVehicle && driver.assignedVehicle !== '—' && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--text-dim)',
                    letterSpacing: '0.02em'
                  }}
                >
                  {driver.assignedVehicle}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '12.5px',
                color: 'var(--text-faint)',
                marginTop: '3px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <span>{driver?.phone || 'No phone recorded'}</span>
              {driver?.driverType && (
                <>
                  <span>·</span>
                  <span>{driver.driverType}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons matching software theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsPenaltyModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
          >
            <Plus size={14} />
            Add challan / penalty
          </button>

          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#b45309',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              boxShadow: '0 2px 6px rgba(180, 83, 9, 0.2)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            <Plus size={14} />
            Give advance
          </button>

          {isPaid ? (
            <button
              onClick={async () => {
                if (window.confirm(`Revert ${driver?.name}'s salary for ${formattedMonthLabel} back to DUE?`)) {
                  await unsettleDriverSalary({ driverId, month: selectedMonth });
                  await loadData();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif"
              }}
              title="Click to revert to DUE"
            >
              <Check size={14} />
              Paid ({formattedMonthLabel})
            </button>
          ) : (
            <button
              onClick={() => setIsSettleModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent, #1687f5)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22, 135, 245, 0.25)',
                fontFamily: "'Poppins', sans-serif",
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              Mark payment paid
            </button>
          )}
        </div>
      </div>

      {/* 3. 4 KPI Cards matching Screenshot 2 with Left Colored Borders */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}
      >
        {/* Card 1: Salary earned - this month */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--text)',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-faint)', marginBottom: '4px', fontFamily: "'Poppins', sans-serif" }}>
            Salary earned — this month
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', fontFamily: "'Poppins', sans-serif" }}>
            ₹{baseSalary.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '4px', fontFamily: "'Poppins', sans-serif" }}>
            Base monthly salary
          </div>
        </div>

        {/* Card 2: Advance balance owed */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-faint)', marginBottom: '4px', fontFamily: "'Poppins', sans-serif" }}>
            Advance balance owed
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', letterSpacing: '-0.02em', fontFamily: "'Poppins', sans-serif" }}>
            ₹{advanceBalance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '4px', fontFamily: "'Poppins', sans-serif" }}>
            Will be deducted at payout
          </div>
        </div>

        {/* Card 3: Challans & penalties */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--danger, #f15b4a)',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-faint)', marginBottom: '4px', fontFamily: "'Poppins', sans-serif" }}>
            Challans & penalties
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--danger, #f15b4a)', letterSpacing: '-0.02em', fontFamily: "'Poppins', sans-serif" }}>
            ₹{challanBalance.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '4px', fontFamily: "'Poppins', sans-serif" }}>
            Deducted at payout
          </div>
        </div>

        {/* Card 4: Net payable now */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--accent, #1687f5)',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-faint)', marginBottom: '4px', fontFamily: "'Poppins', sans-serif" }}>
            Net payable now
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent, #1687f5)', letterSpacing: '-0.02em', fontFamily: "'Poppins', sans-serif" }}>
            ₹{netPayable.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '4px', fontFamily: "'Poppins', sans-serif" }}>
            Salary − advances − challans
          </div>
        </div>
      </div>

      {/* 4. Tabs matching Software Subtabs */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0px'
        }}
      >
        {[
          { key: 'ledger', label: 'Full ledger', count: ledger.length },
          { key: 'advances', label: 'Advances', count: advances.length },
          { key: 'penalties', label: 'Challans & penalties', count: penalties.length },
          { key: 'history', label: 'Payment history', count: settlements.length }
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px 4px 12px 4px',
                fontSize: '13.5px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text)' : 'var(--text-faint)',
                cursor: 'pointer',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    background: isActive ? 'var(--accent)' : 'var(--surface-3)',
                    color: isActive ? 'var(--accent-text, #ffffff)' : 'var(--text-dim)',
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: 'var(--accent, #1687f5)'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Tab Content: Tables matching Screenshot 2 */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}
      >
        {/* Full Ledger Tab */}
        {activeTab === 'ledger' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', fontFamily: "'Poppins', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>DATE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>ENTRY</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>NOTE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: 'right' }}>AMOUNT</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: "'Poppins', sans-serif" }}>
                      Loading ledger entries...
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: "'Poppins', sans-serif" }}>
                      No ledger transactions found for this period.
                    </td>
                  </tr>
                ) : (
                  ledger.map((item: any) => {
                    const isSalary = item.type === 'SALARY';
                    const isAdvance = item.type === 'ADVANCE';
                    const isPenalty = item.type === 'PENALTY';
                    const isPaidEntry = item.type === 'PAID';

                    let badgeBg = 'var(--surface-3)';
                    let badgeColor = 'var(--text-dim)';
                    let badgeBorder = '1px solid var(--border)';
                    if (isAdvance) {
                      badgeBg = 'rgba(217, 119, 6, 0.06)';
                      badgeColor = '#b45309';
                      badgeBorder = '1.5px solid #d97706';
                    } else if (isPenalty) {
                      badgeBg = 'rgba(239, 68, 68, 0.06)';
                      badgeColor = '#dc2626';
                      badgeBorder = '1.5px solid #ef4444';
                    } else if (isPaidEntry) {
                      badgeBg = 'rgba(22, 163, 74, 0.06)';
                      badgeColor = '#16a34a';
                      badgeBorder = '1.5px solid #16a34a';
                    }

                    const isDeduction = item.isDeduction;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" }}>
                          {item.date}
                        </td>
                        <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.4px',
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              border: badgeBorder,
                              fontFamily: "'Poppins', sans-serif"
                            }}
                          >
                            {item.entryLabel || item.type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text)', maxWidth: '300px' }}>
                          <div>{item.note || '—'}</div>
                        </td>
                        <td
                          style={{
                            padding: '14px 18px',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: isDeduction ? '#ef4444' : isPaidEntry ? '#10b981' : 'var(--text)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isDeduction ? `−₹${item.amount?.toLocaleString('en-IN')}` : `₹${item.amount?.toLocaleString('en-IN')}`}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {!isSalary && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              {(isAdvance || isPenalty) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isAdvance) setEditingAdvance(item.item || item);
                                    if (isPenalty) setEditingPenalty(item.item || item);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    color: 'var(--text-dim)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '12px'
                                  }}
                                  title="Edit"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isAdvance) {
                                    setDeleteConfirm({
                                      type: 'advance',
                                      id: item.item?._id || item.id,
                                      title: `advance of ₹${item.amount?.toLocaleString('en-IN')}`
                                    });
                                  } else if (isPenalty) {
                                    setDeleteConfirm({
                                      type: 'penalty',
                                      id: item.item?._id || item.id,
                                      title: `penalty of ₹${item.amount?.toLocaleString('en-IN')}`
                                    });
                                  } else if (isPaidEntry) {
                                    setDeleteConfirm({
                                      type: 'settlement',
                                      id: item.item?._id || item.id,
                                      title: `settlement payout of ₹${item.amount?.toLocaleString('en-IN')}`
                                    });
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '12px'
                                }}
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Advances Tab */}
        {activeTab === 'advances' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', fontFamily: "'Poppins', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>DATE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>AMOUNT</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>PAID VIA</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>REASON / NOTE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>STATUS</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {advances.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: "'Poppins', sans-serif" }}>
                      No advances recorded for this driver.
                    </td>
                  </tr>
                ) : (
                  advances.map((adv: any) => (
                    <tr
                      key={adv._id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{adv.date}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#d97706', whiteSpace: 'nowrap' }}>
                        ₹{adv.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{adv.paymentMode || 'Cash'}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text)' }}>
                        {adv.reason || adv.remarks || 'Advance payment'}
                      </td>
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            border: adv.status === 'SETTLED' ? '1.5px solid #16a34a' : '1.5px solid #d97706',
                            backgroundColor: adv.status === 'SETTLED' ? 'rgba(22, 163, 74, 0.06)' : 'rgba(217, 119, 6, 0.06)',
                            color: adv.status === 'SETTLED' ? '#16a34a' : '#b45309',
                            fontFamily: "'Poppins', sans-serif"
                          }}
                        >
                          {adv.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingAdvance(adv)}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: 'var(--text-dim)',
                              cursor: 'pointer'
                            }}
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'advance',
                                id: adv._id,
                                title: `advance of ₹${adv.amount?.toLocaleString('en-IN')}`
                              })
                            }
                            style={{
                              background: 'none',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Challans & Penalties Tab */}
        {activeTab === 'penalties' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', fontFamily: "'Poppins', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>DATE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>AMOUNT</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>CHALLAN #</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>REASON</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>VEHICLE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>STATUS</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {penalties.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: "'Poppins', sans-serif" }}>
                      No challans or penalties recorded.
                    </td>
                  </tr>
                ) : (
                  penalties.map((pen: any) => (
                    <tr
                      key={pen._id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{pen.date}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#ef4444', whiteSpace: 'nowrap' }}>
                        ₹{pen.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{pen.challanNumber || '—'}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text)' }}>{pen.reason}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{pen.vehicle || '—'}</td>
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            border: pen.status === 'SETTLED' ? '1.5px solid #16a34a' : '1.5px solid #ef4444',
                            backgroundColor: pen.status === 'SETTLED' ? 'rgba(22, 163, 74, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                            color: pen.status === 'SETTLED' ? '#16a34a' : '#dc2626',
                            fontFamily: "'Poppins', sans-serif"
                          }}
                        >
                          {pen.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingPenalty(pen)}
                            style={{
                              background: 'none',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: 'var(--text-dim)',
                              cursor: 'pointer'
                            }}
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'penalty',
                                id: pen._id,
                                title: `penalty of ₹${pen.amount?.toLocaleString('en-IN')}`
                              })
                            }
                            style={{
                              background: 'none',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment History Tab */}
        {activeTab === 'history' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', fontFamily: "'Poppins', sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>MONTH</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>PAID ON</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>BASE SALARY</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>DEDUCTIONS</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>NET PAID</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>MODE</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-faint)', fontSize: '11px', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-faint)', fontFamily: "'Poppins', sans-serif" }}>
                      No payment settlements recorded yet.
                    </td>
                  </tr>
                ) : (
                  settlements.map((s: any) => {
                    const totalDeductions = (s.advancesDeducted || 0) + (s.challansDeducted || 0);
                    return (
                      <tr
                        key={s._id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{s.month}</td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{s.paymentDate || '—'}</td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>₹{s.baseSalary?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '14px 18px', color: '#ef4444', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          −₹{totalDeductions.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>
                          ₹{s.netPaid?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{s.paymentMode || 'Cash'}</td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'settlement',
                                id: s._id,
                                title: `settlement payment of ${s.month} (₹${s.netPaid?.toLocaleString('en-IN')})`
                              })
                            }
                            style={{
                              background: 'none',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px'
                            }}
                            title="Delete and revert deducted items"
                          >
                            <Trash2 size={13} />
                            Delete
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="modal-backdrop"
          onClick={() => setDeleteConfirm(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              borderRadius: '12px',
              maxWidth: '420px',
              width: '100%',
              padding: '22px',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text)' }}>
              Confirm Deletion
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-dim)', margin: '0 0 18px 0', lineHeight: 1.5 }}>
              Are you sure you want to delete this {deleteConfirm.title}?{' '}
              {deleteConfirm.type === 'settlement'
                ? 'Any deducted advances and penalties will be restored back to active balance.'
                : 'This action cannot be undone.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Give Advance Modal */}
      <GiveAdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={async () => {
          setIsAdvanceModalOpen(false);
          await loadData();
          await fetchPayrollSummary(selectedMonth);
        }}
        initialDriverId={driver?.id || driverId}
      />

      {/* Add Penalty Modal */}
      <AddChallanPenaltyModal
        isOpen={isPenaltyModalOpen}
        onClose={async () => {
          setIsPenaltyModalOpen(false);
          await loadData();
          await fetchPayrollSummary(selectedMonth);
        }}
        initialDriverId={driver?.id || driverId}
      />

      {/* Settle Salary Modal */}
      <SettleSalaryModal
        isOpen={isSettleModalOpen}
        onClose={async () => {
          setIsSettleModalOpen(false);
          await loadData();
          await fetchPayrollSummary(selectedMonth);
        }}
        item={{
          driverId: driver?.id || driverId,
          driverName: driver?.name || 'Driver',
          assignedVehicle: driver?.assignedVehicle,
          monthlySalary: baseSalary,
          advanceBalance,
          challanBalance,
          netPayable,
          status: isPaid ? 'PAID' : 'DUE',
          month: selectedMonth
        } as any}
      />

      {/* Edit Advance Modal */}
      <EditAdvanceModal
        isOpen={!!editingAdvance}
        onClose={() => setEditingAdvance(null)}
        advance={editingAdvance}
        onUpdated={async () => {
          await loadData();
          await fetchPayrollSummary(selectedMonth);
        }}
      />

      {/* Edit Penalty Modal */}
      <EditPenaltyModal
        isOpen={!!editingPenalty}
        onClose={() => setEditingPenalty(null)}
        penalty={editingPenalty}
        onUpdated={async () => {
          await loadData();
          await fetchPayrollSummary(selectedMonth);
        }}
      />
    </div>
  );
};
