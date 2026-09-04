import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '../../../context/FleetContext';
import { Zap, FileText } from 'lucide-react';
import { MinimalVoiceFiller } from '../../common/MinimalVoiceFiller';

interface RechargeFastagModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVehicle?: string;
}

export const RechargeFastagModal: React.FC<RechargeFastagModalProps> = ({
  isOpen,
  onClose,
  preselectedVehicle
}) => {
  const { vehicles, rechargeFastag } = useFleet();

  const [vehicleReg, setVehicleReg] = useState(preselectedVehicle || vehicles[0]?.registrationNumber || 'DL01AB1234');
  const [amount, setAmount] = useState('2000');
  const [paymentMode, setPaymentMode] = useState('UPI / GPay');
  const [proofName, setProofName] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const proofInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preselectedVehicle) {
      setVehicleReg(preselectedVehicle);
    }
  }, [preselectedVehicle]);

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

  const selectedVehicle = vehicles.find(v => v.registrationNumber === vehicleReg) || vehicles[0];
  const currentBal = selectedVehicle?.fastagBalance || 0;
  const rechargeNum = Number(amount) || 0;
  const newBal = currentBal + rechargeNum;

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeNum || rechargeNum <= 0) {
      setErrorMsg('Please enter a valid recharge amount.');
      return;
    }

    rechargeFastag(vehicleReg, rechargeNum, paymentMode, proofPreview || proofName || null);

    setAmount('2000');
    setProofName('');
    setProofPreview(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#ffcc4d" /> Recharge Vehicle FASTag
            </h3>
            <span className="modal-subtitle">Top up electronic toll wallet for {vehicleReg}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-body">
            {/* Minimal Voice Form Filler */}
            <MinimalVoiceFiller
              formType="expense"
              context={{ vehicles: vehicles.map(v => v.registrationNumber) }}
              placeholder="Speak recharge info (e.g. 'DL01AB1234 recharge 2000 Rupees UPI')"
              onApplyParsedData={(data) => {
                if (data.vehicle) setVehicleReg(data.vehicle);
                if (data.amount) setAmount(data.amount);
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

            {/* Vehicle Selection */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Vehicle to Recharge *</label>
              <select
                className="form-input"
                value={vehicleReg}
                onChange={e => setVehicleReg(e.target.value)}
                required
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.registrationNumber}>
                    {v.registrationNumber} (Bal: ₹{(v.fastagBalance || 0).toLocaleString('en-IN')})
                    {(v.fastagBalance || 0) < 500 ? ' [LOW BALANCE]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* FASTag Account Details Card */}
            <div
              style={{
                background: 'var(--surface-3)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>TAG ACCOUNT</div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px', marginTop: '2px' }}>
                  {selectedVehicle?.fastagBank || 'NPCI National Electronic Toll'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Tag ID: {selectedVehicle?.fastagTagId || '34161FA8891'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>CURRENT BALANCE</div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: currentBal < 500 ? 'var(--danger)' : 'var(--accent)',
                    marginTop: '2px'
                  }}
                >
                  ₹{currentBal.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Recharge Amount & Quick Pills */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Recharge Amount (₹) *</label>
              <input
                type="number"
                min="100"
                step="100"
                className="form-input"
                style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)' }}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {[500, 1000, 2000, 3000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    className="btn-secondary"
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      background: Number(amount) === val ? 'var(--surface-3)' : undefined,
                      borderColor: Number(amount) === val ? 'var(--accent)' : undefined
                    }}
                    onClick={() => setAmount(String(val))}
                  >
                    +₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Mode */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Mode</label>
              <select
                className="form-input"
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
              >
                <option value="UPI / GPay">UPI / Google Pay / PhonePe</option>
                <option value="Corporate NetBanking">Corporate NetBanking</option>
                <option value="Debit / Credit Card">Debit / Credit Card</option>
                <option value="Fleet Fastag Portal">Fleet FASTag Portal</option>
              </select>
            </div>

            {/* Projected Balance Banner */}
            <div
              style={{
                background: 'var(--surface-2)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12.5px'
              }}
            >
              <span style={{ color: 'var(--text-dim)' }}>Projected New Balance:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px' }}>
                ₹{newBal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Payment Receipt Upload */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Topup Receipt / Payment Screenshot</label>
              <input
                type="file"
                ref={proofInputRef}
                onChange={handleProofUpload}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              <div
                className="upload-box"
                onClick={() => proofInputRef.current?.click()}
                style={{ padding: '8px 12px' }}
              >
                {proofPreview ? (
                  <img src={proofPreview} alt="Receipt" className="upload-preview" />
                ) : (
                  <div className="upload-icon-placeholder" style={{ width: 34, height: 34 }}>
                    <FileText size={16} color="var(--accent)" />
                  </div>
                )}
                <div className="upload-info">
                  <div className="upload-title" style={{ fontSize: '12px' }}>
                    {proofName ? proofName : 'Upload payment confirmation receipt'}
                  </div>
                  <div className="upload-hint">Bank advice or screenshot</div>
                </div>
                {proofName && (
                  <button
                    type="button"
                    className="modal-close-btn"
                    style={{ width: 22, height: 22, fontSize: 10 }}
                    onClick={e => {
                      e.stopPropagation();
                      setProofName('');
                      setProofPreview(null);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} /> Complete Recharge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
