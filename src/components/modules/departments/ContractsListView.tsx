import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddContractModal } from './AddContractModal';
import { DepartmentContract } from '../../../types/fleet';

export const ContractsListView: React.FC = () => {
  const { departmentContracts, updateContractStatus, searchQuery } = useFleet();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<string | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

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

  const getStatusBadge = (status: DepartmentContract['status'], id: string) => {
    const handleToggle = () => {
      if (status === 'Active') updateContractStatus(id, 'Pending Renewal');
      else if (status === 'Pending Renewal') updateContractStatus(id, 'Expired');
      else updateContractStatus(id, 'Active');
    };

    switch (status) {
      case 'Active':
        return (
          <span
            className="status-chip running"
            style={{ cursor: 'pointer' }}
            title="Click to change status"
            onClick={handleToggle}
          >
            ● Active
          </span>
        );
      case 'Pending Renewal':
        return (
          <span
            className="status-chip idle"
            style={{ cursor: 'pointer' }}
            title="Click to change status"
            onClick={handleToggle}
          >
            ● Renewal Due
          </span>
        );
      case 'Expired':
        return (
          <span
            className="status-chip maintenance"
            style={{ cursor: 'pointer' }}
            title="Click to change status"
            onClick={handleToggle}
          >
            ● Expired
          </span>
        );
      default:
        return <span className="status-chip">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                <th>Status (Toggle)</th>
                <th>Agreement</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
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
                    <td>{getStatusBadge(c.status, c.id)}</td>
                    <td>
                      {c.documentFile ? (
                        <span
                          className="bill-link"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setViewDoc(c.documentFile!)}
                        >
                          📄 {c.documentFile.startsWith('data:') ? 'Tender doc' : c.documentFile}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>—</span>
                      )}
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
              <h3 className="modal-title">📑 Contract Document</h3>
              <button className="modal-close-btn" onClick={() => setViewDoc(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '30px' }}>
              <div style={{ fontSize: '42px', marginBottom: '10px' }}>📁</div>
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
