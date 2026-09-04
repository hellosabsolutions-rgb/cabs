import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { ExpenseRecord } from '../../../types/fleet';
import { IndianRupee, Fuel, CreditCard, User, Wrench, FileText } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: ExpenseRecord['category'];
}

const categories: ExpenseRecord['category'][] = [
  'Fuel',
  'FASTag / Toll',
  'Driver',
  'Maintenance',
  'General'
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Fuel'
}) => {
  const { vehicles, drivers, addExpense } = useFleet();

  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
  const [vehicle, setVehicle] = useState(vehicles[0]?.registrationNumber || 'DL01AB1234');
  const [category, setCategory] = useState<ExpenseRecord['category']>(defaultCategory);
  const [amount, setAmount] = useState('');
  const [linkedTo, setLinkedTo] = useState('Department duty');
  const [litres, setLitres] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }

    const fullLinked =
      category === 'Fuel' && litres
        ? `${linkedTo.trim() || 'Fuel refilling'} (${litres} Litres)`
        : linkedTo.trim() || 'General Expense';

    addExpense({
      date,
      vehicle,
      category,
      linkedTo: fullLinked,
      amount: Number(amount)
    });

    setAmount('');
    setLitres('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={18} color="var(--accent)" /> Add Fleet Expense
            </h3>
            <span className="modal-subtitle">Log fuel refills, toll, driver bata, or repairs</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="expense"
              context={{
                vehicles: vehicles.map(v => v.registrationNumber),
                drivers: drivers.map(d => d.name)
              }}
              placeholder="Speak expense details (e.g. 'Driver Rahul Sharma 1200 DL01AB1234 Bata')"
              onApplyParsedData={(data) => {
                if (data.category) setCategory(data.category as any);
                if (data.vehicle) setVehicle(data.vehicle);
                if (data.amount) setAmount(data.amount);
                if (data.driverName) setLinkedTo(`${data.driverName} - Bata / Outstation`);
              }}
            />

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

            {/* Category selection */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Expense Category *</label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {categories.map(cat => (
                  <div
                    key={cat}
                    className={`driver-type-option ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat === 'Fuel' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Fuel size={13} /> Fuel</span>
                    ) : cat === 'FASTag / Toll' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CreditCard size={13} /> Toll</span>
                    ) : cat === 'Driver' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><User size={13} /> Driver</span>
                    ) : cat === 'Maintenance' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Wrench size={13} /> Repair</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FileText size={13} /> General</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle & Date */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle *</label>
                <select
                  className="form-input"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      {v.registrationNumber} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date (e.g. 02 Sep) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Amount & Litres (if fuel) */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Expense Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 3500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              {category === 'Fuel' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fuel Quantity (Litres / Kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="form-input"
                    placeholder="e.g. 35.5"
                    value={litres}
                    onChange={e => setLitres(e.target.value)}
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Receipt / Slip No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. RCP-8840"
                  />
                </div>
              )}
            </div>

            {/* Linked To */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                {category === 'Driver' ? 'Driver / Duty Purpose' : 'Linked To / Purpose'}
              </label>
              {category === 'Driver' && drivers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <select
                    className="form-input"
                    value={drivers.some(d => linkedTo.startsWith(d.name)) ? drivers.find(d => linkedTo.startsWith(d.name))?.name : ''}
                    onChange={e => {
                      if (e.target.value) {
                        setLinkedTo(`${e.target.value} - Outstation Bata / Allowance`);
                      }
                    }}
                  >
                    <option value="">Select registered driver (or type custom below)...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.driverType || 'Driver'} - {d.assignedVehicle || 'No vehicle'})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar - Outstation Bata / Allowance"
                    value={linkedTo}
                    onChange={e => setLinkedTo(e.target.value)}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder={
                    category === 'Driver'
                      ? 'e.g. Ramesh Kumar - Outstation Bata / Allowance'
                      : 'e.g. Indian Oil Pump Delhi, Department Duty'
                  }
                  value={linkedTo}
                  onChange={e => setLinkedTo(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <span>+</span> Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
