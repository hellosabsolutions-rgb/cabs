import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Building2, Briefcase, Calendar, MapPin, IndianRupee, TrendingUp, AlertCircle, CheckCircle2, Navigation, PenTool, BookOpen } from 'lucide-react';
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
  const [driverName, setDriverName] = useState(drivers[0]?.name || '');
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [startTime, setStartTime] = useState('08:30 AM');
  const [endTime, setEndTime] = useState('07:30 PM');
  const [totalHours, setTotalHours] = useState('');
  const [tollParkingAmount, setTollParkingAmount] = useState('');
  
  // Fuel expense fields
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelLitres, setFuelLitres] = useState('');
  const [fuelBillName, setFuelBillName] = useState('');
  const [fuelBillPreview, setFuelBillPreview] = useState<string | null>(null);

  // Log Book Fields
  const [logBookPageNo, setLogBookPageNo] = useState('');
  const [month, setMonth] = useState('');
  const [journeyFrom, setJourneyFrom] = useState('');
  const [journeyTo, setJourneyTo] = useState('');
  const [purposeOfJourney, setPurposeOfJourney] = useState('');
  const [headOfAccount, setHeadOfAccount] = useState('');
  const [motorOilUsed, setMotorOilUsed] = useState('None');
  const [mOilLitres, setMOilLitres] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [officerDesignation, setOfficerDesignation] = useState('');
  const [officerSignatureStatus, setOfficerSignatureStatus] = useState<'Signed' | 'Pending' | 'Exempt'>('Signed');
  const [driverSignatureStatus, setDriverSignatureStatus] = useState<'Signed' | 'Pending'>('Signed');

  // Weekend Trip Specific Fields
  const [tripDestination, setTripDestination] = useState('');
  const [tripFare, setTripFare] = useState('');
  const [driverBata, setDriverBata] = useState('');

  // Sat-Sun / Weekend Off-Duty Package Billing
  const [packageBasePrice, setPackageBasePrice] = useState('');
  const [packageFreeKm, setPackageFreeKm] = useState('80');
  const [extraKmRate, setExtraKmRate] = useState('14');
  const [weekendGstRate, setWeekendGstRate] = useState('5');

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
      if (defaultDutyType === 'Weekend / Off-Duty Trip') {
        setStartKm('12450');
        setEndKm('12619');
        setJourneyFrom('D.Dun Bangarawali');
        setJourneyTo('Vikasnagar & Local to D.Dun');
      }
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
    if (c && c.vehicle.includes('UK 07')) {
      setStartKm('114329');
      setEndKm('114394');
      setLogBookPageNo('122');
      setMonth('August 2026');
      setJourneyFrom('GSON');
      setJourneyTo('Jogiwala to GSON');
      setPurposeOfJourney('for office duty');
      setHeadOfAccount('PWD Office Duty');
      setDriverName('Ramesh Chand');
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

    const deptName = selectedContract?.departmentName || '';
    const vehicleReg = selectedContract?.vehicle || vehicles[0]?.registrationNumber || '';

    if (dutyType === 'Weekend / Off-Duty Trip') {
      const generatedTripSlip = `TRIP-WKND-${Math.floor(Math.random() * 9000 + 1000)}`;
      const baseNum = Number(packageBasePrice) || 2255;
      const freeKmNum = Number(packageFreeKm) || 80;
      const extraKmNum = Math.max(0, calcTotalKm - freeKmNum);
      const extraRateNum = Number(extraKmRate) || 14;
      const extraCostNum = extraKmNum * extraRateNum;
      const subtotalNum = baseNum + extraCostNum + tollNum;
      const gstRateNum = Number(weekendGstRate) || 0;
      const gstAmtNum = Math.round((subtotalNum * gstRateNum) / 100);
      const grandTotalNum = subtotalNum + gstAmtNum;

      // 1. Add Daily Duty Log marked as Weekend Trip with package billing
      addDailyDutyLog({
        dutySlipNumber: generatedTripSlip,
        logBookPageNo: logBookPageNo.trim() || '122',
        month: month.trim() || 'August 2026',
        date,
        departmentName: deptName,
        vehicle: vehicleReg,
        driverName,
        dutyType: 'Weekend / Off-Duty Trip',
        tripDestination: `${journeyFrom || 'D.Dun Bangarawali'} to ${journeyTo || 'Vikasnagar & local'}`,
        journeyFrom: journeyFrom.trim() || 'D.Dun Bangarawali',
        journeyTo: journeyTo.trim() || 'Vikasnagar & local',
        tripFare: grandTotalNum,
        totalFare: grandTotalNum,
        tripNetProfit: Math.max(0, grandTotalNum - (tollNum + fuelNum + bataNum)),
        packageBasePrice: baseNum,
        packageFreeKm: freeKmNum,
        extraKmRate: extraRateNum,
        extraKmCost: extraCostNum,
        subtotal: subtotalNum,
        gstRate: gstRateNum,
        gstAmount: gstAmtNum,
        cgstAmount: Math.round(gstAmtNum / 2),
        sgstAmount: gstAmtNum - Math.round(gstAmtNum / 2),
        startKm: Number(startKm) || 0,
        endKm: Number(endKm) || 0,
        totalKm: calcTotalKm,
        extraKm: extraKmNum,
        startTime,
        endTime,
        totalHours: Number(totalHours) || 10,
        extraHours: 0,
        tollParkingAmount: tollNum,
        fuelAmount: fuelNum > 0 ? fuelNum : undefined,
        fuelLitres: fuelLitres ? Number(fuelLitres) : undefined,
        motorOilUsed: motorOilUsed.trim() || 'None',
        mOilLitres: mOilLitres.trim() || '—',
        purposeOfJourney: 'Sat/Sun Department Duty Booking',
        headOfAccount: 'Department Weekend Duty',
        officerName: officerName.trim() || 'Director Horticulture Mission',
        officerDesignation: officerDesignation.trim() || 'Circuit House D.Dun',
        officerSignatureStatus: 'Signed',
        driverSignatureStatus: 'Signed',
        dutySlipPhoto: slipPhotoPreview || slipPhotoName || null,
        fuelBillPhoto: fuelBillPreview || fuelBillName || null,
        status: 'Approved',
        notes: notes.trim()
          ? `${notes.trim()} · Sat/Sun duty: Fare ₹${grandTotalNum.toLocaleString('en-IN')} (Base ₹${baseNum} for ${freeKmNum}km, ${extraKmNum} extra km @ ₹${extraRateNum})`
          : `Sat/Sun duty: Fare ₹${grandTotalNum.toLocaleString('en-IN')} (Base ₹${baseNum} for ${freeKmNum}km, ${extraKmNum} extra km @ ₹${extraRateNum}).`
      });

      // 2. Also register in Trips financial roster so net profit is counted in Trips module!
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
        logBookPageNo: logBookPageNo.trim() || '122',
        month: month.trim() || 'August 2026',
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
        mOilLitres: mOilLitres.trim() || '—',
        journeyFrom: journeyFrom.trim() || 'GSON',
        journeyTo: journeyTo.trim() || 'Jogiwala to GSON',
        purposeOfJourney: purposeOfJourney.trim() || 'for office duty',
        headOfAccount: headOfAccount.trim() || 'PWD Office Duty',
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
              placeholder="Speak duty info (e.g. 'Duty start 45300 end 45600 toll 200 fuel 2500')"
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
                    setEndKm('45514'); // 169 KM
                    setJourneyFrom('D.Dun Bangarawali');
                    setJourneyTo('Vikasnagar & local');
                    setPackageBasePrice('2255');
                    setPackageFreeKm('80');
                    setExtraKmRate('14');
                    setTollParkingAmount('0');
                    setOfficerName('Director Horticulture Mission');
                    setOfficerDesignation('Circuit House D.Dun');
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Briefcase size={15} /> Weekend Booking (Sat / Sun)
                </div>
              </div>
            </div>

            {/* Log Book Register Reference: Month & Page No (from physical register) */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.04)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BookOpen size={13} /> Log Book Register Details
              </div>
              <div className="form-row-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Month *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. August 2026"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Log Book Page No. *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 122 or 123"
                    value={logBookPageNo}
                    onChange={e => setLogBookPageNo(e.target.value)}
                    required
                  />
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

            {/* IF WEEKEND TRIP: Package Billing Calculator matching Image 2 Cash Memo */}
            {dutyType === 'Weekend / Off-Duty Trip' && (() => {
              const calcKm = Math.max(0, (Number(endKm) || 0) - (Number(startKm) || 0));
              const freeKmVal = Number(packageFreeKm) || 80;
              const extraKmVal = Math.max(0, calcKm - freeKmVal);
              const extraRateVal = Number(extraKmRate) || 14;
              const extraCostVal = extraKmVal * extraRateVal;
              const basePriceVal = Number(packageBasePrice) || 2255;
              const tollVal = Number(tollParkingAmount) || 0;
              const subtotalVal = basePriceVal + extraCostVal + tollVal;
              const gstRateVal = Number(weekendGstRate) || 0;
              const gstAmtVal = Math.round((subtotalVal * gstRateVal) / 100);
              const grandTotalVal = subtotalVal + gstAmtVal;

              return (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(22, 135, 245, 0.04), rgba(245, 158, 11, 0.04))',
                    border: '1.5px solid rgba(22, 135, 245, 0.25)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Briefcase size={15} /> Sat-Sun Off-Duty Booking & Cash Memo Billing
                    </div>
                    <span style={{ fontSize: '11px', background: 'rgba(57, 255, 110, 0.12)', color: 'var(--success)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      Fixed Package + Extra KM Rate
                    </span>
                  </div>

                  <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    Fixed package price includes free KM with fuel. Extra KM charged at vehicle per-KM rate + Toll/Parking (on actuals) + GST.
                  </div>

                  {/* Journey Details: From and To */}
                  <div className="form-row-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Journey Origin (From) *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. D.Dun Bangarawali"
                        value={journeyFrom}
                        onChange={e => setJourneyFrom(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Destination & Local (To) *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Vikasnagar & local"
                        value={journeyTo}
                        onChange={e => setJourneyTo(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Package Base Price & Free KM */}
                  <div className="form-row-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Fixed Package Price (₹) * <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>(Fuel included)</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-faint)' }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          style={{ paddingLeft: '22px', fontWeight: 700 }}
                          placeholder="2255"
                          value={packageBasePrice}
                          onChange={e => setPackageBasePrice(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Included Free KM * <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>(No extra charge)</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          style={{ paddingRight: '35px', fontWeight: 700 }}
                          placeholder="80"
                          value={packageFreeKm}
                          onChange={e => setPackageFreeKm(e.target.value)}
                          required
                        />
                        <span style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-faint)' }}>KM</span>
                      </div>
                    </div>
                  </div>

                  {/* Extra KM Rate & Toll/Parking */}
                  <div className="form-row-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Extra KM Rate (₹/KM) * <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>(Beyond {freeKmVal} KM)</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-faint)' }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          style={{ paddingLeft: '22px', fontWeight: 700 }}
                          placeholder="14"
                          value={extraKmRate}
                          onChange={e => setExtraKmRate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Toll Tax & Parking (₹) <span style={{ fontSize: '10.5px', color: 'var(--text-faint)' }}>(Not in package, on actuals)</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-faint)' }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          style={{ paddingLeft: '22px' }}
                          placeholder="0"
                          value={tollParkingAmount}
                          onChange={e => setTollParkingAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* GST Rate Presets */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0, fontSize: '11.5px' }}>GST Rate:</label>
                      {[0, 5, 12, 18].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setWeekendGstRate(String(r))}
                          className={`subtab-btn ${weekendGstRate === String(r) ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}
                        >
                          {r}%
                        </button>
                      ))}
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, width: '130px' }}>
                      <label className="form-label" style={{ marginBottom: 2, fontSize: '11px' }}>Driver Bata (₹):</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        placeholder="0"
                        value={driverBata}
                        onChange={e => setDriverBata(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Live Distance & Bill Calculation Card */}
                  <div
                    style={{
                      background: 'var(--surface-1, #ffffff)',
                      border: '1px solid var(--border, #cbd5e1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border, #e2e8f0)', paddingBottom: '6px', marginBottom: '6px' }}>
                      <span>Total KM Run: <strong>{calcKm} KM</strong></span>
                      <span>Less Free: <strong>{freeKmVal} KM</strong></span>
                      <span style={{ color: extraKmVal > 0 ? 'var(--warning, #ea580c)' : 'var(--success, #16a34a)', fontWeight: 700 }}>
                        Extra KM: {extraKmVal} KM
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11.5px', color: 'var(--text-dim, #475569)' }}>
                      <div>Base Package: <strong>₹{basePriceVal.toLocaleString('en-IN')}</strong></div>
                      <div>Extra KM ({extraKmVal} @ ₹{extraRateVal}): <strong>₹{extraCostVal.toLocaleString('en-IN')}</strong></div>
                      <div>Toll / Parking: <strong>₹{tollVal.toLocaleString('en-IN')}</strong></div>
                      <div>Subtotal: <strong>₹{subtotalVal.toLocaleString('en-IN')}</strong></div>
                      <div>CGST ({(gstRateVal / 2).toFixed(1)}%): <strong>₹{Math.round(gstAmtVal / 2).toLocaleString('en-IN')}</strong></div>
                      <div>SGST ({(gstRateVal / 2).toFixed(1)}%): <strong>₹{(gstAmtVal - Math.round(gstAmtVal / 2)).toLocaleString('en-IN')}</strong></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid var(--border, #0f172a)', marginTop: '6px', paddingTop: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px' }}>TOTAL BILL (CASH MEMO):</span>
                      <span style={{ fontWeight: 900, fontSize: '16px', color: 'var(--accent, #2563eb)' }}>
                        ₹{grandTotalVal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

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
                <label className="form-label">M. Oil Litres / Other Stores Used</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Litres (e.g. 1 L)"
                    value={mOilLitres}
                    onChange={e => setMOilLitres(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Stores / Brand (e.g. Mobil Super)"
                    value={motorOilUsed}
                    onChange={e => setMotorOilUsed(e.target.value)}
                  />
                </div>
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
                      border: officerSignatureStatus === 'Signed' ? '1px solid var(--success)' : '1px solid var(--border)',
                      background: officerSignatureStatus === 'Signed' ? 'rgba(57, 255, 110, 0.12)' : 'var(--surface-2)',
                      color: officerSignatureStatus === 'Signed' ? 'var(--success)' : 'var(--text-faint)',
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
                      border: driverSignatureStatus === 'Signed' ? '1px solid var(--success)' : '1px solid var(--border)',
                      background: driverSignatureStatus === 'Signed' ? 'rgba(57, 255, 110, 0.12)' : 'var(--surface-2)',
                      color: driverSignatureStatus === 'Signed' ? 'var(--success)' : 'var(--text-faint)',
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
                  <div style={{ fontSize: '15px', fontWeight: 800, color: netTripProfit >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: '2px' }}>
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
