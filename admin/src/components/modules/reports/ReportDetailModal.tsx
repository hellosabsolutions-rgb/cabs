import React, { useState } from 'react';
import {
  X,
  Bug,
  HelpCircle,
  Lightbulb,
  Clock,
  User,
  Mail,
  Phone,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { IssueReportItem, ReportStatus } from '../../../types/report';

interface ReportDetailModalProps {
  report: IssueReportItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose
}) => {
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const getTypeIcon = () => {
    switch (report.reportType) {
      case 'issue':
        return <Bug size={18} color="var(--danger)" />;
      case 'query':
        return <HelpCircle size={18} color="#0ea5e9" />;
      case 'feature_request':
        return <Lightbulb size={18} color="#f59e0b" />;
      default:
        return <AlertTriangle size={18} color="var(--accent)" />;
    }
  };

  const getStatusDisplay = (status: ReportStatus) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return {
          label: 'Done',
          color: '#16a34a',
          bg: 'rgba(34, 197, 94, 0.12)',
          border: 'rgba(34, 197, 94, 0.25)',
          desc: 'This query has been addressed and marked as Done.'
        };
      case 'in_progress':
        return {
          label: 'Working',
          color: '#0284c7',
          bg: 'rgba(14, 165, 233, 0.12)',
          border: 'rgba(14, 165, 233, 0.25)',
          desc: 'Our team is currently working on this query/issue.'
        };
      default:
        return {
          label: 'Pending',
          color: '#d97706',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.25)',
          desc: 'Your query is pending review.'
        };
    }
  };

  const statusInfo = getStatusDisplay(report.status);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 1060,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {getTypeIcon()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#d97706',
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {report.ticketId}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)', textTransform: 'capitalize' }}>
                  • {report.reportType.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                  • {report.module}
                </span>
              </div>
              <h3 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                {report.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-faint)',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Status Tracker Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: statusInfo.bg,
              border: `1px solid ${statusInfo.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: statusInfo.color
                }}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: statusInfo.color }}>
                  {statusInfo.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {statusInfo.desc}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>
              Logged on {new Date(report.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '14px',
              backgroundColor: 'var(--surface-2)',
              borderRadius: '10px',
              border: '1px solid var(--border)'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>PRIORITY</div>
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  marginTop: '3px',
                  textTransform: 'capitalize',
                  color:
                    report.priority === 'critical'
                      ? 'var(--danger)'
                      : report.priority === 'high'
                      ? '#ea580c'
                      : report.priority === 'medium'
                      ? 'var(--accent)'
                      : 'var(--success)'
                }}
              >
                {report.priority}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>SUBMITTED BY</div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginTop: '3px' }}>
                {report.reporterName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>AGENCY / TENANT</div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginTop: '3px' }}>
                {report.agencyName || 'Your Agency'}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              Submitted Query / Issue Details
            </h4>
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {report.description}
            </div>
          </div>

          {/* Reporter Contact Info */}
          {(report.reporterEmail || report.reporterPhone) && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                alignItems: 'center'
              }}
            >
              {report.reporterEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} color="var(--text-faint)" />
                  <span>{report.reporterEmail}</span>
                </div>
              )}
              {report.reporterPhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} color="var(--text-faint)" />
                  <span>{report.reporterPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Attachments Section */}
          {report.attachments && report.attachments.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                Attached Screenshots / Documents ({report.attachments.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {report.attachments.map((att, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      width: '160px',
                      backgroundColor: 'var(--surface-2)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedPreviewImage(att.url)}
                  >
                    {att.url.startsWith('data:video') || att.type?.startsWith('video') || att.url.endsWith('.mp4') || att.url.endsWith('.webm') ? (
                      <div style={{ height: '90px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000030' }}>
                        <video src={att.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      </div>
                    ) : att.url.startsWith('data:image') || att.url.endsWith('.png') || att.url.endsWith('.jpg') ? (
                      <div style={{ height: '90px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000010' }}>
                        <img src={att.url} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <Paperclip size={28} />
                      </div>
                    )}
                    <div style={{ padding: '6px 8px', fontSize: '11.5px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {att.name || `Attachment #${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Super Admin Support Team Response Section */}
          <div
            style={{
              marginTop: '4px',
              borderTop: '1px solid var(--border)',
              paddingTop: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="#d97706" />
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                Support & Super Admin Response
              </h4>
            </div>

            {report.resolutionNotes ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(217, 119, 6, 0.06)',
                  border: '1px solid rgba(217, 119, 6, 0.2)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  lineHeight: 1.6
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Response from Technical Team {report.resolvedAt ? `• ${new Date(report.resolvedAt).toLocaleDateString()}` : ''}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{report.resolutionNotes}</div>
              </div>
            ) : (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-faint)',
                  fontSize: '12.5px'
                }}
              >
                Our technical support team has logged your ticket and is actively looking into it. When an update or resolution note is provided, it will appear right here.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Image / Video Zoom Preview Lightbox */}
      {selectedPreviewImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%', display: 'flex', justifyContent: 'center' }}>
            {selectedPreviewImage.startsWith('data:video') || selectedPreviewImage.endsWith('.mp4') || selectedPreviewImage.endsWith('.webm') ? (
              <video
                controls
                autoPlay
                src={selectedPreviewImage}
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  borderRadius: '8px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              />
            ) : (
              <img
                src={selectedPreviewImage}
                alt="Attachment full view"
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  borderRadius: '8px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
