import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { StatusChip } from '../../common/StatusChip';
import { MaintenanceType } from '../../../types/fleet';
import { Paperclip } from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

const vehicleOptions = ['DL01AB1234', 'DL02CD5678', 'DL03EF9012', 'DL07GH2211', 'DL05KL4432'];

export const MaintenanceView: React.FC = () => {
  const { maintenanceRecords, addMaintenanceRecord, searchQuery, isLoading } = useFleet();

  const [mVehicle, setMVehicle] = useState('DL01AB1234');
  const [mType, setMType] = useState<MaintenanceType>('Service');
  const [mTyreCount, setMTyreCount] = useState<string>('');
  const [mDate, setMDate] = useState<string>('');
  const [mCost, setMCost] = useState<string>('');
  const [mBillFile, setMBillFile] = useState<File | null>(null);
  const [mNotes, setMNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [summaryVehicle, setSummaryVehicle] = useState<string>('DL01AB1234');

  const filteredRecords = maintenanceRecords.filter(r =>
    r.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.dateLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick stats calculation for current month (2026-08)
  const currentMonthStats = useMemo(() => {
    const CURRENT_MONTH = '2026-08';
    const thisMonthRecords = maintenanceRecords.filter(r => r.date.startsWith(CURRENT_MONTH));
    const sums: Record<MaintenanceType, number> = { Service: 0, Repair: 0, 'Tyre Change': 0 };

    thisMonthRecords.forEach(r => {
      sums[r.type] = (sums[r.type] || 0) + r.cost;
    });

    const total = sums.Service + sums.Repair + sums['Tyre Change'];
    return {
      service: sums.Service,
      repair: sums.Repair,
      tyre: sums['Tyre Change'],
      total
    };
  }, [maintenanceRecords]);

  // Vehicle summary calculation
  const vehicleSummary = useMemo(() => {
    const records = maintenanceRecords.filter(r => r.vehicle === summaryVehicle);
    const totals: Record<MaintenanceType, number> = { Service: 0, Repair: 0, 'Tyre Change': 0 };
    records.forEach(r => {
      totals[r.type] = (totals[r.type] || 0) + r.cost;
    });
    const grand = totals.Service + totals.Repair + totals['Tyre Change'];
    return { totals, grand };
  }, [maintenanceRecords, summaryVehicle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mDate || !mCost || Number(mCost) <= 0) {
      setErrorMsg('Enter a valid date and total cost first.');
      return;
    }
    setErrorMsg('');

    const d = new Date(mDate + 'T00:00:00');
    const dateLabel = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

    addMaintenanceRecord({
      date: mDate,
      dateLabel,
      vehicle: mVehicle,
      type: mType,
      tyreCount: mType === 'Tyre Change' && mTyreCount ? Number(mTyreCount) : undefined,
      cost: Number(mCost),
      bill: mBillFile ? mBillFile.name : null,
      notes: mNotes
    });

    // Reset Form
    setMDate('');
    setMCost('');
    setMTyreCount('');
    setMBillFile(null);
    setMNotes('');
    setSummaryVehicle(mVehicle);
  };

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="section active">
      {/* Quick Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Service cost (this month)" value={formatINR(currentMonthStats.service)} />
        <StatCard label="Repair cost (this month)" value={formatINR(currentMonthStats.repair)} />
        <StatCard label="Tyre change cost (this month)" value={formatINR(currentMonthStats.tyre)} />
        <StatCard label="Total this month" value={formatINR(currentMonthStats.total)} customColor="var(--accent)" />
      </div>

      {/* Grid 2: Maintenance Records Table & Entry Form */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Maintenance list</span>
            <span className="panel-link">{maintenanceRecords.length} records</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Cost</th>
                  <th>Bill</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(m => (
                  <tr key={m.id}>
                    <td>{m.dateLabel}</td>
                    <td style={{ fontWeight: 600 }}>{m.vehicle}</td>
                    <td>
                      {m.type} {m.tyreCount ? `(${m.tyreCount} tyres)` : ''}
                    </td>
                    <td className="num">{formatINR(m.cost)}</td>
                    <td>
                      {m.bill ? (
                        <span className="bill-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Paperclip size={12} /> View
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <StatusChip status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Add maintenance entry</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Vehicle</label>
                <select
                  className="form-input"
                  value={mVehicle}
                  onChange={e => setMVehicle(e.target.value)}
                >
                  {vehicleOptions.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Maintenance type</label>
                <select
                  className="form-input"
                  value={mType}
                  onChange={e => setMType(e.target.value as MaintenanceType)}
                >
                  <option value="Service">Service</option>
                  <option value="Repair">Repair</option>
                  <option value="Tyre Change">Tyre change</option>
                </select>
              </div>

              {mType === 'Tyre Change' && (
                <div className="form-group">
                  <label className="form-label">Number of tyres changed</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="6"
                    placeholder="e.g. 4"
                    value={mTyreCount}
                    onChange={e => setMTyreCount(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={mDate}
                  onChange={e => setMDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total cost (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  placeholder="e.g. 4500"
                  value={mCost}
                  onChange={e => setMCost(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bill upload (photo/PDF)</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={e => setMBillFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Any extra detail"
                  value={mNotes}
                  onChange={e => setMNotes(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '2px' }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="submit-btn">
                Add entry
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Vehicle Maintenance Summary */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Vehicle maintenance summary</span>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '6px 10px' }}
            value={summaryVehicle}
            onChange={e => setSummaryVehicle(e.target.value)}
          >
            {vehicleOptions.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Service</td>
                <td className="num">{formatINR(vehicleSummary.totals.Service)}</td>
              </tr>
              <tr>
                <td>Repair</td>
                <td className="num">{formatINR(vehicleSummary.totals.Repair)}</td>
              </tr>
              <tr>
                <td>Tyre change</td>
                <td className="num">{formatINR(vehicleSummary.totals['Tyre Change'])}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Total maintenance</td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {formatINR(vehicleSummary.grand)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
