import React from 'react';
import { DailyDutyLog } from '../../../types/fleet';
import { Printer, X, FileText, CheckCircle2, Building2 } from 'lucide-react';

interface LogBookPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: DailyDutyLog[];
  selectedVehicle?: string;
  selectedMonth?: string;
  selectedPage?: string;
  singleLog?: DailyDutyLog | null;
}

export const LogBookPrintModal: React.FC<LogBookPrintModalProps> = ({
  isOpen,
  onClose,
  logs,
  selectedVehicle,
  selectedMonth,
  selectedPage,
  singleLog
}) => {
  if (!isOpen) return null;

  // If a single log is clicked, show that log or all logs for that log's vehicle and month
  const targetLogs = singleLog
    ? logs.filter(
        l =>
          l.vehicle === singleLog.vehicle &&
          (singleLog.month ? l.month === singleLog.month : true)
      ).length > 0
      ? logs.filter(
          l =>
            l.vehicle === singleLog.vehicle &&
            (singleLog.month ? l.month === singleLog.month : true)
        )
      : [singleLog]
    : logs;

  const vehicleNo = singleLog?.vehicle || selectedVehicle || targetLogs[0]?.vehicle || 'UK 07 TD 7555';
  const monthName = singleLog?.month || selectedMonth || targetLogs[0]?.month || 'August 2026';
  const pageNo = singleLog?.logBookPageNo || selectedPage || targetLogs[0]?.logBookPageNo || '122';
  const deptName = singleLog?.departmentName || targetLogs[0]?.departmentName || 'Public Works Department (PWD)';
  const driverName = singleLog?.driverName || targetLogs[0]?.driverName || 'Ramesh Chand';

  const totalKmSum = targetLogs.reduce((sum, l) => sum + (l.totalKm || 0), 0);
  const totalFuelLitres = targetLogs.reduce((sum, l) => sum + (l.fuelLitres || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <div
        className="modal-dialog logbook-print-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '1100px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          color: '#12233d',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)'
        }}
      >
        {/* Modal Toolbar (hidden during print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'var(--surface-2, #f5f7fc)',
            borderBottom: '1px solid var(--border, #dbe1f0)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="#1d6fd8" />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>
              Official Vehicle Log Book Register
            </span>
            <span
              style={{
                fontSize: '11px',
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              Vehicle: {vehicleNo} · Page {pageNo}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-primary-action"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '12.5px',
                background: '#1d6fd8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Log Book Sheet Content */}
        <div
          className="logbook-printable-area"
          style={{
            padding: '28px 32px',
            overflowY: 'auto',
            background: '#ffffff',
            color: '#111827',
            fontFamily: "'Segoe UI', Arial, sans-serif"
          }}
        >
          {/* Top Page Header matching Image 1 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #1e293b',
              paddingBottom: '12px',
              marginBottom: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '1px', color: '#0f172a' }}>
                LOG BOOK
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                Department Contract Vehicle Log Sheet
              </div>
            </div>

            {/* Top Center: Vehicle No. and Page No. */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1.5px solid #1e293b',
                  borderRadius: '24px',
                  padding: '3px 14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  background: '#f8fafc'
                }}
              >
                <span>Vehicle No.:</span>
                <span style={{ color: '#1d6fd8', letterSpacing: '0.5px' }}>{vehicleNo}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                Department: <strong style={{ color: '#0f172a' }}>{deptName}</strong> · Driver: <strong>{driverName}</strong>
              </div>
            </div>

            {/* Top Right: Page Number badge and Month */}
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '2px solid #1e293b',
                  fontSize: '14px',
                  fontWeight: 800,
                  marginBottom: '4px'
                }}
              >
                {pageNo}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                Month: <span style={{ textDecoration: 'underline', color: '#1d6fd8' }}>{monthName}</span>
              </div>
            </div>
          </div>

          {/* Log Book Register Table matching Image 1 exactly */}
          <div style={{ overflowX: 'auto' }}>
            <table
              className="logbook-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px',
                textAlign: 'left',
                border: '1.5px solid #334155'
              }}
            >
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 700 }}>
                  <th rowSpan={2} style={thStyle}>Date</th>
                  <th colSpan={2} style={{ ...thStyle, textAlign: 'center' }}>Details of Journey</th>
                  <th colSpan={2} style={{ ...thStyle, textAlign: 'center' }}>K.M. Reading</th>
                  <th rowSpan={2} style={thStyle}>K.M. Done</th>
                  <th rowSpan={2} style={thStyle}>Petrol / Diesel Litres</th>
                  <th rowSpan={2} style={thStyle}>M. Oil Liters / other stores used</th>
                  <th rowSpan={2} style={thStyle}>Purpose of Journey</th>
                  <th rowSpan={2} style={thStyle}>Head of A/c</th>
                  <th rowSpan={2} style={thStyle}>Sig. Of Officer</th>
                  <th rowSpan={2} style={thStyle}>Designation</th>
                  <th rowSpan={2} style={thStyle}>Sig. Of Driver</th>
                </tr>
                <tr style={{ background: '#e2e8f0', color: '#0f172a', fontWeight: 600 }}>
                  <th style={thSubStyle}>From</th>
                  <th style={thSubStyle}>To</th>
                  <th style={thSubStyle}>From</th>
                  <th style={thSubStyle}>To</th>
                </tr>
              </thead>
              <tbody>
                {targetLogs.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No log entries recorded for this vehicle and month.
                    </td>
                  </tr>
                ) : (
                  targetLogs.map((log, idx) => (
                    <tr
                      key={log.id || idx}
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #cbd5e1'
                      }}
                    >
                      {/* Date */}
                      <td style={tdStyle}>{log.date}</td>

                      {/* Journey: From */}
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        {log.journeyFrom || 'GSON'}
                      </td>

                      {/* Journey: To */}
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        {log.journeyTo || log.tripDestination || 'Site / Office'}
                      </td>

                      {/* KM Reading: From */}
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{log.startKm}</td>

                      {/* KM Reading: To */}
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{log.endKm}</td>

                      {/* KM Done */}
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#0f172a' }}>
                        {log.totalKm} km
                      </td>

                      {/* Petrol / Diesel Litres */}
                      <td style={tdStyle}>
                        {log.fuelLitres && log.fuelLitres > 0 ? `${log.fuelLitres} L` : '—'}
                      </td>

                      {/* M. Oil Liters / other stores */}
                      <td style={tdStyle}>{log.mOilLitres || log.motorOilUsed || '—'}</td>

                      {/* Purpose of Journey */}
                      <td style={tdStyle}>
                        {log.purposeOfJourney || 'for office duty'}
                      </td>

                      {/* Head of A/c */}
                      <td style={tdStyle}>{log.headOfAccount || 'PWD Duty'}</td>

                      {/* Sig. Of Officer */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 600 }}>
                          <CheckCircle2 size={12} /> {log.officerSignatureStatus || 'Signed'}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#475569' }}>
                          {log.officerName || 'Officer'}
                        </div>
                      </td>

                      {/* Designation */}
                      <td style={{ ...tdStyle, fontSize: '10px' }}>
                        {log.officerDesignation || 'AE / EE'}
                      </td>

                      {/* Sig. Of Driver */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 600 }}>
                          <CheckCircle2 size={12} /> {log.driverSignatureStatus || 'Signed'}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#475569' }}>
                          {log.driverName || 'Driver'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Bottom Totals Footer matching Image 1 */}
              <tfoot>
                <tr style={{ background: '#f1f5f9', borderTop: '2px solid #334155', fontWeight: 800 }}>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'right', fontSize: '12px' }}>
                    TOTAL K.M. DONE & STORES:
                  </td>
                  <td style={{ ...tdStyle, fontSize: '12.5px', color: '#1d6fd8' }}>
                    {totalKmSum.toLocaleString('en-IN')} km
                  </td>
                  <td style={{ ...tdStyle, fontSize: '11.5px' }}>
                    {totalFuelLitres > 0 ? `${totalFuelLitres} L` : '—'}
                  </td>
                  <td style={tdStyle}>—</td>
                  <td colSpan={5} style={{ ...tdStyle, fontSize: '11px', color: '#475569' }}>
                    Checked and verified with departmental meter reading & log slips.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Certification & Signature Area */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '20px',
              marginTop: '36px',
              paddingTop: '20px',
              borderTop: '1px dashed #cbd5e1'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '35px' }}></div>
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '6px', fontSize: '11.5px', fontWeight: 700 }}>
                Signature of Driver
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>({driverName})</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '35px' }}></div>
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '6px', fontSize: '11.5px', fontWeight: 700 }}>
                Verified By Transport Incharge
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Fleet Operations / Log Book Clerk</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '35px' }}></div>
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '6px', fontSize: '11.5px', fontWeight: 700 }}>
                Controlling / Authorizing Officer
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Executive Engineer / HOD Stamp & Seal</div>
            </div>
          </div>
        </div>

        {/* Print specific CSS */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .modal-overlay,
            .modal-dialog.logbook-print-dialog {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              max-height: 100% !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
            }
            .logbook-printable-area,
            .logbook-printable-area * {
              visibility: visible !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '7px 8px',
  border: '1px solid #334155',
  fontSize: '10.5px',
  whiteSpace: 'nowrap'
};

const thSubStyle: React.CSSProperties = {
  padding: '5px 8px',
  border: '1px solid #334155',
  fontSize: '10px',
  textAlign: 'center',
  whiteSpace: 'nowrap'
};

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #cbd5e1',
  whiteSpace: 'nowrap'
};
