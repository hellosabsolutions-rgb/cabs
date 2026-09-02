import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { AllVehiclesView } from './AllVehiclesView';
import { DepartmentVehiclesView } from './DepartmentVehiclesView';
import { TripVehiclesView } from './TripVehiclesView';
import { LiveTrackingView } from './LiveTrackingView';
import { Truck, Building2, Briefcase, Radio } from 'lucide-react';

export const VehiclesView: React.FC = () => {
  const { vehicleSubTab, setVehicleSubTab, vehicles } = useFleet();

  const deptCount = vehicles.filter(v => v.type === 'Department').length;
  const tripCount = vehicles.filter(v => v.type === 'Trip-based').length;

  return (
    <div className="section active">
      {/* Vehicles Sub-Tabs Navigation */}
      <div className="subtab-nav">
        <button
          className={`subtab-btn ${vehicleSubTab === 'all' ? 'active' : ''}`}
          onClick={() => setVehicleSubTab('all')}
        >
          <Truck size={16} />
          All vehicles
          <span className="subtab-counter">{vehicles.length}</span>
        </button>

        <button
          className={`subtab-btn ${vehicleSubTab === 'department' ? 'active' : ''}`}
          onClick={() => setVehicleSubTab('department')}
        >
          <Building2 size={16} />
          Department vehicles
          <span className="subtab-counter">{deptCount}</span>
        </button>

        <button
          className={`subtab-btn ${vehicleSubTab === 'trip' ? 'active' : ''}`}
          onClick={() => setVehicleSubTab('trip')}
        >
          <Briefcase size={16} />
          Trip vehicles
          <span className="subtab-counter">{tripCount}</span>
        </button>

        <button
          className={`subtab-btn ${vehicleSubTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setVehicleSubTab('tracking')}
        >
          <Radio size={16} color="#39ff6e" />
          Live tracking
          <span
            className="subtab-counter"
            style={{
              background: 'rgba(57, 255, 110, 0.15)',
              color: '#39ff6e',
              borderColor: 'rgba(57, 255, 110, 0.3)'
            }}
          >
            ● LIVE
          </span>
        </button>
      </div>

      {/* Render Active View */}
      {vehicleSubTab === 'all' && <AllVehiclesView />}
      {vehicleSubTab === 'department' && <DepartmentVehiclesView />}
      {vehicleSubTab === 'trip' && <TripVehiclesView />}
      {vehicleSubTab === 'tracking' && <LiveTrackingView />}
    </div>
  );
};
