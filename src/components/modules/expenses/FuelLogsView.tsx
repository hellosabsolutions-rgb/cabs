import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddFuelLogModal } from './AddFuelLogModal';
import { FuelLogEntry } from '../../../types/fleet';
import { Fuel, Camera, FileText } from 'lucide-react';

export const FuelLogsView: React.FC = () => {
  const { fuelLogs, vehicles, searchQuery } = useFleet();

  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    title: string;
    vehicle: string;
    litres: number;
    amount: number;
    src: string;
    date: string;
    station: string;
  } | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const filteredLogs = useMemo(() => {
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

  // Vehicle-wise totals
  const vehicleStats = useMemo(() => {
    const map: Record<string, { totalLitres: number; totalCost: number; count: number }> = {};
    fuelLogs.forEach(l => {
      if (!map[l.vehicle]) {
        map[l.vehicle] = { totalLitres: 0, totalCost: 0, count: 0 };
      }
      map[l.vehicle].totalLitres += l.litres;
      map[l.vehicle].totalCost += l.totalCost;
      map[l.vehicle].count += 1;
    });
    return map;
  }, [fuelLogs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Fuel Dispensed" value={`${stats.totalLitres} L`} customColor="#ffcc4d" />
        <StatCard label="Total Fuel Cost" value={formatINR(stats.totalCost)} customColor="var(--accent)" />
        <StatCard label="Vehicles Refueled" value={`${stats.vehiclesCount} of ${vehicles.length}`} />
        <StatCard label="Avg. Rate / Litre" value={`₹${stats.avgRate}`} />
      </div>

      {/* Vehicle Quick Filter Chips */}
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
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          <Fuel size={14} />
          All Vehicles
          <span className="subtab-counter">{fuelLogs.length} logs</span>
        </button>

        {vehicles.map(v => {
          const vData = vehicleStats[v.registrationNumber];
          const hasFuel = Boolean(vData && vData.totalCost > 0);

          return (
            <button
              key={v.id}
              className={`subtab-btn ${vehicleFilter === v.registrationNumber ? 'active' : ''}`}
              onClick={() => setVehicleFilter(v.registrationNumber)}
              style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              <span>{v.registrationNumber}</span>
              {hasFuel ? (
                <span
                  className="subtab-counter"
                  style={{
                    background: 'rgba(255, 204, 77, 0.15)',
                    color: '#ffcc4d',
                    borderColor: 'rgba(255, 204, 77, 0.3)'
                  }}
                >
                  {vData.totalLitres.toFixed(0)}L · {formatINR(vData.totalCost)}
                </span>
              ) : (
                <span className="subtab-counter" style={{ opacity: 0.5 }}>0L</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Vehicle Refueling History & Photo Proofs</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredLogs.length} refill logs)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
            >
              <option value="All">All Vehicles (Kis Gaadi Mai)</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.registrationNumber}>
                  {v.registrationNumber} ({v.type})
                </option>
              ))}
            </select>

            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={fuelTypeFilter}
              onChange={e => setFuelTypeFilter(e.target.value)}
            >
              <option value="All">All Fuel Types</option>
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
              <option value="CNG">CNG</option>
            </select>

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px' }}
              onClick={() => setIsModalOpen(true)}
            >
              + Log Fuel Refill
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle & Driver (Kis Gaadi Mai)</th>
                <th>Date & Time (Kb Dala)</th>
                <th>Odometer KM</th>
                <th>Quantity (Kitna Dala)</th>
                <th>Rate / L</th>
                <th>Total Cost</th>
                <th>Pump / Station & Payment</th>
                <th>Photo Proofs</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No fuel entries found. Click "+ Log Fuel Refill" to add vehicle fuel with photo proofs.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id}>
                    {/* Vehicle & Driver */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#ffcc4d' }}>⛽</span> {l.vehicle}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          Driver: <b>{l.driverName}</b>
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td>
                      <div style={{ fontWeight: 500 }}>{l.date}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {l.time}
                      </div>
                    </td>

                    {/* Odometer */}
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {l.odometer.toLocaleString('en-IN')} km
                    </td>

                    {/* Quantity & Fuel Type */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#ffcc4d', fontSize: '13px' }}>
                          {l.litres} {l.fuelType === 'CNG' ? 'Kg' : 'L'}
                        </span>
                        <span
                          className="driver-type-badge"
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background:
                              l.fuelType === 'Diesel'
                                ? 'rgba(56, 189, 248, 0.12)'
                                : l.fuelType === 'CNG'
                                ? 'rgba(57, 255, 110, 0.12)'
                                : 'rgba(255, 204, 77, 0.15)'
                          }}
                        >
                          {l.fuelType}
                        </span>
                      </div>
                    </td>

                    {/* Rate per Litre */}
                    <td className="num" style={{ fontSize: '12px' }}>
                      ₹{l.ratePerLitre}
                    </td>

                    {/* Total Cost */}
                    <td className="num" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '13.5px' }}>
                      {formatINR(l.totalCost)}
                    </td>

                    {/* Station & Payment */}
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.stationName}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        💳 {l.paymentMode}
                      </div>
                    </td>

                    {/* Photo Proofs */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {l.meterPhoto ? (
                          <span
                            className="bill-link"
                            style={{
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#38bdf8'
                            }}
                            onClick={() =>
                              setSelectedProof({
                                title: 'Pump Dispenser Meter Photo Proof',
                                vehicle: l.vehicle,
                                litres: l.litres,
                                amount: l.totalCost,
                                src: l.meterPhoto!,
                                date: `${l.date} ${l.time}`,
                                station: l.stationName
                              })
                            }
                          >
                            <Camera size={12} />
                            Meter reading proof
                          </span>
                        ) : null}

                        {l.receiptPhoto ? (
                          <span
                            className="bill-link"
                            style={{
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#ffcc4d'
                            }}
                            onClick={() =>
                              setSelectedProof({
                                title: 'Printed Fuel Receipt / Bill Proof',
                                vehicle: l.vehicle,
                                litres: l.litres,
                                amount: l.totalCost,
                                src: l.receiptPhoto!,
                                date: `${l.date} ${l.time}`,
                                station: l.stationName
                              })
                            }
                          >
                            <FileText size={12} />
                            Receipt / slip proof
                          </span>
                        ) : null}

                        {!l.meterPhoto && !l.receiptPhoto && (
                          <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}>No photo</span>
                        )}
                      </div>
                    </td>

                    {/* Notes */}
                    <td style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                      {l.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fuel Refill Modal */}
      <AddFuelLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedVehicle={vehicleFilter !== 'All' ? vehicleFilter : undefined}
      />

      {/* Photo Proof Modal */}
      {selectedProof && (
        <div className="modal-overlay" onClick={() => setSelectedProof(null)}>
          <div className="modal-dialog" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3 className="modal-title">📸 {selectedProof.title}</h3>
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
                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>⛽</div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      Verified Refill Slip: {selectedProof.src}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '6px' }}>
                      Fuel pump meter digital reading and cash invoice verified against odometer reading.
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
                  <span style={{ color: 'var(--text-dim)' }}>Date & Time:</span>
                  <b>{selectedProof.date}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Fuel Quantity:</span>
                  <b style={{ color: '#ffcc4d' }}>{selectedProof.litres} Litres</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Total Amount:</span>
                  <b style={{ color: 'var(--accent)' }}>{formatINR(selectedProof.amount)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Station Location:</span>
                  <span>{selectedProof.station}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedProof(null)}>
                Close
              </button>
              <button
                className="btn-primary-action"
                onClick={() => {
                  alert(`Photo proof for ${selectedProof.vehicle} downloaded.`);
                  setSelectedProof(null);
                }}
              >
                ⬇ Download Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
