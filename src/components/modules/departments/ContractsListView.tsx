import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddContractModal } from './AddContractModal';
import { DepartmentContract } from '../../../types/fleet';
import { FileText, Folder, Trash2, ChevronDown, RefreshCw, Radio } from 'lucide-react';

export const ContractsListView: React.FC = () => {
  const { departmentContracts, fetchLiveContracts, updateContractStatus, deleteDepartmentContract, searchQuery } = useFleet();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const handleSyncFromApi = async () => {
    setIsSyncing(true);
    try {
      await fetchLiveContracts();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const filteredContracts = useMemo(() => {
    return departmentContracts.filter(c => {
      const matchSearch =
        c.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [departmentContracts, searchQuery, statusFilter]);

  // Quick stats
  const stats = useMemo(() => {
    let active = 0;
    let totalRevenue = 0;
    let pendingRenewal = 0;

    departmentContracts.forEach(c => {
      if (c.status === 'Active') {
        active++;
        totalRevenue += c.monthlyBaseAmount;
      } else if (c.status === 'Pending Renewal') {
        pendingRenewal++;
      }
    });

    return {
      active,
      totalRevenue,
      totalContracts: departmentContracts.length,
      pendingRenewal
    };
  }, [departmentContracts]);

  const renderStatusDropdown = (status: DepartmentContract['status'], id: string) => {
    const getStatusStyle = (s: DepartmentContract['status']) => {
      switch (s) {
        case 'Active':
          return {
            background: 'rgba(57, 255, 110, 0.12)',
            color: '#39ff6e',
            borderColor: 'rgba(57, 255, 110, 0.35)'
          };
        case 'Pending Renewal':
          return {
            background: 'rgba(255, 193, 7, 0.12)',
            color: '#ffc107',
            borderColor: 'rgba(255, 193, 7, 0.35)'
          };
        case 'Expired':
          return {
            background: 'rgba(255, 92, 92, 0.12)',
            color: 'var(--danger, #ff5c5c)',
            borderColor: 'rgba(255, 92, 92, 0.35)'
          };
        default:
          return {
            background: 'var(--surface-3)',
            color: 'var(--text)',
            borderColor: 'var(--border)'
          };
      }
    };

    const style = getStatusStyle(status);

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={status}
          onChange={e => updateContractStatus(id, e.target.value as DepartmentContract['status'])}
          style={{
            background: style.background,
            color: style.color,
            border: `1px solid ${style.borderColor}`,
            padding: '4px 22px 4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            lineHeight: 1.4
          }}
          title="Change contract status"
        >
          <option value="Active" style={{ background: 'var(--surface-1, #1e293b)', color: '#39ff6e' }}>● Active</option>
          <option value="Pending Renewal" style={{ background: 'var(--surface-1, #1e293b)', color: '#ffc107' }}>● Renewal Due</option>
          <option value="Expired" style={{ background: 'var(--surface-1, #1e293b)', color: '#ff5c5c' }}>● Expired</option>
        </select>
        <ChevronDown
          size={11}
          style={{
            position: 'absolute',
            right: '7px',
            pointerEvents: 'none',
            color: style.color,
            opacity: 0.85
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Live Contracts Backend API Banner */}
      <div
        style={{
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '12px 18px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12.5px',
          color: 'var(--text)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <Radio size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Live Contracts API Integrated</span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  background: 'rgba(57, 255, 110, 0.15)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(57, 255, 110, 0.3)',
                  padding: '1px 7px',
                  borderRadius: '12px'
                }}
              >
                ● Live Sync Active
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Government fleet tenders, department vehicle attachments, monthly rate limits, and SLA validity synchronized with database.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
          onClick={handleSyncFromApi}
          disabled={isSyncing}
          title="Sync latest contracts from backend server"
        >
          <RefreshCw size={13} className={isSyncing ? 'spin-icon' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync from Server'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard label="Active Contracts" value={stats.active} customColor="var(--accent)" />
        <StatCard label="Monthly Base Revenue" value={formatINR(stats.totalRevenue)} />
        <StatCard label="Total Registered Contracts" value={stats.totalContracts} />
        <StatCard label="Pending Renewal" value={stats.pendingRenewal} />
      </div>

      {/* Contracts Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="panel-title">Department Fleet Contracts</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredContracts.length} contracts)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Renewal">Pending Renewal</option>
              <option value="Expired">Expired</option>
            </select>

            <button
              className="btn-primary-action"
              style={{ fontSize: '12px', padding: '7px 16px' }}
              onClick={() => setIsModalOpen(true)}
            >
              + New Contract
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Department & Contact</th>
                <th>Vehicle & Driver</th>
                <th>Base monthly rate</th>
                <th>Included limits</th>
                <th>Extra rates</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Agreement</th>
                <th style={{ textAlign: 'center', width: '60px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                    No department contracts found. Click "+ New Contract" to create one.
                  </td>
                </tr>
              ) : (
                filteredContracts.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{c.departmentName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {c.contactPerson} · {c.phone}
                        </div>
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--accent)', marginTop: '2px' }}>
                          {c.contractNumber}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.vehicle}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        Driver: {c.driverName || '—'}
                      </div>
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {formatINR(c.monthlyBaseAmount)}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                        {c.includedKmPerMonth} km / mo
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        {c.includedHoursPerMonth} hrs / mo
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                        ₹{c.extraKmRate}/km
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        ₹{c.extraHourRate}/hr
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        {c.startDate} → {c.endDate}
                      </div>
                    </td>
                    <td>{renderStatusDropdown(c.status, c.id)}</td>
                    <td>
                      {c.documentFile ? (
                        <span
                          className="bill-link"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setViewDoc(c.documentFile!)}
                        >
                          <FileText size={12} /> {c.documentFile.startsWith('data:') ? 'Tender doc' : c.documentFile}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        style={{
                          width: '28px',
                          height: '28px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-faint)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title={`Delete contract ${c.contractNumber}`}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete contract "${c.contractNumber}" (${c.departmentName})?`)) {
                            deleteDepartmentContract(c.id);
                          }
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = 'var(--danger)';
                          e.currentTarget.style.borderColor = 'var(--danger)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'var(--text-faint)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contract Modal */}
      <AddContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Document View Modal */}
      {viewDoc && (
        <div className="modal-overlay" onClick={() => setViewDoc(null)}>
          <div className="modal-dialog" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} /> Contract Document
              </h3>
              <button className="modal-close-btn" onClick={() => setViewDoc(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <Folder size={42} color="var(--accent)" />
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{viewDoc}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '8px' }}>
                Contract agreement file verified & archived in system.
              </div>
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
