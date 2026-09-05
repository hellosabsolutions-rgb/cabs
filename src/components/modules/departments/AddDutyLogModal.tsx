import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Building2, Briefcase, Calendar, MapPin, IndianRupee, TrendingUp, AlertCircle, CheckCircle2, Navigation, PenTool } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';
import { DatePicker } from '../../common/DatePicker';

interface AddDutyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDutyType?: 'Official Department Duty' | 'Weekend / Off-Duty Trip';
}

export const AddDutyLogModal: React.FC<AddDutyLogModalProps> = ({
  isOpen,
  onClose,
  defaultDutyType = 'Official Department Duty'
}) => {
  const { departmentContracts, drivers, vehicles, addDailyDutyLog, addTrip, switchVehicleMode } = useFleet();

  const [dutyType, setDutyType] = useState<'Official Department Duty' | 'Weekend / Off-Duty Trip'>(defaultDutyType);
  const [dutySlipNumber, setDutySlipNumber] = useState(
    () => `SLIP-${Math.floor(Math.random() * 9000 + 1000)}`
  );
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedContractId, setSelectedContractId] = useState(departmentContracts[0]?.id || '');
  const [driverName, setDriverName] = useState(drivers[0]?.name || 'Rahul Sharma');
  const [startKm, setStartKm] = useState('45345');
  const [endKm, setEndKm] = useState('45475');
  const [startTime, setStartTime] = useState('08:30 AM');
  const [endTime, setEndTime] = useState('07:30 PM');
  const [totalHours, setTotalHours] = useState('11.0');
  const [tollParkingAmount, setTollParkingAmount] = useState('240');
  
  // Fuel expense fields
  const [fuelAmount, setFuelAmount] = useState('2400');
  const [fuelLitres, setFuelLitres] = useState('25.5');
  const [fuelBillName, setFuelBillName] = useState('');
  const [fuelBillPreview, setFuelBillPreview] = useState<string | null>(null);

  // Missing Log Book Fields
  const [journeyFrom, setJourneyFrom] = useState('GSON Base');
  const [journeyTo, setJourneyTo] = useState('Jogiwala & Site');
  const [purposeOfJourney, setPurposeOfJourney] = useState('Official Office Duty');
  const [headOfAccount, setHeadOfAccount] = useState('PWD-M&E-2026');
  const [motorOilUsed, setMotorOilUsed] = useState('None');
  const [officerName, setOfficerName] = useState('Er. R. K. Singhal');
  const [officerDesignation, setOfficerDesignation] = useState('Executive Engineer (Civil)');
  const [officerSignatureStatus, setOfficerSignatureStatus] = useState<'Signed' | 'Pending' | 'Exempt'>('Signed');
  const [driverSignatureStatus, setDriverSignatureStatus] = useState<'Signed' | 'Pending'>('Signed');

  // Weekend Trip Specific Fields
  const [tripDestination, setTripDestination] = useState('Delhi to Jaipur (Weekend Round Trip)');
  const [tripFare, setTripFare] = useState('14500');
  const [driverBata, setDriverBata] = useState('1200');

  const [notes, setNotes] = useState('');
  const [slipPhotoName, setSlipPhotoName] = useState('');
  const [slipPhotoPreview, setSlipPhotoPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const fuelInputRef = useRef<HTMLInputElement>(null);

  const selectedContract = departmentContracts.find(c => c.id === selectedContractId) || departmentContracts[0];
  const selectedVehicleObj = vehicles.find(v => v.registrationNumber === selectedContract?.vehicle);

  useEffect(() => {
    if (defaultDutyType) {
      setDutyType(defaultDutyType);
    }
  }, [defaultDutyType]);

  useEffect(() => {
    if (departmentContracts.length > 0 && !selectedContractId) {
      setSelectedContractId(departmentContracts[0].id);
      if (departmentContracts[0].driverName) {
        setDriverName(departmentContracts[0].driverName);
      }
    }
  }, [departmentContracts, selectedContractId]);

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

  const handleContractChange = (id: string) => {
    setSelectedContractId(id);
    const c = departmentContracts.find(item => item.id === id);
    if (c && c.driverName) {
      setDriverName(c.driverName);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFuelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFuelBillName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFuelBillPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calcTotalKm = Math.max(0, (Number(endKm) || 0) - (Number(startKm) || 0));
  const calcExtraKm = dutyType === 'Official Department Duty' ? Math.max(0, calcTotalKm - 100) : 0;

  // Weekend trip calculations
  const fareNum = Number(tripFare) || 0;
  const fuelNum = Number(fuelAmount) || 0;
  const tollNum = Number(tollParkingAmount) || 0;
  const bataNum = Number(driverBata) || 0;
  const totalTripExpenses = fuelNum + tollNum + bataNum;
  const netTripProfit = fareNum - totalTripExpenses;
  const tripMargin = fareNum > 0 ? ((netTripProfit / fareNum) * 100).toFixed(1) + '%' : '0%';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(endKm) < Number(startKm)) {
      setErrorMsg('End KM reading cannot be less than Start KM reading.');
      return;
    }

    const deptName = selectedContract?.departmentName || 'Public Works Department (PWD)';
    const vehicleReg = selectedContract?.vehicle || 'DL01AB1234';

    if (dutyType === 'Weekend / Off-Duty Trip') {
      const generatedTripSlip = `TRIP-WKND-${Math.floor(Math.random() * 9000 + 1000)}`;

      // 1. Add Daily Duty Log marked as Weekend Trip
      addDailyDutyLog({
        dutySlipNumber: generatedTripSlip,
        date,
        departmentName: deptName,
        vehicle: vehicleReg,
        driverName,
        dutyType: 'Weekend / Off-Duty Trip',
        tripDestination: tripDestination.trim(),
        tripFare: fareNum,
        tripNetProfit: netTripProfit,
        startKm: Number(startKm) || 0,
        endKm: Number(endKm) || 0,
        totalKm: calcTotalKm,
        extraKm: 0,
        startTime,
        endTime,
        totalHours: Number(totalHours) || 16,
        extraHours: 0,
        tollParkingAmount: tollNum,
        fuelAmount: fuelNum > 0 ? fuelNum : undefined,
        fuelLitres: fuelLitres ? Number(fuelLitres) : undefined,
        motorOilUsed: motorOilUsed.trim() || 'None',
        journeyFrom: tripDestination.split(' to ')[0] || 'Delhi Base',
        journeyTo: tripDestination.split(' to ')[1] || tripDestination,
        purposeOfJourney: 'Weekend Outstation Booking',
        headOfAccount: 'Fleet Commercial Trips',
        officerName: 'Private Client (Weekend Trip)',
        officerDesignation: 'Client Guest',
        officerSignatureStatus: 'Signed',
        driverSignatureStatus: 'Signed',
        dutySlipPhoto: slipPhotoPreview || slipPhotoName || null,
        fuelBillPhoto: fuelBillPreview || fuelBillName || null,
        status: 'Approved',
        notes: notes.trim()
          ? `${notes.trim()} · Sat/Sun weekend trip: Fare ₹${fareNum.toLocaleString('en-IN')}, Profit ₹${netTripProfit.toLocaleString('en-IN')}`
          : `Sat/Sun weekend trip: Fare ₹${fareNum.toLocaleString('en-IN')}, Profit ₹${netTripProfit.toLocaleString('en-IN')} (Excluded from ${deptName} monthly invoice).`
      });

      // 2. Also register in Trips financial roster so Munafa is counted in Trips module!
      addTrip({
        tripNumber: generatedTripSlip,
        tripType: 'Round Trip',
        vehicle: vehicleReg,
        vehicleModel: selectedVehicleObj?.model,
        isDepartmentVehicle: true,
        departmentName: deptName,
        weekendDutyType: 'Weekend Round Trip',
        driverName,
        pickupLocation: tripDestination.split(' to ')[0] || 'Delhi Base',
        dropLocation: tripDestination.split(' to ')[1] || tripDestination,
        route: tripDestination,
        startDate: date,
        startTime,
        startOdometer: Number(startKm) || 0,
        endOdometer: Number(endKm) || 0,
        totalKmRun: calcTotalKm,
        initialFuelLitres: Number(fuelLitres) || 0,
        fuelCost: fuelNum,
        fastagCost: tollNum,
        driverBata: bataNum,
        otherExpenses: 0,
        revenue: fareNum,
        expenses: totalTripExpenses,
        profit: netTripProfit,
        margin: tripMargin,
        status: 'Completed',
        notes: `Weekend trip executed by department vehicle (${deptName} contract). Logged via Department Duty Roster.`
      });

      if (selectedVehicleObj) {
        switchVehicleMode(selectedVehicleObj.id, 'Trip-based');
      }
    } else {
      // Official Department Duty
      addDailyDutyLog({
        dutySlipNumber: dutySlipNumber.trim(),
        date,
        departmentName: deptName,
        vehicle: vehicleReg,
        driverName,
        dutyType: 'Official Department Duty',
        startKm: Number(startKm) || 0,
        endKm: Number(endKm) || 0,
        totalKm: calcTotalKm,
        extraKm: calcExtraKm,
        startTime,
        endTime,
        totalHours: Number(totalHours) || 10,
        extraHours: Math.max(0, (Number(totalHours) || 10) - 10),
        tollParkingAmount: tollNum,
        fuelAmount: fuelNum > 0 ? fuelNum : undefined,
        fuelLitres: fuelLitres ? Number(fuelLitres) : undefined,
        motorOilUsed: motorOilUsed.trim() || 'None',
        journeyFrom: journeyFrom.trim() || 'GSON Base',
        journeyTo: journeyTo.trim() || 'Site Office',
        purposeOfJourney: purposeOfJourney.trim() || 'Official Office Duty',
        headOfAccount: headOfAccount.trim() || 'General Duty / Fleet',
        officerName: officerName.trim() || undefined,
        officerDesignation: officerDesignation.trim() || undefined,
        officerSignatureStatus,
        driverSignatureStatus,
        dutySlipPhoto: slipPhotoPreview || slipPhotoName || null,
        fuelBillPhoto: fuelBillPreview || fuelBillName || null,
        status: 'Approved',
        notes: notes.trim() || undefined
      });
    }

    setNotes('');
    setFuelAmount('');
    setFuelLitres('');
    setFuelBillName('');
    setFuelBillPreview(null);
    setSlipPhotoName('');
    setSlipPhotoPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {dutyType === 'Weekend / Off-Duty Trip' ? <Briefcase size={18} color="#38bdf8" /> : <Building2 size={18} color="var(--accent)" />}
              {dutyType === 'Weekend / Off-Duty Trip'
                ? 'Log Weekend / Sat-Sun Trip for Department Vehicle'
                : 'Log Official Department Duty Slip'}
            </h3>
            <span className="modal-subtitle">
              {dutyType === 'Weekend / Off-Duty Trip'
                ? 'Record commercial trip taken by department car on Saturday/Sunday with profit tracking'
                : 'Record official department vehicle running, KM & hours'}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="general"
              context={{
                vehicles: vehicles.map(v => v.registrationNumber),
                drivers: drivers.map(d => d.name),
                departments: departmentContracts.map(c => c.departmentName)
              }}
              placeholder="Speak duty info (e.g. 'Rahul Sharma start 45300 end 45600 toll 200 fuel 2500')"
              onApplyParsedData={(data) => {
                if (data.driverName) setDriverName(data.driverName);
                if (data.vehicle) {
                  const matchContract = departmentContracts.find(c => c.vehicle === data.vehicle);
                  if (matchContract) setSelectedContractId(matchContract.id);
                }
                if (data.amount) setTollParkingAmount(data.amount);
                if (data.litres) setFuelLitres(data.litres);
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

            {/* Duty Type Selector: Official Department vs Weekend Trip */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Duty Category / Log Type *</label>
              <div className="driver-type-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div
                  className={`driver-type-option ${dutyType === 'Official Department Duty' ? 'active' : ''}`}
                  onClick={() => {
                    setDutyType('Official Department Duty');
                    setStartKm('45345');
                    setEndKm('45470');
                    setTollParkingAmount('0');
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Building2 size={15} /> Official Duty (Mon - Fri)
                </div>
                <div
                  className={`driver-type-option ${dutyType === 'Weekend / Off-Duty Trip' ? 'active' : ''}`}
                  onClick={() => {
                    setDutyType('Weekend / Off-Duty Trip');
                    setStartKm('45345');
                    setEndKm('45980');
                    setTollParkingAmount('650');
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Briefcase size={15} /> Weekend Booking (Sat / Sun)
                </div>
              </div>
            </div>

            {/* Department Contract Vehicle & Date */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department Contract Vehicle *</label>
                <select
                  className="form-input"
                  value={selectedContractId}
                  onChange={e => handleContractChange(e.target.value)}
                  required
                >
                  {departmentContracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.vehicle} — {c.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  {dutyType === 'Weekend / Off-Duty Trip' ? 'Weekend Booking Date (Sat / Sun) *' : 'Duty Date *'}
                </label>
                <DatePicker
                  value={date}
                  onChange={d => setDate(d)}
                  required
                />
              </div>
            </div>

            {/* IF WEEKEND TRIP: Route & Customer Fare */}
            {dutyType === 'Weekend / Off-Duty Trip' && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={14} /> Weekend Commercial Booking Details & Net Profit
                </div>

                <div className="form-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Booking Route *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Delhi to Jaipur (Round Trip)"
                      value={tripDestination}
                      onChange={e => setTripDestination(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Customer Fare / Revenue (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '15px' }}
                      placeholder="14500"
                      value={tripFare}
                      onChange={e => setTripFare(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Driver Bata / Outstation Allowance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="1200"
                    value={driverBata}
                    onChange={e => setDriverBata(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Official Department Duty Log Book Fields */}
            {dutyType === 'Official Department Duty' && (
              <>
                {/* Log Book: Details of Journey (From & To) */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Navigation size={13} color="var(--accent)" /> Details of Journey (Log Book Entry)
                  </div>
                  <div className="form-row-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Journey From (Origin) *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. GSON / Head Office"
                        value={journeyFrom}
                        onChange={e => setJourneyFrom(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Journey To (Destination) *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Jogiwala / Treasury / Site"
                        value={journeyTo}
                        onChange={e => setJourneyTo(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Purpose of Journey & Head of A/c */}
                <div className="form-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Purpose of Journey *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. for office duty, site inspection"
                      value={purposeOfJourney}
                      onChange={e => setPurposeOfJourney(e.target.value)}
                      required
                    />
                    {/* Quick preset chips */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {['Office Duty', 'Site Inspection', 'Treasury', 'PHC / Health', 'Bank Visit'].map(p => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setPurposeOfJourney(p)}
                          style={{
                            background: purposeOfJourney === p ? 'var(--accent)' : 'var(--surface-3)',
                            color: purposeOfJourney === p ? '#fff' : 'var(--text-dim)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '2px 7px',
                            fontSize: '10.5px',
                            cursor: 'pointer'
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Head of Account (Head of A/c)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. PWD-M&E-2026 / Office Duty"
                      value={headOfAccount}
                      onChange={e => setHeadOfAccount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Officer Name & Designation */}
                <div className="form-row-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Officer Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Er. R. K. Singhal"
                      value={officerName}
                      onChange={e => setOfficerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Officer Designation *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Executive Engineer (Civil) / AE / CMO"
                      value={officerDesignation}
                      onChange={e => setOfficerDesignation(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Driver & Duty Slip No / Officer Reference */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Driver Name (Pilot on Duty) *</label>
                <select
                  className="form-input"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  required
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.driverType || 'Driver'})
                    </option>
                  ))}
                </select>
              </div>

              {dutyType === 'Official Department Duty' ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Duty Slip No. *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={dutySlipNumber}
                    onChange={e => setDutySlipNumber(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Officer / Private Client Reference</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Private Client Booking / Family Trip"
                    value={officerName}
                    onChange={e => setOfficerName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Odometer Readings */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Odometer (KM) *</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={startKm}
                  onChange={e => setStartKm(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">End Odometer (KM) *</label>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>
                    Done: {calcTotalKm} km
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={endKm}
                  onChange={e => setEndKm(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Fuel, Litres, Toll & M. Oil Used */}
            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fuel Expense (₹) & Litres</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="₹ Amount"
                    value={fuelAmount}
                    onChange={e => setFuelAmount(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="form-input"
                    placeholder="Litres"
                    value={fuelLitres}
                    onChange={e => setFuelLitres(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">M. Oil / Other Stores Used</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1 L Mobil Super / None"
                  value={motorOilUsed}
                  onChange={e => setMotorOilUsed(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">FASTag Toll Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="650"
                  value={tollParkingAmount}
                  onChange={e => setTollParkingAmount(e.target.value)}
                />
              </div>

              {/* Signatures verification status */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Log Book Signatures (Sig.)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '38px' }}>
                  <button
                    type="button"
                    onClick={() => setOfficerSignatureStatus(prev => prev === 'Signed' ? 'Pending' : 'Signed')}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: officerSignatureStatus === 'Signed' ? '1px solid #39ff6e' : '1px solid var(--border)',
                      background: officerSignatureStatus === 'Signed' ? 'rgba(57, 255, 110, 0.12)' : 'var(--surface-2)',
                      color: officerSignatureStatus === 'Signed' ? '#39ff6e' : 'var(--text-faint)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle2 size={12} /> {officerSignatureStatus === 'Signed' ? 'Sig. Officer' : 'Officer Pending'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDriverSignatureStatus(prev => prev === 'Signed' ? 'Pending' : 'Signed')}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: driverSignatureStatus === 'Signed' ? '1px solid #39ff6e' : '1px solid var(--border)',
                      background: driverSignatureStatus === 'Signed' ? 'rgba(57, 255, 110, 0.12)' : 'var(--surface-2)',
                      color: driverSignatureStatus === 'Signed' ? '#39ff6e' : 'var(--text-faint)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle2 size={12} /> {driverSignatureStatus === 'Signed' ? 'Sig. Driver' : 'Driver Pending'}
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE PROFIT DISPLAY FOR WEEKEND TRIP */}
            {dutyType === 'Weekend / Off-Duty Trip' && (
              <div
                style={{
                  background: netTripProfit >= 0 ? 'rgba(57, 255, 110, 0.08)' : 'rgba(255, 92, 92, 0.08)',
                  border: `1px solid ${netTripProfit >= 0 ? 'rgba(57, 255, 110, 0.3)' : 'rgba(255, 92, 92, 0.3)'}`,
                  padding: '12px 14px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    Total KM: <b>{calcTotalKm} km</b> · Total Expenses: <b>₹{totalTripExpenses.toLocaleString('en-IN')}</b>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: netTripProfit >= 0 ? '#39ff6e' : 'var(--danger)', marginTop: '2px' }}>
                    Net Profit: ₹{netTripProfit.toLocaleString('en-IN')} ({tripMargin})
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-dim)' }}>
                  <div>Fare: ₹{fareNum.toLocaleString('en-IN')}</div>
                  <div style={{ color: 'var(--danger)' }}>- Expenses: ₹{totalTripExpenses.toLocaleString('en-IN')}</div>
                </div>
              </div>
            )}

            {/* Explanatory Policy Alert */}
            <div
              style={{
                background: 'var(--surface-3)',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--border)'
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, color: 'var(--accent)' }} />
              {dutyType === 'Weekend / Off-Duty Trip' ? (
                <span>
                  <b>Audit Note:</b> This log will <b>NOT</b> be included in <b>{selectedContract?.departmentName}</b>'s monthly tender bill. Its net profit will be recorded in the <b>Trips Ledger</b> and vehicle odometer will stay updated.
                </span>
              ) : (
                <span>
                  This is an official department duty slip. Extra KM and tolls will be billed to the department's monthly invoice.
                </span>
              )}
            </div>

            {/* Notes */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Duty / Trip Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  dutyType === 'Weekend / Off-Duty Trip'
                    ? 'e.g. Sunday off from PWD. Commercial outstation trip.'
                    : 'e.g. Site visit with Junior Engineer to Ring Road bypass'
                }
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> {dutyType === 'Weekend / Off-Duty Trip' ? 'Save Weekend Trip Log' : 'Log Duty Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
