import React, { useState, useMemo, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DriverPayrollItem } from '../../../types/fleet';
import {
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Wallet,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  ArrowRight
} from 'lucide-react';
import { GiveAdvanceModal } from './GiveAdvanceModal';
import { AddChallanPenaltyModal } from './AddChallanPenaltyModal';
import { DriverPayrollDetailView } from './DriverPayrollDetailView';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const DriverPayrollView: React.FC = () => {
  const {
    payrollItems,
    isPayrollLoading,
    selectedPayrollMonth,
    setSelectedPayrollMonth,
    fetchPayrollSummary,
    fetchLiveDrivers
  } = useFleet();

  // Load live data from server on mount and month change
  useEffect(() => {
    fetchLiveDrivers?.();
    fetchPayrollSummary(selectedPayrollMonth);
  }, [selectedPayrollMonth]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'due' | 'advance' | 'paid'>('all');

  // Selected driver for dedicated Payout Detail View (Screenshot 2)
  const [selectedDriverDetailId, setSelectedDriverDetailId] = useState<string | null>(null);

  // Modals state
  const [isGiveAdvanceOpen, setIsGiveAdvanceOpen] = useState(false);
  const [isAddPenaltyOpen, setIsAddPenaltyOpen] = useState(false);
  const [selectedDriverIdForAction, setSelectedDriverIdForAction] = useState<string | undefined>(undefined);

  // Filtered payroll items
  const filtered = useMemo(() => {
    return payrollItems.filter(item => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignedVehicle && item.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.phone && item.phone.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchFilter = true;
      if (filterTab === 'due') {
        matchFilter = item.status === 'DUE';
      } else if (filterTab === 'advance') {
        matchFilter = item.status === 'ADVANCE RUNNING';
      } else if (filterTab === 'paid') {
        matchFilter = item.status === 'PAID';
      }

      return matchSearch && matchFilter;
    });
  }, [payrollItems, searchQuery, filterTab]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems
  } = usePagination(filtered, 10);

  // Helper for status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ADVANCE RUNNING':
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '4px',
              border: '1.5px solid #d97706',
              color: '#b45309',
              background: 'rgba(217, 119, 6, 0.06)',
              letterSpacing: '0.4px',
              display: 'inline-block',
              textAlign: 'center'
            }}
          >
            ADVANCE RUNNING
          </span>
        );
      case 'PAID':
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '4px',
              border: '1.5px solid #16a34a',
              color: '#16a34a',
              background: 'rgba(22, 163, 74, 0.06)',
              letterSpacing: '0.4px',
              display: 'inline-block',
              textAlign: 'center'
            }}
          >
            PAID
          </span>
        );
      case 'DUE':
      default:
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '4px',
              border: '1.5px solid #ef4444',
              color: '#dc2626',
              background: 'rgba(239, 68, 68, 0.06)',
              letterSpacing: '0.4px',
              display: 'inline-block',
              textAlign: 'center'
            }}
          >
            DUE
          </span>
        );
    }
  };

  const dueCount = payrollItems.filter(p => p.status === 'DUE').length;
  const advanceCount = payrollItems.filter(p => p.status === 'ADVANCE RUNNING').length;

  const handleMonthChange = (offset: number) => {
    const [year, month] = selectedPayrollMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + offset, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPayrollMonth(newMonth);
    fetchPayrollSummary(newMonth);
  };

  const formattedMonthLabel = useMemo(() => {
    const [year, month] = selectedPayrollMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }, [selectedPayrollMonth]);

  if (selectedDriverDetailId) {
    return (
      <DriverPayrollDetailView
        driverId={selectedDriverDetailId}
        onBack={() => {
          setSelectedDriverDetailId(null);
          fetchPayrollSummary(selectedPayrollMonth);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Poppins', sans-serif" }}>
      {/* Top Header matching screenshot */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              margin: '0 0 6px 0',
              color: 'var(--text)',
              letterSpacing: '-0.3px',
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Driver payroll
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: 'var(--text-dim)',
              maxWidth: '680px',
              lineHeight: 1.4,
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            Track salary, advances and challans for every driver, and mark payments the moment you hand over cash.
          </p>
        </div>

        {/* Action Button & Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Month Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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

          <button
            type="button"
            onClick={() => {
              setSelectedDriverIdForAction(undefined);
              setIsGiveAdvanceOpen(true);
            }}
            style={{
              background: '#b45309',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(180, 83, 9, 0.2)',
              transition: 'all 0.15s ease',
              fontFamily: "'Poppins', sans-serif"
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
          >
            <Plus size={16} /> Give advance
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search Box */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 320px',
            maxWidth: '520px'
          }}
        >
          <input
            type="text"
            className="form-input"
            style={{
              width: '100%',
              padding: '9px 12px 9px 14px',
              fontSize: '13.5px',
              borderRadius: '6px',
              background: 'var(--surface)',
              border: '1px solid var(--border)'
            }}
            placeholder="Search driver by name or vehicle number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '20px',
              cursor: 'pointer',
              border: filterTab === 'all' ? '1px solid var(--text)' : '1px solid var(--border)',
              background: filterTab === 'all' ? 'var(--text)' : 'var(--surface)',
              color: filterTab === 'all' ? 'var(--bg)' : 'var(--text-dim)',
              transition: 'all 0.15s ease'
            }}
          >
            All ({payrollItems.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('due')}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: 600,
              borderRadius: '20px',
              cursor: 'pointer',
              border: filterTab === 'due' ? '1px solid var(--text)' : '1px solid var(--border)',
              background: filterTab === 'due' ? 'var(--text)' : 'var(--surface)',
              color: filterTab === 'due' ? 'var(--bg)' : 'var(--text-dim)',
              transition: 'all 0.15s ease'
            }}
          >
            Payment due
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('advance')}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: 600,
              borderRadius: '20px',
              cursor: 'pointer',
              border: filterTab === 'advance' ? '1px solid var(--text)' : '1px solid var(--border)',
              background: filterTab === 'advance' ? 'var(--text)' : 'var(--surface)',
              color: filterTab === 'advance' ? 'var(--bg)' : 'var(--text-dim)',
              transition: 'all 0.15s ease'
            }}
          >
            Advance running
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--surface-3)',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <th
                  style={{
                    padding: '12px 20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase'
                  }}
                >
                  Driver
                </th>
                <th
                  style={{
                    padding: '12px 20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase'
                  }}
                >
                  Advance Balance
                </th>
                <th
                  style={{
                    padding: '12px 20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase'
                  }}
                >
                  Challans
                </th>
                <th
                  style={{
                    padding: '12px 20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase'
                  }}
                >
                  Net Payable
                </th>
                <th
                  style={{
                    padding: '12px 20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.6px',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    textAlign: 'center'
                  }}
                >
                  Status
                </th>
                <th style={{ width: '40px', padding: '12px 14px' }}></th>
              </tr>
            </thead>

            <tbody>
              {isPayrollLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    Loading driver payroll records...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    No driver payroll records match your search or filter.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => {
                  const initial = item.name.charAt(0).toUpperCase();

                  return (
                    <tr
                      key={item.driverId}
                      onClick={() => setSelectedDriverDetailId(item.driverId)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Driver Info Column */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: '#0b0b0b',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '15px',
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>
                              {item.assignedVehicle || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Advance Balance */}
                      <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                        {item.advanceBalance > 0 ? `₹${item.advanceBalance.toLocaleString('en-IN')}` : '—'}
                      </td>

                      {/* Challans */}
                      <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                        {item.challanBalance > 0 ? `₹${item.challanBalance.toLocaleString('en-IN')}` : '—'}
                      </td>

                      {/* Net Payable */}
                      <td style={{ padding: '14px 20px', fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                        ₹{item.netPayable.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Chevron Arrow */}
                      <td style={{ padding: '14px 14px', textAlign: 'right', color: 'var(--text-faint)' }}>
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="drivers"
          />
        </div>
      </div>

      {/* Give Advance Modal */}
      <GiveAdvanceModal
        isOpen={isGiveAdvanceOpen}
        onClose={() => setIsGiveAdvanceOpen(false)}
        initialDriverId={selectedDriverIdForAction}
      />

      {/* Add Challan / Penalty Modal */}
      <AddChallanPenaltyModal
        isOpen={isAddPenaltyOpen}
        onClose={() => setIsAddPenaltyOpen(false)}
        initialDriverId={selectedDriverIdForAction}
      />
    </div>
  );
};
