import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { SkeletonProfitability, SoftRefreshBar } from '../../common/Skeleton';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import { RevenueOverviewData } from '../../../types/revenue';
import { TrendingUp, Car, ArrowUpRight, Fuel, UserCheck, CreditCard, Wrench, FileText } from 'lucide-react';
import { PnLLedgerView } from './PnLLedgerView';

export const ProfitabilityView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const ledgerParam = searchParams.get('ledger') as 'bookings' | 'departments' | 'overheads' | null;
  const { vehicles, maintenanceRecords, expenses, searchQuery, isLoading, isLoadingProfitability } = useFleet();
  const [revenueData, setRevenueData] = useState<RevenueOverviewData | null>(null);
  const [isFetchingRevenue, setIsFetchingRevenue] = useState(false);

  useEffect(() => {
    const fetchRev = async () => {
      setIsFetchingRevenue(true);
      try {
        const res = await fetch('http://localhost:5001/api/revenue?dateFilter=all');
        const json = await res.json();
        if (json.success) {
          setRevenueData(json);
        }
      } catch (err) {
        console.warn('Profitability: failed to fetch live revenue data:', err);
      } finally {
        setIsFetchingRevenue(false);
      }
    };
    fetchRev();
  }, []);

  const formatINR = (val: number) => '₹' + Math.round(val || 0).toLocaleString('en-IN');

  // Business Rules from Specification:
  // Total Contribution = Trip Profit + Department Profit
  // Net Profit = Total Contribution - Common/Other Expenses (Maintenance, General, etc.)
  const metrics = useMemo(() => {
    const tripRevenue = revenueData?.summary?.tripRevenue || 0;
    const deptRevenue = revenueData?.summary?.deptRevenue || 0;

    // Direct Cost breakdown for bookings
    const tripFuel = revenueData?.trips?.reduce((acc, t) => acc + (t.fuelCost || 0), 0) || 0;
    const tripDriver = revenueData?.trips?.reduce((acc, t) => acc + (t.driverCost || 0), 0) || 0;
    const tripFastag = revenueData?.trips?.reduce((acc, t) => acc + (t.fastagCost || 0), 0) || 0;
    const tripDirectCost = tripFuel + tripDriver + tripFastag;
    const tripProfit = revenueData?.summary?.tripProfit !== undefined ? revenueData.summary.tripProfit : (tripRevenue - tripDirectCost);
    const tripMargin = tripRevenue > 0 ? Number(((tripProfit / tripRevenue) * 100).toFixed(1)) : 0;

    // Direct Cost breakdown for departments
    const deptFuel = revenueData?.departments?.reduce((acc, d) => acc + (d.fuelCost || 0), 0) || 0;
    const deptDriver = revenueData?.departments?.reduce((acc, d) => acc + (d.driverCost || 0), 0) || 0;
    const deptTolls = revenueData?.departments?.reduce((acc, d) => acc + (d.fastagCost || 0), 0) || 0;
    const deptDirectCost = deptFuel + deptDriver + deptTolls;
    const deptProfit = revenueData?.summary?.deptProfit !== undefined ? revenueData.summary.deptProfit : (deptRevenue - deptDirectCost);
    const deptMargin = deptRevenue > 0 ? Number(((deptProfit / deptRevenue) * 100).toFixed(1)) : 0;

    // Total activity contribution
    const totalContribution = tripProfit + deptProfit;
    const totalRevenue = revenueData?.summary?.totalRevenue || (tripRevenue + deptRevenue);

    // Common Overheads: Maintenance + General Expenses (Fuel/Driver are direct costs)
    const maintenanceTotal = maintenanceRecords.reduce((acc, m) => acc + (m.cost || 0), 0);
    const maintenanceFromExpenses = expenses
      .filter(e => e.category === 'Maintenance')
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const maintenanceCost = Math.max(maintenanceTotal, maintenanceFromExpenses);

    const generalCost = expenses
      .filter(e => e.category === 'General')
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    const otherOverhead = expenses
      .filter(e => e.category !== 'Maintenance' && e.category !== 'General' && e.category !== 'Fuel' && e.category !== 'Driver' && e.category !== 'FASTag / Toll')
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    const commonExpenses = maintenanceCost + generalCost + otherOverhead;

    const netProfit = totalContribution - commonExpenses;
    const netMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    return {
      tripRevenue,
      tripFuel,
      tripDriver,
      tripFastag,
      tripDirectCost,
      tripProfit,
      tripMargin,

      deptRevenue,
      deptFuel,
      deptDriver,
      deptTolls,
      deptDirectCost,
      deptProfit,
      deptMargin,

      maintenanceCost,
      generalCost,
      otherOverhead,
      commonExpenses,

      totalContribution,
      netProfit,
      netMargin,
      totalRevenue
    };
  }, [revenueData, maintenanceRecords, expenses]);

  // Merge vehicle revenue and costs from vehicleEconomics
  const vehiclePnL = useMemo(() => {
    const economicsMap = new Map();
    if (revenueData?.vehicleEconomics) {
      revenueData.vehicleEconomics.forEach(v => {
        economicsMap.set(v.vehicle.toUpperCase(), v);
      });
    }

    return vehicles
      .filter(v =>
        v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(v => {
        const econ = economicsMap.get(v.registrationNumber.toUpperCase());
        const rev = econ ? econ.revenue : (v.revenue || 0);
        const directCost = econ ? econ.directCost : (v.expense || 0);
        const profit = econ ? econ.profit : (rev - directCost);
        const margin = rev > 0 ? Number(((profit / rev) * 100).toFixed(1)) : 0;

        return {
          id: v.id,
          registrationNumber: v.registrationNumber,
          model: v.model || v.type,
          type: v.type,
          revenue: rev,
          directCost,
          profit,
          margin,
          tripCount: econ?.tripCount || 0,
          deptCount: econ?.deptCount || 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [vehicles, revenueData, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedVehicles
  } = usePagination(vehiclePnL, 10);

  if (isLoadingProfitability && vehicles.length === 0) {
    return (
      <div className="section active module-page">
        <SkeletonProfitability />
      </div>
    );
  }

  // Full Page P&L Details Ledger View when a card is clicked or query param is set
  if (ledgerParam && ['bookings', 'departments', 'overheads'].includes(ledgerParam)) {
    return (
      <div className="section active module-page">
        <SoftRefreshBar visible={isFetchingRevenue && vehicles.length > 0} label="Calculating live profitability…" />
        <PnLLedgerView
          ledgerType={ledgerParam}
          onBack={() => setSearchParams({})}
          onChangeLedgerType={(type) => setSearchParams({ ledger: type })}
          revenueData={revenueData}
          maintenanceRecords={maintenanceRecords}
          expenses={expenses}
          metrics={metrics}
        />
      </div>
    );
  }

  return (
    <div className="section active module-page">
      <SoftRefreshBar visible={isFetchingRevenue && vehicles.length > 0} label="Calculating live profitability…" />

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
          Business Profitability & P&L
        </h2>
        <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--text-faint)' }}>
          Final Net Profit = Activity Contribution (Booking + Department Profit) − Common Overhead Expenses
        </p>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          label="Booking Direct Profit"
          value={formatINR(metrics.tripProfit)}
          customColor="#38bdf8"
        />
        <StatCard
          label="Department Direct Profit"
          value={formatINR(metrics.deptProfit)}
          customColor="#22c55e"
        />
        <StatCard
          label="Total Activity Contribution"
          value={formatINR(metrics.totalContribution)}
          customColor="var(--accent)"
        />
        <StatCard
          label="Common Overhead (Maintenance/Salaries)"
          value={formatINR(metrics.commonExpenses)}
          customColor="#f59e0b"
        />
        <StatCard
          label={`Final Net Profit (${metrics.netMargin}% margin)`}
          value={formatINR(metrics.netProfit)}
          customColor={metrics.netProfit >= 0 ? '#22c55e' : '#ef4444'}
        />
      </div>

      {/* P&L Statement Flow Card (Specification Section 14 & 17) */}
      <div
        className="panel"
        style={{
          padding: '20px',
          margin: 0,
          background: 'var(--surface-1)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="panel-head" style={{ marginBottom: '16px' }}>
          <span className="panel-title">Master P&L Contribution Statement</span>
          <span style={{ fontSize: '12.5px', color: 'var(--text-faint)' }}>
            Direct earnings linked to vehicles/duties • Overheads handled separately
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {/* Booking Direct Economics */}
          <div
            onClick={() => setSearchParams({ ledger: 'bookings' })}
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            title="Click to open full page Bookings Details Ledger"
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>1. Booking Revenue & Direct Costs</span>
                  <ArrowUpRight size={13} style={{ opacity: 0.8 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                    {metrics.tripMargin}% Margin
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'var(--surface-1)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    Full Ledger ↗
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-faint)' }}>Booking Revenue</span>
                  <strong style={{ color: 'var(--text)' }}>{formatINR(metrics.tripRevenue)}</strong>
                </div>

                {/* Direct Costs Breakdown (Line by Line) */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    margin: '2px 0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '12px' }}>
                    <span>− Fuel Cost</span>
                    <span style={{ fontWeight: 600 }}>− {formatINR(metrics.tripFuel)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '12px' }}>
                    <span>− Driver Bata</span>
                    <span style={{ fontWeight: 600 }}>− {formatINR(metrics.tripDriver)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '12px' }}>
                    <span>− FASTag / Tolls</span>
                    <span style={{ fontWeight: 600 }}>− {formatINR(metrics.tripFastag)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-faint)' }}>
                  <span>Total Direct Costs</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>− {formatINR(metrics.tripDirectCost)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)', marginTop: '12px', fontWeight: 700 }}>
              <span style={{ fontSize: '13px' }}>Booking Direct Profit</span>
              <span style={{ fontSize: '16px', color: metrics.tripProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                {formatINR(metrics.tripProfit)}
              </span>
            </div>
          </div>

          {/* Department Direct Economics */}
          <div
            onClick={() => setSearchParams({ ledger: 'departments' })}
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            title="Click to open full page Department Contracts Details Ledger"
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>2. Department Revenue & Direct Costs</span>
                  <ArrowUpRight size={13} style={{ opacity: 0.8 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
                    {metrics.deptMargin}% Margin
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'var(--surface-1)',
                      color: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    Full Ledger ↗
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-faint)' }}>Department Invoiced</span>
                  <strong style={{ color: 'var(--text)' }}>{formatINR(metrics.deptRevenue)}</strong>
                </div>

                {/* Direct Costs Breakdown (Line by Line) */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    margin: '2px 0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '12px' }}>
                    <span>− Fuel Cost</span>
                    <span style={{ fontWeight: 600 }}>− {formatINR(metrics.deptFuel)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '12px' }}>
                    <span>− Driver Allowance</span>
                    <span style={{ fontWeight: 600 }}>− {formatINR(metrics.deptDriver)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '12px' }}>
                    <span>− Tolls & Parking</span>
                    <span style={{ fontWeight: 600 }}>− {formatINR(metrics.deptTolls)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-faint)' }}>
                  <span>Total Direct Costs</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>− {formatINR(metrics.deptDirectCost)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)', marginTop: '12px', fontWeight: 700 }}>
              <span style={{ fontSize: '13px' }}>Department Direct Profit</span>
              <span style={{ fontSize: '16px', color: metrics.deptProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                {formatINR(metrics.deptProfit)}
              </span>
            </div>
          </div>

          {/* Master Net Business Profit Calculation */}
          <div
            onClick={() => setSearchParams({ ledger: 'overheads' })}
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(34, 197, 94, 0.08) 100%)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            title="Click to open full page Common Overhead Expenses Ledger"
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>3. Business Net Profit Formula</span>
                  <ArrowUpRight size={13} style={{ opacity: 0.8 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--surface-1)', color: 'var(--accent)' }}>
                    {metrics.netMargin}% Net Margin
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'var(--surface-1)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    Full Ledger ↗
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-faint)' }}>Total Activity Contribution</span>
                  <strong style={{ color: 'var(--text)' }}>{formatINR(metrics.totalContribution)}</strong>
                </div>

                {/* Common Overhead Breakdown (Line by Line) */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    margin: '2px 0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontSize: '12px' }}>
                    <span>− Fleet Maintenance</span>
                    <span style={{ fontWeight: 600 }}>− {formatINR(metrics.maintenanceCost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontSize: '12px' }}>
                    <span>− General & Admin Overheads</span>
                    <span style={{ fontWeight: 600 }}>− {formatINR(metrics.generalCost + metrics.otherOverhead)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-faint)' }}>
                  <span>Total Common Overhead</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>− {formatINR(metrics.commonExpenses)}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingTop: '10px',
                borderTop: '1px solid var(--border)',
                marginTop: '12px'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Final Net Profit</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: metrics.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                {formatINR(metrics.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle-wise Profit and Loss Table */}
      <div className="panel" style={{ margin: 0 }}>
        <div className="panel-head">
          <span className="panel-title">Vehicle-wise Profit and Loss</span>
          <span className="panel-link">{totalItems} vehicles</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Model / Type</th>
                <th>Operations</th>
                <th>Gross Revenue</th>
                <th>Direct Cost</th>
                <th>Direct Profit</th>
                <th>Profit Margin</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '28px 0' }}>
                    No vehicle records found.
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700 }}>{v.registrationNumber}</td>
                    <td>
                      <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`}>
                        {v.model}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                      {v.tripCount} bookings • {v.deptCount} contracts
                    </td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      {formatINR(v.revenue)}
                    </td>
                    <td className="num" style={{ color: 'var(--text-faint)' }}>
                      {formatINR(v.directCost)}
                    </td>
                    <td className={`num ${v.profit >= 0 ? 'profit-pos' : ''}`} style={{ fontWeight: 700, color: v.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                      {formatINR(v.profit)}
                    </td>
                    <td className="num" style={{ fontWeight: 600, color: v.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                      {v.margin}%
                    </td>
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
