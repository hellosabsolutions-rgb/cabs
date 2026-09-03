import React, { useState } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddVehicleComplianceModal } from './AddVehicleComplianceModal';
import { AddDriverComplianceModal } from './AddDriverComplianceModal';
import {
  AlertTriangle,
  Clock,
  Plus,
  FileText,
  Shield,
  FileCheck,
  Wind,
  Settings,
  Tag,
  IdCard,
  UserCheck,
  HeartPulse
} from 'lucide-react';
import { SkeletonCard, SkeletonTable } from '../../common/Skeleton';

export const ComplianceView: React.FC = () => {
  const { vehicleCompliance, driverCompliance, complianceStats, searchQuery, isLoading } = useFleet();

  const [isVehModalOpen, setIsVehModalOpen] = useState(false);
  const [isDrvModalOpen, setIsDrvModalOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<{ title: string; src: string; who: string; exp: string } | null>(null);

  const filteredVehDocs = vehicleCompliance.filter(d =>
    d.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.documentNumber && d.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDrvDocs = driverCompliance.filter(d =>
    d.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.documentNumber && d.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getDocIcon = (name: string) => {
    switch (name) {
      case 'Insurance':
        return <Shield size={14} color="#38bdf8" />;
      case 'Permit':
      case 'State permit':
        return <FileCheck size={14} color="#ffcc4d" />;
      case 'PUC':
      case 'Pollution (PUC)':
        return <Wind size={14} color="#39ff6e" />;
      case 'RC':
        return <FileText size={14} color="#38bdf8" />;
      case 'Fitness':
        return <Settings size={14} color="#ffcc4d" />;
      case 'Road tax':
        return <Tag size={14} color="#a78bfa" />;
      case 'Driving licence':
        return <IdCard size={14} color="#39ff6e" />;
      case 'Police verification':
        return <UserCheck size={14} color="#38bdf8" />;
      case 'Medical record':
        return <HeartPulse size={14} color="#f87171" />;
      default:
        return <FileText size={14} color="var(--accent)" />;
    }
  };

  if (isLoading) {
    return (
      <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonCard count={4} />
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="section active" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          label="Driver docs due (DL)"
          value={String(complianceStats.driverDueCount)}
          customColor="var(--warning)"
        />
        <StatCard
          label="Total tracked docs"
          value={String(complianceStats.totalDocsCount)}
          customColor="var(--accent)"
        />
      </div>

      {/* Dynamic Expiry Alerts Banner */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Expiry alerts</span>
          <span className="panel-link">
            {complianceStats.alerts.length} active
          </span>
        </div>
        <div>
          {complianceStats.alerts.length === 0 ? (
            <div className="alert-empty">No documents expiring soon. All fleet compliances valid!</div>
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
        {/* 1. Vehicle Compliance Panel */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-title">Vehicle Compliance</span>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                Insurance, Permit, PUC, RC, Fitness & Road Tax
              </div>
            </div>
            <button
              type="button"
              className="btn-primary-action"
              style={{ fontSize: '11.5px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setIsVehModalOpen(true)}
            >
              <Plus size={13} /> Add Document
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Document Type</th>
                  <th>Expiry Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehDocs.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '24px 0' }}>
                      No vehicle compliance documents found. Click "+ Add Document" to add Insurance, RC, PUC, etc.
                    </td>
                  </tr>
                ) : (
                  filteredVehDocs.map(doc => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>
                        <div>{doc.entityName}</div>
                        {doc.documentNumber && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-faint)', marginTop: '1px' }}>
                            #{doc.documentNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{getDocIcon(doc.documentName)}</span>
                          <span style={{ fontWeight: 500 }}>{doc.documentName}</span>
                        </div>
                        {doc.documentPhoto && (
                          <span
                            className="bill-link"
                            style={{ fontSize: '10.5px', display: 'inline-block', marginTop: '2px' }}
                            onClick={() =>
                              setViewDoc({
                                title: `${doc.entityName} · ${doc.documentName}`,
                                src: doc.documentPhoto!,
                                who: doc.entityName,
                                exp: doc.expiryLabel
                              })
                            }
                          >
                            View Copy
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`expiry-${doc.statusType}`} style={{ fontWeight: 600 }}>
                          {doc.expiryLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Driver Compliance Panel */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="panel-title">Driver Compliance</span>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                Driving Licence (Mandatory) & Medical Records
              </div>
            </div>
            <button
              type="button"
              className="btn-primary-action"
              style={{ fontSize: '11.5px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setIsDrvModalOpen(true)}
            >
              <Plus size={13} /> Add Document
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Document Type</th>
                  <th>Expiry Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrvDocs.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '24px 0' }}>
                      No driver documents found. Click "+ Add Document" to record Driver Licence.
                    </td>
                  </tr>
                ) : (
                  filteredDrvDocs.map(doc => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>
                        <div>{doc.entityName}</div>
                        {doc.documentNumber && (
                          <div style={{ fontSize: '10.5px', color: 'var(--accent)', marginTop: '1px' }}>
                            DL: {doc.documentNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{getDocIcon(doc.documentName)}</span>
                          <span style={{ fontWeight: 500 }}>
                            {doc.documentName === 'Driving licence' ? 'Driving Licence (DL)' : doc.documentName}
                          </span>
                          {doc.documentName === 'Driving licence' && (
                            <span
                              style={{
                                fontSize: '9px',
                                background: 'rgba(57, 255, 110, 0.15)',
                                color: 'var(--accent)',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontWeight: 600
                              }}
                            >
                              Mandatory
                            </span>
                          )}
                        </div>
                        {doc.documentPhoto && (
                          <span
                            className="bill-link"
                            style={{ fontSize: '10.5px', display: 'inline-block', marginTop: '2px' }}
                            onClick={() =>
                              setViewDoc({
                                title: `${doc.entityName} · ${doc.documentName}`,
                                src: doc.documentPhoto!,
                                who: doc.entityName,
                                exp: doc.expiryLabel
                              })
                            }
                          >
                            View Copy
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`expiry-${doc.statusType}`} style={{ fontWeight: 600 }}>
                          {doc.expiryLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Vehicle Compliance Modal */}
      <AddVehicleComplianceModal
        isOpen={isVehModalOpen}
        onClose={() => setIsVehModalOpen(false)}
      />

      {/* Driver Compliance Modal */}
      <AddDriverComplianceModal
        isOpen={isDrvModalOpen}
        onClose={() => setIsDrvModalOpen(false)}
      />

      {/* Document Proof Viewer Modal */}
      {viewDoc && (
        <div className="modal-overlay" onClick={() => setViewDoc(null)}>
          <div className="modal-dialog" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> {viewDoc.title}
              </h3>
              <button className="modal-close-btn" onClick={() => setViewDoc(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              {viewDoc.src.startsWith('data:image') ? (
                <img
                  src={viewDoc.src}
                  alt={viewDoc.title}
                  style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ padding: '30px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <FileText size={48} color="var(--accent)" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Document Verified</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>
                    Entity: {viewDoc.who} · Expiry: {viewDoc.exp}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
