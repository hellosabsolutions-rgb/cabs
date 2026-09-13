import React, { useState } from 'react';
import { RevenueTimeSeriesPoint } from '../../../types/revenue';

interface RevenueTimeSeriesChartProps {
  data: RevenueTimeSeriesPoint[];
}

export const RevenueTimeSeriesChart: React.FC<RevenueTimeSeriesChartProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'split' | 'collection'>('split');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-faint)',
          fontSize: '13px'
        }}
      >
        No revenue data in selected time frame.
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.totalRevenue, d.receivedAmount)), 1000);
  const chartHeight = 180;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 20;

  const stepX = (chartWidth - paddingX * 2) / Math.max(1, data.length - 1);

  // Helper to map (index, value) to SVG coordinates
  const getY = (val: number) => {
    const usableH = chartHeight - paddingY * 2;
    return chartHeight - paddingY - (val / maxVal) * usableH;
  };
  const getX = (idx: number) => paddingX + idx * stepX;

  const totalPoints = data.map((d, idx) => `${getX(idx)},${getY(d.totalRevenue)}`).join(' ');
  const tripPoints = data.map((d, idx) => `${getX(idx)},${getY(d.tripRevenue)}`).join(' ');
  const deptPoints = data.map((d, idx) => `${getX(idx)},${getY(d.deptRevenue)}`).join(' ');
  const receivedPoints = data.map((d, idx) => `${getX(idx)},${getY(d.receivedAmount)}`).join(' ');

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Chart Header with Mode Toggle and Hover readout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
            {viewMode === 'split' ? 'Booking vs Department Revenue Trend' : 'Total Revenue vs Cash Collected'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
              {formatINR(activePoint.totalRevenue)}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>({activePoint.date})</span>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              background: viewMode === 'split' ? 'var(--surface-1)' : 'transparent',
              color: viewMode === 'split' ? 'var(--accent)' : 'var(--text-faint)',
              border: 'none'
            }}
          >
            Booking vs Dept
          </button>
          <button
            type="button"
            onClick={() => setViewMode('collection')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              background: viewMode === 'collection' ? 'var(--surface-1)' : 'transparent',
              color: viewMode === 'collection' ? 'var(--accent)' : 'var(--text-faint)',
              border: 'none'
            }}
          >
            Revenue vs Received
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: '200px', overflow: 'visible' }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="totalRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingY + ratio * (chartHeight - paddingY * 2);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {viewMode === 'split' ? (
            <>
              {/* Total Area */}
              <polygon
                points={`${paddingX},${chartHeight - paddingY} ${totalPoints} ${chartWidth - paddingX},${chartHeight - paddingY}`}
                fill="url(#totalRevGrad)"
              />
              {/* Trip Line (Sky Blue) */}
              <polyline
                points={tripPoints}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dept Line (Emerald Green) */}
              <polyline
                points={deptPoints}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <>
              {/* Total Revenue Area & Line */}
              <polygon
                points={`${paddingX},${chartHeight - paddingY} ${totalPoints} ${chartWidth - paddingX},${chartHeight - paddingY}`}
                fill="url(#totalRevGrad)"
              />
              <polyline
                points={totalPoints}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Received Line (Green) */}
              <polyline
                points={receivedPoints}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Hover interactive bars and points */}
          {data.map((d, idx) => {
            const x = getX(idx);
            const isHovered = hoverIndex === idx;

            return (
              <g key={idx} onMouseEnter={() => setHoverIndex(idx)} style={{ cursor: 'pointer' }}>
                <rect
                  x={x - stepX / 2}
                  y={0}
                  width={stepX}
                  height={chartHeight}
                  fill="transparent"
                />
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={chartHeight - paddingY}
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}
                <circle
                  cx={x}
                  cy={getY(d.totalRevenue)}
                  r={isHovered ? 5 : 3}
                  fill="#38bdf8"
                  stroke="var(--surface-1)"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', fontSize: '11.5px', color: 'var(--text-faint)' }}>
        {viewMode === 'split' ? (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} /> Booking Revenue
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} /> Department Revenue
            </span>
          </>
        ) : (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} /> Invoiced / Earned
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} /> Cash Collected
            </span>
          </>
        )}
      </div>
    </div>
  );
};
