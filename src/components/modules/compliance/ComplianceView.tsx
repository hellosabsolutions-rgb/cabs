import React from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AlertTriangle, Clock } from 'lucide-react';

export const ComplianceView: React.FC = () => {
  const { vehicleCompliance, driverCompliance, complianceStats, searchQuery } = useFleet();

  const filteredVehDocs = vehicleCompliance.filter(d =>
    d.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrvDocs = driverCompliance.filter(d =>
    d.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="section active">
      {/* Top Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Expiring in 15 days"
          value={String(complianceStats.expiringSoonCount)}
          customColor="var(--warning)"
        />
        <StatCard
          label="Already expired"
          value={String(complianceStats.expiredCount)}
          customColor="var(--danger)"
        />
        <StatCard
          label="Driver docs due"
          value={String(complianceStats.driverDueCount)}
          customColor="var(--warning)"
        />
        <StatCard
          label="Total tracked docs"
          value={String(complianceStats.totalDocsCount)}
        />
      </div>

      {/* Dynamic Expiry Alerts Banner */}
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-head">
          <span className="panel-title">Expiry alerts</span>
          <span className="panel-link">
            {complianceStats.alerts.length} active
          </span>
        </div>
        <div>
          {complianceStats.alerts.length === 0 ? (
            <div className="alert-empty">No documents expiring soon.</div>
          ) : (
            complianceStats.alerts.map((alert, idx) => (
              <div className="alert-row" key={idx}>
                <div className={`alert-icon ${alert.type}`}>
                  {alert.type === 'late' ? <AlertTriangle size={15} /> : <Clock size={15} />}
                </div>
                <div className="alert-text">
                  <b>{alert.who}</b> — {alert.doc}{' '}
                  {alert.type === 'late' ? 'has expired' : 'expires soon'}{' '}
                  <span style={{ color: 'var(--text-faint)' }}>({alert.text})</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Two Column Tables: Vehicle & Driver Compliance */}
      <div className="two-col-tables">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Vehicle compliance</span>
            <span className="panel-link">+ Add document</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Document</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehDocs.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600 }}>{doc.entityName}</td>
                    <td>{doc.documentName}</td>
                    <td className={`expiry-${doc.statusType}`}>
                      {doc.expiryLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Driver compliance</span>
            <span className="panel-link">+ Add document</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Document</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrvDocs.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600 }}>{doc.entityName}</td>
                    <td>{doc.documentName}</td>
                    <td className={`expiry-${doc.statusType}`}>
                      {doc.expiryLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
