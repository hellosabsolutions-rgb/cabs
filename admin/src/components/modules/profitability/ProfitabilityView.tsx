import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';

export const ProfitabilityView: React.FC = () => {
  const { vehicles, searchQuery, isLoading } = useFleet();

  const filtered = vehicles.filter(v =>
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedVehicles
  } = usePagination(filtered, 10);

  if (isLoading) {
    return (
      <div className="section active">
        <SkeletonCard count={4} />
        <div style={{ marginTop: '20px' }}>
          <SkeletonTable rows={5} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="section active">
      <div className="stats-grid">
        <StatCard label="Department profit" value="₹1,85,000" customColor="var(--accent)" />
        <StatCard label="Trip profit" value="₹3,30,000" customColor="var(--accent)" />
        <StatCard label="Overall profit" value="₹5,15,000" customColor="var(--accent)" />
        <StatCard label="Margin" value="46.8%" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Vehicle-wise profit and loss</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Model</th>
                <th>Revenue</th>
                <th>Expense</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '24px 0' }}>
                    No vehicle records found.
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.registrationNumber}</td>
                    <td>
                      <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`}>
                        {v.type}
                      </span>
                    </td>
                    <td className="num">₹{v.revenue.toLocaleString('en-IN')}</td>
                    <td className="num">₹{v.expense.toLocaleString('en-IN')}</td>
                    <td className="num profit-pos">₹{v.profit.toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="vehicles"
        />
      </div>
    </div>
  );
};
