import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { RecordPaymentModal } from './RecordPaymentModal';
import { DepartmentPayment } from '../../../types/fleet';
import { FileText, Building2, Receipt } from 'lucide-react';

export const DepartmentPaymentsView: React.FC = () => {
  const { departmentPayments, searchQuery } = useFleet();

  const [modeFilter, setModeFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewProof, setViewProof] = useState<string | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const filteredPayments = useMemo(() => {
    return departmentPayments.filter(p => {
      const matchSearch =
        p.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.remarks && p.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMode = modeFilter === 'All' || p.paymentMode === modeFilter;

      return matchSearch && matchMode;
    });
  }, [departmentPayments, searchQuery, modeFilter]);

  // Stats
  const stats = useMemo(() => {
    let totalCollected = 0;
    let treasuryChallan = 0;
    let neftRtgs = 0;

    departmentPayments.forEach(p => {
      totalCollected += p.amountPaid;
      if (p.paymentMode === 'Treasury Challan') treasuryChallan += p.amountPaid;
      else if (p.paymentMode === 'NEFT / RTGS') neftRtgs += p.amountPaid;
    });

    return {
      totalCollected,
      treasuryChallan,
      neftRtgs,
      totalCount: departmentPayments.length
    };
  }, [departmentPayments]);

  const getStatusBadge = (status: DepartmentPayment['status']) => {
    switch (status) {
      case 'Reconciled':
        return <span className="status-chip running">● Reconciled</span>;
      case 'Received':
        return <span className="status-chip active" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>● Received</span>;
      case 'Processing':
        return <span className="status-chip idle">● Processing</span>;
      default:
        return <span className="status-chip">{status}</span>;
    }
  };

  const getModeBadgeClass = (mode: DepartmentPayment['paymentMode']) => {
    switch (mode) {
      case 'Treasury Challan':
        return 'rgba(168, 85, 247, 0.12)';
      case 'NEFT / RTGS':
        return 'rgba(57, 255, 110, 0.12)';
      case 'Cheque':
        return 'var(--warning-bg)';
      default:
        return 'var(--surface-3)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Collected Payments" value={formatINR(stats.totalCollected)} customColor="var(--accent)" />
        <StatCard label="Treasury Challan Receipts" value={formatINR(stats.treasuryChallan)} />
        <StatCard label="NEFT / RTGS Transfers" value={formatINR(stats.neftRtgs)} />
        <StatCard label="Total Payment Receipts" value={stats.totalCount} />
      </div>

      {/* Payments Ledger Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Department Payments & Receipts Ledger</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredPayments.length} receipts)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value)}
            >
              <option value="All">All Payment Modes</option>
              <option value="NEFT / RTGS">NEFT / RTGS</option>
              <option value="Treasury Challan">Treasury Challan</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="Direct Transfer">Direct Transfer</option>
            </select>

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px' }}
              onClick={() => setIsModalOpen(true)}
            >
              + Record Payment
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Receipt No & Date</th>
                <th>Department</th>
                <th>Invoice settled</th>
                <th>Amount received</th>
                <th>Payment mode</th>
                <th>UTR / Challan ref</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No payment records match your filters. Click "+ Record Payment" to log one.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.receiptNumber}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {p.paymentDate}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.departmentName}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-dim)' }}>
                      {p.invoiceNumber}
                    </td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      {formatINR(p.amountPaid)}
                    </td>
                    <td>
                      <span
                        className="driver-type-badge"
                        style={{ background: getModeBadgeClass(p.paymentMode) }}
                      >
                        {p.paymentMode}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {p.referenceNo}
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {p.remarks || '—'}
                    </td>
                    <td>
                      {p.paymentProof ? (
                        <span
                          className="bill-link"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setViewProof(p.paymentProof!)}
                        >
                          <FileText size={12} /> {p.paymentProof.startsWith('data:') ? 'Challan slip' : p.paymentProof}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Proof Modal */}
      {viewProof && (
        <div className="modal-overlay" onClick={() => setViewProof(null)}>
          <div className="modal-dialog" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} /> Payment Advice / Challan
              </h3>
              <button className="modal-close-btn" onClick={() => setViewProof(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              {viewProof.startsWith('data:image') ? (
                <img
                  src={viewProof}
                  alt="Payment Challan"
                  style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <Building2 size={42} color="var(--accent)" />
                  </div>
                  <div style={{ fontWeight: 600 }}>File: {viewProof}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    Government treasury deposit & transaction advice verified.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewProof(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
