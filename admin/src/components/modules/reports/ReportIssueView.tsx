import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  RotateCw,
  ChevronRight,
  Sparkles,
  Inbox,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';
import { api } from '../../../services/api';
import { IssueReportItem, ReportStatus } from '../../../types/report';
import { CreateReportModal } from './CreateReportModal';
import { ReportDetailModal } from './ReportDetailModal';
import { useFleet } from '../../../context/FleetContext';
import { useAgency } from '../../../context/AgencyContext';

type TabStatus = 'all' | 'pending' | 'working' | 'done';

export const ReportIssueView: React.FC = () => {
  const { showToast } = useFleet();
  const { currentAgency } = useAgency();

  const [reports, setReports] = useState<IssueReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<TabStatus>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IssueReportItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchReportsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const agencyId = currentAgency?.id || currentAgency?._id;
      if (agencyId) params.append('agencyId', agencyId);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/reports?${params.toString()}`);
      if (res.success && Array.isArray(res.data)) {
        setReports(res.data);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load queries');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentAgency, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReportsData();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchReportsData]);

  const handleReportCreated = (newReport: IssueReportItem) => {
    setReports(prev => [newReport, ...prev]);
    fetchReportsData();
  };

  // Map backend status to user friendly done, pending, working
  const getDisplayStatus = (status: ReportStatus): 'pending' | 'working' | 'done' => {
    if (status === 'resolved' || status === 'closed') return 'done';
    if (status === 'in_progress') return 'working';
    return 'pending';
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (selectedStatusTab === 'all') return true;
      return getDisplayStatus(r.status) === selectedStatusTab;
    });
  }, [reports, selectedStatusTab]);

  const counts = useMemo(() => {
    let pending = 0;
    let working = 0;
    let done = 0;
    reports.forEach(r => {
      const st = getDisplayStatus(r.status);
      if (st === 'pending') pending++;
      else if (st === 'working') working++;
      else if (st === 'done') done++;
    });
    return { all: reports.length, pending, working, done };
  }, [reports]);

  const renderStatusBadge = (status: ReportStatus) => {
    const mapped = getDisplayStatus(status);
    if (mapped === 'done') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            color: '#16a34a',
            border: '1px solid rgba(34, 197, 94, 0.25)'
          }}
        >
          <CheckCircle2 size={13} />
          Done
        </span>
      );
    }
    if (mapped === 'working') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: 'rgba(14, 165, 233, 0.12)',
            color: '#0284c7',
            border: '1px solid rgba(14, 165, 233, 0.25)'
          }}
        >
          <RotateCw size={12} className="spin" />
          Working
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.25)'
        }}
      >
        <Clock size={12} />
        Pending
      </span>
    );
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", paddingBottom: '40px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(217, 119, 6, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              flexShrink: 0
            }}
          >
            <LifeBuoy size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              Report & Query History
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-faint)' }}>
              Raise issues or queries regarding the software and check real-time resolution status
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchReportsData}
            style={{
              padding: '9px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif"
            }}
            title="Refresh history"
          >
            <RotateCw size={14} className={isLoading ? 'spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              height: '38px',
              padding: '0 20px',
              borderRadius: '6px',
              border: 'none',
              background: '#d97706',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(217, 119, 6, 0.3)',
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            <Plus size={16} />
            Raise Query or Report
          </button>
        </div>
      </div>

      {/* Clean Filter & Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '14px 18px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedStatusTab('all')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: selectedStatusTab === 'all' ? '1.5px solid #d97706' : '1px solid var(--border)',
              backgroundColor: selectedStatusTab === 'all' ? 'rgba(217, 119, 6, 0.12)' : 'var(--surface-2)',
              color: selectedStatusTab === 'all' ? '#d97706' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            All Queries
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: selectedStatusTab === 'all' ? '#d97706' : 'var(--border)',
                color: selectedStatusTab === 'all' ? '#ffffff' : 'var(--text-faint)'
              }}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab('pending')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: selectedStatusTab === 'pending' ? '1.5px solid #f59e0b' : '1px solid var(--border)',
              backgroundColor: selectedStatusTab === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface-2)',
              color: selectedStatusTab === 'pending' ? '#d97706' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={14} />
            Pending
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: selectedStatusTab === 'pending' ? '#f59e0b' : 'var(--border)',
                color: selectedStatusTab === 'pending' ? '#ffffff' : 'var(--text-faint)'
              }}
            >
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab('working')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: selectedStatusTab === 'working' ? '1.5px solid #0ea5e9' : '1px solid var(--border)',
              backgroundColor: selectedStatusTab === 'working' ? 'rgba(14, 165, 233, 0.12)' : 'var(--surface-2)',
              color: selectedStatusTab === 'working' ? '#0284c7' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCw size={13} />
            Working
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: selectedStatusTab === 'working' ? '#0ea5e9' : 'var(--border)',
                color: selectedStatusTab === 'working' ? '#ffffff' : 'var(--text-faint)'
              }}
            >
              {counts.working}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab('done')}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: selectedStatusTab === 'done' ? '1.5px solid #22c55e' : '1px solid var(--border)',
              backgroundColor: selectedStatusTab === 'done' ? 'rgba(34, 197, 94, 0.12)' : 'var(--surface-2)',
              color: selectedStatusTab === 'done' ? '#16a34a' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={14} />
            Done
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: selectedStatusTab === 'done' ? '#22c55e' : 'var(--border)',
                color: selectedStatusTab === 'done' ? '#ffffff' : 'var(--text-faint)'
              }}
            >
              {counts.done}
            </span>
          </button>
        </div>

        {/* Search Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--surface-2)',
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          <Search size={15} color="var(--text-faint)" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search raised queries..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '13px',
              width: '100%',
              fontFamily: "'Poppins', sans-serif"
            }}
          />
        </div>
      </div>

      {/* Query History Table */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}
      >
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-faint)' }}>
            <RotateCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '13.5px' }}>Loading your queries...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <LifeBuoy size={32} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
              {selectedStatusTab === 'all'
                ? 'No Queries or Reports Raised Yet'
                : `No ${selectedStatusTab.toUpperCase()} Queries Found`}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-faint)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Have an issue or a question regarding the software? Click below to raise your query and track its resolution.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#d97706',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(217, 119, 6, 0.3)',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              <Plus size={16} />
              Raise Query or Report
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-2)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px'
                  }}
                >
                  <th style={{ padding: '14px 18px' }}>Ticket ID</th>
                  <th style={{ padding: '14px 18px' }}>Heading & Description</th>
                  <th style={{ padding: '14px 18px' }}>Supportive File</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px' }}>Date Raised</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr
                    key={report._id}
                    onClick={() => {
                      setSelectedReport(report);
                      setIsDetailModalOpen(true);
                    }}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          color: '#d97706',
                          backgroundColor: 'rgba(217, 119, 6, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {report.ticketId}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', maxWidth: '380px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {report.title}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-faint)',
                          marginTop: '3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {report.description}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      {report.attachments && report.attachments.length > 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#d97706' }}>
                          {report.attachments.some(a => a.type?.startsWith('video') || a.url?.includes('video') || a.url?.endsWith('.mp4')) ? (
                            <>
                              <VideoIcon size={15} />
                              <span>Video attached</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon size={15} />
                              <span>Image attached</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>None</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      {renderStatusBadge(report.status)}
                    </td>

                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-faint)' }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedReport(report);
                          setIsDetailModalOpen(true);
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '7px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--text)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        View Details
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleReportCreated}
      />

      <ReportDetailModal
        report={selectedReport}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReport(null);
        }}
      />
    </div>
  );
};
