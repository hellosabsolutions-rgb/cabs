import React, { useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { RevenueType, RevenuePaymentStatus, RevenuePaymentMethod } from '../../../types/revenue';
import { X, Plus, Calendar, Car, User, DollarSign, FileText } from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';
import { API_URL } from '../../../config/env';

interface AddRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddRevenueModal: React.FC<AddRevenueModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { vehicles, drivers } = useFleet();

  const [type, setType] = useState<RevenueType>('Other');
  const [customer, setCustomer] = useState('');
  const [vehicle, setVehicle] = useState(vehicles[0]?.registrationNumber || '');
  const [driver, setDriver] = useState(drivers[0]?.name || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<RevenuePaymentStatus>('Pending');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<RevenuePaymentMethod>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [driverCost, setDriverCost] = useState('');
  const [fastagCost, setFastagCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !amount || Number(amount) <= 0) {
      setErrorMsg('Please provide a valid customer/department name and amount.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        type,
        customer: customer.trim(),
        vehicle: vehicle || '—',
        driver: driver || '—',
        date,
        dueDate: dueDate || date,
        amount: Number(amount),
        receivedAmount: paymentStatus === 'Received' && !receivedAmount ? Number(amount) : Number(receivedAmount || 0),
        paymentStatus,
        paymentMethod,
        referenceNo: referenceNo.trim(),
        fuelCost: Number(fuelCost || 0),
        driverCost: Number(driverCost || 0),
        fastagCost: Number(fastagCost || 0),
        notes: notes.trim()
      };

      const response = await fetch(`${API_URL}/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const res = await response.json();
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to save revenue record');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error while adding revenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border)',
          overflow: 'hidden',
          margin: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2)'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
              Add Manual Revenue
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-faint)' }}>
              Log exceptional corrections or other revenue entries
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontSize: '12.5px',
                fontWeight: 500
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Revenue Type */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
              Revenue Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {(['Trip', 'Department', 'Other'] as RevenueType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: type === t ? 'rgba(56, 189, 248, 0.15)' : 'var(--surface-2)',
                    color: type === t ? '#38bdf8' : 'var(--text)',
                    border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t} Revenue
                </button>
              ))}
            </div>
          </div>

          {/* Customer / Department Name */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
              Customer / Department Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Acme Corp / Ministry of Health / John Doe"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              required
            />
          </div>

          {/* Vehicle & Driver */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
                Vehicle
              </label>
              <select className="form-input" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                <option value="—">Unassigned / General</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.registrationNumber}>
                    {v.registrationNumber} ({v.model || v.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
                Driver
              </label>
              <select className="form-input" value={driver} onChange={e => setDriver(e.target.value)}>
                <option value="—">None / Fleet</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
                Revenue Date *
              </label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
                Payment Due Date
              </label>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </div>
          </div>

          {/* Gross Amount & Payment Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
                Gross Revenue Amount (₹) *
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 15000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
                Payment Status
              </label>
              <select className="form-input" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as any)}>
                <option value="Received">Received</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Received Amount & Payment Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
                Received Amount (₹)
              </label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 10000"
                value={receivedAmount}
                onChange={e => setReceivedAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
                Payment Method
              </label>
              <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Reference / Invoice Number */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
              Reference / Invoice Number
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. INV-2026-098 / TXN-998812"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
            />
          </div>

          {/* Direct Costs Section (Attached directly to this earning source) */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>
              Direct Costs Attached to this Earning (Optional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'block', marginBottom: '4px' }}>
                  Fuel Cost (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={fuelCost}
                  onChange={e => setFuelCost(e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'block', marginBottom: '4px' }}>
                  Driver Payment (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={driverCost}
                  onChange={e => setDriverCost(e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'block', marginBottom: '4px' }}>
                  FASTag / Toll (₹)
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={fastagCost}
                  onChange={e => setFastagCost(e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', marginBottom: '6px', display: 'block' }}>
              Notes (Optional)
            </label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Any additional remarks..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}
          >
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : '+ Add Revenue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
