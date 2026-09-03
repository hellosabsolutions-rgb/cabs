import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { RechargeFastagModal } from './RechargeFastagModal';
import { DeductTollModal } from './DeductTollModal';
import { EditFastagModal } from './EditFastagModal';
import { CreditCard, AlertTriangle, Zap, ShieldCheck, MinusCircle, Edit3, Plus } from 'lucide-react';

export const FastagExpensesView: React.FC = () => {
  const { vehicles, fastagTransactions, searchQuery } = useFleet();

  const [filterMode, setFilterMode] = useState<'all' | 'low-balance'>('all');
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalVehicleTarget, setModalVehicleTarget] = useState<string | undefined>(undefined);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  // Compute per-vehicle FASTag summary
  const vehicleFastagSummaries = useMemo(() => {
    return vehicles.map(v => {
      // Find all recharges for this vehicle sorted by latest
      const recharges = fastagTransactions
        .filter(tx => tx.vehicle === v.registrationNumber && tx.type === 'Recharge')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastRecharge = recharges[0] || null;

      // Find all toll deductions (total expense in fastag)
      const totalTollExpense = fastagTransactions
        .filter(tx => tx.vehicle === v.registrationNumber && tx.type === 'Toll Deduction')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const bal = v.fastagBalance || 0;
      const isLow = bal < 500;

      return {
        vehicleReg: v.registrationNumber,
        model: v.model || v.type,
        assignedTo: v.assignedTo,
        driver: v.assignedDriver || 'Assigned Driver',
        tagId: v.fastagTagId || `34161FA${v.registrationNumber.slice(-4)}`,
        bank: v.fastagBank || 'ICICI Bank FASTag',
        currentBalance: bal,
        isLowBalance: isLow,
        lastRechargeDate: lastRecharge ? lastRecharge.date : 'No recharge logged',
        lastRechargeAmount: lastRecharge ? lastRecharge.amount : 0,
        totalTollExpense
      };
    });
  }, [vehicles, fastagTransactions]);

  // Overall quick stats
  const overallStats = useMemo(() => {
    let totalFleetBalance = 0;
    let totalTollSpent = 0;
    let lowBalanceCount = 0;

    vehicleFastagSummaries.forEach(s => {
      totalFleetBalance += s.currentBalance;
      totalTollSpent += s.totalTollExpense;
      if (s.isLowBalance) lowBalanceCount++;
    });

    return {
      totalFleetBalance,
      totalTollSpent,
      lowBalanceCount,
      totalVehicles: vehicles.length
    };
  }, [vehicleFastagSummaries, vehicles]);

  // Filtered by search query & filterMode
  const filteredSummaries = useMemo(() => {
    return vehicleFastagSummaries.filter(item => {
      const matchSearch =
        item.vehicleReg.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bank.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.driver.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMode = filterMode === 'all' || (filterMode === 'low-balance' && item.isLowBalance);

      return matchSearch && matchMode;
    });
  }, [vehicleFastagSummaries, searchQuery, filterMode]);

  const handleOpenRecharge = (reg?: string) => {
    setModalVehicleTarget(reg);
    setIsRechargeModalOpen(true);
  };

  const handleOpenDeduct = (reg?: string) => {
    setModalVehicleTarget(reg);
    setIsDeductModalOpen(true);
  };

  const handleOpenEdit = (reg: string) => {
    setModalVehicleTarget(reg);
    setIsEditModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Manual Mode Operational Banner */}
      <div
        style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '10px 16px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12.5px',
          color: 'var(--text-dim)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
          <span>
            <b>Manual FASTag Management (API Free):</b> Yahan aap manually toll deduction (kitna kata/kam hua) record kar sakte hain, recharge daal sakte hain, ya seedhe wallet balance edit kar sakte hain.
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>100% Offline / Manual Support</span>
      </div>

      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Fleet FASTag Balance"
          value={formatINR(overallStats.totalFleetBalance)}
          customColor="var(--accent)"
        />
        <StatCard
          label="Total Toll Expense Incurred"
          value={formatINR(overallStats.totalTollSpent)}
          customColor="#38bdf8"
        />
        <StatCard
          label="Vehicles with Low Balance"
          value={overallStats.lowBalanceCount}
          customColor={overallStats.lowBalanceCount > 0 ? 'var(--danger)' : undefined}
        />
        <StatCard label="Total Monitored Vehicles" value={overallStats.totalVehicles} />
      </div>

      {/* Main Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Vehicle FASTag Balances, Recharges & Toll Deductions</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredSummaries.length} vehicles)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`subtab-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
              style={{ padding: '5px 12px', fontSize: '12px' }}
            >
              All Vehicles ({vehicleFastagSummaries.length})
            </button>
            <button
              className={`subtab-btn ${filterMode === 'low-balance' ? 'active' : ''}`}
              onClick={() => setFilterMode('low-balance')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                color: overallStats.lowBalanceCount > 0 ? 'var(--danger)' : undefined
              }}
            >
              <AlertTriangle size={13} />
              Low Balance ({overallStats.lowBalanceCount})
            </button>

            {/* Deduct Toll Button */}
            <button
              className="btn-secondary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                color: 'var(--danger)',
                borderColor: 'rgba(255, 92, 92, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onClick={() => handleOpenDeduct()}
              title="Record toll deduction from any vehicle's FASTag"
            >
              <MinusCircle size={13} /> - Deduct Toll (Kitna Kata)
            </button>

            {/* Recharge FASTag Button */}
            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => handleOpenRecharge()}
            >
              <Zap size={14} /> + Recharge FASTag
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle (Konsi Gaadi Mai Hai)</th>
                <th>FASTag Details (Konsa FASTag Hai)</th>
                <th>Current Balance (Kitne Paise Hai)</th>
                <th>Last Recharge (Kab & Kitne Ka Hua)</th>
                <th>Total Toll Expense (Kitna Kata)</th>
                <th>Actions (Edit / Deduct / Recharge)</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No vehicle FASTag records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map(item => (
                  <tr key={item.vehicleReg}>
                    {/* 1. Konsa vehicle mai hai */}
                    <td>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--text)',
                            fontSize: '14px',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {item.vehicleReg}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {item.model}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Driver: <b>{item.driver}</b> · {item.assignedTo}
                        </div>
                      </div>
                    </td>

                    {/* 2. Konsa FASTag hai (Tag ID & Bank) */}
                    <td>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <CreditCard size={14} style={{ color: 'var(--accent)' }} />
                          {item.bank}
                        </div>
                        <div
                          style={{
                            fontSize: '11.5px',
                            fontFamily: 'monospace',
                            color: 'var(--text-dim)',
                            marginTop: '3px'
                          }}
                        >
                          Tag ID: <b>{item.tagId}</b>
                        </div>
                        <div
                          style={{
                            fontSize: '10.5px',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            marginTop: '2px'
                          }}
                        >
                          <ShieldCheck size={11} /> KYC Active
                        </div>
                      </div>
                    </td>

                    {/* 3. Kitne paise hai (Current Balance) + Direct Edit Button */}
                    <td>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 800,
                              color: item.isLowBalance ? 'var(--danger)' : 'var(--accent)'
                            }}
                          >
                            {formatINR(item.currentBalance)}
                          </span>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                            onClick={() => handleOpenEdit(item.vehicleReg)}
                            title="Directly edit FASTag wallet balance"
                          >
                            <Edit3 size={10} /> Edit
                          </button>
                        </div>
                        {item.isLowBalance ? (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--danger)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontWeight: 600,
                              marginTop: '2px'
                            }}
                          >
                            <AlertTriangle size={11} /> Low balance! Refill needed
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                            ● Wallet Active
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4. Last recharge kab hua and kitne ka hua */}
                    <td>
                      {item.lastRechargeAmount > 0 ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
                            <span style={{ color: '#ffcc4d' }}>+</span>{formatINR(item.lastRechargeAmount)}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Recharge Date: <b>{item.lastRechargeDate}</b>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>
                          No recharge logged
                        </span>
                      )}
                    </td>

                    {/* 5. Total expense in FASTag */}
                    <td>
                      <div
                        className="num"
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: item.totalTollExpense > 0 ? '#38bdf8' : 'var(--text-faint)'
                        }}
                      >
                        {formatINR(item.totalTollExpense)}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        Toll Deducted
                      </div>
                    </td>

                    {/* 6. Actions: Deduct Toll / Recharge / Edit */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Deduct Toll Button */}
                        <button
                          className="btn-secondary"
                          style={{
                            fontSize: '11px',
                            padding: '5px 8px',
                            color: 'var(--danger)',
                            borderColor: 'rgba(255, 92, 92, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          onClick={() => handleOpenDeduct(item.vehicleReg)}
                          title="Record toll deduction (kitna kata)"
                        >
                          <MinusCircle size={11} /> Deduct Toll
                        </button>

                        {/* Recharge Button */}
                        <button
                          className="btn-primary-action"
                          style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => handleOpenRecharge(item.vehicleReg)}
                          title="Recharge FASTag balance"
                        >
                          <Zap size={11} /> Recharge
                        </button>
                      </div>
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

      {/* Deduct Toll Modal (Kitna Kata / Kam Hua) */}
      <DeductTollModal
        isOpen={isDeductModalOpen}
        onClose={() => setIsDeductModalOpen(false)}
        preselectedVehicle={modalVehicleTarget}
      />

      {/* Edit FASTag Modal (Manual direct balance update) */}
      {modalVehicleTarget && (
        <EditFastagModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          vehicleReg={modalVehicleTarget}
        />
      )}
    </div>
  );
};
