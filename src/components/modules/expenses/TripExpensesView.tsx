import React, { useMemo, useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { Receipt, MapPin, Plus } from 'lucide-react';
import { TripExpenseCategory } from '../../../types/fleet';
import { AddTripExpenseModal } from './AddTripExpenseModal';

const CATEGORY_COLORS: Record<TripExpenseCategory, { bg: string; color: string; border: string }> = {
  Toll: { bg: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
  Food: { bg: 'rgba(251, 146, 60, 0.12)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' },
  Parking: { bg: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
  Repair: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  Loading: { bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  Maintenance: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  Other: { bg: 'var(--surface-3)', color: 'var(--text-dim)', border: 'var(--border-soft)' }
};

export const TripExpensesView: React.FC = () => {
  const { tripExpenses, searchQuery } = useFleet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const filtered = tripExpenses.filter(e => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      e.vehicle?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.driverName?.toLowerCase().includes(q) ||
      e.bookingNumber?.toLowerCase().includes(q) ||
      (e.notes || '').toLowerCase().includes(q)
    );
  });

  const stats = useMemo(() => {
    const totals: Record<string, number> = { Toll: 0, Food: 0, Parking: 0, Repair: 0 };
    let all = 0;
    tripExpenses.forEach(e => {
      all += Number(e.amount || 0);
      if (totals[e.category] !== undefined) totals[e.category] += Number(e.amount || 0);
    });
    return { ...totals, all };
  }, [tripExpenses]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="stats-grid">
        <StatCard label="Trip expenses" value={formatINR(stats.all)} customColor="#1687F5" />
        <StatCard label="Toll" value={formatINR(stats.Toll)} customColor="#38bdf8" />
        <StatCard label="Food" value={formatINR(stats.Food)} customColor="#fb923c" />
        <StatCard label="Parking" value={formatINR(stats.Parking)} customColor="#a855f7" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Trip Expense Log</span>
          <span
            className="panel-link"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={14} /> Add trip expense
          </span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Booking</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Added by</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Notes</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No trip expenses yet. Add one here or let the driver log it from the trip screen.
                  </td>
                </tr>
              ) : (
                filtered.map(e => {
                  const tone = CATEGORY_COLORS[e.category] || CATEGORY_COLORS.Other;
                  const office = e.createdBy === 'admin';
                  return (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={12} />
                          {e.bookingNumber || '—'}
                        </span>
                      </td>
                      <td>{e.driverName || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{e.vehicle || '—'}</td>
                      <td>
                        <span
                          className="driver-type-badge"
                          style={{
                            background: tone.bg,
                            color: tone.color,
                            borderColor: tone.border,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Receipt size={12} />
                          {e.category}
                        </span>
                      </td>
                      <td>
                        <span
                          className="driver-type-badge"
                          style={{
                            background: office ? 'rgba(22, 135, 245, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: office ? '#1687F5' : '#10b981',
                            borderColor: office ? 'rgba(22, 135, 245, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {office ? `Office${e.createdByName ? ` · ${e.createdByName}` : ''}` : 'Driver'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="driver-type-badge"
                          style={{
                            background: e.status === 'Paid' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                            color: e.status === 'Paid' ? '#22c55e' : '#eab308'
                          }}
                        >
                          {e.status === 'Paid' ? 'Paid' : e.status === 'Approved' ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {e.receipt ? (
                          <button
                            type="button"
                            className="panel-link"
                            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                            onClick={() => setPreviewUrl(e.receipt || null)}
                          >
                            View
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>{e.notes || '—'}</td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {formatINR(e.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTripExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {previewUrl && (
        <div className="modal-overlay" onClick={() => setPreviewUrl(null)}>
          <div
            className="modal-dialog"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 640, padding: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>Receipt</strong>
              <button className="modal-close-btn" type="button" onClick={() => setPreviewUrl(null)}>
                ✕
              </button>
            </div>
            {previewUrl.toLowerCase().includes('.pdf') || previewUrl.startsWith('data:application/pdf') ? (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="panel-link">
                Open PDF receipt
              </a>
            ) : (
              <img src={previewUrl} alt="Receipt" style={{ width: '100%', borderRadius: 10 }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
