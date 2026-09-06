import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { DriverExpenseCategory, DriverExpenseItem } from '../../../types/fleet';
import { Edit3, IndianRupee, FileText, Loader2, Car, Calendar, CheckCircle2 } from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';

interface EditDriverExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: DriverExpenseItem | null;
}

const expenseCategories: DriverExpenseCategory[] = [
  'Daily Bata / Food',
  'Night Halt Allowance',
  'Advance Payout',
  'Overtime',
  'Toll / Cash Reimbursement',
  'Uniform / Misc'
];

export const EditDriverExpenseModal: React.FC<EditDriverExpenseModalProps> = ({
  isOpen,
  onClose,
  expense
}) => {
  const { drivers, vehicles, updateDriverExpense } = useFleet();

  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [vehicle, setVehicle] = useState('—');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<DriverExpenseCategory>('Daily Bata / Food');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'Approved' | 'Pending' | 'Paid'>('Paid');
  const [remarks, setRemarks] = useState('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expense) {
      setSelectedDriverId(expense.driverId || '');
      setVehicle(expense.vehicle || '—');
      setDate(expense.date || '');
      setCategory(expense.category || 'Daily Bata / Food');
      setAmount(String(expense.amount || ''));
      setStatus(expense.status || 'Paid');
      setRemarks(expense.remarks || '');
      setReceiptName(expense.receipt || '');
      setReceiptPreview(expense.receipt?.startsWith('data:') ? expense.receipt : null);
      setErrorMsg('');
    }
  }, [expense, isOpen]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || !expense) return null;

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const selectedDriver = drivers.find(d => d.id === selectedDriverId);
      const res = await updateDriverExpense(expense.id, {
        driverId: selectedDriver?.id || expense.driverId,
        driverName: selectedDriver?.name || expense.driverName,
        vehicle,
        date,
        category,
        amount: Number(amount),
        status,
        remarks: remarks.trim() || undefined,
        receipt: receiptPreview || receiptName || undefined
      });

      if (res && !res.success && res.error) {
        setErrorMsg(res.error);
        return;
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update driver expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="var(--accent)" /> Edit Driver Expense
            </h3>
            <span className="modal-subtitle">
              Updating expense log for <strong style={{ color: 'var(--text)' }}>{expense.driverName}</strong> ({expense.date})
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" title="Close modal">
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

            {/* Driver & Vehicle */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver *</label>
                <select
                  className="form-input"
                  value={selectedDriverId}
                  onChange={e => {
                    setSelectedDriverId(e.target.value);
                    const d = drivers.find(drv => drv.id === e.target.value);
                    if (d?.assignedVehicle) setVehicle(d.assignedVehicle);
                  }}
                  required
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.assignedVehicle || 'No Vehicle'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Car size={12} /> Assigned Vehicle
                </label>
                <select
                  className="form-input"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                >
                  <option value="—">Unassigned (—)</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Category */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> Expense Date *
                </label>
                <DatePicker
                  value={date}
                  onChange={d => setDate(d)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Expense Category *</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={e => setCategory(e.target.value as DriverExpenseCategory)}
                  required
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount & Status */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IndianRupee size={12} /> Amount (₹) *
                </label>
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
                <label className="form-label">Payout Status *</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value as 'Approved' | 'Pending' | 'Paid')}
                >
                  <option value="Paid">● Paid</option>
                  <option value="Approved">● Approved</option>
                  <option value="Pending">● Pending</option>
                </select>
              </div>
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Remarks / Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Toll receipt Karnal bypass / Night halt meal"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>

            {/* Receipt / Proof Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Receipt / Bill Proof</label>
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
                  <div className="upload-icon-placeholder">
                    <FileText size={18} color="var(--accent)" />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title">
                    {receiptName ? receiptName : 'Click to upload receipt document or photo'}
                  </div>
                  <div className="upload-hint">JPG, PNG, PDF up to 5MB</div>
                </div>
                {receiptName && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 26, height: 26, fontSize: 11 }}
                    onClick={e => {
                      e.stopPropagation();
                      setReceiptName('');
                      setReceiptPreview(null);
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
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
