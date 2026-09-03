import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { ContractsListView } from './ContractsListView';
import { DailyDutyLogsView } from './DailyDutyLogsView';
import { MonthlyBillingView } from './MonthlyBillingView';
import { DepartmentPaymentsView } from './DepartmentPaymentsView';
import { FileText, ClipboardList, ReceiptText, CreditCard } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const DepartmentsView: React.FC = () => {
  const {
    departmentSubTab,
    setDepartmentSubTab,
    departmentContracts,
    dailyDutyLogs,
    monthlyBills,
    departmentPayments,
    isLoading
  } = useFleet();

  const totalMonthlyBilled = monthlyBills.reduce((acc, curr) => acc + curr.totalBill, 0);

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="section active">
      {/* Department Sub-Tabs Navigation */}
      <div className="subtab-nav">
        <button
          className={`subtab-btn ${departmentSubTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setDepartmentSubTab('contracts')}
        >
          <FileText size={16} />
          Contracts
          <span className="subtab-counter">{departmentContracts.length}</span>
        </button>

        <button
          className={`subtab-btn ${departmentSubTab === 'duty-logs' ? 'active' : ''}`}
          onClick={() => setDepartmentSubTab('duty-logs')}
        >
          <ClipboardList size={16} />
          Daily duty logs
          <span className="subtab-counter">{dailyDutyLogs.length} slips</span>
        </button>

        <button
          className={`subtab-btn ${departmentSubTab === 'billing' ? 'active' : ''}`}
          onClick={() => setDepartmentSubTab('billing')}
        >
          <ReceiptText size={16} />
          Monthly billing
          <span className="subtab-counter">
            ₹{totalMonthlyBilled.toLocaleString('en-IN')}
          </span>
        </button>

        <button
          className={`subtab-btn ${departmentSubTab === 'payments' ? 'active' : ''}`}
          onClick={() => setDepartmentSubTab('payments')}
        >
          <CreditCard size={16} />
          Payments
          <span className="subtab-counter">{departmentPayments.length}</span>
        </button>
      </div>

      {/* Render Active Department View */}
      {departmentSubTab === 'contracts' && <ContractsListView />}
      {departmentSubTab === 'duty-logs' && <DailyDutyLogsView />}
      {departmentSubTab === 'billing' && <MonthlyBillingView />}
      {departmentSubTab === 'payments' && <DepartmentPaymentsView />}
    </div>
  );
};
