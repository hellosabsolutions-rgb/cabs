import React, { useRef } from 'react';
import { DailyDutyLog, MonthlyDepartmentBill } from '../../../types/fleet';
import { Printer, X } from 'lucide-react';

interface WeekendTripBillModalProps {
  log?: DailyDutyLog | null;
  bill?: MonthlyDepartmentBill | null;
  onClose: () => void;
  companyName?: string;
  companySub?: string;
  companyAddress?: string;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
}

export const WeekendTripBillModal: React.FC<WeekendTripBillModalProps> = ({
  log,
  bill,
  onClose,
  companyName = 'KABPRO',
  companySub = 'GOVT. CONTRACTOR AND FLEET OWNER',
  companyAddress = '78, Rajpur Road, Radha Palace Complex, Opp. R.T.O. Office, Dehradun - 248001 (Uttarakhand)',
  gstin = '05ABZPB8720C1ZQ',
  pan = 'ABZPB8720C',
  phone = '9837008255, 7300881555',
  email = 'kabpro.fleet@gmail.com',
  bankName = 'State Bank of India, Rajpur Road, D.Dun',
  bankAccount = '10587398870',
  bankIfsc = 'SBIN0005713'
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Pricing calculations (either from DailyDutyLog or from MonthlyDepartmentBill)
  const basePrice = Number(bill?.baseContractAmount ?? log?.packageBasePrice) || 2255;
  const freeKm = Number(bill?.packageFreeKm ?? log?.packageFreeKm) || 80;
  const totalKm = Number(bill?.totalKmRun ?? log?.totalKm) || Math.max(0, ((log?.endKm || 0) - (log?.startKm || 0)));
  const extraKm = Math.max(0, totalKm - freeKm);
  const extraKmRate = Number(bill?.extraKmRate ?? log?.extraKmRate) || 14;
  const extraKmCost = (bill ? bill.extraKmCost : log?.extraKmCost) ?? (extraKm * extraKmRate);
  const tollParking = Number((bill ? bill.tollParkingCost : log?.tollParkingAmount)) || 0;
  const extraFuel = Number((bill ? bill.fuelCost : (log?.extraFuelCost || log?.fuelAmount))) || 0;

  const subtotal = bill?.subtotal ?? (basePrice + extraKmCost + tollParking + extraFuel);
  const gstRate = (bill?.gstRate ?? log?.gstRate) !== undefined ? Number(bill?.gstRate ?? log?.gstRate) : 5;
  const gstType = (bill?.gstType || (log?.igstAmount && log.igstAmount > 0 ? 'IGST' : 'CGST_SGST'));
  const gstAmount = (bill?.gstAmount ?? log?.gstAmount) !== undefined ? Number(bill?.gstAmount ?? log?.gstAmount) : Math.round((subtotal * gstRate) / 100);

  const cgst = (bill?.cgstAmount ?? log?.cgstAmount) !== undefined ? Number(bill?.cgstAmount ?? log?.cgstAmount) : Math.round(gstAmount / 2);
  const sgst = (bill?.sgstAmount ?? log?.sgstAmount) !== undefined ? Number(bill?.sgstAmount ?? log?.sgstAmount) : gstAmount - cgst;
  const igst = (bill?.igstAmount ?? log?.igstAmount) !== undefined ? Number(bill?.igstAmount ?? log?.igstAmount) : (gstType === 'IGST' ? gstAmount : 0);

  const grandTotal = (bill?.totalBill ?? log?.totalFare) !== undefined && (bill?.totalBill || log?.totalFare || 0) > 0 ? (bill?.totalBill ?? log?.totalFare ?? 0) : (subtotal + gstAmount);

  const dutySlipNumber = bill?.billNumber || log?.dutySlipNumber || '3454';
  const departmentName = bill?.departmentName || log?.departmentName || 'Director Horticulture Mission';
  const vehicle = bill?.vehicle || log?.vehicle || 'UK07TE9755';
  const dateStr = bill?.dutyStartDate || log?.date || '2026-07-31';
  const journeyFrom = bill?.journeyFrom || log?.journeyFrom || 'D.Dun Ranipokhari';
  const journeyTo = bill?.journeyTo || log?.journeyTo || log?.tripDestination || 'Vikasnagar & Local to D.Dun';
  const officerName = log?.officerName || '';

  // Number to words (Indian system)
  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convert = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    return convert(Math.round(num)) + ' Rupees Only';
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) return;

    const origin = window.location.origin;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CashMemo_${dutySlipNumber}_KABPRO</title>
        <base href="${origin}/" />
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #111;
            background: #fff;
            padding: 0;
            font-size: 12.5px;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bill-wrapper {
            max-width: 740px;
            margin: 0 auto;
            border: 1.5px solid #222;
            padding: 12px 14px;
            background: #fff;
          }
        </style>
      </head>
      <body>
        <div class="bill-wrapper">
          ${printContent.innerHTML}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 450);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-dialog"
        style={{ maxWidth: 840, maxHeight: '94vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} color="var(--accent)" /> Weekend / Sat-Sun Off-Duty Cash Memo ({companyName})
            </h3>
            <span className="modal-subtitle">
              Slip #{dutySlipNumber} • {departmentName} • Taxi {vehicle}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn-primary-action"
              style={{ fontSize: '12.5px', padding: '7px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              onClick={handlePrint}
              type="button"
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button className="modal-close-btn" onClick={onClose} type="button">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Paper Document Preview */}
        <div style={{ overflow: 'auto', flex: 1, padding: '16px', background: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={printRef}
            style={{
              width: '100%',
              maxWidth: 750,
              background: '#ffffff',
              color: '#111111',
              border: '1.5px solid #222222',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              padding: '16px 20px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '12.5px',
              lineHeight: 1.4
            }}
          >
            {/* Top Contact Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: 500,
                color: '#222',
                paddingBottom: 6,
                borderBottom: '1px dotted #bbb'
              }}
            >
              <div>
                <div>GSTN No. : <strong>{gstin}</strong></div>
                <div>Pan No. : <strong>{pan}</strong></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Mobile : <strong>{phone}</strong></div>
                <div>e-mail : <strong>{email}</strong></div>
              </div>
            </div>

            {/* Header: Car on Left, KABPRO Banner Center, KABPRO Logo on Right */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 0 10px 0',
                borderBottom: '2px solid #111'
              }}
            >
              <div style={{ width: 95, textAlign: 'center', flexShrink: 0 }}>
                <img
                  src="/car-bill-icon.png"
                  alt="Fleet Car"
                  style={{ maxWidth: 90, maxHeight: 60, objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontStyle: 'italic', fontWeight: 600, color: '#444', marginBottom: 2 }}>
                  Cash Memo/Bill
                </div>
                <div>
                  <span
                    style={{
                      background: '#801424',
                      color: '#ffffff',
                      fontSize: 28,
                      fontWeight: 900,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      padding: '5px 24px',
                      borderRadius: 4,
                      display: 'inline-block',
                      margin: '2px 0 4px 0',
                      fontFamily: "'Trebuchet MS', 'Arial Black', Arial, sans-serif",
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  >
                    {companyName}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#111', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  {companySub}
                </div>
                <div style={{ fontSize: 10.5, color: '#333', marginTop: 3, lineHeight: 1.3 }}>
                  {companyAddress}
                </div>
              </div>

              <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
                <img
                  src="/logo-light.png"
                  alt="KABPRO Logo"
                  style={{ maxWidth: 75, maxHeight: 75, objectFit: 'contain', borderRadius: 6 }}
                  onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
            </div>

            {/* Party and Receipt Box Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '8px 0',
                borderBottom: '1.5px solid #222'
              }}
            >
              <div style={{ flex: 1, paddingRight: 16 }}>
                <div style={{ fontSize: 13, marginBottom: 5, display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#333', minWidth: 40 }}>M/s.</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: '#000',
                      fontSize: 14,
                      borderBottom: '1px dotted #555',
                      paddingBottom: 1,
                      flex: 1
                    }}
                  >
                    {departmentName}
                    {officerName ? ` (${officerName})` : ''}
                  </span>
                </div>
                <div style={{ fontSize: 12, display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, color: '#444', minWidth: 95 }}>Party GSTN No. :</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: '#111',
                      borderBottom: '1px dotted #555',
                      paddingBottom: 1,
                      flex: 1
                    }}
                  >
                    05AAAGB1234F1Z5
                  </span>
                </div>
              </div>

              <div style={{ border: '1.5px solid #222', width: 175, flexShrink: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    fontSize: 12,
                    borderBottom: '1.5px solid #222'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#333' }}>No.</span>
                  <span style={{ fontWeight: 800, color: '#000', fontSize: 14 }}>{dutySlipNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#333' }}>Date</span>
                  <span style={{ fontWeight: 700, color: '#000' }}>{formatDate(dateStr)}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table with dual Amount columns: Rs. | P. */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    style={{
                      border: '1.5px solid #222',
                      background: '#f4f4f4',
                      fontWeight: 800,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      width: '6%'
                    }}
                  >
                    S. No.
                  </th>
                  <th
                    rowSpan={2}
                    style={{
                      border: '1.5px solid #222',
                      background: '#f4f4f4',
                      fontWeight: 800,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      textAlign: 'left',
                      padding: '5px 8px',
                      width: '52%'
                    }}
                  >
                    DESCRIPTION
                  </th>
                  <th
                    rowSpan={2}
                    style={{
                      border: '1.5px solid #222',
                      background: '#f4f4f4',
                      fontWeight: 800,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      textAlign: 'left',
                      padding: '5px 8px',
                      width: '24%'
                    }}
                  >
                    RATE
                  </th>
                  <th
                    colSpan={2}
                    style={{
                      border: '1.5px solid #222',
                      background: '#f4f4f4',
                      fontWeight: 800,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      padding: '3px 6px',
                      width: '18%'
                    }}
                  >
                    AMOUNT
                  </th>
                </tr>
                <tr>
                  <th
                    style={{
                      border: '1.5px solid #222',
                      background: '#f4f4f4',
                      fontWeight: 700,
                      fontSize: 11,
                      textAlign: 'right',
                      padding: '3px 6px',
                      width: '12%'
                    }}
                  >
                    Rs.
                  </th>
                  <th
                    style={{
                      border: '1.5px solid #222',
                      background: '#f4f4f4',
                      fontWeight: 700,
                      fontSize: 11,
                      textAlign: 'center',
                      padding: '3px 4px',
                      width: '6%'
                    }}
                  >
                    P.
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Line 1: Hiring Charges Package with free KM */}
                <tr style={{ verticalAlign: 'top', fontSize: 12 }}>
                  <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '6px 4px' }}>1</td>
                  <td style={{ border: '1.5px solid #222', padding: '6px 8px' }}>
                    <div style={{ fontWeight: 600, lineHeight: 1.35 }}>
                      Hiring charges for providing Taxi no {vehicle} from {journeyFrom} to{' '}
                      {journeyTo} on {formatDate(dateStr)}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11.5, color: '#333', fontFamily: 'monospace' }}>
                      <div>Total KM : <strong>{totalKm}</strong></div>
                      <div>Less free KM : <strong>{freeKm}</strong></div>
                      <div style={{ borderTop: '1px solid #777', width: '130px', paddingTop: '2px', fontWeight: 700 }}>
                        Extra KM : <strong>{extraKm}</strong>
                      </div>
                    </div>
                  </td>
                  <td style={{ border: '1.5px solid #222', padding: '6px 8px', fontSize: 11.5, color: '#222' }}>
                    <div>@ Rs {basePrice.toLocaleString('en-IN')} per Day & {freeKm} KM Free</div>
                    <div style={{ marginTop: 12 }}>& @ Rs {extraKmRate} per KM Extra</div>
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>
                    {basePrice.toLocaleString('en-IN')}
                    {extraKmCost > 0 && (
                      <div style={{ marginTop: 16 }}>{extraKmCost.toLocaleString('en-IN')}</div>
                    )}
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '6px 4px', fontSize: 11, color: '#444' }}>
                    00
                    {extraKmCost > 0 && <div style={{ marginTop: 16 }}>00</div>}
                  </td>
                </tr>

                {/* Optional Line 2: Toll Tax & Parking */}
                {tollParking > 0 && (
                  <tr style={{ verticalAlign: 'top', fontSize: 12 }}>
                    <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '6px 4px' }}>2</td>
                    <td style={{ border: '1.5px solid #222', padding: '6px 8px' }}>Toll Tax & Parking (Actuals)</td>
                    <td style={{ border: '1.5px solid #222', padding: '6px 8px', fontSize: 11.5 }}>On actuals</td>
                    <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>
                      {tollParking.toLocaleString('en-IN')}
                    </td>
                    <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '6px 4px', fontSize: 11, color: '#444' }}>
                      00
                    </td>
                  </tr>
                )}

                {/* Optional Line 3: Extra Fuel */}
                {extraFuel > 0 && (
                  <tr style={{ verticalAlign: 'top', fontSize: 12 }}>
                    <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '6px 4px' }}>3</td>
                    <td style={{ border: '1.5px solid #222', padding: '6px 8px' }}>Extra Fuel beyond Free Package</td>
                    <td style={{ border: '1.5px solid #222', padding: '6px 8px', fontSize: 11.5 }}>On actuals</td>
                    <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>
                      {extraFuel.toLocaleString('en-IN')}
                    </td>
                    <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '6px 4px', fontSize: 11, color: '#444' }}>
                      00
                    </td>
                  </tr>
                )}

                {/* Spacer row */}
                <tr>
                  <td style={{ border: '1.5px solid #222', height: 40 }}></td>
                  <td style={{ border: '1.5px solid #222' }}></td>
                  <td style={{ border: '1.5px solid #222' }}></td>
                  <td style={{ border: '1.5px solid #222' }}></td>
                  <td style={{ border: '1.5px solid #222' }}></td>
                </tr>

                {/* Subtotal Row */}
                <tr style={{ fontWeight: 700, fontSize: 12.5 }}>
                  <td colSpan={3} style={{ border: '1.5px solid #222', borderTop: '2px solid #111', textAlign: 'right', padding: '6px 12px' }}>
                    TOTAL
                  </td>
                  <td style={{ border: '1.5px solid #222', borderTop: '2px solid #111', textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>
                    {subtotal.toLocaleString('en-IN')}
                  </td>
                  <td style={{ border: '1.5px solid #222', borderTop: '2px solid #111', textAlign: 'center', padding: '6px 4px', fontWeight: 700 }}>
                    00
                  </td>
                </tr>

                {/* CGST Row */}
                <tr style={{ fontSize: 12 }}>
                  <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                    CGST ({(gstRate / 2).toFixed(1)}%)
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>
                    {cgst > 0 ? cgst.toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>
                    {cgst > 0 ? '00' : '—'}
                  </td>
                </tr>

                {/* SGST Row */}
                <tr style={{ fontSize: 12 }}>
                  <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                    SGST ({(gstRate / 2).toFixed(1)}%)
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>
                    {sgst > 0 ? sgst.toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>
                    {sgst > 0 ? '00' : '—'}
                  </td>
                </tr>

                {/* IGST Row */}
                <tr style={{ fontSize: 12, color: '#888' }}>
                  <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                    IGST (.......%)
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px' }}>
                    {igst > 0 ? igst.toLocaleString('en-IN') : '—'}
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>
                    {igst > 0 ? '00' : '—'}
                  </td>
                </tr>

                {/* Extra line item */}
                <tr style={{ fontSize: 12, color: '#888' }}>
                  <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                    Extra
                  </td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px' }}>—</td>
                  <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>—</td>
                </tr>

                {/* Grand Total Row */}
                <tr style={{ fontWeight: 800, fontSize: 14, background: '#f9f9f9' }}>
                  <td
                    colSpan={3}
                    style={{
                      border: '1.5px solid #222',
                      borderTop: '2px solid #000',
                      borderBottom: '2.5px double #000',
                      textAlign: 'right',
                      padding: '7px 12px'
                    }}
                  >
                    G.TOTAL
                  </td>
                  <td
                    style={{
                      border: '1.5px solid #222',
                      borderTop: '2px solid #000',
                      borderBottom: '2.5px double #000',
                      textAlign: 'right',
                      padding: '7px 8px',
                      fontWeight: 900
                    }}
                  >
                    {grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td
                    style={{
                      border: '1.5px solid #222',
                      borderTop: '2px solid #000',
                      borderBottom: '2.5px double #000',
                      textAlign: 'center',
                      padding: '7px 4px',
                      fontWeight: 900
                    }}
                  >
                    00
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer Section */}
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: 8,
                borderTop: '1px solid #aaa'
              }}
            >
              <div style={{ fontSize: 11, color: '#222', lineHeight: 1.45, maxWidth: '60%' }}>
                <div>
                  Please make Cheque in favour of <strong>M/s {companyName}</strong>
                </div>
                <div>Our Banker : {bankName}</div>
                <div>
                  A/c No. : <strong>{bankAccount}</strong> &nbsp; IFSC : <strong>{bankIfsc}</strong>
                </div>
                <div style={{ marginTop: 4, fontWeight: 700, fontSize: 11 }}>E.&O.E.</div>
              </div>

              <div style={{ textAlign: 'right', minWidth: 200 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#000' }}>For {companyName}</div>
                <div
                  style={{
                    fontFamily: '"Brush Script MT", "Segoe Script", cursive',
                    fontSize: 22,
                    color: '#1e3a8a',
                    margin: '12px 0 2px 0',
                    fontWeight: 600
                  }}
                >
                  Authorized Signatory
                </div>
                <div style={{ fontSize: 10.5, color: '#555' }}>(Sole Prop.)</div>
              </div>
            </div>

            {/* Amount In Words Line */}
            <div
              style={{
                marginTop: 8,
                padding: '6px 8px',
                fontSize: 11.5,
                border: '1px dashed #bbb',
                background: '#fafafa',
                borderRadius: 4
              }}
            >
              <strong>Rupees (In Words):</strong> {numberToWords(grandTotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
