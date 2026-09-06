import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { AttendanceStatus, DriverAttendance } from '../../../types/fleet';
import { Edit3, Clock, Calendar, Car, Briefcase, FileText, Loader2 } from 'lucide-react';
import { DatePicker } from '../../common/DatePicker';

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DriverAttendance | null;
}

const statusOptions: AttendanceStatus[] = ['Present', 'On Trip', 'Late', 'Absent', 'On Leave'];
const dutyTypes = ['Department Duty', 'Trip Duty', 'Standby', 'Yard Duty'] as const;

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  onClose,
  record
}) => {
  const { vehicles, updateAttendance } = useFleet();

  const [date, setDate] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [checkIn, setCheckIn] = useState('08:30 AM');
  const [checkOut, setCheckOut] = useState('06:30 PM');
  const [vehicle, setVehicle] = useState('—');
  const [dutyType, setDutyType] = useState<'Department Duty' | 'Trip Duty' | 'Standby' | 'Yard Duty'>('Department Duty');
  const [workingHours, setWorkingHours] = useState('10.0');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setDate(record.date || '');
      setStatus(record.status || 'Present');
      setCheckIn(record.checkIn && record.checkIn !== '—' ? record.checkIn : '08:30 AM');
      setCheckOut(record.checkOut && record.checkOut !== '—' ? record.checkOut : '06:30 PM');
      setVehicle(record.assignedVehicle || '—');
      setDutyType(record.dutyType || 'Department Duty');
      setWorkingHours(String(record.workingHours !== undefined ? record.workingHours : 10));
      setNotes(record.notes || '');
      setErrorMsg('');
    }
  }, [record, isOpen]);

  // Adjust default times/hours when status changes
  const handleStatusChange = (newStatus: AttendanceStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Absent' || newStatus === 'On Leave') {
      setWorkingHours('0');
    } else if (workingHours === '0') {
      setWorkingHours('10.0');
    }
  };

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

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const isOff = status === 'Absent' || status === 'On Leave';
      const payload: Partial<DriverAttendance> = {
        driverId: record.driverId,
        driverName: record.driverName,
        date,
        status,
        checkIn: isOff ? '—' : checkIn,
        checkOut: isOff ? '—' : checkOut,
        assignedVehicle: vehicle,
        dutyType,
        workingHours: isOff ? 0 : Number(workingHours) || 0,
        notes: notes.trim() || undefined
      };

      const res = await updateAttendance(record.id, payload);
      if (res && !res.success && res.error) {
        setErrorMsg(res.error);
        return;
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update attendance record.');
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
              <Edit3 size={18} color="var(--accent)" /> Edit Attendance Record
            </h3>
            <span className="modal-subtitle">
              Updating daily duty log for <strong style={{ color: 'var(--text)' }}>{record.driverName}</strong>
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button" title="Close modal">
            ✕
          </button>
        </div>

        {/* Form */}
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

            {/* Driver Badge Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--surface-2)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>DRIVER</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>{record.driverName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>CURRENT DUTY</div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--accent)' }}>{record.assignedVehicle || '—'}</div>
              </div>
            </div>

            {/* Date & Status */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> Attendance Date *
                </label>
                <DatePicker
                  value={date}
                  onChange={d => setDate(d)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Attendance Status *</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => handleStatusChange(e.target.value as AttendanceStatus)}
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duty Type & Assigned Vehicle */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={12} /> Duty Type
                </label>
                <select
                  className="form-input"
                  value={dutyType}
                  onChange={e => setDutyType(e.target.value as any)}
                >
                  {dutyTypes.map(t => (
                    <option key={t} value={t}>
                      {t}
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

            {/* Check In, Check Out, Working Hours */}
            {status !== 'Absent' && status !== 'On Leave' && (
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Check In Time
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 08:30 AM"
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Check Out Time
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 06:30 PM"
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Working Hours */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Duty Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                className="form-input"
                value={workingHours}
                onChange={e => setWorkingHours(e.target.value)}
                disabled={status === 'Absent' || status === 'On Leave'}
              />
              {(status === 'Absent' || status === 'On Leave') && (
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '3px' }}>
                  Hours automatically zeroed for {status} status.
                </div>
              )}
            </div>

            {/* Remarks / Route */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={12} /> Remarks / Route Description
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Delhi to Gurgaon VIP movement / Late check-in approved"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
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
