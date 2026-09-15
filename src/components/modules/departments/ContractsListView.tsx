import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { AddContractModal } from './AddContractModal';
import { DepartmentContract } from '../../../types/fleet';
import { StatusDropdown, StatusOption } from '../../common/StatusDropdown';
import { Pagination } from '../../common/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import { X, FileText, Folder, Trash2, ChevronDown } from 'lucide-react';

export const ContractsListView: React.FC = () => {
  const { departmentContracts, updateContractStatus, deleteDepartmentContract, searchQuery } = useFleet();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<string | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  const todayIst = useMemo(
    () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()),
    []
  );

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

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems: paginatedContracts
  } = usePagination(filteredContracts, 10);

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
    const contractOptions: StatusOption<DepartmentContract['status']>[] = [
      {
        value: 'Active',
        label: 'Active',
        color: 'var(--success, #26b8d8)',
        bg: 'rgba(38, 184, 216, 0.12)',
        borderColor: 'rgba(38, 184, 216, 0.35)'
      },
      {
        value: 'Pending Renewal',
        label: 'Renewal Due',
        color: '#ffc107',
        bg: 'rgba(255, 193, 7, 0.12)',
        borderColor: 'rgba(255, 193, 7, 0.35)'
      },
      {
        value: 'Expired',
        label: 'Expired',
        color: 'var(--danger, #ff5c5c)',
        bg: 'rgba(255, 92, 92, 0.12)',
        borderColor: 'rgba(255, 92, 92, 0.35)'
      }
    ];

    return (
      <StatusDropdown
        value={status}
        options={contractOptions}
        onChange={(newStatus) => updateContractStatus(id, newStatus)}
      />
    );
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
                paginatedContracts.map(c => (
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
                      {(c.nightChargePerDay ?? 0) > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                          ₹{c.nightChargePerDay}/night
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        {c.startDate} → {c.endDate}
                      </div>
                      {c.endDate < todayIst && c.status !== 'Expired' && (
                        <div
                          style={{
                            fontSize: '10px',
                            marginTop: '2px',
                            color: 'var(--danger, #ff5c5c)',
                            fontWeight: 600
                          }}
                        >
                          Past end date
                        </div>
                      )}
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

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="contracts"
        />
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
                <X size={15} />
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
