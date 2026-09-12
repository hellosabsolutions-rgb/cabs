import React from 'react';
import { RevenueItem } from '../../../types/revenue';
import {
  X,
  Fuel,
  UserCheck,
  CreditCard,
  Calendar,
  Car,
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Edit2
} from 'lucide-react';

interface RevenueDetailModalProps {
  item: RevenueItem | null;
  onClose: () => void;
  onEditBooking?: (bookingId: string) => void;
}

export const RevenueDetailModal: React.FC<RevenueDetailModalProps> = ({ item, onClose, onEditBooking }) => {
  if (!item) return null;

  const formatINR = (val: number) => '₹' + Math.round(val || 0).toLocaleString('en-IN');

  const getStatusBadge = (status: RevenueItem['paymentStatus']) => {
    switch (status) {
      case 'Received':
        return (
          <span className="status-chip running" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Received
          </span>
        );
      case 'Partial':
        return (
          <span className="status-chip idle" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Partial
          </span>
        );
      case 'Overdue':
        return (
          <span className="status-chip offline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> Overdue
          </span>
        );
      default:
        return (
          <span
            className="status-chip"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8'
            }}
          >
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
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
    >
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '88vh',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border)',
          overflow: 'hidden',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: item.type === 'Trip' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                color: item.type === 'Trip' ? '#38bdf8' : '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {item.type === 'Trip' ? <Car size={20} /> : <Receipt size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: item.type === 'Trip' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: item.type === 'Trip' ? '#38bdf8' : '#22c55e'
                  }}
                >
                  {item.type} Revenue
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontWeight: 600 }}>
                  {item.revenueId}
                </span>
              </div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                {item.customer || item.departmentName || 'Revenue Details'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            className="btn-close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer'
            }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Card 1: Gross Revenue & Collections */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>
                Gross Fare / Revenue
              </span>
              {getStatusBadge(item.paymentStatus)}
            </div>

            <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px' }}>
              {formatINR(item.amount)}
            </div>

            {/* Collection Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'block' }}>Received</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>
                  {formatINR(item.receivedAmount)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'block' }}>Pending</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: item.pendingAmount > 0 ? '#ef4444' : 'var(--text-faint)' }}>
                  {formatINR(item.pendingAmount)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'block' }}>Due Date</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  {item.dueDate || item.date}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Activity Direct Profit Calculation */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                Activity Direct Profit
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: item.profit >= 0 ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                  color: item.profit >= 0 ? '#22c55e' : '#ef4444'
                }}
              >
                Margin: {item.margin}%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-faint)' }}>Revenue Earned</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{formatINR(item.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Fuel size={13} /> Fuel Cost
                </span>
                <span style={{ fontWeight: 600 }}>− {formatINR(item.fuelCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={13} /> Driver Direct Payment / Bata
                </span>
                <span style={{ fontWeight: 600 }}>− {formatINR(item.driverCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={13} /> FASTag / Toll Cost
                </span>
                <span style={{ fontWeight: 600 }}>− {formatINR(item.fastagCost)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  marginTop: '4px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '13.5px',
                  fontWeight: 700
                }}
              >
                <span>Net Activity Profit</span>
                <span style={{ color: item.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                  {formatINR(item.profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Source Traceability & Operational Details */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '12px' }}>
              Source Traceability & Metadata
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                  <Car size={13} /> Vehicle
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {item.vehicle}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                  <UserCheck size={13} /> Driver
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {item.driver || '—'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                  <Calendar size={13} /> Date
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {item.date}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                  <FileText size={13} /> Reference #
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {item.referenceNo || '—'}
                </span>
              </div>
              {item.route && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                    <Briefcase size={13} /> Route / Details
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', lineHeight: '1.4' }}>
                    {item.route}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Business Rule Notice */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              fontSize: '11.5px',
              color: 'var(--text-faint)',
              lineHeight: '1.5'
            }}
          >
            <strong>Note:</strong> Fixed overheads (vehicle maintenance, fixed driver salaries, and general expenses) are not deducted at the individual trip level and are accounted for in the Profitability module.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'var(--surface-2)'
          }}
        >
          <div>
            {(item.sourceType === 'Booking' || item.type === 'Trip') && onEditBooking && (
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => {
                  const targetId = item.sourceId || item.id;
                  onEditBooking(targetId);
                }}
                style={{
                  padding: '8px 18px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  color: '#fbbf24',
                  borderColor: 'rgba(251, 191, 36, 0.4)'
                }}
              >
                <Edit2 size={13} /> Edit Trip Expenses
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
