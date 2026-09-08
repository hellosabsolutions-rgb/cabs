import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

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

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width="180px" height={16} />
        <Skeleton width="100px" height={16} />
      </div>
      <div style={{ padding: '8px 0' }}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, cIdx) => {
              const widths = ['25%', '18%', '15%', '14%', '12%', '16%'];
              const width = widths[cIdx % widths.length];
              return (
                <div key={cIdx} style={{ width, padding: '0 6px' }}>
                  <Skeleton height={14} width="90%" />
                  {cIdx === 0 && <Skeleton height={10} width="60%" style={{ marginTop: '5px' }} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
