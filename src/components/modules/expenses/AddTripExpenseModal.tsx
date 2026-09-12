import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { TripExpenseCategory } from '../../../types/fleet';
import { IndianRupee, Receipt } from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';
import { uploadFileToCloudinary } from '../../../services/uploadService';
import { ACCEPT_DOC_TYPES, isPdfDocument } from '../../../utils/fileUtils';

const CATEGORIES: TripExpenseCategory[] = [
  'Toll',
  'Food',
  'Parking',
  'Repair',
  'Loading',
  'Maintenance',
  'Other'
];

interface AddTripExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
}

export const AddTripExpenseModal: React.FC<AddTripExpenseModalProps> = ({
  isOpen,
  onClose,
  bookingId
}) => {
  const { bookings, addTripExpense } = useFleet();
  const assignedBookings = useMemo(
    () =>
      bookings.filter(
        b => b.driverName && b.driverName !== 'Unassigned' && (b.id || (b as any)._id)
      ),
    [bookings]
  );

  const [selectedBookingId, setSelectedBookingId] = useState(bookingId || assignedBookings[0]?.id || '');
  const [category, setCategory] = useState<TripExpenseCategory>('Toll');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedBookingId(bookingId || assignedBookings[0]?.id || '');
    setCategory('Toll');
    setAmount('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setReceiptFile(null);
    setReceiptPreview(null);
    setErrorMsg('');
  }, [isOpen, bookingId, assignedBookings]);

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

  const selectedBooking = assignedBookings.find(b => b.id === selectedBookingId || (b as any)._id === selectedBookingId);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setErrorMsg('Select a booking first.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      let receiptUrl: string | null = null;
      if (receiptFile) {
        const uploaded = await uploadFileToCloudinary(receiptFile, 'fleetos/trip-expenses');
        if (!uploaded.success || !uploaded.url) {
          setErrorMsg(uploaded.error || 'Could not upload receipt.');
          return;
        }
        receiptUrl = uploaded.url;
      }

      const res = await addTripExpense({
        bookingId: selectedBookingId,
        category,
        amount: Number(amount),
        notes: notes.trim() || undefined,
        receipt: receiptUrl,
        date
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to add trip expense.');
        return;
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add trip expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={18} color="var(--accent)" /> Add trip expense
            </h3>
            <span className="modal-subtitle">
              Log toll, food or parking on a driver’s trip. Receipt photo is optional for office.
            </span>
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
                  border: '1px solid rgba(255, 92, 92, 0.3)',
                  marginBottom: 12
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Booking *</label>
              <select
                className="form-input"
                value={selectedBookingId}
                onChange={e => setSelectedBookingId(e.target.value)}
                disabled={Boolean(bookingId)}
              >
                {assignedBookings.length === 0 && <option value="">No assigned bookings</option>}
                {assignedBookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bookingNumber || b.tripNumber} · {b.driverName} · {b.route}
                  </option>
                ))}
              </select>
              {selectedBooking && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                  {selectedBooking.vehicle} · {selectedBooking.driverName}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category *</label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {CATEGORIES.map(cat => (
                  <div
                    key={cat}
                    className={`driver-type-option ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-row-2" style={{ marginTop: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount (₹) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 120"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date</label>
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                className="form-input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Toll at Kherki Daula"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Receipt photo (optional)</label>
              <input
                ref={receiptInputRef}
                type="file"
                accept={ACCEPT_DOC_TYPES}
                onChange={handleReceiptUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-box" onClick={() => receiptInputRef.current?.click()}>
                {receiptPreview ? (
                  <img src={receiptPreview} alt="Receipt preview" className="upload-preview" />
                ) : receiptFile && isPdfDocument(receiptFile.name) ? (
                  <div className="upload-icon-placeholder">
                    <Receipt size={18} />
                  </div>
                ) : (
                  <div className="upload-icon-placeholder">
                    <Receipt size={18} />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title">
                    {receiptFile ? receiptFile.name : 'Click to attach receipt (optional)'}
                  </div>
                  <div className="upload-hint">Image or PDF. Not required when adding from office.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
