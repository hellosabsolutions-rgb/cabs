import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddExpenseModal } from './AddExpenseModal';
import { FuelLogsView } from './FuelLogsView';
import { FastagExpensesView } from './FastagExpensesView';
import { Fuel, CreditCard, IndianRupee } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    searchQuery,
    expenseSubTab,
    setExpenseSubTab,
    fuelLogs,
    fastagTransactions,
    isLoading
  } = useFleet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = expenses.filter(e =>
    e.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.linkedTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const stats = useMemo(() => {
    let fuel = 0;
    let toll = 0;
    let driver = 0;
    let maintenance = 0;

    expenses.forEach(e => {
      if (e.category === 'Fuel') fuel += e.amount;
      else if (e.category === 'FASTag / Toll') toll += e.amount;
      else if (e.category === 'Driver') driver += e.amount;
      else if (e.category === 'Maintenance') maintenance += e.amount;
    });

    return { fuel, toll, driver, maintenance };
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="section active">
      {/* Subtab Navigation: Fuel, FASTag & All Expenses */}
      <div className="subtab-nav">
        <button
          className={`subtab-btn ${expenseSubTab === 'fastag' ? 'active' : ''}`}
          onClick={() => setExpenseSubTab('fastag')}
        >
          <CreditCard size={16} />
          FASTag & toll per vehicle
          <span className="subtab-counter">{fastagTransactions.length}</span>
        </button>

        <button
          className={`subtab-btn ${expenseSubTab === 'fuel' ? 'active' : ''}`}
          onClick={() => setExpenseSubTab('fuel')}
        >
          <Fuel size={16} />
          Fuel tracking & logs
          <span className="subtab-counter">{fuelLogs.length} logs</span>
        </button>

        <button
          className={`subtab-btn ${expenseSubTab === 'all' ? 'active' : ''}`}
          onClick={() => setExpenseSubTab('all')}
        >
          <IndianRupee size={16} />
          All fleet expenses
          <span className="subtab-counter">{expenses.length}</span>
        </button>
      </div>

      {/* Render Active View */}
      {expenseSubTab === 'fastag' && <FastagExpensesView />}
      {expenseSubTab === 'fuel' && <FuelLogsView />}
      {expenseSubTab === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="stats-grid">
            <StatCard label="Fuel" value={formatINR(stats.fuel)} customColor="#ffcc4d" />
            <StatCard label="FASTag / toll" value={formatINR(stats.toll)} customColor="#38bdf8" />
            <StatCard label="Driver" value={formatINR(stats.driver)} />
            <StatCard label="Maintenance" value={formatINR(stats.maintenance)} />
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Fleet Expense Log</span>
              <span
                className="panel-link"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setIsModalOpen(true)}
              >
                + Add expense
              </span>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Linked to</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                        No expenses found. Click "+ Add expense" to log fuel or toll.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(e => (
                      <tr key={e.id}>
                        <td>{e.date}</td>
                        <td style={{ fontWeight: 600 }}>{e.vehicle}</td>
                        <td>
                          <span
                            className="driver-type-badge"
                            style={{
                              background:
                                e.category === 'Fuel'
                                  ? 'rgba(255, 204, 77, 0.15)'
                                  : e.category === 'FASTag / Toll'
                                  ? 'rgba(56, 189, 248, 0.12)'
                                  : 'var(--surface-3)',
                              color:
                                e.category === 'Fuel'
                                  ? '#ffcc4d'
                                  : e.category === 'FASTag / Toll'
                                  ? '#38bdf8'
                                  : undefined,
                              borderColor:
                                e.category === 'Fuel'
                                  ? 'rgba(255, 204, 77, 0.3)'
                                  : e.category === 'FASTag / Toll'
                                  ? 'rgba(56, 189, 248, 0.3)'
                                  : undefined,
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            {e.category === 'Fuel' ? (
                              <Fuel size={12} style={{ marginRight: '4px' }} />
                            ) : e.category === 'FASTag / Toll' ? (
                              <CreditCard size={12} style={{ marginRight: '4px' }} />
                            ) : null}
                            {e.category}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-dim)' }}>{e.linkedTo}</td>
                        <td className="num" style={{ fontWeight: 600 }}>
                          {formatINR(e.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Expense Modal */}
          <AddExpenseModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
