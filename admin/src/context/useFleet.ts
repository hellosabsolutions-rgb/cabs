import { useContext } from 'react';
import { FleetContext, FleetContextType } from './FleetContextDef';

export const useFleet = (): FleetContextType => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
