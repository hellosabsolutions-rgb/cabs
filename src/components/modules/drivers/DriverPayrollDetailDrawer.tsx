import React, { useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DriverPayrollItem } from '../../../types/fleet';
import {
  X,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  ShieldAlert,
  CreditCard,
  Plus,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';

interface DriverPayrollDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  payrollItem: DriverPayrollItem | null;
  onOpenGiveAdvance: (driverId: string) => void;
  onOpenAddPenalty: (driverId: string) => void;
}

export const DriverPayrollDetailDrawer: React.FC<DriverPayrollDetailDrawerProps> = ({
  isOpen,
  onClose,
  payrollItem,
  onOpenGiveAdvance,
  onOpenAddPenalty
}) => {
  const { settleDriverSalary, unsettleDriverSalary, selectedPayrollMonth } = useFleet();

  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState<string>('');
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [isUnsettling, setIsUnsettling] = useState<boolean>(false);

  if (!isOpen || !payrollItem) return null;

  const isPaid = payrollItem.status === 'PAID';

  const handleSettle = async () => {
    setIsSettling(true);
    await settleDriverSalary({
      driverId: payrollItem.driverId,
      month: selectedPayrollMonth,
      paymentMode,
      paymentDate,
      remarks
    });
    setIsSettling(false);
  };

  const handleUnsettle = async () => {
    if (!window.confirm(`Are you sure you want to revert salary payment for ${payrollItem.name}?`)) {
      return;
    }
    setIsUnsettling(true);
    await unsettleDriverSalary({
      driverId: payrollItem.driverId,
      month: selectedPayrollMonth
    });
    setIsUnsettling(false);
  };

  const initial = payrollItem.name.charAt(0).toUpperCase();

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#0b0b0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              {initial}
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>
                {payrollItem.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', display: 'flex', gap: '8px' }}>
                <span>Vehicle: <b>{payrollItem.assignedVehicle || '—'}</b></span>
                {payrollItem.phone && <span>• Phone: {payrollItem.phone}</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Salary Breakdown Summary Card */}
          <div
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-soft)',
                paddingBottom: '8px'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Monthly Payroll Calculation ({selectedPayrollMonth})
              </span>
              <div>
                {payrollItem.status === 'PAID' && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(22, 163, 74, 0.15)',
                      color: '#16a34a',
                      border: '1px solid rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    ✓ PAID
                  </span>
                )}
                {payrollItem.status === 'ADVANCE RUNNING' && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(217, 119, 6, 0.15)',
                      color: '#b45309',
                      border: '1px solid rgba(217, 119, 6, 0.4)'
                    }}
                  >
                    ADVANCE RUNNING
                  </span>
                )}
                {payrollItem.status === 'DUE' && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#dc2626',
                      border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    DUE
                  </span>
                )}
              </div>
            </div>

            {/* Calculations Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Base Monthly Salary</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  ₹{payrollItem.monthlySalary.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wallet size={13} /> Less: Advance Balance
                </span>
                <span style={{ fontWeight: 700, color: payrollItem.advanceBalance > 0 ? '#b45309' : 'var(--text-faint)' }}>
                  {payrollItem.advanceBalance > 0 ? `-₹${payrollItem.advanceBalance.toLocaleString('en-IN')}` : '—'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={13} /> Less: Traffic Challans / Penalties
                </span>
                <span style={{ fontWeight: 700, color: payrollItem.challanBalance > 0 ? '#dc2626' : 'var(--text-faint)' }}>
                  {payrollItem.challanBalance > 0 ? `-₹${payrollItem.challanBalance.toLocaleString('en-IN')}` : '—'}
                </span>
              </div>

              <div
                style={{
                  marginTop: '4px',
                  paddingTop: '10px',
                  borderTop: '1px dashed var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
                    {isPaid ? 'Total Amount Paid' : 'Net Payable to Driver'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {isPaid ? 'Salary settled for this month' : 'Payable after advance and challan deductions'}
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: isPaid ? '#16a34a' : 'var(--text)' }}>
                  ₹{payrollItem.netPayable.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Action: Mark as Paid or View Paid Status */}
          {isPaid ? (
            <div
              style={{
                background: 'rgba(22, 163, 74, 0.08)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>
                <CheckCircle2 size={16} />
                <span>Salary paid for {selectedPayrollMonth}</span>
              </div>
              {payrollItem.settlement && (
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  Paid on: <b>{payrollItem.settlement.paymentDate}</b> via <b>{payrollItem.settlement.paymentMode}</b>
                  {payrollItem.settlement.remarks && <span> ({payrollItem.settlement.remarks})</span>}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleUnsettle}
                  disabled={isUnsettling}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <RotateCcw size={13} /> {isUnsettling ? 'Reverting...' : 'Revert to Unpaid'}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} color="var(--accent)" />
                <span>Mark Salary as Paid</span>
              </div>

              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Payment Mode</label>
                  <select
                    className="form-input"
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  >
                    <option value="Cash">Cash Handover</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Payment Date</label>
                  <DatePicker value={paymentDate} onChange={d => setPaymentDate(d)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Remarks / Note (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                  placeholder="e.g. Paid in full for the month"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="btn-primary-action"
                onClick={handleSettle}
                disabled={isSettling}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <CheckCircle2 size={15} />
                {isSettling ? 'Marking Paid...' : `Mark Salary as Paid (₹${payrollItem.netPayable.toLocaleString('en-IN')})`}
              </button>
            </div>
          )}

          {/* Quick Add Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGiveAdvance(payrollItem.driverId);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'rgba(217, 119, 6, 0.1)',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                color: '#b45309',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Wallet size={14} /> + Give Advance
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddPenalty(payrollItem.driverId);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#dc2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ShieldAlert size={14} /> + Add Challan / Penalty
            </button>
          </div>

          {/* Advances Itemized List */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Advances Recorded ({payrollItem.advances.length})
            </div>
            {payrollItem.advances.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', padding: '8px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                No advances recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {payrollItem.advances.map(adv => (
                  <div
                    key={adv.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                        {adv.reason || 'Advance'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        {adv.date} • {adv.paymentMode || 'Cash'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#b45309' }}>
                        ₹{adv.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '10px', color: adv.status === 'DEDUCTED' ? '#16a34a' : '#b45309', fontWeight: 600 }}>
                        {adv.status === 'DEDUCTED' ? 'Deducted' : 'Running'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Challans / Penalties Itemized List */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Challans & Penalties ({payrollItem.challans.length})
            </div>
            {payrollItem.challans.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', padding: '8px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                No penalties or challans recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {payrollItem.challans.map(pen => (
                  <div
                    key={pen.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                        {pen.reason}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        {pen.date} {pen.challanNumber ? `• ${pen.challanNumber}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#dc2626' }}>
                        ₹{pen.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '10px', color: pen.status === 'DEDUCTED' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {pen.status === 'DEDUCTED' ? 'Deducted' : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
