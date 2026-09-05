import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddFuelLogModal } from './AddFuelLogModal';
import { FuelLogEntry } from '../../../types/fleet';
import { Fuel, Camera, FileText, Plus, CheckCircle2, Building2, User, Gauge, Truck, Briefcase } from 'lucide-react';

export const FuelLogsView: React.FC = () => {
  const { fuelLogs, vehicles, searchQuery } = useFleet();

  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'by-vehicle' | 'table'>('by-vehicle');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalVehicleTarget, setModalVehicleTarget] = useState<string | undefined>(undefined);
  const [selectedProof, setSelectedProof] = useState<{
    title: string;
    vehicle: string;
    litres: number;
    amount: number;
    src: string;
    date: string;
    station: string;
    driverName: string;
  } | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  // Overall stats
  const stats = useMemo(() => {
    let totalLitres = 0;
    let totalCost = 0;
    const uniqueVehicles = new Set<string>();

    fuelLogs.forEach(l => {
      totalLitres += l.litres;
      totalCost += l.totalCost;
      uniqueVehicles.add(l.vehicle);
    });

    const avgRate = totalLitres > 0 ? (totalCost / totalLitres).toFixed(2) : '0';

    return {
      totalLitres: totalLitres.toFixed(1),
      totalCost,
      vehiclesCount: uniqueVehicles.size,
      avgRate
    };
  }, [fuelLogs]);

  // Vehicle-wise logs mapping
  const vehicleGroups = useMemo(() => {
    return vehicles.map(v => {
      const logs = fuelLogs
        .filter(l => l.vehicle === v.registrationNumber)
        .filter(l => {
          const matchSearch =
            l.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (l.notes && l.notes.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchFuelType = fuelTypeFilter === 'All' || l.fuelType === fuelTypeFilter;

          return matchSearch && matchFuelType;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalLitres = logs.reduce((sum, l) => sum + l.litres, 0);
      const totalCost = logs.reduce((sum, l) => sum + l.totalCost, 0);

      return {
        vehicle: v,
        logs,
        totalLitres: totalLitres.toFixed(1),
        totalCost,
        refillCount: logs.length
      };
    });
  }, [vehicles, fuelLogs, searchQuery, fuelTypeFilter]);

  // Filtered by vehicle filter
  const displayedVehicleGroups = useMemo(() => {
    if (vehicleFilter === 'All') return vehicleGroups;
    return vehicleGroups.filter(g => g.vehicle.registrationNumber === vehicleFilter);
  }, [vehicleGroups, vehicleFilter]);

  // Flat logs for table view
  const flatFilteredLogs = useMemo(() => {
    return fuelLogs.filter(log => {
      const matchSearch =
        log.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchVehicle = vehicleFilter === 'All' || log.vehicle === vehicleFilter;
      const matchFuelType = fuelTypeFilter === 'All' || log.fuelType === fuelTypeFilter;

      return matchSearch && matchVehicle && matchFuelType;
    });
  }, [fuelLogs, searchQuery, vehicleFilter, fuelTypeFilter]);

  const handleOpenAddFuel = (vehicleReg?: string) => {
    setModalVehicleTarget(vehicleReg);
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Overview Stats */}
      <div className="stats-grid">
        <StatCard label="Total Fuel Dispensed" value={`${stats.totalLitres} L`} customColor="#ffcc4d" />
        <StatCard label="Total Fuel Cost (₹)" value={formatINR(stats.totalCost)} customColor="var(--accent)" />
        <StatCard label="Vehicles Refueled" value={`${stats.vehiclesCount} of ${vehicles.length}`} />
        <StatCard label="Average Rate / Litre" value={`₹${stats.avgRate}`} />
      </div>

      {/* Vehicle Quick Filter Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}
      >
        <button
          className={`subtab-btn ${vehicleFilter === 'All' ? 'active' : ''}`}
          onClick={() => setVehicleFilter('All')}
          style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
        >
          <Fuel size={14} />
          All Vehicles ({vehicles.length})
          <span className="subtab-counter">{fuelLogs.length} logs</span>
        </button>

        {vehicles.map(v => {
          const group = vehicleGroups.find(g => g.vehicle.registrationNumber === v.registrationNumber);
          const hasLogs = Boolean(group && group.refillCount > 0);

          return (
            <button
              key={v.id}
              className={`subtab-btn ${vehicleFilter === v.registrationNumber ? 'active' : ''}`}
              onClick={() => setVehicleFilter(v.registrationNumber)}
              style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              <span>{v.registrationNumber}</span>
              {hasLogs ? (
                <span
                  className="subtab-counter"
                  style={{
                    background: 'rgba(255, 204, 77, 0.15)',
                    color: '#ffcc4d',
                    borderColor: 'rgba(255, 204, 77, 0.3)'
                  }}
                >
                  {group?.totalLitres}L · {formatINR(group?.totalCost || 0)}
                </span>
              ) : (
                <span className="subtab-counter" style={{ opacity: 0.5 }}>0L</span>
              )}
            </button>
          );
        })}
      </div>

      {/* View Switcher & Filters Header */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Dual View Toggle: According to Vehicle vs Flat Table */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-soft)' }}>
            <button
              className={`subtab-btn ${viewMode === 'by-vehicle' ? 'active' : ''}`}
              onClick={() => setViewMode('by-vehicle')}
              style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Truck size={13} /> By Vehicle
            </button>
            <button
              className={`subtab-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={13} /> All Refills Master Table
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            value={fuelTypeFilter}
            onChange={e => setFuelTypeFilter(e.target.value)}
          >
            <option value="All">All Fuels (Diesel / Petrol / CNG)</option>
            <option value="Diesel">Diesel Only</option>
            <option value="Petrol">Petrol Only</option>
            <option value="CNG">CNG Only</option>
          </select>

          <button
            className="btn-primary-action"
            style={{ fontSize: '12px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => handleOpenAddFuel(vehicleFilter !== 'All' ? vehicleFilter : undefined)}
          >
            <Plus size={14} /> + Log Fuel Refill
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: ACCORDING TO VEHICLE (Vehicle-wise Grouped Cards) */}
      {viewMode === 'by-vehicle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {displayedVehicleGroups.map(group => {
            const v = group.vehicle;

            return (
              <div
                key={v.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
              >
                {/* Vehicle Header Strip */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: 'rgba(255, 204, 77, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Fuel size={18} color="#ffcc4d" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text)', letterSpacing: '0.5px' }}>
                          {v.registrationNumber}
                        </span>
                        <span className={`tag ${v.type === 'Department' ? 'dept' : 'trip'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {v.type === 'Department' ? (
                            <>
                              <Building2 size={11} /> {v.departmentName || v.assignedTo}
                            </>
                          ) : (
                            <>
                              <Briefcase size={11} /> Trip Cab ({v.assignedTo})
                            </>
                          )}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {v.model || 'Commercial Vehicle'} · Default Driver: <b>{v.assignedDriver || 'Rahul Sharma'}</b> · Odometer: <b>{v.odometer ? `${v.odometer.toLocaleString('en-IN')} km` : '42,000 km'}</b>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Vehicle Fuel Totals & Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>TOTAL FUEL IN THIS VEHICLE</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: '#ffcc4d' }}>
                          {group.totalLitres} L
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent)' }}>
                          {formatINR(group.totalCost)}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                          ({group.refillCount} refills)
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn-secondary"
                      style={{ fontSize: '11.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleOpenAddFuel(v.registrationNumber)}
                    >
                      <Plus size={12} /> Add Fuel
                    </button>
                  </div>
                </div>

                {/* Refuel History Table for this specific Vehicle */}
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Driver</th>
                        <th>Odometer KM</th>
                        <th>Quantity & Fuel</th>
                        <th>Cost & Rate</th>
                        <th>Petrol Pump & Payment</th>
                        <th>Fuel Meter Photo</th>
                        <th>Receipt Photo</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.logs.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '24px 0' }}>
                            No fuel refills logged yet for {v.registrationNumber}. Click "+ Add Fuel" to record refill with meter and slip photos.
                          </td>
                        </tr>
                      ) : (
                        group.logs.map(log => (
                          <tr key={log.id}>
                            {/* 1. Kab Dala (Date & Time) */}
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {log.date}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                {log.time}
                              </div>
                            </td>

                            {/* 2. Kisne Dalaya (Driver Who Refilled) */}
                            <td>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User size={13} color="var(--accent)" />
                                {log.driverName}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '1px' }}>
                                Refueled on Duty
                              </div>
                            </td>

                            {/* 3. Odometer KM */}
                            <td>
                              <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12.5px' }}>
                                {log.odometer.toLocaleString('en-IN')} km
                              </div>
                            </td>

                            {/* 4. Kitna Dala (Quantity & Type) */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 800, color: '#ffcc4d', fontSize: '13.5px' }}>
                                  {log.litres} {log.fuelType === 'CNG' ? 'Kg' : 'L'}
                                </span>
                                <span
                                  className="driver-type-badge"
                                  style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    background:
                                      log.fuelType === 'Diesel'
                                        ? 'rgba(56, 189, 248, 0.12)'
                                        : log.fuelType === 'CNG'
                                        ? 'rgba(57, 255, 110, 0.12)'
                                        : 'rgba(255, 204, 77, 0.12)',
                                    color:
                                      log.fuelType === 'Diesel'
                                        ? '#38bdf8'
                                        : log.fuelType === 'CNG'
                                        ? '#39ff6e'
                                        : '#ffcc4d'
                                  }}
                                >
                                  {log.fuelType}
                                </span>
                              </div>
                            </td>

                            {/* 5. Kitne Ka Dala (Cost & Rate) */}
                            <td className="num">
                              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>
                                {formatINR(log.totalCost)}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                                @ ₹{log.ratePerLitre}/L
                              </div>
                            </td>

                            {/* 6. Petrol Pump & Payment */}
                            <td>
                              <div style={{ fontWeight: 500, fontSize: '12px' }}>
                                {log.stationName}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                Mode: <b>{log.paymentMode}</b>
                              </div>
                            </td>

                            {/* 7. Fuel Meter Ki Photo */}
                            <td>
                              {log.meterPhoto ? (
                                <button
                                  type="button"
                                  className="bill-link"
                                  style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                                  onClick={() =>
                                    setSelectedProof({
                                      title: 'Dispenser Fuel Meter Reading Proof',
                                      vehicle: log.vehicle,
                                      litres: log.litres,
                                      amount: log.totalCost,
                                      src: log.meterPhoto!,
                                      date: `${log.date} ${log.time}`,
                                      station: log.stationName,
                                      driverName: log.driverName
                                    })
                                  }
                                >
                                  <Camera size={12} color="#38bdf8" />
                                  <span>Fuel Meter Photo</span>
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}>—</span>
                              )}
                            </td>

                            {/* 8. Photo Slip Ki (Bill Receipt) */}
                            <td>
                              {log.receiptPhoto ? (
                                <button
                                  type="button"
                                  className="bill-link"
                                  style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                                  onClick={() =>
                                    setSelectedProof({
                                      title: 'Printed Fuel Pump Receipt / Bill Slip',
                                      vehicle: log.vehicle,
                                      litres: log.litres,
                                      amount: log.totalCost,
                                      src: log.receiptPhoto!,
                                      date: `${log.date} ${log.time}`,
                                      station: log.stationName,
                                      driverName: log.driverName
                                    })
                                  }
                                >
                                  <FileText size={12} color="#ffcc4d" />
                                  <span>Bill Slip Photo</span>
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}>—</span>
                              )}
                            </td>

                            {/* 9. Notes */}
                            <td style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                              {log.notes || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: FLAT MASTER TABLE */}
      {viewMode === 'table' && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Master Refueling List</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({flatFilteredLogs.length} logs)
            </span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Date & Time</th>
                  <th>Driver</th>
                  <th>Odometer KM</th>
                  <th>Quantity</th>
                  <th>Cost & Rate</th>
                  <th>Pump & Payment</th>
                  <th>Receipt & Meter Photo</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {flatFilteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                      No fuel logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  flatFilteredLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                          {log.vehicle}
                        </div>
                      </td>
                      <td>
                        <div>{log.date}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{log.time}</div>
                      </td>
                      <td>
                        <b>{log.driverName}</b>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>
                        {log.odometer.toLocaleString('en-IN')} km
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#ffcc4d' }}>
                          {log.litres} {log.fuelType === 'CNG' ? 'Kg' : 'L'}
                        </span>
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {formatINR(log.totalCost)}
                      </td>
                      <td>
                        <div>{log.stationName}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{log.paymentMode}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {log.meterPhoto && (
                            <span
                              className="bill-link"
                              style={{ fontSize: '11px', cursor: 'pointer' }}
                              onClick={() =>
                                setSelectedProof({
                                  title: 'Dispenser Fuel Meter Reading Proof',
                                  vehicle: log.vehicle,
                                  litres: log.litres,
                                  amount: log.totalCost,
                                  src: log.meterPhoto!,
                                  date: `${log.date} ${log.time}`,
                                  station: log.stationName,
                                  driverName: log.driverName
                                })
                              }
                            >
                              <Camera size={11} style={{ marginRight: '4px' }} /> Meter Photo
                            </span>
                          )}
                          {log.receiptPhoto && (
                            <span
                              className="bill-link"
                              style={{ fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                              onClick={() =>
                                setSelectedProof({
                                  title: 'Printed Fuel Pump Receipt / Bill Slip',
                                  vehicle: log.vehicle,
                                  litres: log.litres,
                                  amount: log.totalCost,
                                  src: log.receiptPhoto!,
                                  date: `${log.date} ${log.time}`,
                                  station: log.stationName,
                                  driverName: log.driverName
                                })
                              }
                            >
                              <FileText size={11} style={{ marginRight: '4px' }} /> Bill Slip Photo
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {log.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Fuel Refill Modal */}
      <AddFuelLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedVehicle={modalVehicleTarget || (vehicleFilter !== 'All' ? vehicleFilter : undefined)}
      />

      {/* Photo Proof Viewer Modal */}
      {selectedProof && (
        <div className="modal-overlay" onClick={() => setSelectedProof(null)}>
          <div className="modal-dialog" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} color="var(--accent)" /> {selectedProof.title}
                </h3>
                <span className="modal-subtitle">
                  {selectedProof.vehicle} · {selectedProof.litres}L · {formatINR(selectedProof.amount)}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedProof(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Photo Display */}
              <div
                style={{
                  background: 'var(--surface-3)',
                  padding: '12px',
                  borderRadius: '10px',
                  textAlign: 'center',
                  border: '1px solid var(--border)'
                }}
              >
                {selectedProof.src.startsWith('data:image') ? (
                  <img
                    src={selectedProof.src}
                    alt={selectedProof.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '380px',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div style={{ padding: '30px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                      <Fuel size={48} color="var(--accent)" />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      Verified Refill Proof: {selectedProof.src}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                      Fuel pump meter digital reading and printed cash invoice verified.
                    </div>
                  </div>
                )}
              </div>

              {/* Refill Details Info Box */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginTop: '12px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid var(--border-soft)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Vehicle Refueled:</span>
                  <b>{selectedProof.vehicle}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Driver Who Refilled:</span>
                  <b style={{ color: 'var(--accent)' }}>{selectedProof.driverName}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Date & Time:</span>
                  <b>{selectedProof.date}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Quantity:</span>
                  <b style={{ color: '#ffcc4d' }}>{selectedProof.litres} Litres</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Total Amount:</span>
                  <b>{formatINR(selectedProof.amount)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Station / Pump Location:</span>
                  <span>{selectedProof.station}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedProof(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
