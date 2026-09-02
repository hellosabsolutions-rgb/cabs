import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';

interface GenerateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GenerateBillModal: React.FC<GenerateBillModalProps> = ({ isOpen, onClose }) => {
  const { departmentContracts, addMonthlyBill } = useFleet();

  const [selectedContractId, setSelectedContractId] = useState(departmentContracts[0]?.id || '');
  const [billingMonth, setBillingMonth] = useState('2026-08');
  const [baseAmount, setBaseAmount] = useState('85000');
  const [totalKmRun, setTotalKmRun] = useState('2980');
  const [extraKmCost, setExtraKmCost] = useState('6720');
  const [extraHoursCost, setExtraHoursCost] = useState('2280');
  const [tollParkingCost, setTollParkingCost] = useState('1500');
  const [status, setStatus] = useState<'Sent' | 'Paid' | 'Pending' | 'Overdue' | 'Draft'>('Sent');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [errorMsg, setErrorMsg] = useState('');

  const selectedContract = departmentContracts.find(c => c.id === selectedContractId) || departmentContracts[0];

  useEffect(() => {
    if (selectedContract) {
      setBaseAmount(String(selectedContract.monthlyBaseAmount));
    }
  }, [selectedContractId, selectedContract]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalBillCalculated =
    (Number(baseAmount) || 0) +
    (Number(extraKmCost) || 0) +
    (Number(extraHoursCost) || 0) +
    (Number(tollParkingCost) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) {
      setErrorMsg('Please select a department contract.');
      return;
    }

    const billNumber = `INV-${billingMonth}-${selectedContract.departmentName.substring(0, 3).toUpperCase()}`;

    addMonthlyBill({
      billNumber,
      departmentName: selectedContract.departmentName,
      vehicle: selectedContract.vehicle,
      billingMonth,
      baseContractAmount: Number(baseAmount) || 0,
      totalKmRun: Number(totalKmRun) || 0,
      extraKmCost: Number(extraKmCost) || 0,
      extraHoursCost: Number(extraHoursCost) || 0,
      tollParkingCost: Number(tollParkingCost) || 0,
      totalBill: totalBillCalculated,
      paidAmount: status === 'Paid' ? totalBillCalculated : 0,
      balanceDue: status === 'Paid' ? 0 : totalBillCalculated,
      status,
      dueDate,
      invoicePdf: `invoice_${selectedContract.departmentName.substring(0, 3).toLowerCase()}_${billingMonth}.pdf`
    });

    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span>📑</span> Generate Department Monthly Invoice
            </h3>
            <span className="modal-subtitle">Compile base contract, extra km/hours & toll billing</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {errorMsg && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  border: '1px solid rgba(255, 92, 92, 0.3)'
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Contract & Month */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department Contract *</label>
                <select
                  className="form-input"
                  value={selectedContractId}
                  onChange={e => setSelectedContractId(e.target.value)}
                  required
                >
                  {departmentContracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.departmentName} ({c.vehicle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Billing Month (YYYY-MM) *</label>
                <input
                  type="month"
                  className="form-input"
                  value={billingMonth}
                  onChange={e => setBillingMonth(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Base Amount & Total KM Run */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Base Contract Rate (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={baseAmount}
                  onChange={e => setBaseAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Total KM Run This Month</label>
                <input
                  type="number"
                  className="form-input"
                  value={totalKmRun}
                  onChange={e => setTotalKmRun(e.target.value)}
                />
              </div>
            </div>

            {/* Extra KM Cost & Extra Hours Cost */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Extra KM Cost (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={extraKmCost}
                  onChange={e => setExtraKmCost(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Extra Hours Cost (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={extraHoursCost}
                  onChange={e => setExtraHoursCost(e.target.value)}
                />
              </div>
            </div>

            {/* Toll/Parking & Due Date */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Toll & Parking Reimbursed (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={tollParkingCost}
                  onChange={e => setTollParkingCost(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Bill Status */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Invoice Status</label>
              <select
                className="form-input"
                value={status}
                onChange={e => setStatus(e.target.value as typeof status)}
              >
                <option value="Sent">Sent (Awaiting Payment)</option>
                <option value="Pending">Pending Dispatch</option>
                <option value="Draft">Draft</option>
                <option value="Paid">Already Paid</option>
              </select>
            </div>

            {/* Computed Grand Total Banner */}
            <div
              style={{
                background: 'var(--surface-3)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>TOTAL INVOICE AMOUNT</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Base + Extra KM + Extra Hrs + Toll
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
                ₹{totalBillCalculated.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>✓</span> Generate Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
