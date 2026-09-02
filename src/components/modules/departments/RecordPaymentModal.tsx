import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const paymentModes = ['NEFT / RTGS', 'Treasury Challan', 'Cheque', 'UPI', 'Direct Transfer'] as const;

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose }) => {
  const { monthlyBills, departmentContracts, addDepartmentPayment, updateBillStatus } = useFleet();

  const [receiptNumber, setReceiptNumber] = useState(
    () => `REC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(monthlyBills[0]?.id || '');
  const [departmentName, setDepartmentName] = useState(departmentContracts[0]?.departmentName || '');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState<typeof paymentModes[number]>('NEFT / RTGS');
  const [referenceNo, setReferenceNo] = useState('');
  const [status, setStatus] = useState<'Received' | 'Reconciled' | 'Processing'>('Received');
  const [remarks, setRemarks] = useState('');
  const [proofName, setProofName] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const proofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const bill = monthlyBills.find(b => b.id === selectedInvoiceId);
    if (bill) {
      setDepartmentName(bill.departmentName);
      setAmountPaid(String(bill.balanceDue || bill.totalBill));
    }
  }, [selectedInvoiceId, monthlyBills]);

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

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountPaid || Number(amountPaid) <= 0) {
      setErrorMsg('Please enter a valid payment amount.');
      return;
    }

    const bill = monthlyBills.find(b => b.id === selectedInvoiceId);
    const invoiceNum = bill ? bill.billNumber : `INV-${departmentName.substring(0, 3).toUpperCase()}`;

    addDepartmentPayment({
      receiptNumber: receiptNumber.trim(),
      invoiceNumber: invoiceNum,
      departmentName: departmentName.trim(),
      paymentDate,
      amountPaid: Number(amountPaid),
      paymentMode,
      referenceNo: referenceNo.trim() || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
      status,
      remarks: remarks.trim() || undefined,
      paymentProof: proofPreview || proofName || null
    });

    // If bill exists, mark as paid
    if (bill) {
      updateBillStatus(bill.id, 'Paid');
    }

    setAmountPaid('');
    setReferenceNo('');
    setRemarks('');
    setProofName('');
    setProofPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span>💳</span> Record Department Payment
            </h3>
            <span className="modal-subtitle">Log electronic transfer, RTGS, challan or cheque clearance</span>
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

            {/* Linked Invoice & Receipt No */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Settle Invoice / Bill</label>
                <select
                  className="form-input"
                  value={selectedInvoiceId}
                  onChange={e => setSelectedInvoiceId(e.target.value)}
                >
                  <option value="">Manual / General Advance</option>
                  {monthlyBills.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} — {b.departmentName} (₹{b.totalBill.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Receipt No. *</label>
                <input
                  type="text"
                  className="form-input"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Department Name & Date */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Amount Paid & Payment Mode */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount Received (₹) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 85000"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-input"
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as typeof paymentMode)}
                >
                  {paymentModes.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference No & Status */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">UTR / Challan / Transaction No.</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UTR-SBIN004889211 or Challan #998"
                  value={referenceNo}
                  onChange={e => setReferenceNo(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Settlement Status</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value as typeof status)}
                >
                  <option value="Received">Received (In Bank)</option>
                  <option value="Reconciled">Reconciled</option>
                  <option value="Processing">Processing</option>
                </select>
              </div>
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Remarks / Treasury Note</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Cleared via SBI Government Treasury branch"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>

            {/* Payment Proof / Challan Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Slip / Treasury Challan Proof</label>
              <input
                type="file"
                ref={proofInputRef}
                onChange={handleProofUpload}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => proofInputRef.current?.click()}>
                <div className="upload-icon-placeholder">🧾</div>
                <div className="upload-info">
                  <div className="upload-title">
                    {proofName ? proofName : 'Click to attach payment advice or challan copy'}
                  </div>
                  <div className="upload-hint">PDF or image proof</div>
                </div>
                {proofName && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={e => {
                      e.stopPropagation();
                      setProofName('');
                      setProofPreview(null);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
