import React from 'react';
import { VehicleStatus } from '../../types/fleet';

interface StatusChipProps {
  status: VehicleStatus | 'On duty' | 'Off duty' | 'Sent' | 'Paid' | 'Completed' | string;
  variant?: 'running' | 'idle' | 'maint';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, variant }) => {
  let computedVariant = variant;

  if (!computedVariant) {
    const s = status.toLowerCase();
    if (s.includes('running') || s.includes('active') || s.includes('on duty') || s.includes('paid') || s.includes('completed')) {
      computedVariant = 'running';
    } else if (s.includes('maint') || s.includes('service') || s.includes('repair')) {
      computedVariant = 'maint';
    } else {
      computedVariant = 'idle';
    }
  }

  return (
    <span className={`chip ${computedVariant}`}>
      {status}
    </span>
  );
};
