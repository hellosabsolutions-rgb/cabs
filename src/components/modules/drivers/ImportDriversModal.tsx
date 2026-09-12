import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  HelpCircle,
  RefreshCw,
  Users
} from 'lucide-react';
import {
  downloadDriverExcelTemplate,
  parseDriverFile,
  CsvParseResult
} from '../../../utils/csvHelper';
import { useFleet } from '../../../context/FleetContext';

interface ImportDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportDriversModal: React.FC<ImportDriversModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { bulkAddDrivers } = useFleet();

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [importSummary, setImportSummary] = useState<{ created: number; updated?: number; skipped?: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setFileName('');
    setParseResult(null);
    setSubmitError('');
    setImportSummary(null);
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadDriverExcelTemplate();
  };

  const processFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isExcelOrCsv =
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv');

    if (!isExcelOrCsv) {
      setSubmitError('Please select a valid Excel (.xlsx, .xls) or .csv file.');
      return;
    }

    setIsProcessingFile(true);
    setSubmitError('');
    setFileName(file.name);
    setImportSummary(null);

    try {
      const result = await parseDriverFile(file);
      setParseResult(result);
      if (result.validDrivers.length === 0 && result.totalRows > 0) {
        setSubmitError('No valid driver records found in this file. Please verify required fields (Full Name, Phone).');
      }
    } catch (err: any) {
      setSubmitError(`Failed to parse file: ${err.message || 'Corrupted or unsupported format'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleResetFile = () => {
    setFileName('');
    setParseResult(null);
    setSubmitError('');
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.validDrivers.length === 0) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await bulkAddDrivers(parseResult.validDrivers);
      if (res && res.success) {
        setImportSummary({
          created: res.summary?.created ?? res.count ?? parseResult.validDrivers.length,
          updated: res.summary?.updated ?? 0,
          skipped: res.summary?.skipped ?? 0
        });
        if (onSuccess) onSuccess();
      } else {
        setSubmitError(res?.error || 'Failed to import drivers. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred during import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="modal-content panel"
        style={{
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface, #1e222d)',
          borderRadius: '16px',
          border: '1px solid var(--border, rgba(255,255,255,0.1))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))',
            background: 'var(--surface-2, rgba(255,255,255,0.03))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(22, 135, 245, 0.2), rgba(22, 135, 245, 0.05))',
                border: '1px solid rgba(22, 135, 245, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent, #1687F5)'
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text, #ffffff)' }}>
                Import Drivers via Excel
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                Bulk onboard multiple drivers at once using an Excel (.xlsx) spreadsheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* STEP 1: DOWNLOAD TEMPLATE CALLOUT */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(22, 135, 245, 0.1) 0%, rgba(22, 135, 245, 0.03) 100%)',
              border: '1px solid rgba(22, 135, 245, 0.25)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(22, 135, 245, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent, #1687F5)',
                  flexShrink: 0
                }}
              >
                <Download size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text, #ffffff)' }}>
                  Download Excel Template (.xlsx)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  Pre-formatted Excel sheet with column headers and sample driver data
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#ffffff',
                background: 'var(--accent, #1687F5)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22, 135, 245, 0.3)',
                transition: 'transform 0.15s ease, opacity 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.92')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <FileSpreadsheet size={15} />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>

          {/* SUCCESS MESSAGE AFTER IMPORT */}
          {importSummary && (
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4ade80' }}>
                <CheckCircle2 size={22} />
                <span style={{ fontSize: '15px', fontWeight: 700 }}>
                  Drivers Onboarded Successfully!
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text, #ffffff)' }}>
                Processed <strong>{importSummary.created + (importSummary.updated || 0)}</strong> drivers
                ({importSummary.created} newly added
                {importSummary.updated ? `, ${importSummary.updated} updated` : ''}
                {importSummary.skipped ? `, ${importSummary.skipped} skipped` : ''}).
                All vehicle assignments and licence compliance records have been synchronized.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: '8px 18px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent, #1687F5)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Done & View Drivers
                </button>
                <button
                  type="button"
                  onClick={handleResetFile}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted, #94a3b8)',
                    border: '1px solid var(--border, rgba(255,255,255,0.15))',
                    cursor: 'pointer'
                  }}
                >
                  Import Another File
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DROP ZONE / UPLOAD (Hidden if import completed) */}
          {!importSummary && !parseResult && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--accent, #1687F5)' : 'var(--border, rgba(255,255,255,0.2))'}`,
                  borderRadius: '14px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  backgroundColor: dragActive
                    ? 'rgba(22, 135, 245, 0.08)'
                    : 'var(--surface-2, rgba(255,255,255,0.02))',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: dragActive ? 'var(--accent, #1687F5)' : 'var(--text-muted, #94a3b8)'
                  }}
                >
                  <Upload size={28} />
                </div>

                <div>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text, #ffffff)' }}>
                    Drop your filled Driver Excel (.xlsx) file here, or{' '}
                    <span style={{ color: 'var(--accent, #1687F5)', textDecoration: 'underline' }}>
                      browse computer
                    </span>
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '4px' }}>
                    Accepts Excel (.xlsx, .xls) and .csv spreadsheets up to 10MB
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginTop: '8px',
                    fontSize: '11.5px',
                    color: 'var(--text-muted, #94a3b8)',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} style={{ color: '#4ade80' }} /> Name & Phone required
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} style={{ color: '#4ade80' }} /> Auto-links assigned vehicle
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} style={{ color: '#4ade80' }} /> Auto-creates DL compliance
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ERROR ALERT */}
          {submitError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '12.5px'
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{submitError}</div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION RESULTS */}
          {!importSummary && parseResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* FILE METRICS BAR */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'var(--surface-2, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} style={{ color: 'var(--accent, #1687F5)' }} />
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text, #ffffff)' }}>
                    {fileName}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--text-muted, #94a3b8)'
                    }}
                  >
                    {parseResult.totalRows} Total Rows
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#4ade80',
                      background: 'rgba(34, 197, 94, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '20px'
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {parseResult.validDrivers.length} Valid
                  </span>

                  {parseResult.errorCount > 0 && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#f87171',
                        background: 'rgba(239, 68, 68, 0.15)',
                        padding: '4px 10px',
                        borderRadius: '20px'
                      }}
                    >
                      <AlertCircle size={14} />
                      {parseResult.errorCount} Issues
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      color: 'var(--text-muted, #94a3b8)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                  >
                    <RefreshCw size={13} />
                    Change File
                  </button>
                </div>
              </div>

              {/* ISSUE NOTICE IF ANY */}
              {parseResult.errorCount > 0 && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '12px',
                    color: '#fbbf24'
                  }}
                >
                  <strong>Note:</strong> {parseResult.errorCount} row(s) have missing required fields (marked in red). Only the {parseResult.validDrivers.length} valid drivers will be imported.
                </div>
              )}

              {/* DATA PREVIEW TABLE */}
              <div
                style={{
                  maxHeight: '340px',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  borderRadius: '10px',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))'
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <thead
                    style={{
                      background: 'var(--surface-2, rgba(255,255,255,0.05))',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))'
                    }}
                  >
                    <tr>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>#</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Driver Name</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Phone</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Assigned Vehicle</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>License No.</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Salary</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.parsedRows.map(row => (
                      <tr
                        key={row.rowNumber}
                        style={{
                          borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))',
                          backgroundColor: row.isValid
                            ? 'transparent'
                            : 'rgba(239, 68, 68, 0.08)'
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)' }}>
                          {row.rowNumber}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: row.data.name ? 'var(--text, #ffffff)' : '#f87171' }}>
                          {row.data.name || <em>Missing Name</em>}
                        </td>
                        <td style={{ padding: '10px 12px', color: row.data.phone ? 'var(--text, #ffffff)' : '#f87171' }}>
                          {row.data.phone || <em>Missing Phone</em>}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.08)',
                              color: 'var(--text, #ffffff)'
                            }}
                          >
                            {row.data.driverType || 'Full Time'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text, #ffffff)' }}>
                          {row.data.assignedVehicle || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted, #94a3b8)', fontFamily: 'monospace' }}>
                          {row.data.licenseNumber || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text, #ffffff)' }}>
                          {row.data.monthlySalary ? `₹${row.data.monthlySalary.toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: row.data.status === 'On duty' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.08)',
                              color: row.data.status === 'On duty' ? '#4ade80' : 'var(--text-muted, #94a3b8)'
                            }}
                          >
                            {row.data.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {row.isValid ? (
                            <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> Ready
                            </span>
                          ) : (
                            <span
                              style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title={row.errors.join(', ')}
                            >
                              <AlertCircle size={13} /> {row.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid var(--border, rgba(255,255,255,0.1))',
            background: 'var(--surface-2, rgba(255,255,255,0.02))'
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
            {parseResult ? (
              <span>
                <strong>{parseResult.validDrivers.length}</strong> driver(s) will be created or synced.
              </span>
            ) : (
              <span>Fields supported: Name, Phone, License, Vehicle, Salary, Status, Address</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text, #ffffff)',
                background: 'transparent',
                border: '1px solid var(--border, rgba(255,255,255,0.15))',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              Cancel
            </button>

            {parseResult && parseResult.validDrivers.length > 0 && !importSummary && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: isSubmitting ? 'rgba(22, 135, 245, 0.6)' : 'var(--accent, #1687F5)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(22, 135, 245, 0.35)',
                  transition: 'opacity 0.15s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    <span>Onboarding {parseResult.validDrivers.length} Drivers...</span>
                  </>
                ) : (
                  <>
                    <Users size={15} />
                    <span>Onboard {parseResult.validDrivers.length} Drivers</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
