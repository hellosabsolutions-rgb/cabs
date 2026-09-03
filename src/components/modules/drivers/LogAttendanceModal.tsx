import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { AttendanceStatus } from '../../../types/fleet';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';

interface LogAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

const statusOptions: AttendanceStatus[] = ['Present', 'On Trip', 'Late', 'Absent', 'On Leave'];
const dutyTypes = ['Department Duty', 'Trip Duty', 'Standby', 'Yard Duty'] as const;

export const LogAttendanceModal: React.FC<LogAttendanceModalProps> = ({
  isOpen,
  onClose,
  defaultDate
}) => {
  const { drivers, vehicles, markAttendance } = useFleet();

  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [checkIn, setCheckIn] = useState('08:30 AM');
  const [checkOut, setCheckOut] = useState('06:30 PM');
  const [vehicle, setVehicle] = useState(vehicles[0]?.registrationNumber || 'DL01AB1234');
  const [dutyType, setDutyType] = useState<'Department Duty' | 'Trip Duty' | 'Standby' | 'Yard Duty'>('Department Duty');
  const [workingHours, setWorkingHours] = useState('10.0');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep state in sync with selected driver defaults
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = drivers.find(drv => drv.id === selectedDriverId);
    if (!d) {
      setErrorMsg('Please select a valid driver.');
      return;
    }

    setIsSubmitting(true);
    try {
      markAttendance({
        driverId: d.id,
        driverName: d.name,
        date,
        status,
        checkIn: status === 'Absent' || status === 'On Leave' ? '—' : checkIn,
        checkOut: status === 'Absent' || status === 'On Leave' ? '—' : checkOut,
        assignedVehicle: vehicle,
        dutyType,
        workingHours: status === 'Absent' || status === 'On Leave' ? 0 : Number(workingHours) || 0,
        notes: notes.trim() || undefined
      });

      setNotes('');
      setErrorMsg('');
      onClose();
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
              <Calendar size={18} color="var(--accent)" /> Log Driver Attendance
            </h3>
            <span className="modal-subtitle">Record duty check-in, timings, route & hours</span>
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
                <label className="form-label">Attendance Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Attendance Status */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Attendance Status</label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {statusOptions.map(st => (
                  <div
                    key={st}
                    className={`driver-type-option ${status === st ? 'active' : ''}`}
                    onClick={() => setStatus(st)}
                    style={{ padding: '7px 4px', fontSize: '11.5px' }}
                  >
                    {st}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle & Duty Type */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned Vehicle</label>
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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duty Type</label>
                <select
                  className="form-input"
                  value={dutyType}
                  onChange={e => setDutyType(e.target.value as typeof dutyType)}
                >
                  {dutyTypes.map(dt => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Timings (if present) */}
            {status !== 'Absent' && status !== 'On Leave' && (
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Check-in Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="08:30 AM"
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Check-out Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="06:30 PM"
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Working Hours & Notes */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duty / Working Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  className="form-input"
                  placeholder="e.g. 10.5"
                  value={workingHours}
                  onChange={e => setWorkingHours(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Remarks / Duty Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PWD Delhi Route, Trip to Jaipur"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
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
                  <Loader2 size={14} className="spin-loader" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Save Attendance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
