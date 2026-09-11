import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

/** Primitive shimmer block — building unit for all loaders */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  style,
  className = ''
}) => {
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style
      }}
    />
  );
};

/** Stat cards row (dashboard / list headers) */
export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <Skeleton width="45%" height={12} />
          <Skeleton width="75%" height={26} style={{ marginTop: '6px' }} />
          <Skeleton width="55%" height={11} style={{ marginTop: '4px' }} />
        </div>
      ))}
    </div>
  );
};

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

/** Panel + table rows */
export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}
      >
        <Skeleton width="180px" height={16} />
        <Skeleton width="100px" height={32} borderRadius={8} />
      </div>
      <div style={{ padding: '8px 0' }}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, cIdx) => {
              const widths = ['22%', '16%', '14%', '14%', '12%', '12%', '10%'];
              const width = widths[cIdx % widths.length];
              return (
                <div key={cIdx} style={{ width, padding: '0 6px' }}>
                  <Skeleton height={14} width="90%" />
                  {cIdx === 0 && <Skeleton height={10} width="55%" style={{ marginTop: '5px' }} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Card / roster grid */
export const SkeletonList: React.FC<{ count?: number; columns?: number }> = ({
  count = 6,
  columns = 3
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: 14
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Skeleton width={44} height={44} borderRadius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton width="70%" height={14} />
              <Skeleton width="45%" height={11} style={{ marginTop: 6 }} />
            </div>
          </div>
          <Skeleton width="100%" height={10} style={{ marginTop: 14 }} />
          <Skeleton width="60%" height={10} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
};

/** Driver card grid skeleton — matches DriverCard layout */
export const SkeletonDriverCard: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="skeleton-driver-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Skeleton width={52} height={52} borderRadius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton width="65%" height={14} />
              <Skeleton width="45%" height={11} style={{ marginTop: 6 }} />
              <Skeleton width="35%" height={10} style={{ marginTop: 4 }} borderRadius={20} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton width="48%" height={28} borderRadius={6} />
            <Skeleton width="48%" height={28} borderRadius={6} />
          </div>
        </div>
      ))}
    </div>
  );
};

/** Full dashboard skeleton — mirrors exact dashboard layout */
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="page-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* KPI stat cards */}
      <SkeletonCard count={4} />

      {/* 2-column charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        {/* Revenue vs Expense bar chart panel */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Skeleton width="170px" height={15} />
              <Skeleton width="240px" height={11} style={{ marginTop: 5 }} />
            </div>
            <Skeleton width="60px" height={14} />
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
              {[68, 45, 80, 55, 90, 72].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%', height: 100 }}>
                    <Skeleton width="47%" height={`${h}%`} style={{ minHeight: 8 }} borderRadius={3} />
                    <Skeleton width="47%" height={`${Math.round(h * 0.65)}%`} style={{ minHeight: 8 }} borderRadius={3} />
                  </div>
                  <Skeleton width="80%" height={9} borderRadius={4} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense mix donut panel */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Skeleton width="120px" height={15} />
              <Skeleton width="200px" height={11} style={{ marginTop: 5 }} />
            </div>
            <Skeleton width="80px" height={14} />
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <Skeleton width={130} height={130} borderRadius="50%" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[80, 65, 50, 45].map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Skeleton width={`${w}%`} height={12} />
                  <Skeleton width="22%" height={12} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle status + Ops snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Live vehicle status */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="160px" height={15} />
            <Skeleton width="90px" height={14} />
          </div>
          <div style={{ padding: '10px 0' }}>
            <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px' }}>
              <Skeleton width={90} height={26} borderRadius={20} />
              <Skeleton width={70} height={26} borderRadius={20} />
              <Skeleton width={85} height={26} borderRadius={20} />
            </div>
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="skeleton-table-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Skeleton width={10} height={10} borderRadius="50%" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="55%" height={13} />
                    <Skeleton width="70%" height={10} style={{ marginTop: 4 }} />
                  </div>
                </div>
                <Skeleton width={64} height={22} borderRadius={20} />
              </div>
            ))}
          </div>
        </div>

        {/* Operations snapshot */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="170px" height={15} />
            <Skeleton width="100px" height={14} />
          </div>
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, border: '1px solid var(--border-soft)' }}>
                <Skeleton width={28} height={28} borderRadius={8} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="40%" height={18} />
                  <Skeleton width="70%" height={10} style={{ marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle profit ranking table */}
      <SkeletonTable rows={6} columns={8} />
    </div>
  );
};

/** Compliance page skeleton — two-column doc tables */
export const SkeletonCompliance: React.FC = () => {
  return (
    <div className="page-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SkeletonCard count={4} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SkeletonTable rows={6} columns={5} />
        <SkeletonTable rows={6} columns={5} />
      </div>
    </div>
  );
};

/** Maintenance page skeleton */
export const SkeletonMaintenance: React.FC = () => {
  return (
    <div className="page-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SkeletonCard count={3} />
      <SkeletonTable rows={7} columns={6} />
    </div>
  );
};

/** Profitability page skeleton — table + mini chart */
export const SkeletonProfitability: React.FC = () => {
  return (
    <div className="page-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SkeletonCard count={4} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
        <SkeletonTable rows={8} columns={7} />
        <div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton width="50%" height={15} />
          <Skeleton width="100%" height={140} borderRadius={10} />
          {[80, 65, 50, 45, 35].map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Skeleton width={`${w}%`} height={12} />
              <Skeleton width="18%" height={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export type PageSkeletonVariant = 'table' | 'cards' | 'dashboard' | 'mixed' | 'compliance' | 'maintenance' | 'profitability';

interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
  cards?: number;
  rows?: number;
  columns?: number;
  listCount?: number;
  listColumns?: number;
  className?: string;
}

/**
 * Full-page placeholder used while a tab loads its first batch of data.
 * Reuse across every module for a consistent loading experience.
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  variant = 'mixed',
  cards = 4,
  rows = 6,
  columns = 6,
  listCount = 6,
  listColumns = 3,
  className = ''
}) => {
  if (variant === 'dashboard') return <SkeletonDashboard />;
  if (variant === 'compliance') return <SkeletonCompliance />;
  if (variant === 'maintenance') return <SkeletonMaintenance />;
  if (variant === 'profitability') return <SkeletonProfitability />;

  return (
    <div className={`page-skeleton ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {(variant === 'mixed' || variant === 'cards') && (
        <SkeletonCard count={cards} />
      )}
      {(variant === 'mixed' || variant === 'table') && (
        <SkeletonTable rows={rows} columns={columns} />
      )}
      {variant === 'cards' && <SkeletonList count={listCount} columns={listColumns} />}
    </div>
  );
};

/** Subtle top bar while refreshing with existing data still visible */
export const SoftRefreshBar: React.FC<{ visible?: boolean; label?: string }> = ({
  visible = false,
  label = 'Syncing latest data…'
}) => {
  if (!visible) return null;
  return (
    <div className="soft-refresh-bar" role="status" aria-live="polite">
      <span className="soft-refresh-dot" />
      <span>{label}</span>
    </div>
  );
};
