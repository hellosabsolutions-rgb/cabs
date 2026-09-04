import React, { useState, useMemo } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { StatCard } from '../../common/StatCard';
import { GenerateBillModal } from './GenerateBillModal';
import { MonthlyDepartmentBill } from '../../../types/fleet';
import { Building2, Layers, ListFilter, FileText } from 'lucide-react';

export const MonthlyBillingView: React.FC = () => {
  const { monthlyBills, updateBillStatus, searchQuery, departmentContracts } = useFleet();

  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'by-dept' | 'flat'>('by-dept');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBillForPreview, setSelectedBillForPreview] = useState<MonthlyDepartmentBill | null>(null);

  const formatINR = (val: number) => '₹' + Math.round(val).toLocaleString('en-IN');

  // List of all unique departments from contracts and bills
  const allDepartmentNames = useMemo(() => {
    const set = new Set<string>();
    departmentContracts.forEach(c => set.add(c.departmentName));
    monthlyBills.forEach(b => set.add(b.departmentName));
    return Array.from(set);
  }, [departmentContracts, monthlyBills]);

  // Months available
  const availableMonths = useMemo(() => {
    return Array.from(new Set(monthlyBills.map(b => b.billingMonth)));
  }, [monthlyBills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return monthlyBills.filter(bill => {
      const matchSearch =
        bill.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.billingMonth.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = deptFilter === 'All' || bill.departmentName === deptFilter;
      const matchStatus = statusFilter === 'All' || bill.status === statusFilter;
      const matchMonth = monthFilter === 'All' || bill.billingMonth === monthFilter;

      return matchSearch && matchDept && matchStatus && matchMonth;
    });
  }, [monthlyBills, searchQuery, deptFilter, statusFilter, monthFilter]);

  // Department-wise grouping
  const departmentGroups = useMemo(() => {
    const groupsMap: Record<
      string,
      {
        departmentName: string;
        bills: MonthlyDepartmentBill[];
        totalBilled: number;
        totalPaid: number;
        totalPending: number;
        vehicles: string[];
        activeContractNo?: string;
      }
    > = {};

    // First initialize from contracts so every department has representation
    allDepartmentNames.forEach(dept => {
      const contract = departmentContracts.find(c => c.departmentName === dept);
      groupsMap[dept] = {
        departmentName: dept,
        bills: [],
        totalBilled: 0,
        totalPaid: 0,
        totalPending: 0,
        vehicles: contract ? [contract.vehicle] : [],
        activeContractNo: contract?.contractNumber
      };
    });

    // Populate with filtered bills
    filteredBills.forEach(b => {
      if (!groupsMap[b.departmentName]) {
        groupsMap[b.departmentName] = {
          departmentName: b.departmentName,
          bills: [],
          totalBilled: 0,
          totalPaid: 0,
          totalPending: 0,
          vehicles: []
        };
      }
      groupsMap[b.departmentName].bills.push(b);
      groupsMap[b.departmentName].totalBilled += b.totalBill;
      groupsMap[b.departmentName].totalPaid += b.paidAmount;
      groupsMap[b.departmentName].totalPending += b.balanceDue;
      if (!groupsMap[b.departmentName].vehicles.includes(b.vehicle)) {
        groupsMap[b.departmentName].vehicles.push(b.vehicle);
      }
    });

    // If deptFilter is specific, only show that department
    if (deptFilter !== 'All') {
      return Object.values(groupsMap).filter(g => g.departmentName === deptFilter);
    }

    // Filter out empty groups if search or other filters are applied
    if (searchQuery || statusFilter !== 'All' || monthFilter !== 'All') {
      return Object.values(groupsMap).filter(g => g.bills.length > 0);
    }

    return Object.values(groupsMap);
  }, [allDepartmentNames, departmentContracts, filteredBills, deptFilter, searchQuery, statusFilter, monthFilter]);

  // Quick stats
  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;

    monthlyBills.forEach(b => {
      totalBilled += b.totalBill;
      totalPaid += b.paidAmount;
      totalPending += b.balanceDue;
    });

    return {
      totalBilled,
      totalPaid,
      totalPending,
      totalCount: monthlyBills.length,
      deptCount: allDepartmentNames.length
    };
  }, [monthlyBills, allDepartmentNames]);

  const getStatusBadge = (status: MonthlyDepartmentBill['status'], id: string) => {
    const handleToggle = () => {
      if (status === 'Sent') updateBillStatus(id, 'Paid');
      else if (status === 'Paid') updateBillStatus(id, 'Overdue');
      else if (status === 'Overdue') updateBillStatus(id, 'Pending');
      else updateBillStatus(id, 'Sent');
    };

    switch (status) {
      case 'Paid':
        return (
          <span
            className="status-chip running"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={handleToggle}
          >
            ● Paid
          </span>
        );
      case 'Sent':
        return (
          <span
            className="status-chip active"
            style={{ cursor: 'pointer', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}
            title="Click to toggle status"
            onClick={handleToggle}
          >
            ● Sent (Pending)
          </span>
        );
      case 'Overdue':
        return (
          <span
            className="status-chip maintenance"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={handleToggle}
          >
            ● Overdue
          </span>
        );
      case 'Pending':
      case 'Draft':
        return (
          <span
            className="status-chip idle"
            style={{ cursor: 'pointer' }}
            title="Click to toggle status"
            onClick={handleToggle}
          >
            ● {status}
          </span>
        );
      default:
        return <span className="status-chip">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Total Invoiced Billing" value={formatINR(stats.totalBilled)} customColor="var(--accent)" />
        <StatCard label="Payments Realized (Paid)" value={formatINR(stats.totalPaid)} />
        <StatCard label="Outstanding Balance Due" value={formatINR(stats.totalPending)} customColor={stats.totalPending > 0 ? 'var(--danger)' : undefined} />
        <StatCard label="Client Departments" value={stats.deptCount} />
      </div>

      {/* Department Quick Filter Tabs */}
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
          className={`subtab-btn ${deptFilter === 'All' ? 'active' : ''}`}
          onClick={() => setDeptFilter('All')}
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          <Building2 size={14} />
          All Departments
          <span className="subtab-counter">{monthlyBills.length}</span>
        </button>

        {allDepartmentNames.map(dept => {
          const deptBills = monthlyBills.filter(b => b.departmentName === dept);
          const deptTotal = deptBills.reduce((acc, curr) => acc + curr.totalBill, 0);
          const hasPending = deptBills.some(b => b.balanceDue > 0);

          return (
            <button
              key={dept}
              className={`subtab-btn ${deptFilter === dept ? 'active' : ''}`}
              onClick={() => setDeptFilter(dept)}
              style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
            >
              {dept}
              <span
                className="subtab-counter"
                style={{
                  background: hasPending ? 'rgba(255, 92, 92, 0.18)' : undefined,
                  color: hasPending ? 'var(--danger)' : undefined,
                  borderColor: hasPending ? 'rgba(255, 92, 92, 0.3)' : undefined
                }}
              >
                {formatINR(deptTotal)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Filter & View Mode Toolbar */}
      <div
        className="panel"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Mode Toggle */}
          <button
            className={`subtab-btn ${viewMode === 'by-dept' ? 'active' : ''}`}
            onClick={() => setViewMode('by-dept')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            <Layers size={14} />
            Group by Department
          </button>
          <button
            className={`subtab-btn ${viewMode === 'flat' ? 'active' : ''}`}
            onClick={() => setViewMode('flat')}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            <ListFilter size={14} />
            All Invoices Table
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Department Select */}
          <select
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
          >
            <option value="All">All Departments</option>
            {allDepartmentNames.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Month Select */}
          <select
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
          >
            <option value="All">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Draft">Draft</option>
          </select>

          <button
            className="btn-primary-action"
            style={{ fontSize: '12px', padding: '7px 16px' }}
            onClick={() => setIsModalOpen(true)}
          >
            + Generate Monthly Bill
          </button>
        </div>
      </div>

      {/* VIEW 1: ACCORDING TO DEPARTMENT (GROUPED VIEW) */}
      {viewMode === 'by-dept' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {departmentGroups.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px 0' }}>
              No department billing records found matching your filters.
            </div>
          ) : (
            departmentGroups.map(group => (
              <div key={group.departmentName} className="dept-billing-card">
                {/* Department Header Card */}
                <div className="dept-billing-header">
                  <div className="dept-billing-title-group">
                    <div className="dept-billing-icon">
                      <Building2 size={18} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                        {group.departmentName}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {group.vehicles.length > 0 ? (
                          <span>Vehicles: <b>{group.vehicles.join(', ')}</b></span>
                        ) : null}
                        {group.activeContractNo ? (
                          <span> · Tender: <b>{group.activeContractNo}</b></span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="dept-billing-stats-strip">
                    <div className="dept-stat-item">
                      <span className="dept-stat-label">Total Invoiced</span>
                      <span className="dept-stat-val" style={{ color: 'var(--accent)' }}>
                        {formatINR(group.totalBilled)}
                      </span>
                    </div>

                    <div className="dept-stat-item">
                      <span className="dept-stat-label">Received / Paid</span>
                      <span className="dept-stat-val" style={{ color: 'var(--text)' }}>
                        {formatINR(group.totalPaid)}
                      </span>
                    </div>

                    <div className="dept-stat-item">
                      <span className="dept-stat-label">Outstanding Due</span>
                      <span
                        className="dept-stat-val"
                        style={{ color: group.totalPending > 0 ? 'var(--danger)' : 'var(--text-dim)' }}
                      >
                        {formatINR(group.totalPending)}
                      </span>
                    </div>

                    <button
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                      onClick={() => setIsModalOpen(true)}
                    >
                      + Bill Dept
                    </button>
                  </div>
                </div>

                {/* Invoices Table for this department */}
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice No & Month</th>
                        <th>Vehicle</th>
                        <th>Base contract rate</th>
                        <th>Extra KM + Hrs</th>
                        <th>Toll & parking</th>
                        <th>Total bill</th>
                        <th>Status (Toggle)</th>
                        <th>Due date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.bills.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '20px 0' }}>
                            No monthly invoices generated yet for this department.
                          </td>
                        </tr>
                      ) : (
                        group.bills.map(b => (
                          <tr key={b.id}>
                            <td>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{b.billNumber}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                                  Month: {b.billingMonth}
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>{b.vehicle}</td>
                            <td className="num">{formatINR(b.baseContractAmount)}</td>
                            <td className="num" style={{ color: 'var(--warning)' }}>
                              {formatINR(b.extraKmCost + b.extraHoursCost)}
                            </td>
                            <td className="num">{formatINR(b.tollParkingCost)}</td>
                            <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                              {formatINR(b.totalBill)}
                              {b.gstRate !== undefined && b.gstRate > 0 && (
                                <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 400 }}>
                                  Incl. {b.gstRate}% GST ({formatINR(b.gstAmount || 0)})
                                </div>
                              )}
                            </td>
                            <td>{getStatusBadge(b.status, b.id)}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{b.dueDate}</td>
                            <td>
                              <span
                                className="bill-link"
                                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setSelectedBillForPreview(b)}
                              >
                                <FileText size={12} /> View bill
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: ALL INVOICES FLAT TABLE VIEW */}
      {viewMode === 'flat' && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Master Billing Register</span>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              ({filteredBills.length} invoices)
            </span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Invoice No & Month</th>
                  <th>Department</th>
                  <th>Vehicle</th>
                  <th>Base rate</th>
                  <th>Extra KM + Hrs</th>
                  <th>Toll & misc</th>
                  <th>Total bill</th>
                  <th>Status (Toggle)</th>
                  <th>Due date</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '30px 0' }}>
                      No department monthly invoices found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{b.billNumber}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                            Month: {b.billingMonth}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{b.departmentName}</td>
                      <td style={{ fontWeight: 500 }}>{b.vehicle}</td>
                      <td className="num">{formatINR(b.baseContractAmount)}</td>
                      <td className="num" style={{ color: 'var(--warning)' }}>
                        {formatINR(b.extraKmCost + b.extraHoursCost)}
                      </td>
                      <td className="num">{formatINR(b.tollParkingCost)}</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {formatINR(b.totalBill)}
                        {b.gstRate !== undefined && b.gstRate > 0 && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 400 }}>
                            Incl. {b.gstRate}% GST ({formatINR(b.gstAmount || 0)})
                          </div>
                        )}
                      </td>
                      <td>{getStatusBadge(b.status, b.id)}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{b.dueDate}</td>
                      <td>
                        <span
                          className="bill-link"
                          style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setSelectedBillForPreview(b)}
                        >
                          <FileText size={12} /> View bill
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      <GenerateBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Invoice Preview Modal */}
      {selectedBillForPreview && (
        <div className="modal-overlay" onClick={() => setSelectedBillForPreview(null)}>
          <div className="modal-dialog" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--accent)" /> Official Monthly Invoice
                </h3>
                <span className="modal-subtitle">{selectedBillForPreview.billNumber}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedBillForPreview(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  background: 'var(--surface-2)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-soft)', paddingBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>BILLED TO:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>
                      {selectedBillForPreview.departmentName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      Assigned Vehicle: {selectedBillForPreview.vehicle}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>BILLING PERIOD</div>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {selectedBillForPreview.billingMonth}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                      Due: {selectedBillForPreview.dueDate}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Monthly Base Contract Rate:</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(selectedBillForPreview.baseContractAmount)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Extra KM Charges ({selectedBillForPreview.totalKmRun} km total):</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(selectedBillForPreview.extraKmCost)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Extra Duty Hours Charges:</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(selectedBillForPreview.extraHoursCost)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Toll / Parking Reimbursement:</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(selectedBillForPreview.tollParkingCost)}</span>
                  </div>

                  {/* Taxable Subtotal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-soft)', paddingTop: '8px', marginTop: '2px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Taxable Subtotal:</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatINR(selectedBillForPreview.subtotal ?? (selectedBillForPreview.baseContractAmount + selectedBillForPreview.extraKmCost + selectedBillForPreview.extraHoursCost + selectedBillForPreview.tollParkingCost))}
                    </span>
                  </div>

                  {/* GST Line Item */}
                  {(selectedBillForPreview.gstRate !== undefined && selectedBillForPreview.gstRate > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffcc4d' }}>
                      <span>GST ({selectedBillForPreview.gstRate}%):</span>
                      <span style={{ fontWeight: 600 }}>+{formatINR(selectedBillForPreview.gstAmount || 0)}</span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>TOTAL PAYABLE:</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                    {formatINR(selectedBillForPreview.totalBill)}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedBillForPreview(null)}>
                Close
              </button>
              <button
                className="btn-primary-action"
                onClick={() => {
                  alert(`Invoice PDF for ${selectedBillForPreview.billNumber} downloaded successfully!`);
                  setSelectedBillForPreview(null);
                }}
              >
                ⬇ Download Invoice PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
