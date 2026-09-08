import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Shield,
  FileCheck,
  Wind,
  Settings,
  Tag,
  IdCard,
  UserCheck,
  HeartPulse,
  Calendar,
  Building2,
  Hash,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Edit3,
  Trash2,
  ExternalLink,
  Upload,
  Eye,
  Car,
  User,
  Save,
  RotateCcw,
  Check,
  Download
} from 'lucide-react';
import { DocumentCompliance } from '../../../types/fleet';
import { useFleet } from '../../../context/FleetContext';
import { useModalAnimation } from '../../../hooks/useModalAnimation';
import { ACCEPT_DOC_TYPES, isPdfDocument } from '../../../utils/fileUtils';

interface ComplianceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocumentCompliance | null;
}

export const ComplianceDetailModal: React.FC<ComplianceDetailModalProps> = ({
  isOpen,
  onClose,
  doc
}) => {
  const { updateComplianceDoc, deleteComplianceDoc } = useFleet();
  const { isClosing, handleClose } = useModalAnimation(onClose);

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable Form States
  const [documentName, setDocumentName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState('');
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when doc changes
  useEffect(() => {
    if (doc) {
      setIsEditing(false);
      setConfirmDelete(false);
      setShowFullImage(false);
      setFormError('');
      setDocumentName(doc.documentName || '');
      setDocumentNumber(doc.documentNumber || '');
      setIssuingAuthority(doc.issuingAuthority || '');
      setIssueDate(doc.issueDate ? doc.issueDate.split('T')[0] : '');
      setExpiryDate(doc.expiryDate ? doc.expiryDate.split('T')[0] : '');
      setNotes(doc.notes || '');
      setDocumentPhoto(doc.documentPhoto || null);
      setPhotoFileName(doc.documentPhoto ? 'Current proof copy' : '');
    }
  }, [doc, isOpen]);

  if (!isOpen || !doc) return null;

  // Icon mapping
  const getDocIcon = (name: string, size = 18) => {
    const n = (name || '').toLowerCase();
    if (n.includes('insurance')) return <Shield size={size} color="#38bdf8" />;
    if (n.includes('auth')) return <FileCheck size={size} color="#ffcc4d" />;
    if (n.includes('permit')) return <FileCheck size={size} color="#ffcc4d" />;
    if (n.includes('puc') || n.includes('pollution')) return <Wind size={size} color="var(--success)" />;
    if (n.includes('rc') || n.includes('registration')) return <FileText size={size} color="#38bdf8" />;
    if (n.includes('fitness')) return <Settings size={size} color="#ffcc4d" />;
    if (n.includes('tax')) return <Tag size={size} color="#a78bfa" />;
    if (n.includes('licence') || n.includes('license') || n.includes('dl')) return <IdCard size={size} color="var(--success)" />;
    if (n.includes('police')) return <UserCheck size={size} color="#38bdf8" />;
    if (n.includes('medical')) return <HeartPulse size={size} color="#f87171" />;
    return <FileText size={size} color="var(--accent)" />;
  };

  // Live status preview based on entered expiryDate
  const calculateLiveStatus = (expStr: string) => {
    if (!expStr) return { statusType: doc.statusType, label: doc.expiryLabel, days: doc.daysLeft ?? 0 };
    const exp = new Date(expStr);
    if (isNaN(exp.getTime())) return { statusType: doc.statusType, label: doc.expiryLabel, days: doc.daysLeft ?? 0 };

    const now = new Date();
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        statusType: 'late' as const,
        label: daysAgo === 1 ? 'Expired 1 day ago' : `Expired ${daysAgo} days ago`,
        days: diffDays
      };
    } else if (diffDays <= 30) {
      return {
        statusType: 'soon' as const,
        label: diffDays === 0 ? 'Expires today' : `In ${diffDays} days`,
        days: diffDays
      };
    } else {
      const months = Math.round(diffDays / 30);
      return {
        statusType: 'ok' as const,
        label: diffDays >= 365 ? `Valid · ${Math.round(diffDays / 365)} years` : `Valid · ${months} months`,
        days: diffDays
      };
    }
  };

  const liveStatus = calculateLiveStatus(expiryDate);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setFormError('Uploaded file must be less than 8MB.');
      return;
    }

    setPhotoFileName(file.name);
    setFormError('');

    const reader = new FileReader();
    reader.onload = () => {
      setDocumentPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Updates
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentName.trim()) {
      setFormError('Document name is required.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      await updateComplianceDoc(doc.id, {
        documentName: documentName.trim(),
        documentNumber: documentNumber.trim() || undefined,
        issuingAuthority: issuingAuthority.trim() || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes.trim() || undefined,
        documentPhoto: documentPhoto || null
      });
      setIsEditing(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    try {
      await deleteComplianceDoc(doc.id, doc.entityType);
      handleClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete document.');
    }
  };

  return (
    <>
      <div className={`opaque-glass-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
        <div
          className={`opaque-glass-dialog ${isClosing ? 'closing' : ''}`}
          style={{ maxWidth: 660 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {getDocIcon(isEditing ? documentName : doc.documentName, 22)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                    {doc.entityName}
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      background: doc.entityType === 'Vehicle' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(167, 139, 250, 0.15)',
                      color: doc.entityType === 'Vehicle' ? '#38bdf8' : '#a78bfa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {doc.entityType === 'Vehicle' ? <Car size={11} /> : <User size={11} />}
                    {doc.entityType}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-faint)', marginTop: '2px' }}>
                  {isEditing ? documentName : doc.documentName}
                  {(isEditing ? documentNumber : doc.documentNumber) && ` · #${isEditing ? documentNumber : doc.documentNumber}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Status pill in header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background:
                    liveStatus.statusType === 'late'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : liveStatus.statusType === 'soon'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(57, 255, 110, 0.15)',
                  color:
                    liveStatus.statusType === 'late'
                      ? 'var(--danger)'
                      : liveStatus.statusType === 'soon'
                      ? 'var(--warning)'
                      : 'var(--accent)'
                }}
              >
                {liveStatus.statusType === 'late' ? (
                  <AlertTriangle size={13} />
                ) : liveStatus.statusType === 'soon' ? (
                  <Clock size={13} />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                <span>{liveStatus.label}</span>
              </div>

              {/* Edit / View Toggle button */}
              <button
                type="button"
                className="btn-secondary"
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onClick={() => {
                  setIsEditing(!isEditing);
                  setConfirmDelete(false);
                  setFormError('');
                }}
              >
                {isEditing ? (
                  <>
                    <RotateCcw size={13} /> Cancel Edit
                  </>
                ) : (
                  <>
                    <Edit3 size={13} /> Edit Document
                  </>
                )}
              </button>

              <button
                type="button"
                className="modal-close-btn"
                onClick={handleClose}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div
            className="modal-body"
            style={{
              padding: '22px 24px',
              overflowY: 'auto',
              flex: '1 1 auto',
              minHeight: 0
            }}
          >
            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--danger)',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={15} />
                {formError}
              </div>
            )}

            {isEditing ? (
              /* ================= EDIT MODE ================= */
              <form id="edit-compliance-form" onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', display: 'block', marginBottom: '6px' }}>
                      Document Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={documentName}
                      onChange={e => setDocumentName(e.target.value)}
                      placeholder="e.g. Insurance, RC, Driving licence"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', display: 'block', marginBottom: '6px' }}>
                      Document Number / Policy #
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={documentNumber}
                      onChange={e => setDocumentNumber(e.target.value)}
                      placeholder="e.g. DL-0420110092341"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', display: 'block', marginBottom: '6px' }}>
                      Issue Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', display: 'block', marginBottom: '6px' }}>
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', display: 'block', marginBottom: '6px' }}>
                    Issuing Authority / Agency
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={issuingAuthority}
                    onChange={e => setIssuingAuthority(e.target.value)}
                    placeholder="e.g. ICICI Lombard GIC Ltd, Delhi RTO, STA"
                  />
                </div>

                {/* Proof copy upload */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', display: 'block', marginBottom: '6px' }}>
                    Document Copy / Photo Proof
                  </label>
                  <div
                    style={{
                      border: '1px dashed var(--border)',
                      borderRadius: '10px',
                      padding: '16px',
                      background: 'var(--surface-2)',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={ACCEPT_DOC_TYPES}
                      style={{ display: 'none' }}
                    />
                    {documentPhoto ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                            background: isPdfDocument(photoFileName, documentPhoto) ? 'rgba(239, 68, 68, 0.15)' : '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isPdfDocument(photoFileName, documentPhoto) ? (
                            <FileText size={24} color="#ef4444" />
                          ) : (
                            <img
                              src={documentPhoto}
                              alt="Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                            {photoFileName || 'Document copy attached'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--accent)' }}>
                            Click to replace photo or file
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload size={22} color="var(--accent)" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                          Click to upload document photo or PDF
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          PNG, JPG, PDF up to 8MB
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-faint)', display: 'block', marginBottom: '6px' }}>
                    Notes & Internal Remarks
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Endorsement verified with RTO, original copy stored in office filing cabinet"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </form>
            ) : (
              /* ================= VIEW MODE ================= */
              <div>
                {/* Key Details Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px'
                  }}
                >
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
                      <Hash size={13} /> Document #
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
                      {doc.documentNumber || <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>Not recorded</span>}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
                      <Calendar size={13} /> Expiry Date
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>
                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'None'}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
                      <Clock size={13} /> Status
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color:
                          doc.statusType === 'late'
                            ? 'var(--danger)'
                            : doc.statusType === 'soon'
                            ? 'var(--warning)'
                            : 'var(--accent)',
                        marginTop: '4px'
                      }}
                    >
                      {doc.expiryLabel}
                    </div>
                  </div>
                </div>

                {/* Additional Info Rows */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} /> Issuing Authority
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {doc.issuingAuthority || 'Regional Transport Office (RTO)'}
                    </span>
                  </div>

                  {doc.issueDate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> Issue Date
                      </span>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                        {new Date(doc.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}

                  {doc.notes && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '12.5px' }}>
                      <div style={{ color: 'var(--text-faint)', marginBottom: '4px', fontWeight: 600 }}>Notes / Remarks:</div>
                      <div style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{doc.notes}</div>
                    </div>
                  )}
                </div>

                {/* Document Copy / Proof Section */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Document Proof Copy
                    </span>
                    {doc.documentPhoto && (
                      <button
                        type="button"
                        className="bill-link"
                        style={{
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          padding: 0
                        }}
                        onClick={() => setShowFullImage(true)}
                      >
                        <Eye size={13} /> Open Full Size
                      </button>
                    )}
                  </div>

                  {doc.documentPhoto ? (
                    <div
                      style={{
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        background: 'rgba(0,0,0,0.3)',
                        maxHeight: '220px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => setShowFullImage(true)}
                      title="Click to view full preview"
                    >
                      {doc.documentPhoto.startsWith('data:image') || doc.documentPhoto.startsWith('http') ? (
                        <img
                          src={doc.documentPhoto}
                          alt="Document Proof"
                          style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ padding: '30px', textAlign: 'center' }}>
                          <FileText size={36} color="var(--accent)" />
                          <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '8px' }}>
                            Document copy attached
                          </div>
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ExternalLink size={12} /> Click to expand
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        background: 'var(--surface-2)',
                        borderRadius: '10px',
                        border: '1px dashed var(--border)'
                      }}
                    >
                      <FileText size={24} color="var(--text-faint)" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '12.5px', color: 'var(--text-faint)' }}>
                        No document proof uploaded yet
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '11.5px', padding: '4px 10px', marginTop: '10px' }}
                        onClick={() => setIsEditing(true)}
                      >
                        <Upload size={12} style={{ marginRight: '4px' }} /> Upload Copy Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer"
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-2)'
            }}
          >
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-compliance-form"
                  className="btn-primary-action"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={isSaving}
                >
                  <Save size={14} />
                  {isSaving ? 'Saving Changes…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                {confirmDelete ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
                      Are you sure?
                    </span>
                    <button
                      type="button"
                      className="btn-primary-action"
                      style={{ background: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '11.5px', padding: '5px 10px' }}
                      onClick={handleDelete}
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '11.5px', padding: '5px 10px' }}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={13} /> Delete Document
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn-primary-action"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 size={14} /> Edit Document
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* High-res Image Zoom Lightbox */}
      {showFullImage && doc.documentPhoto && (
        <div
          className="opaque-glass-overlay"
          style={{ zIndex: 1100, background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setShowFullImage(false)}
        >
          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '14px' }}>
                {doc.entityName} — {doc.documentName} Proof
              </div>
              <button
                type="button"
                className="modal-close-btn"
                style={{ color: '#fff', background: 'rgba(255,255,255,0.2)' }}
                onClick={() => setShowFullImage(false)}
              >
                <X size={18} />
              </button>
            </div>
            {isPdfDocument(photoFileName, doc.documentPhoto) ? (
              <iframe
                src={doc.documentPhoto}
                title="PDF Document Viewer"
                style={{
                  width: '80vw',
                  height: '75vh',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ffffff'
                }}
              />
            ) : (
              <img
                src={doc.documentPhoto}
                alt={doc.documentName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  borderRadius: '8px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
