import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  isUp?: boolean;
  isDown?: boolean;
  customColor?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  isUp,
  isDown,
  customColor,
  icon
}) => {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>
      <div className="stat-value" style={customColor ? { color: customColor } : undefined}>
        {value}
      </div>
      {delta && (
        <div className={`stat-delta ${isUp ? 'up' : isDown ? 'down' : ''}`}>
          {delta}
        </div>
      )}
    </div>
  );
};
