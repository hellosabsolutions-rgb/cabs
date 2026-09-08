import React, { useState } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  LifeBuoy
} from 'lucide-react';
import { api } from '../../../services/api';
import { IssueReportItem } from '../../../types/report';
import { useAuth } from '../../../context/AuthContext';
import { useAgency } from '../../../context/AgencyContext';
import { useFleet } from '../../../context/FleetContext';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReport: IssueReportItem) => void;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { currentAgency } = useAgency();
  const { showToast } = useFleet();

  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'File size exceeds 10MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachments(prev => [
        ...prev,
        {
          name: file.name,
          url: reader.result as string,
          type: file.type
        }
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!heading.trim()) {
      setErrorMsg('Please enter a heading/title for your report or query.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please write a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: heading.trim(),
        description: description.trim(),
        reportType: 'issue',
        module: 'General',
        priority: 'medium',
        reporterName: user?.name || currentAgency?.name || 'Administrator',
        reporterEmail: user?.email || currentAgency?.email || '',
        reporterPhone: user?.phone || currentAgency?.phone || '',
        attachments,
        agencyId: currentAgency?.id || currentAgency?._id || undefined,
        agencyName: currentAgency?.name || undefined,
        userId: user?.id || undefined
      };

      const res = await api.post('/reports', payload);
      if (res.success && res.data) {
        showToast('success', `Report ${res.data.ticketId} submitted successfully!`);
        onSuccess(res.data);
        setHeading('');
        setDescription('');
        setAttachments([]);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to submit report.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with server.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        zIndex: 1050,
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
          maxWidth: '580px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          fontFamily: "'Poppins', sans-serif"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
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
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(217, 119, 6, 0.25)'
              }}
            >
              <LifeBuoy size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                Report Issue or Raise Query
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-faint)' }}>
                Send your issue or question directly to technical support
              </p>
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
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '22px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {errorMsg && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: 'var(--danger)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Heading */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              Heading / Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={heading}
              onChange={e => setHeading(e.target.value)}
              placeholder="e.g. Issue in driver payroll calculation or query regarding billing"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '9px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '13.5px',
                fontFamily: "'Poppins', sans-serif",
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              Description <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe the issue or query in detail..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '9px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '13.5px',
                fontFamily: "'Poppins', sans-serif",
                resize: 'vertical',
                outline: 'none',
                minHeight: '110px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* Supportive Image or Video */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                Supportive Image or Video (Optional)
              </label>
              <span style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>Max 10MB</span>
            </div>

            <label
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: '1.5px dashed var(--border)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-muted)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
            >
              <Upload size={18} color="#d97706" />
              <span>Click to upload screenshot, photo, or screen recording video</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            {/* Attached files preview list */}
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      fontSize: '12.5px',
                      color: 'var(--text)'
                    }}
                  >
                    {att.type.startsWith('video') ? (
                      <VideoIcon size={16} color="#d97706" />
                    ) : (
                      <ImageIcon size={16} color="#d97706" />
                    )}
                    <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger)',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '4px'
                      }}
                      title="Remove file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                height: '38px',
                padding: '0 18px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#d97706',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 3px rgba(217, 119, 6, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
