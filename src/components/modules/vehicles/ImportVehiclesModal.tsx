import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Truck,
  Building2,
  Briefcase
} from 'lucide-react';
import { useFleet } from '../../../context/FleetContext';
import {
  downloadVehicleExcelTemplate,
  parseVehicleFile,
  VehicleCsvParseResult
} from '../../../utils/csvHelper';

interface ImportVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportVehiclesModal: React.FC<ImportVehiclesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { bulkAddVehicles } = useFleet();

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [parseResult, setParseResult] = useState<VehicleCsvParseResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [importSummary, setImportSummary] = useState<{
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    downloadVehicleExcelTemplate();
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
      const result = await parseVehicleFile(file);
      setParseResult(result);
      if (result.validVehicles.length === 0 && result.totalRows > 0) {
        setSubmitError('No valid vehicle records found. Please ensure Registration Number is present in each row.');
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
    if (!parseResult || parseResult.validVehicles.length === 0) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await bulkAddVehicles(parseResult.validVehicles);
      if (res && res.success) {
        setImportSummary({
          created: res.summary?.created ?? res.count ?? parseResult.validVehicles.length,
          updated: res.summary?.updated ?? 0,
          skipped: res.summary?.skipped ?? 0
        });
        if (onSuccess) onSuccess();
      } else {
        setSubmitError(res?.error || 'Failed to import vehicles. Please try again.');
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
          maxWidth: '880px',
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
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.05))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text, #ffffff)',
                  letterSpacing: '-0.02em'
                }}
              >
                Bulk Onboard Fleet Vehicles
              </h2>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '12.5px',
                  color: 'var(--text-muted, #94a3b8)'
                }}
              >
                Import your vehicle fleet using our pre-formatted Excel template
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
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
              transition: 'background-color 0.15s'
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
            gap: '20px',
            flex: 1
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
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0.03) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  flexShrink: 0
                }}
              >
                <Download size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text, #ffffff)' }}>
                  Download Dummy Excel Template (.xlsx)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  Pre-formatted Excel sheet with column headers and sample vehicle data (no images needed)
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
                background: '#0284c7',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.92')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <FileSpreadsheet size={15} />
              <span>Download Excel Template (.xlsx)</span>
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
                  Vehicles Onboarded Successfully!
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text, #ffffff)' }}>
                Processed <strong>{importSummary.created + (importSummary.updated || 0)}</strong> vehicles
                ({importSummary.created} newly registered
                {importSummary.updated ? `, ${importSummary.updated} updated` : ''}
                {importSummary.skipped ? `, ${importSummary.skipped} skipped` : ''}).
                All compliance records (RC, Insurance, PUC, Permit, Fitness) have been auto-synchronized.
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
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Done & View Fleet
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
                  border: `2px dashed ${dragActive ? '#38bdf8' : 'var(--border, rgba(255,255,255,0.2))'}`,
                  borderRadius: '14px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  backgroundColor: dragActive
                    ? 'rgba(56, 189, 248, 0.08)'
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
                    color: dragActive ? '#38bdf8' : 'var(--text-muted, #94a3b8)'
                  }}
                >
                  <Upload size={28} />
                </div>

                <div>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text, #ffffff)' }}>
                    Drop your filled Vehicle Excel (.xlsx) file here, or{' '}
                    <span style={{ color: '#38bdf8', textDecoration: 'underline' }}>
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
                    <CheckCircle2 size={13} style={{ color: '#4ade80' }} /> Registration Number required
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} style={{ color: '#4ade80' }} /> No image uploads needed in bulk
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} style={{ color: '#4ade80' }} /> Auto-creates 5 compliance expiry records
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
                  <FileSpreadsheet size={20} color="#38bdf8" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text, #ffffff)' }}>
                    {fileName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: '4px' }}>
                    ({parseResult.totalRows} rows detected)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      fontSize: '11.5px',
                      fontWeight: 600
                    }}
                  >
                    <CheckCircle2 size={13} />
                    {parseResult.validVehicles.length} Ready to Onboard
                  </div>

                  {parseResult.errorCount > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        fontSize: '11.5px',
                        fontWeight: 600
                      }}
                    >
                      <AlertTriangle size={13} />
                      {parseResult.errorCount} Errors (Skipped)
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFile}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border, rgba(255,255,255,0.15))',
                      color: 'var(--text-muted, #94a3b8)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* TABLE PREVIEW */}
              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  borderRadius: '10px',
                  background: 'var(--surface-2, rgba(255,255,255,0.02))'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr
                      style={{
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'var(--surface, #1e222d)',
                        borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))',
                        color: 'var(--text-faint, #64748b)',
                        textAlign: 'left'
                      }}
                    >
                      <th style={{ padding: '10px 12px', width: '50px' }}>#</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Registration</th>
                      <th style={{ padding: '10px 12px' }}>Type</th>
                      <th style={{ padding: '10px 12px' }}>Model / Make</th>
                      <th style={{ padding: '10px 12px' }}>Assigned To</th>
                      <th style={{ padding: '10px 12px' }}>Driver</th>
                      <th style={{ padding: '10px 12px' }}>Vehicle Status</th>
                      <th style={{ padding: '10px 12px' }}>Fuel / Odo</th>
                      <th style={{ padding: '10px 12px' }}>FASTag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.parsedRows.map(row => (
                      <tr
                        key={row.rowNumber}
                        style={{
                          borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))',
                          backgroundColor: row.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.04)'
                        }}
                      >
                        <td style={{ padding: '8px 12px', color: 'var(--text-faint)' }}>
                          {row.rowNumber}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {row.isValid ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#4ade80',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              <CheckCircle2 size={13} /> Valid
                            </span>
                          ) : (
                            <span
                              title={row.errors.join(', ')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#f87171',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'help'
                              }}
                            >
                              <AlertCircle size={13} /> {row.errors[0]}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text)' }}>
                          {row.data.registrationNumber || '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            className={`tag ${row.data.type === 'Department' ? 'dept' : 'trip'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            {row.data.type === 'Department' ? <Building2 size={10} /> : <Briefcase size={10} />}
                            {row.data.type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {row.data.model || '—'}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {row.data.assignedTo || '—'}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {row.data.assignedDriver || '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              backgroundColor:
                                row.data.status === 'Running' || row.data.status === 'Active'
                                  ? 'rgba(34, 197, 94, 0.15)'
                                  : row.data.status === 'Maintenance'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(148, 163, 184, 0.15)',
                              color:
                                row.data.status === 'Running' || row.data.status === 'Active'
                                  ? '#4ade80'
                                  : row.data.status === 'Maintenance'
                                  ? '#f87171'
                                  : '#cbd5e1'
                            }}
                          >
                            {row.data.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {row.data.fuelType || '—'} • {row.data.odometer ? `${row.data.odometer.toLocaleString()} km` : '0 km'}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {row.data.fastagBalance !== undefined ? `₹${row.data.fastagBalance}` : '—'}
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
            padding: '16px 24px',
            borderTop: '1px solid var(--border, rgba(255,255,255,0.1))',
            background: 'var(--surface-2, rgba(255,255,255,0.03))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>
            * Images can be uploaded later via individual vehicle profile
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
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--border, rgba(255,255,255,0.15))',
                color: 'var(--text-muted, #94a3b8)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>

            {!importSummary && parseResult && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isSubmitting || parseResult.validVehicles.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: parseResult.validVehicles.length === 0 ? 'rgba(56, 189, 248, 0.4)' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  cursor: isSubmitting || parseResult.validVehicles.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    <span>Onboarding Vehicles...</span>
                  </>
                ) : (
                  <>
                    <FileCheck size={15} />
                    <span>Confirm & Onboard {parseResult.validVehicles.length} Vehicles</span>
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
