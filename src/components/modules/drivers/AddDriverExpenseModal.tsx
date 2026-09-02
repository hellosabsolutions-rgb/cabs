import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DriverExpenseCategory } from '../../../types/fleet';

interface AddDriverExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const expenseCategories: DriverExpenseCategory[] = [
  'Daily Bata / Food',
  'Night Halt Allowance',
  'Advance Payout',
  'Overtime',
  'Toll / Cash Reimbursement',
  'Uniform / Misc'
];

export const AddDriverExpenseModal: React.FC<AddDriverExpenseModalProps> = ({
  isOpen,
  onClose
}) => {
  const { drivers, vehicles, addDriverExpense } = useFleet();

  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [vehicle, setVehicle] = useState(vehicles[0]?.registrationNumber || 'DL01AB1234');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<DriverExpenseCategory>('Daily Bata / Food');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'Approved' | 'Pending' | 'Paid'>('Paid');
  const [remarks, setRemarks] = useState('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (drivers.length > 0 && !selectedDriverId) {
      setSelectedDriverId(drivers[0].id);
      if (drivers[0].assignedVehicle) {
        setVehicle(drivers[0].assignedVehicle);
      }
    }
  }, [drivers, selectedDriverId]);

  const handleDriverChange = (id: string) => {
    setSelectedDriverId(id);
    const d = drivers.find(drv => drv.id === id);
    if (d && d.assignedVehicle && d.assignedVehicle !== '—') {
      setVehicle(d.assignedVehicle);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Close on ESC key
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = drivers.find(drv => drv.id === selectedDriverId);
    if (!d) {
      setErrorMsg('Please select a driver.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }

    addDriverExpense({
      driverId: d.id,
      driverName: d.name,
      vehicle,
      date,
      category,
      amount: Number(amount),
      status,
      remarks: remarks.trim() || undefined,
      receipt: receiptPreview || receiptName || null
    });

    setAmount('');
    setRemarks('');
    setReceiptName('');
    setReceiptPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">
              <span>💵</span> Record Driver Expense
            </h3>
            <span className="modal-subtitle">Log daily bata, night halt, salary advance or reimbursements</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" title="Close">
            ✕
          </button>
        </div>

        {/* Form Body */}
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

            {/* Driver & Date */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Driver *</label>
                <select
                  className="form-input"
                  value={selectedDriverId}
                  onChange={e => handleDriverChange(e.target.value)}
                  required
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.driverType || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Expense Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Expense Category */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Expense Category</label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {expenseCategories.map(cat => (
                  <div
                    key={cat}
                    className={`driver-type-option ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                    style={{ padding: '7px 6px', fontSize: '11px' }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            {/* Amount & Vehicle */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Linked Vehicle</label>
                <select
                  className="form-input"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                >
                  <option value="—">No Vehicle (General)</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Status & Remarks */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payout Status</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value as typeof status)}
                >
                  <option value="Paid">Paid</option>
                  <option value="Approved">Approved (Pending Payout)</option>
                  <option value="Pending">Pending Review</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Remarks / Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jaipur outstation bata, toll receipt"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Receipt / Bill Voucher (Optional)</label>
              <input
                type="file"
                ref={receiptInputRef}
                onChange={handleReceiptUpload}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => receiptInputRef.current?.click()}>
                {receiptPreview ? (
                  <img src={receiptPreview} alt="Receipt preview" className="upload-preview" />
                ) : (
                  <div className="upload-icon-placeholder">🧾</div>
                )}
                <div className="upload-info">
                  <div className="upload-title">
                    {receiptName
                      ? receiptName
                      : receiptPreview
                      ? 'Receipt attached'
                      : 'Click to attach payment slip or voucher'}
                  </div>
                  <div className="upload-hint">Image or PDF proof</div>
                </div>
                {(receiptPreview || receiptName) && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={e => {
                      e.stopPropagation();
                      setReceiptPreview(null);
                      setReceiptName('');
                    }}
                    title="Remove receipt"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Save Driver Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
