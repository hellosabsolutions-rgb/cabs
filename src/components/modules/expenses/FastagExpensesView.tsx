import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { RechargeFastagModal } from './RechargeFastagModal';
import { AddTollDeductionModal } from './AddTollDeductionModal';
import { FastagTransaction } from '../../../types/fleet';
import { CreditCard, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const FastagExpensesView: React.FC = () => {
  const { vehicles, fastagTransactions, searchQuery } = useFleet();

  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [modalVehicleTarget, setModalVehicleTarget] = useState<string | undefined>(undefined);
  const [selectedProof, setSelectedProof] = useState<{
    title: string;
    vehicle: string;
    amount: number;
    src: string;
    plaza?: string;
  } | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  // Per-vehicle statistics
  const vehicleFastagStats = useMemo(() => {
    const map: Record<
      string,
      {
        totalToll: number;
        totalRecharge: number;
        txCount: number;
      }
    > = {};

    vehicles.forEach(v => {
      map[v.registrationNumber] = { totalToll: 0, totalRecharge: 0, txCount: 0 };
    });

    fastagTransactions.forEach(tx => {
      if (!map[tx.vehicle]) {
        map[tx.vehicle] = { totalToll: 0, totalRecharge: 0, txCount: 0 };
      }
      if (tx.type === 'Toll Deduction') {
        map[tx.vehicle].totalToll += tx.amount;
      } else {
        map[tx.vehicle].totalRecharge += tx.amount;
      }
      map[tx.vehicle].txCount += 1;
    });

    return map;
  }, [vehicles, fastagTransactions]);

  // Overall stats
  const overallStats = useMemo(() => {
    let totalBalance = 0;
    let totalTollSpent = 0;
    let lowBalanceCount = 0;

    vehicles.forEach(v => {
      const bal = v.fastagBalance || 0;
      totalBalance += bal;
      if (bal < 500) lowBalanceCount++;
    });

    fastagTransactions.forEach(tx => {
      if (tx.type === 'Toll Deduction') {
        totalTollSpent += tx.amount;
      }
    });

    return {
      totalBalance,
      totalTollSpent,
      lowBalanceCount,
      totalAccounts: vehicles.length
    };
  }, [vehicles, fastagTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return fastagTransactions.filter(tx => {
      const matchSearch =
        tx.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.tollPlaza && tx.tollPlaza.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tx.transactionRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.linkedDutyOrTrip && tx.linkedDutyOrTrip.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchVehicle = selectedVehicleFilter === 'All' || tx.vehicle === selectedVehicleFilter;
      const matchType = typeFilter === 'All' || tx.type === typeFilter;

      return matchSearch && matchVehicle && matchType;
    });
  }, [fastagTransactions, searchQuery, selectedVehicleFilter, typeFilter]);

  const handleOpenRecharge = (reg?: string) => {
    setModalVehicleTarget(reg);
    setIsRechargeModalOpen(true);
  };

  const handleOpenDeduct = (reg?: string) => {
    setModalVehicleTarget(reg);
    setIsDeductModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overall Stats */}
      <div className="stats-grid">
        <StatCard label="Total FASTag Fleet Balance" value={formatINR(overallStats.totalBalance)} customColor="var(--accent)" />
        <StatCard label="Total Toll Incurred" value={formatINR(overallStats.totalTollSpent)} customColor="#38bdf8" />
        <StatCard label="Active FASTag Units" value={overallStats.totalAccounts} />
        <StatCard
          label="Low Balance Warnings (< ₹500)"
          value={overallStats.lowBalanceCount}
          customColor={overallStats.lowBalanceCount > 0 ? 'var(--danger)' : undefined}
        />
      </div>

      {/* SECTION 1: PER-VEHICLE FASTAG ACCOUNTS & EXPENSE CARDS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              Per-Vehicle FASTag Accounts & Toll Expense
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              Live tag balance, total toll spent, and direct recharge per vehicle
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => handleOpenDeduct()}
            >
              + Log Toll Plaza
            </button>
            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={() => handleOpenRecharge()}
            >
              ⚡ Recharge FASTag
            </button>
          </div>
        </div>

        {/* Per-Vehicle Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px'
          }}
        >
          {vehicles.map(v => {
            const vStats = vehicleFastagStats[v.registrationNumber] || { totalToll: 0, totalRecharge: 0, txCount: 0 };
            const bal = v.fastagBalance || 0;
            const isLow = bal < 500;
            const isSelected = selectedVehicleFilter === v.registrationNumber;

            return (
              <div
                key={v.id}
                style={{
                  background: isSelected ? 'var(--surface-3)' : 'var(--surface)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : isLow ? 'rgba(255, 92, 92, 0.4)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Header with Reg & Balance */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text)', letterSpacing: '0.5px' }}>
                      {v.registrationNumber}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '1px' }}>
                      {v.model || v.type} · {v.assignedDriver || 'Driver'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: isLow ? 'var(--danger)' : 'var(--accent)'
                      }}
                    >
                      {formatINR(bal)}
                    </div>
                    {isLow && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--danger)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontWeight: 600
                        }}
                      >
                        <AlertTriangle size={10} /> LOW BALANCE
                      </span>
                    )}
                  </div>
                </div>

                {/* Tag & Bank Details */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    border: '1px solid var(--border-soft)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Tag Bank:</span>
                    <span style={{ fontWeight: 500 }}>{v.fastagBank || 'ICICI Bank FASTag'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Tag ID:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{v.fastagTagId || '34161FA8891'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Total Toll Deducted:</span>
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>{formatINR(vStats.totalToll)}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '11px', padding: '5px 0' }}
                    onClick={() =>
                      setSelectedVehicleFilter(isSelected ? 'All' : v.registrationNumber)
                    }
                  >
                    {isSelected ? '✓ Showing' : 'View Tolls'}
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '11px', padding: '5px 0' }}
                    onClick={() => handleOpenDeduct(v.registrationNumber)}
                  >
                    + Toll
                  </button>
                  <button
                    className="btn-primary-action"
                    style={{ flex: 1, fontSize: '11px', padding: '5px 0' }}
                    onClick={() => handleOpenRecharge(v.registrationNumber)}
                  >
                    ⚡ Topup
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: FASTAG TRANSACTIONS & DEDUCTION STATEMENT */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">FASTag Toll Statement & Deductions Ledger</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredTransactions.length} transactions)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={selectedVehicleFilter}
              onChange={e => setSelectedVehicleFilter(e.target.value)}
            >
              <option value="All">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.registrationNumber}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>

            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="All">All Transaction Types</option>
              <option value="Toll Deduction">Toll Deductions</option>
              <option value="Recharge">Wallet Recharges</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle & Tag</th>
                <th>Date & Time</th>
                <th>Toll Plaza / Operation</th>
                <th>Lane / Gate</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>NPCI Reference</th>
                <th>Proof Slip</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No FASTag transactions found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{tx.vehicle}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', fontFamily: 'monospace' }}>
                          {tx.tagId}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.date}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {tx.time}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500, fontSize: '12px' }}>
                        {tx.tollPlaza || 'Electronic Toll Collection Plaza'}
                      </div>
                      {tx.linkedDutyOrTrip && (
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Linked: {tx.linkedDutyOrTrip}
                        </div>
                      )}
                    </td>

                    <td style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                      {tx.lane || 'ETC Fast'}
                    </td>

                    <td>
                      <span
                        className="driver-type-badge"
                        style={{
                          background:
                            tx.type === 'Toll Deduction'
                              ? 'rgba(56, 189, 248, 0.12)'
                              : 'rgba(57, 255, 110, 0.15)',
                          color: tx.type === 'Toll Deduction' ? '#38bdf8' : '#39ff6e'
                        }}
                      >
                        {tx.type === 'Toll Deduction' ? '🛣️ Toll' : '⚡ Topup'}
                      </span>
                    </td>

                    <td
                      className="num"
                      style={{
                        fontWeight: 700,
                        color: tx.type === 'Toll Deduction' ? 'var(--text)' : 'var(--accent)'
                      }}
                    >
                      {tx.type === 'Toll Deduction' ? '-' : '+'}{formatINR(tx.amount)}
                    </td>

                    <td className="num" style={{ fontWeight: 600 }}>
                      {formatINR(tx.balanceAfter)}
                    </td>

                    <td style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>
                      {tx.transactionRef}
                    </td>

                    <td>
                      {tx.proofSlip ? (
                        <span
                          className="bill-link"
                          style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          onClick={() =>
                            setSelectedProof({
                              title: tx.type === 'Recharge' ? 'FASTag Wallet Recharge Slip' : 'Toll Plaza Deduction Proof',
                              vehicle: tx.vehicle,
                              amount: tx.amount,
                              src: tx.proofSlip!,
                              plaza: tx.tollPlaza
                            })
                          }
                        >
                          <FileText size={11} />
                          View proof
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recharge Modal */}
      <RechargeFastagModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        preselectedVehicle={modalVehicleTarget}
      />

      {/* Toll Deduction Modal */}
      <AddTollDeductionModal
        isOpen={isDeductModalOpen}
        onClose={() => setIsDeductModalOpen(false)}
        preselectedVehicle={modalVehicleTarget}
      />

      {/* Proof Viewer Modal */}
      {selectedProof && (
        <div className="modal-overlay" onClick={() => setSelectedProof(null)}>
          <div className="modal-dialog" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🧾 {selectedProof.title}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedProof(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              {selectedProof.src.startsWith('data:image') ? (
                <img
                  src={selectedProof.src}
                  alt={selectedProof.title}
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '30px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>🛣️</div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    Slip: {selectedProof.src}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    Vehicle: {selectedProof.vehicle} · Amount: {formatINR(selectedProof.amount)}
                  </div>
                  {selectedProof.plaza && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Plaza: {selectedProof.plaza}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedProof(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
