import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useFleet } from '../../../context/FleetContext';
import { ContractsListView } from './ContractsListView';
import { DailyDutyLogsView } from './DailyDutyLogsView';
import { MonthlyBillingView } from './MonthlyBillingView';
import { WeekendBillingView } from './WeekendBillingView';
import { DepartmentPaymentsView } from './DepartmentPaymentsView';
import { SkeletonCard, SkeletonTable, SoftRefreshBar } from '../../common/Skeleton';

export const DepartmentsView: React.FC = () => {
  const { departmentSubTab } = useFleet();
  const location = useLocation();

  const activeTab = useMemo(() => {
    if (location.pathname.includes('/duty-logs')) return 'duty-logs';
    if (location.pathname.includes('/billing')) return 'billing';
    if (location.pathname.includes('/weekend-billing')) return 'weekend-billing';
    if (location.pathname.includes('/payments')) return 'payments';
    if (location.pathname.includes('/contracts')) return 'contracts';
    return departmentSubTab || 'duty-logs';
  }, [location.pathname, departmentSubTab]);

  return (
    <div className="section active module-page" style={{ padding: 0 }}>
      {/* Render Active Department View directly without unmounting */}
      {activeTab === 'contracts' && <ContractsListView />}
      {activeTab === 'duty-logs' && <DailyDutyLogsView />}
      {activeTab === 'billing' && <MonthlyBillingView />}
      {activeTab === 'weekend-billing' && <WeekendBillingView />}
      {activeTab === 'payments' && <DepartmentPaymentsView />}
    </div>
  );
};
