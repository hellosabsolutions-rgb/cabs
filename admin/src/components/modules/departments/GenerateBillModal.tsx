import React, { useState, useEffect } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { FileText, CheckCircle2, Fuel, Moon, Calculator } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';

interface GenerateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGstRate?: number;
  defaultGstType?: 'CGST_SGST' | 'IGST';
}

export const GenerateBillModal: React.FC<GenerateBillModalProps> = ({
  isOpen,
  onClose,
  defaultGstRate = 5,
  defaultGstType = 'CGST_SGST'
}) => {
  const { departmentContracts, addMonthlyBill } = useFleet();

  const [selectedContractId, setSelectedContractId] = useState(departmentContracts[0]?.id || '');
  const [billingMonth, setBillingMonth] = useState('2026-08');
  const [baseAmount, setBaseAmount] = useState('53755');
  const [dutyStartDate, setDutyStartDate] = useState('2026-08-01');
  const [dutyEndDate, setDutyEndDate] = useState('2026-08-31');
  const [totalKmRun, setTotalKmRun] = useState('2300');
  const [extraKmCost, setExtraKmCost] = useState('1500');
  const [extraHoursCost, setExtraHoursCost] = useState('0');
  const [extraDriverAllowance, setExtraDriverAllowance] = useState('0');

  // Fuel Calculator
  const [fuelAvgKmpl, setFuelAvgKmpl] = useState('10');
  const [fuelRatePerLitre, setFuelRatePerLitre] = useState('88.33');

  // Night Charges
  const [nightCount, setNightCount] = useState('5');
  const [nightRate, setNightRate] = useState('300');

  // Toll & Parking
  const [tollParkingCost, setTollParkingCost] = useState('320');

  // GST Configuration
  const [gstRate, setGstRate] = useState(String(defaultGstRate));
  const [gstType, setGstType] = useState<'CGST_SGST' | 'IGST'>(defaultGstType);
  const [gstTaxableOn, setGstTaxableOn] = useState<'RENT_ONLY' | 'TOTAL'>('TOTAL');
  const [partyGstin, setPartyGstin] = useState('');

  // Status & Due Date
  const [status, setStatus] = useState<'Sent' | 'Paid' | 'Pending' | 'Overdue' | 'Draft'>('Sent');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [errorMsg, setErrorMsg] = useState('');

  const selectedContract = departmentContracts.find(c => c.id === selectedContractId) || departmentContracts[0];

  useEffect(() => {
    if (selectedContract) {
      setBaseAmount(String(selectedContract.monthlyBaseAmount));
    }
  }, [selectedContractId, selectedContract]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ===== CALCULATIONS =====
  const baseNum = Number(baseAmount) || 0;
  const extraKmNum = Number(extraKmCost) || 0;
  const extraHrsNum = Number(extraHoursCost) || 0;
  const driverAllowanceNum = Number(extraDriverAllowance) || 0;
  const kmRunNum = Number(totalKmRun) || 0;
  const kmplNum = Number(fuelAvgKmpl) || 1;
  const fuelRateNum = Number(fuelRatePerLitre) || 0;
  const nightCountNum = Number(nightCount) || 0;
  const nightRateNum = Number(nightRate) || 0;
  const tollNum = Number(tollParkingCost) || 0;

  // Fuel cost auto-calculation
  const fuelLitresCalc = kmplNum > 0 ? Math.round((kmRunNum / kmplNum) * 100) / 100 : 0;
  const fuelCostCalc = Math.round(fuelLitresCalc * fuelRateNum);

  // Night cost
  const nightCostCalc = nightCountNum * nightRateNum;

  // Subtotal (before GST)
  const subtotalCalc = baseNum + extraKmNum + extraHrsNum + driverAllowanceNum + fuelCostCalc + nightCostCalc + tollNum;

  // GST taxable base
  const gstPercentNum = Math.max(0, Number(gstRate) || 0);
  const taxableBase = gstTaxableOn === 'RENT_ONLY'
    ? (baseNum + extraKmNum + extraHrsNum + driverAllowanceNum)
    : subtotalCalc;

  const gstAmountCalc = Math.round((taxableBase * gstPercentNum) / 100);

  // CGST / SGST / IGST split
  let cgstCalc = 0, sgstCalc = 0, igstCalc = 0;
  if (gstType === 'CGST_SGST') {
    cgstCalc = Math.round(gstAmountCalc / 2);
    sgstCalc = gstAmountCalc - cgstCalc;
  } else {
    igstCalc = gstAmountCalc;
  }

  const totalBillCalc = subtotalCalc + gstAmountCalc;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) {
      setErrorMsg('Please select a department contract.');
      return;
    }

    const billNumber = `INV-${billingMonth}-${selectedContract.departmentName.substring(0, 3).toUpperCase()}`;

    addMonthlyBill({
      billNumber,
      departmentName: selectedContract.departmentName,
      vehicle: selectedContract.vehicle,
      billingMonth,
      baseContractAmount: baseNum,
      dutyStartDate,
      dutyEndDate,
      totalKmRun: kmRunNum,
      extraKmCost: extraKmNum,
      extraHoursCost: extraHrsNum,
      extraDriverAllowance: driverAllowanceNum,
      fuelAvgKmpl: kmplNum,
      fuelLitresUsed: fuelLitresCalc,
      fuelRatePerLitre: fuelRateNum,
      fuelCost: fuelCostCalc,
      nightCount: nightCountNum,
      nightRate: nightRateNum,
      nightCost: nightCostCalc,
      tollParkingCost: tollNum,
      subtotal: subtotalCalc,
      gstRate: gstPercentNum,
      gstType,
      gstTaxableOn,
      gstAmount: gstAmountCalc,
      cgstAmount: cgstCalc,
      sgstAmount: sgstCalc,
      igstAmount: igstCalc,
      partyGstin: partyGstin.trim(),
      totalBill: totalBillCalc,
      paidAmount: status === 'Paid' ? totalBillCalc : 0,
      balanceDue: status === 'Paid' ? 0 : totalBillCalc,
      status,
      dueDate,
      invoicePdf: `invoice_${selectedContract.departmentName.substring(0, 3).toLowerCase()}_${billingMonth}.pdf`
    });

    setErrorMsg('');
    onClose();
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '11.5px',
    fontWeight: 700,
    color: 'var(--accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '8px',
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const gstPillStyle = (rate: string): React.CSSProperties => ({
    padding: '4px 9px',
    fontSize: '11px',
    minWidth: '36px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    background: gstRate === rate ? 'var(--accent)' : 'var(--surface-3)',
    color: gstRate === rate ? '#000' : 'var(--text-dim)',
    border: `1px solid ${gstRate === rate ? 'var(--accent)' : 'var(--border)'}`,
    transition: 'all 0.15s ease'
  });

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '8px',
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-3)',
    color: active ? 'var(--accent)' : 'var(--text-dim)',
    transition: 'all 0.15s ease'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent)" /> Generate Monthly Department Bill
            </h3>
            <span className="modal-subtitle">Contract rent, fuel, night charges & GST billing</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="general"
              context={{ departments: departmentContracts.map(c => c.departmentName) }}
              placeholder="Speak bill details (e.g. 'PWD Base 53755 km 2300 avg 10 fuel rate 88')"
              onApplyParsedData={(data) => {
                if (data.amount) setBaseAmount(data.amount);
                if (data.gstRate) setGstRate(data.gstRate);
                if (data.departmentName) {
                  const match = departmentContracts.find(c => c.departmentName.toLowerCase().includes(data.departmentName.toLowerCase()));
                  if (match) setSelectedContractId(match.id);
                }
              }}
            />

            {errorMsg && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  border: '1px solid rgba(255, 92, 92, 0.3)'
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* ── CONTRACT & PERIOD ── */}
            <div style={sectionHeaderStyle}>
              <FileText size={13} /> Contract & Period
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department Contract *</label>
                <select
                  className="form-input"
                  value={selectedContractId}
                  onChange={e => setSelectedContractId(e.target.value)}
                  required
                >
                  {departmentContracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.departmentName} ({c.vehicle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Billing Month (YYYY-MM) *</label>
                <input
                  type="month"
                  className="form-input"
                  value={billingMonth}
                  onChange={e => setBillingMonth(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duty Start Date</label>
                <DatePicker value={dutyStartDate} onChange={d => setDutyStartDate(d)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Duty End Date</label>
                <DatePicker value={dutyEndDate} onChange={d => setDutyEndDate(d)} />
              </div>
            </div>

            {/* ── BASE AMOUNT & EXTRAS ── */}
            <div style={sectionHeaderStyle}>
              <Calculator size={13} /> Hiring Rate & Extras
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Monthly Hire Rate (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={baseAmount}
                  onChange={e => setBaseAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver Allowance (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={extraDriverAllowance}
                  onChange={e => setExtraDriverAllowance(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Extra KM Cost (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={extraKmCost}
                  onChange={e => setExtraKmCost(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Extra Hours Cost (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={extraHoursCost}
                  onChange={e => setExtraHoursCost(e.target.value)}
                />
              </div>
            </div>

            {/* ── FUEL CALCULATOR ── */}
            <div style={sectionHeaderStyle}>
              <Fuel size={13} /> Fuel Expense Calculator
            </div>

            <div style={{
              background: 'var(--surface-3)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Total KM Run</label>
                  <input type="number" className="form-input" value={totalKmRun} onChange={e => setTotalKmRun(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Average (KM/L)</label>
                  <input type="number" className="form-input" step="0.1" value={fuelAvgKmpl} onChange={e => setFuelAvgKmpl(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Rate per Litre (₹)</label>
                  <input type="number" className="form-input" step="0.01" value={fuelRatePerLitre} onChange={e => setFuelRatePerLitre(e.target.value)} />
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--surface-2)',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px dashed var(--border)'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  {fuelLitresCalc.toFixed(1)} Litres × ₹{fuelRateNum.toFixed(2)}/L
                </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f97316' }}>
                  = ₹{fuelCostCalc.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* ── NIGHT CHARGES ── */}
            <div style={sectionHeaderStyle}>
              <Moon size={13} /> Night Charges (After 7:00 PM)
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Night Count</label>
                <input type="number" className="form-input" value={nightCount} onChange={e => setNightCount(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Rate per Night (₹)</label>
                <input type="number" className="form-input" value={nightRate} onChange={e => setNightRate(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Night Cost (₹)</label>
                <input
                  type="text"
                  className="form-input"
                  value={`₹${nightCostCalc.toLocaleString('en-IN')}`}
                  readOnly
                  style={{ fontWeight: 700, color: '#a78bfa' }}
                />
              </div>
            </div>

            {/* ── TOLL & PARKING ── */}
            <div className="form-row-2" style={{ marginTop: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Toll Tax / Parking (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={tollParkingCost}
                  onChange={e => setTollParkingCost(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Party GSTIN (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 05ABZPB8720C1ZQ"
                  value={partyGstin}
                  onChange={e => setPartyGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                />
              </div>
            </div>

            {/* ── GST CONFIGURATOR ── */}
            <div style={sectionHeaderStyle}>
              💰 GST Configuration
            </div>

            <div style={{
              background: 'var(--surface-3)',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* GST Rate Selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontSize: '11.5px' }}>GST Rate (%)</label>
                  <span style={{ fontSize: '11px', color: '#ffcc4d', fontWeight: 600 }}>
                    {gstPercentNum > 0 ? `Tax: +₹${gstAmountCalc.toLocaleString('en-IN')}` : 'Nil Tax (0%)'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    className="form-input"
                    placeholder="Custom %"
                    value={gstRate}
                    onChange={e => setGstRate(e.target.value)}
                    style={{ flex: 1, maxWidth: '90px' }}
                  />
                  {['0', '5', '12', '18'].map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      style={gstPillStyle(rate)}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* GST Type Toggle: CGST+SGST vs IGST */}
              <div>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: '5px' }}>Tax Type</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setGstType('CGST_SGST')}
                    style={toggleBtnStyle(gstType === 'CGST_SGST')}
                  >
                    Intra-State (CGST + SGST)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstType('IGST')}
                    style={toggleBtnStyle(gstType === 'IGST')}
                  >
                    Inter-State (IGST)
                  </button>
                </div>
              </div>

              {/* GST Taxable Base Toggle */}
              <div>
                <label className="form-label" style={{ fontSize: '11px', marginBottom: '5px' }}>GST Applicable On</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setGstTaxableOn('TOTAL')}
                    style={toggleBtnStyle(gstTaxableOn === 'TOTAL')}
                  >
                    Full Subtotal (₹{subtotalCalc.toLocaleString('en-IN')})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstTaxableOn('RENT_ONLY')}
                    style={toggleBtnStyle(gstTaxableOn === 'RENT_ONLY')}
                  >
                    Rent & Extras Only (₹{(baseNum + extraKmNum + extraHrsNum + driverAllowanceNum).toLocaleString('en-IN')})
                  </button>
                </div>
              </div>

              {/* Tax Split Display */}
              {gstPercentNum > 0 && (
                <div style={{
                  background: 'var(--surface-2)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                    <span>Taxable Amount:</span>
                    <span style={{ fontWeight: 600 }}>₹{taxableBase.toLocaleString('en-IN')}</span>
                  </div>
                  {gstType === 'CGST_SGST' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffcc4d' }}>
                        <span>CGST ({(gstPercentNum / 2).toFixed(1)}%):</span>
                        <span style={{ fontWeight: 600 }}>₹{cgstCalc.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffcc4d' }}>
                        <span>SGST ({(gstPercentNum / 2).toFixed(1)}%):</span>
                        <span style={{ fontWeight: 600 }}>₹{sgstCalc.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffcc4d' }}>
                      <span>IGST ({gstPercentNum}%):</span>
                      <span style={{ fontWeight: 600 }}>₹{igstCalc.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── PAYMENT DETAILS ── */}
            <div className="form-row-2" style={{ marginTop: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Payment Due Date</label>
                <DatePicker
                  value={dueDate}
                  onChange={d => setDueDate(d)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Invoice Status</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value as typeof status)}
                >
                  <option value="Sent">Sent (Awaiting Payment)</option>
                  <option value="Pending">Pending Dispatch</option>
                  <option value="Draft">Draft</option>
                  <option value="Paid">Already Paid</option>
                </select>
              </div>
            </div>

            {/* ── GRAND TOTAL BANNER ── */}
            <div
              style={{
                background: 'var(--surface-3)',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginTop: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Monthly Hire Rate:</span>
                <span style={{ fontWeight: 600 }}>₹{baseNum.toLocaleString('en-IN')}</span>
              </div>
              {extraKmNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>+ Extra KM:</span>
                  <span style={{ fontWeight: 600 }}>₹{extraKmNum.toLocaleString('en-IN')}</span>
                </div>
              )}
              {extraHrsNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>+ Extra Hours:</span>
                  <span style={{ fontWeight: 600 }}>₹{extraHrsNum.toLocaleString('en-IN')}</span>
                </div>
              )}
              {driverAllowanceNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>+ Driver Allowance:</span>
                  <span style={{ fontWeight: 600 }}>₹{driverAllowanceNum.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#f97316' }}>+ Fuel ({fuelLitresCalc.toFixed(1)}L):</span>
                <span style={{ fontWeight: 600, color: '#f97316' }}>₹{fuelCostCalc.toLocaleString('en-IN')}</span>
              </div>
              {nightCostCalc > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#a78bfa' }}>+ Night Charges ({nightCountNum}N):</span>
                  <span style={{ fontWeight: 600, color: '#a78bfa' }}>₹{nightCostCalc.toLocaleString('en-IN')}</span>
                </div>
              )}
              {tollNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-dim)' }}>+ Toll / Parking:</span>
                  <span style={{ fontWeight: 600 }}>₹{tollNum.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Subtotal (Before Tax):</span>
                <span style={{ fontWeight: 700 }}>₹{subtotalCalc.toLocaleString('en-IN')}</span>
              </div>

              {gstPercentNum > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: '#ffcc4d' }}>
                    + GST {gstPercentNum}% ({gstType === 'CGST_SGST' ? `CGST ${(gstPercentNum/2).toFixed(1)}% + SGST ${(gstPercentNum/2).toFixed(1)}%` : `IGST ${gstPercentNum}%`}):
                  </span>
                  <span style={{ fontWeight: 600, color: '#ffcc4d' }}>+₹{gstAmountCalc.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>GRAND TOTAL (INVOICE AMOUNT)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {gstPercentNum > 0 ? `Includes ₹${gstAmountCalc.toLocaleString('en-IN')} GST (${gstPercentNum}%)` : 'Exempt / Nil GST'}
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
                  ₹{totalBillCalc.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Generate Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
