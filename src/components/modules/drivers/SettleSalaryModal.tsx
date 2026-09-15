import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { X, CheckCircle2, Wallet, CalendarX, AlertTriangle } from 'lucide-react';

interface SettleSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    driverId: string;
    driverName: string;
    assignedVehicle?: string;
    monthlySalary: number;
    advanceBalance: number;
    challanBalance: number;
    netPayable: number;
    absentDays?: number;
    absentDates?: string[];
    perDaySalary?: number;
    suggestedAbsentDeduction?: number;
    absentDeduction?: number;
    month?: string;
  } | null;
}

export const SettleSalaryModal: React.FC<SettleSalaryModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const { settleDriverSalary, selectedPayrollMonth } = useFleet();

  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Checkbox & custom amount states for Leaves / Absenteeism
  const [deductLeaves, setDeductLeaves] = useState<boolean>(true);
  const [absentDeduction, setAbsentDeduction] = useState<number>(0);

  // Checkbox & custom amount states for Advances
  const [deductAdvance, setDeductAdvance] = useState<boolean>(true);
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(0);

  useEffect(() => {
    if (isOpen && item) {
      setPaymentMode('Cash');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
      setErrorMsg('');

      // Leaves / Absenteeism initialization
      const hasAbsents = (item.absentDays || 0) > 0;
      setDeductLeaves(hasAbsents);
      const defaultAbsentDeduction = item.absentDeduction !== undefined
        ? item.absentDeduction
        : (item.suggestedAbsentDeduction ?? (item.absentDays ? Math.round((item.monthlySalary / 30) * item.absentDays) : 0));
      setAbsentDeduction(defaultAbsentDeduction);

      // Advance deduction initialization
      const hasAdvance = (item.advanceBalance || 0) > 0;
      setDeductAdvance(hasAdvance);
      setAdvanceDeduction(item.advanceBalance || 0);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const month = item.month || selectedPayrollMonth;

  // Real-time calculation values
  const effectiveAbsentDeduction = deductLeaves ? Math.max(0, Number(absentDeduction) || 0) : 0;
  const effectiveAdvanceDeduction = deductAdvance
    ? Math.min(item.advanceBalance || 0, Math.max(0, Number(advanceDeduction) || 0))
    : 0;

  const currentNetPayable = Math.max(
    0,
    (item.monthlySalary || 0) - effectiveAdvanceDeduction - (item.challanBalance || 0) - effectiveAbsentDeduction
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await settleDriverSalary({
      driverId: item.driverId,
      month,
      paymentMode,
      paymentDate,
      remarks: remarks.trim(),
      absentDeduction: effectiveAbsentDeduction,
      absentDays: deductLeaves ? (item.absentDays || 0) : 0,
      advanceDeduction: effectiveAdvanceDeduction
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to settle salary payment.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div
          style={{
            padding: '22px 24px 16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: 0,
                letterSpacing: '-0.01em',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              Mark salary payment paid
            </h2>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-faint)',
                marginTop: '4px',
                marginBottom: 0,
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              For {item.driverName} ({month})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  fontSize: '12.5px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* 1. Leaves / Absenteeism Section with Checkbox & Custom Amount */}
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={deductLeaves}
                  onChange={e => setDeductLeaves(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CalendarX size={14} color={deductLeaves ? '#ef4444' : 'var(--text-faint)'} />
                      Deduct Salary for Absent Days ({item.absentDays || 0} days)
                    </span>
                    {item.absentDays !== undefined && item.absentDays > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>
                        @ ₹{item.perDaySalary || Math.round((item.monthlySalary || 0) / 30)}/day
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                    {item.absentDays && item.absentDays > 0
                      ? `Absent on: ${item.absentDates?.join(', ') || 'recorded dates'}`
                      : 'Driver was present for all days'}
                  </div>
                </div>
              </label>

              {deductLeaves && (
                <div style={{ paddingTop: '10px', borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', margin: 0 }}>
                      Absenteeism Salary Deduction (₹)
                    </label>
                    {item.absentDays !== undefined && item.absentDays > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const suggested = item.suggestedAbsentDeduction ?? Math.round(((item.monthlySalary || 0) / 30) * (item.absentDays || 0));
                          setAbsentDeduction(suggested);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent, #1687f5)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Reset to suggested (₹{((item.perDaySalary || Math.round((item.monthlySalary || 0) / 30)) * (item.absentDays || 0)).toLocaleString('en-IN')})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.monthlySalary || 1000000}
                    value={absentDeduction}
                    onChange={e => setAbsentDeduction(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="Enter amount to deduct for leaves"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-3)',
                      color: 'var(--text)',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {absentDeduction > 0
                      ? `₹${absentDeduction.toLocaleString('en-IN')} will be deducted from this month's salary.`
                      : 'Zero deduction (full salary will be preserved).'}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Advances Section with Checkbox & Custom Amount */}
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: (item.advanceBalance || 0) > 0 ? 'pointer' : 'default', userSelect: 'none', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={deductAdvance}
                  disabled={!item.advanceBalance || item.advanceBalance <= 0}
                  onChange={e => setDeductAdvance(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: (item.advanceBalance || 0) > 0 ? 'pointer' : 'default', accentColor: 'var(--accent)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Wallet size={14} color={deductAdvance && item.advanceBalance > 0 ? '#d97706' : 'var(--text-faint)'} />
                      Deduct Driver Advance from this Salary
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: (item.advanceBalance || 0) > 0 ? '#d97706' : 'var(--text-faint)' }}>
                      Total Balance: ₹{(item.advanceBalance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                    {(item.advanceBalance || 0) > 0
                      ? 'Toggle whether to deduct advance and specify the amount'
                      : 'No outstanding advance balance for this driver'}
                  </div>
                </div>
              </label>

              {deductAdvance && (item.advanceBalance || 0) > 0 && (
                <div style={{ paddingTop: '10px', borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', margin: 0 }}>
                      Advance Deduction Amount (₹)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setAdvanceDeduction(Math.round((item.advanceBalance || 0) / 2))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent, #1687f5)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Half (₹{Math.round((item.advanceBalance || 0) / 2).toLocaleString('en-IN')})
                      </button>
                      <span style={{ color: 'var(--border)', fontSize: '11px' }}>|</span>
                      <button
                        type="button"
                        onClick={() => setAdvanceDeduction(item.advanceBalance || 0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent, #1687f5)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Full (₹{(item.advanceBalance || 0).toLocaleString('en-IN')})
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.advanceBalance || 1000000}
                    value={advanceDeduction}
                    onChange={e => setAdvanceDeduction(Math.min(item.advanceBalance || 0, Math.max(0, Number(e.target.value) || 0)))}
                    placeholder="Enter advance amount to deduct"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-3)',
                      color: 'var(--text)',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {advanceDeduction < (item.advanceBalance || 0)
                      ? `₹${advanceDeduction.toLocaleString('en-IN')} will be deducted. Remaining ₹${Math.max(0, (item.advanceBalance || 0) - advanceDeduction).toLocaleString('en-IN')} remains as active advance.`
                      : `Full advance of ₹${(item.advanceBalance || 0).toLocaleString('en-IN')} will be cleared.`}
                  </div>
                </div>
              )}
            </div>

            {/* Payout Calculation Card */}
            <div
              style={{
                background: 'var(--surface-2)',
                borderRadius: '12px',
                padding: '14px 16px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-dim)' }}>
                <span>Base Monthly Salary</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  ₹{(item.monthlySalary || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-dim)' }}>
                <span style={{ color: effectiveAbsentDeduction > 0 ? '#ef4444' : 'var(--text-faint)' }}>
                  Absenteeism Deducted {deductLeaves && (item.absentDays || 0) > 0 ? `(${item.absentDays} days)` : ''}
                </span>
                <span style={{ fontWeight: 700, color: effectiveAbsentDeduction > 0 ? '#ef4444' : 'var(--text-faint)' }}>
                  {effectiveAbsentDeduction > 0 ? `−₹${effectiveAbsentDeduction.toLocaleString('en-IN')}` : '₹0 (Skipped)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-dim)' }}>
                <span style={{ color: effectiveAdvanceDeduction > 0 ? '#d97706' : 'var(--text-faint)' }}>
                  Advances Deducted
                </span>
                <span style={{ fontWeight: 700, color: effectiveAdvanceDeduction > 0 ? '#d97706' : 'var(--text-faint)' }}>
                  {effectiveAdvanceDeduction > 0 ? `−₹${effectiveAdvanceDeduction.toLocaleString('en-IN')}` : '₹0 (Not Deducted)'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-dim)' }}>
                <span style={{ color: (item.challanBalance || 0) > 0 ? '#ef4444' : 'var(--text-faint)' }}>
                  Challans Deducted
                </span>
                <span style={{ fontWeight: 700, color: (item.challanBalance || 0) > 0 ? '#ef4444' : 'var(--text-faint)' }}>
                  −₹{(item.challanBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontSize: '15px',
                  fontWeight: 700,
                  borderTop: '1px dashed var(--border)',
                  paddingTop: '8px',
                  marginTop: '4px'
                }}
              >
                <span>Net Amount Handed Over</span>
                <span style={{ color: 'var(--accent, #1687f5)', fontSize: '17px', fontWeight: 800 }}>
                  ₹{currentNetPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text)'
                  }}
                >
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'var(--text)'
                  }}
                >
                  Paid via
                </label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Cash">Cash Handover</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: 'var(--text)'
                }}
              >
                Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cash handed over in office"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '14px 24px 20px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'var(--surface)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
              style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: '8px 22px',
                fontSize: '13px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700
              }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Recording Payment...' : 'Mark as Paid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
