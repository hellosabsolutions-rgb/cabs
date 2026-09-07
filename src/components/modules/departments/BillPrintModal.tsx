import React, { useRef, useState } from 'react';
import { MonthlyDepartmentBill } from '../../../types/fleet';
import { Printer, X, Edit3 } from 'lucide-react';

export interface CashMemoProps {
  bill: MonthlyDepartmentBill;
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
  logo?: string;
  carImage?: string;
}

// Reusable Cash Memo / Bill paper renderer
export const CashMemoBillView: React.FC<CashMemoProps> = ({
  bill,
  companyName = 'KABPRO',
  companySub = 'GOVT. CONTRACTOR AND FLEET OWNER',
  companyAddress = '78, Rajpur Road, Radha Palace Complex, Opp. R.T.O. Office, Dehradun - 248001 (Uttarakhand)',
  gstin = '05ABZPB8720C1ZQ',
  pan = 'ABZPB8720C',
  phone = '9837008255, 7300881555',
  email = 'kabpro.fleet@gmail.com',
  bankName = 'State Bank of India, Rajpur Road, D.Dun',
  bankAccount = '10587398870',
  bankIfsc = 'SBIN0005713',
  logo = '/logo-light.png',
  carImage = '/car-bill-icon.png'
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDutyPeriodText = () => {
    if (bill.dutyStartDate && bill.dutyEndDate) {
      return `on ${formatDate(bill.dutyStartDate)} to ${formatDate(bill.dutyEndDate)}`;
    }
    if (bill.billingMonth) {
      const parts = bill.billingMonth.split('-');
      if (parts.length === 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m)) {
          const lastDay = new Date(y, m, 0).getDate();
          return `on 01/${String(m).padStart(2, '0')}/${y} to ${String(lastDay).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        }
      }
    }
    return `for monthly duty`;
  };

  const getBillDate = () => {
    if (bill.dutyEndDate) return formatDate(bill.dutyEndDate);
    if (bill.dueDate) return formatDate(bill.dueDate);
    if (bill.billingMonth) {
      const parts = bill.billingMonth.split('-');
      if (parts.length === 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m)) {
          const lastDay = new Date(y, m, 0).getDate();
          return `${String(lastDay).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
        }
      }
    }
    return '01/08/2026';
  };

  const subtotalVal =
    bill.subtotal ??
    bill.baseContractAmount +
      (bill.extraKmCost || 0) +
      (bill.extraHoursCost || 0) +
      (bill.extraDriverAllowance || 0) +
      (bill.fuelCost || 0) +
      (bill.nightCost || 0) +
      (bill.tollParkingCost || 0);

  const gstRateVal = bill.gstRate || 0;
  const gstAmountVal = bill.gstAmount || 0;
  const cgstVal = bill.cgstAmount || Math.round(gstAmountVal / 2);
  const sgstVal = bill.sgstAmount || gstAmountVal - cgstVal;
  const igstVal = bill.igstAmount || 0;
  const gstTypeVal = bill.gstType || 'CGST_SGST';

  // Build description items for the billing table
  const descItems: { description: string; rate: string; amount: number }[] = [];

  descItems.push({
    description: `Hiring charges for providing Taxi No. ${bill.vehicle} for local & outstation Duty ${getDutyPeriodText()} for monthly basis`,
    rate: `@ Rs ${bill.baseContractAmount.toLocaleString('en-IN')} per month`,
    amount: bill.baseContractAmount
  });

  if ((bill.extraKmCost || 0) > 0) {
    descItems.push({
      description: `Extra KM Charges (${bill.totalKmRun || 0} KM total run)`,
      rate: '',
      amount: bill.extraKmCost
    });
  }

  if ((bill.extraHoursCost || 0) > 0) {
    descItems.push({
      description: 'Extra Duty Hours Charges',
      rate: '',
      amount: bill.extraHoursCost
    });
  }

  if ((bill.extraDriverAllowance || 0) > 0) {
    descItems.push({
      description: 'Driver Allowance',
      rate: '',
      amount: bill.extraDriverAllowance!
    });
  }

  if ((bill.fuelCost || 0) > 0) {
    descItems.push({
      description: `Diesel / Fuel used: ${bill.fuelLitresUsed?.toFixed(1) || 0} litres (${bill.totalKmRun || 0} KM ÷ ${bill.fuelAvgKmpl || 10} KM/L avg)`,
      rate: `& @ Rs ${(bill.fuelRatePerLitre || 0).toFixed(2)} per litre Diesel`,
      amount: bill.fuelCost!
    });
  }

  if ((bill.nightCost || 0) > 0) {
    descItems.push({
      description: `${bill.nightCount || 0} Night charges after 7:00 PM`,
      rate: `@ Rs ${(bill.nightRate || 300).toLocaleString('en-IN')} Night charge after 7:00 PM`,
      amount: bill.nightCost!
    });
  }

  if ((bill.tollParkingCost || 0) > 0) {
    descItems.push({
      description: 'Toll Tax & Parking',
      rate: '',
      amount: bill.tollParkingCost
    });
  }

  // Number to words (Indian system)
  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const a = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
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

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 750,
        margin: '0 auto',
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
      {/* Top GST / Contact Bar */}
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
          <div>
            GSTN No. : <strong>{gstin}</strong>
          </div>
          <div>
            Pan No. : <strong>{pan}</strong>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>
            Mobile : <strong>{phone}</strong>
          </div>
          <div>
            e-mail : <strong>{email}</strong>
          </div>
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
        {/* Left Car Image (like receipt photo) */}
        <div style={{ width: 95, textAlign: 'center', flexShrink: 0 }}>
          <img
            src={carImage}
            alt="Fleet Car"
            style={{ maxWidth: 90, maxHeight: 60, objectFit: 'contain' }}
            onError={e => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Center Company Banner - KABPRO */}
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

        {/* Right KABPRO Official Logo */}
        <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
          <img
            src={logo}
            alt="KABPRO Logo"
            style={{ maxWidth: 75, maxHeight: 75, objectFit: 'contain', borderRadius: 6 }}
            onError={e => {
              (e.target as HTMLElement).style.display = 'none';
            }}
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
              {bill.departmentName}
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
              {bill.partyGstin || '—'}
            </span>
          </div>
        </div>

        {/* Boxed No. and Date */}
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
            <span style={{ fontWeight: 800, color: '#000', fontSize: 14 }}>{bill.billNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', fontSize: 12 }}>
            <span style={{ fontWeight: 600, color: '#333' }}>Date</span>
            <span style={{ fontWeight: 700, color: '#000' }}>{getBillDate()}</span>
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
          {descItems.map((item, idx) => (
            <tr key={idx} style={{ verticalAlign: 'top', fontSize: 12 }}>
              <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '6px 4px' }}>
                {idx + 1}
              </td>
              <td style={{ border: '1.5px solid #222', padding: '6px 8px' }}>
                <div style={{ fontWeight: 500, lineHeight: 1.35 }}>{item.description}</div>
              </td>
              <td style={{ border: '1.5px solid #222', padding: '6px 8px', fontSize: 11.5, color: '#222' }}>
                {item.rate}
              </td>
              <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>
                {Math.floor(item.amount).toLocaleString('en-IN')}
              </td>
              <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '6px 4px', fontSize: 11, color: '#444' }}>
                00
              </td>
            </tr>
          ))}

          {/* Spacer row */}
          <tr>
            <td style={{ border: '1.5px solid #222', height: 35 }}></td>
            <td style={{ border: '1.5px solid #222' }}></td>
            <td style={{ border: '1.5px solid #222' }}></td>
            <td style={{ border: '1.5px solid #222' }}></td>
            <td style={{ border: '1.5px solid #222' }}></td>
          </tr>

          {/* Subtotal Row */}
          <tr style={{ fontWeight: 700, fontSize: 12.5 }}>
            <td
              colSpan={3}
              style={{
                border: '1.5px solid #222',
                borderTop: '2px solid #111',
                textAlign: 'right',
                padding: '6px 12px'
              }}
            >
              TOTAL
            </td>
            <td
              style={{
                border: '1.5px solid #222',
                borderTop: '2px solid #111',
                textAlign: 'right',
                padding: '6px 8px',
                fontWeight: 700
              }}
            >
              {Math.floor(subtotalVal).toLocaleString('en-IN')}
            </td>
            <td
              style={{
                border: '1.5px solid #222',
                borderTop: '2px solid #111',
                textAlign: 'center',
                padding: '6px 4px',
                fontWeight: 700
              }}
            >
              00
            </td>
          </tr>

          {/* Tax Breakdown Rows */}
          {gstRateVal > 0 && gstTypeVal === 'CGST_SGST' ? (
            <>
              <tr style={{ fontSize: 12 }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  CGST ({(gstRateVal / 2).toFixed(1)}%)
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>
                  {Math.floor(cgstVal).toLocaleString('en-IN')}
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>00</td>
              </tr>
              <tr style={{ fontSize: 12 }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  SGST ({(gstRateVal / 2).toFixed(1)}%)
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>
                  {Math.floor(sgstVal).toLocaleString('en-IN')}
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>00</td>
              </tr>
              <tr style={{ fontSize: 12, color: '#888' }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  IGST (.......%)
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px' }}>—</td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>—</td>
              </tr>
            </>
          ) : gstRateVal > 0 && gstTypeVal === 'IGST' ? (
            <>
              <tr style={{ fontSize: 12, color: '#888' }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  CGST
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px' }}>—</td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>—</td>
              </tr>
              <tr style={{ fontSize: 12, color: '#888' }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  SGST
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px' }}>—</td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>—</td>
              </tr>
              <tr style={{ fontSize: 12 }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  IGST ({gstRateVal}%)
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>
                  {Math.floor(igstVal).toLocaleString('en-IN')}
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>00</td>
              </tr>
            </>
          ) : (
            <>
              <tr style={{ fontSize: 12, color: '#888' }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  CGST
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px' }}>—</td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>—</td>
              </tr>
              <tr style={{ fontSize: 12, color: '#888' }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  SGST
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px' }}>—</td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>—</td>
              </tr>
              <tr style={{ fontSize: 12, color: '#888' }}>
                <td colSpan={3} style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 12px' }}>
                  IGST
                </td>
                <td style={{ border: '1.5px solid #222', textAlign: 'right', padding: '4px 8px' }}>—</td>
                <td style={{ border: '1.5px solid #222', textAlign: 'center', padding: '4px 4px' }}>—</td>
              </tr>
            </>
          )}

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
              {Math.floor(bill.totalBill).toLocaleString('en-IN')}
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
        <strong>Rs. (In Words):</strong> {numberToWords(bill.totalBill)}
      </div>
    </div>
  );
};

interface BillPrintModalProps {
  bill: MonthlyDepartmentBill;
  onClose: () => void;
  agencyName?: string;
  agencyAddress?: string;
  agencyGstin?: string;
  agencyPan?: string;
  agencyPhone?: string;
  agencyEmail?: string;
  agencyBankName?: string;
  agencyBankAccount?: string;
  agencyBankIfsc?: string;
  agencyLogo?: string;
  agencyCarImage?: string;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  bill,
  onClose,
  agencyName: propName,
  agencyAddress: propAddress,
  agencyGstin: propGstin,
  agencyPan: propPan,
  agencyPhone: propPhone,
  agencyEmail: propEmail,
  agencyBankName: propBankName,
  agencyBankAccount: propBankAccount,
  agencyBankIfsc: propBankIfsc,
  agencyLogo: propLogo,
  agencyCarImage: propCarImage
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Default always strictly KABPRO
  const defaultName = propName || 'KABPRO';
  const defaultSub = 'GOVT. CONTRACTOR AND FLEET OWNER';
  const defaultAddress =
    propAddress || '78, Rajpur Road, Radha Palace Complex, Opp. R.T.O. Office, Dehradun - 248001 (Uttarakhand)';
  const defaultGstin = propGstin || '05ABZPB8720C1ZQ';
  const defaultPan = propPan || 'ABZPB8720C';
  const defaultPhone = propPhone || '9837008255, 7300881555';
  const defaultEmail = propEmail || 'kabpro.fleet@gmail.com';
  const defaultBankName = propBankName || 'State Bank of India, Rajpur Road, D.Dun';
  const defaultBankAccount = propBankAccount || '10587398870';
  const defaultBankIfsc = propBankIfsc || 'SBIN0005713';
  const defaultLogo = propLogo || '/logo-light.png';
  const defaultCarImage = propCarImage || '/car-bill-icon.png';

  const [companyName, setCompanyName] = useState(defaultName);
  const [companySub, setCompanySub] = useState(defaultSub);
  const [companyAddress, setCompanyAddress] = useState(defaultAddress);
  const [gstin, setGstin] = useState(defaultGstin);
  const [pan, setPan] = useState(defaultPan);
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [bankName, setBankName] = useState(defaultBankName);
  const [bankAccount, setBankAccount] = useState(defaultBankAccount);
  const [bankIfsc, setBankIfsc] = useState(defaultBankIfsc);
  const [showEditControls, setShowEditControls] = useState(false);

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
        <title>Invoice_${bill.billNumber}_${companyName.replace(/\\s+/g, '_')}</title>
        <base href="${origin}/" />
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
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
        {/* Action Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} color="var(--accent)" /> Official Cash Memo / Bill ({companyName})
            </h3>
            <span className="modal-subtitle">
              Invoice #{bill.billNumber} • {bill.departmentName}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setShowEditControls(!showEditControls)}
              type="button"
              title="Edit agency details on bill"
            >
              <Edit3 size={13} /> {showEditControls ? 'Hide Edit' : 'Edit Header'}
            </button>
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

        {/* Optional Live Edit Controls Bar */}
        {showEditControls && (
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--bg-subtle, #f8fafc)',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px',
              fontSize: '11px'
            }}
          >
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Company Name:</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Subtitle:</label>
              <input
                type="text"
                value={companySub}
                onChange={e => setCompanySub(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>GSTN No.:</label>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>PAN No.:</label>
              <input
                type="text"
                value={pan}
                onChange={e => setPan(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Mobile Phones:</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Email Address:</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </div>
          </div>
        )}

        {/* Document Preview (Scrollable) */}
        <div style={{ overflow: 'auto', flex: 1, padding: '16px', background: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
          <div ref={printRef} style={{ width: '100%' }}>
            <CashMemoBillView
              bill={bill}
              companyName={companyName}
              companySub={companySub}
              companyAddress={companyAddress}
              gstin={gstin}
              pan={pan}
              phone={phone}
              email={email}
              bankName={bankName}
              bankAccount={bankAccount}
              bankIfsc={bankIfsc}
              logo={defaultLogo}
              carImage={defaultCarImage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
