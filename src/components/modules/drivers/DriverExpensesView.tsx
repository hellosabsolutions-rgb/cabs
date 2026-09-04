import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddDriverExpenseModal } from './AddDriverExpenseModal';
import { DriverExpenseCategory } from '../../../types/fleet';
import { FileText } from 'lucide-react';

export const DriverExpensesView: React.FC = () => {
  const { driverExpenses, updateDriverExpenseStatus, searchQuery } = useFleet();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<string | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const filteredExpenses = useMemo(() => {
    return driverExpenses.filter(item => {
      const matchSearch =
        item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.remarks && item.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [driverExpenses, searchQuery, categoryFilter, statusFilter]);

  // Quick stats
  const stats = useMemo(() => {
    let total = 0;
    let bata = 0;
    let nightHaltAndOT = 0;
    let advanceAndMisc = 0;

    driverExpenses.forEach(exp => {
      total += exp.amount;
      if (exp.category === 'Daily Bata / Food') {
        bata += exp.amount;
      } else if (exp.category === 'Night Halt Allowance' || exp.category === 'Overtime') {
        nightHaltAndOT += exp.amount;
      } else {
        advanceAndMisc += exp.amount;
      }
    });

    return { total, bata, nightHaltAndOT, advanceAndMisc };
  }, [driverExpenses]);

  const getStatusBadge = (status: 'Approved' | 'Pending' | 'Paid', id: string) => {
    const handleStatusClick = () => {
      if (status === 'Paid') updateDriverExpenseStatus(id, 'Pending');
      else if (status === 'Pending') updateDriverExpenseStatus(id, 'Approved');
      else updateDriverExpenseStatus(id, 'Paid');
    };

    switch (status) {
      case 'Paid':
        return (
          <span
            className="status-chip running"
            style={{ cursor: 'pointer' }}
            title="Click to toggle payout status"
            onClick={handleStatusClick}
          >
            ● Paid
          </span>
        );
      case 'Approved':
        return (
          <span
            className="status-chip active"
            style={{ cursor: 'pointer', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}
            title="Click to toggle payout status"
            onClick={handleStatusClick}
          >
            ● Approved
          </span>
        );
      case 'Pending':
        return (
          <span
            className="status-chip idle"
            style={{ cursor: 'pointer' }}
            title="Click to toggle payout status"
            onClick={handleStatusClick}
          >
            ● Pending
          </span>
        );
      default:
        return <span className="status-chip">{status}</span>;
    }
  };

  const getCategoryColor = (cat: DriverExpenseCategory) => {
    switch (cat) {
      case 'Daily Bata / Food':
        return 'rgba(57, 255, 110, 0.12)';
      case 'Night Halt Allowance':
        return 'rgba(168, 85, 247, 0.12)';
      case 'Advance Payout':
        return 'var(--warning-bg)';
      case 'Overtime':
        return 'rgba(56, 189, 248, 0.12)';
      default:
        return 'var(--surface-3)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Driver Expenses" value={formatINR(stats.total)} customColor="var(--accent)" />
        <StatCard label="Daily Bata & Food" value={formatINR(stats.bata)} />
        <StatCard label="Night Halt & Overtime" value={formatINR(stats.nightHaltAndOT)} />
        <StatCard label="Advances & Reimbursements" value={formatINR(stats.advanceAndMisc)} />
      </div>

      {/* Expenses Table Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="panel-title">Driver Expense & Allowance Logs</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredExpenses.length} entries)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Daily Bata / Food">Daily Bata / Food</option>
              <option value="Night Halt Allowance">Night Halt Allowance</option>
              <option value="Advance Payout">Advance Payout</option>
              <option value="Overtime">Overtime</option>
              <option value="Toll / Cash Reimbursement">Toll / Reimbursement</option>
            </select>

            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
            </select>

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px' }}
              onClick={() => setIsModalOpen(true)}
            >
              + Add Driver Expense
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status (Click to toggle)</th>
                <th>Remarks</th>
                <th>Receipt / Proof</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No driver expenses match current filters. Click "+ Add Driver Expense" to create one.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {exp.date}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className="driver-avatar-circle"
                          style={{ width: 26, height: 26, fontSize: 11 }}
                        >
                          {exp.driverName.charAt(0)}
                        </div>
                        {exp.driverName}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{exp.vehicle}</td>
                    <td>
                      <span
                        className="driver-type-badge"
                        style={{ background: getCategoryColor(exp.category) }}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {formatINR(exp.amount)}
                    </td>
                    <td>{getStatusBadge(exp.status, exp.id)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {exp.remarks || '—'}
                    </td>
                    <td>
                      {exp.receipt ? (
                        <span
                          className="bill-link"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setActiveReceipt(exp.receipt!)}
                        >
                          <FileText size={12} /> {exp.receipt.startsWith('data:') ? 'View attachment' : exp.receipt}
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

      {/* Slide-from-bottom Add Expense Modal */}
      <AddDriverExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Receipt View Modal */}
      {activeReceipt && (
        <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal-dialog" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Receipt / Voucher Document
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveReceipt(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center' }}>
              {activeReceipt.startsWith('data:image') ? (
                <img
                  src={activeReceipt}
                  alt="Receipt Document"
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '30px', color: 'var(--text-dim)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <FileText size={40} color="var(--accent)" />
                  </div>
                  <div>Document File: <b>{activeReceipt}</b></div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    Verified and stored in KABPRO storage.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setActiveReceipt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
