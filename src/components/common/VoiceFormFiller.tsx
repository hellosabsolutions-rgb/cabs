import React, { useState } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { parseVehicleVoiceInput, ParsedVehicleVoiceData } from '../../utils/vehicleVoiceParser';
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';

interface VoiceFormFillerProps {
  availableDrivers?: string[];
  onApplyParsedData: (data: ParsedVehicleVoiceData) => void;
}

export const VoiceFormFiller: React.FC<VoiceFormFillerProps> = ({
  availableDrivers = [],
  onApplyParsedData
}) => {
  const [activeLang, setActiveLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [detectedData, setDetectedData] = useState<ParsedVehicleVoiceData>({});
  const [detectedCount, setDetectedCount] = useState(0);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    lang: activeLang,
    continuous: true,
    interimResults: true,
    onResult: (text) => {
      const { parsed, detectedFieldsCount } = parseVehicleVoiceInput(text, availableDrivers);
      setDetectedData(parsed);
      setDetectedCount(detectedFieldsCount);
    }
  });

  const handleApply = () => {
    stopListening();
    if (Object.keys(detectedData).length > 0) {
      onApplyParsedData(detectedData);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      handleApply();
    } else {
      resetTranscript();
      setDetectedData({});
      setDetectedCount(0);
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div
        style={{
          background: 'rgba(255, 184, 0, 0.1)',
          border: '1px solid rgba(255, 184, 0, 0.3)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '12px',
          color: '#ffb800',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          flexShrink: 0
        }}
      >
        <AlertCircle size={15} style={{ flexShrink: 0 }} />
        <span>Voice dictation is supported in Google Chrome, Microsoft Edge, and Android Chrome.</span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        flexShrink: 0,
        background: isListening
          ? 'linear-gradient(135deg, rgba(57, 255, 110, 0.14) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'var(--surface-2)',
        border: isListening ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: '12px',
        padding: '14px 16px',
        marginBottom: '18px',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Top Bar: Title & Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 200 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: isListening ? 'var(--accent)' : 'var(--accent-dim)',
              color: isListening ? '#000' : 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isListening ? '0 0 14px rgba(57, 255, 110, 0.6)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Mic size={16} />
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Voice Form Fill / बोलकर भरें</span>
              <span
                style={{
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(57, 255, 110, 0.3)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  fontSize: '9.5px',
                  color: 'var(--accent)',
                  fontWeight: 700
                }}
              >
                AI VOICE
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
              {isListening ? 'Listening... Bolte rahiye' : 'Speak details to auto-fill vehicle form'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setActiveLang(prev => (prev === 'en-IN' ? 'hi-IN' : 'en-IN'))}
            disabled={isListening}
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11.5px',
              color: 'var(--text-dim)',
              cursor: isListening ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
            title="Toggle speech language"
          >
            {activeLang === 'en-IN' ? '🇮🇳 Hinglish' : '🇮🇳 Hindi'}
          </button>

          {/* Main Mic Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            style={{
              background: isListening ? 'var(--danger)' : 'var(--accent)',
              color: isListening ? '#fff' : 'var(--accent-text)',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isListening ? '0 0 12px rgba(255, 92, 92, 0.5)' : '0 2px 8px rgba(57, 255, 110, 0.3)'
            }}
          >
            {isListening ? (
              <>
                <MicOff size={14} />
                <span>Stop & Apply</span>
              </>
            ) : (
              <>
                <Mic size={14} />
                <span>Start Voice Fill</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* When Listening or Transcript Exists */}
      {(isListening || transcript) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {/* Animated Wave Indicator when listening */}
          {isListening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 4, height: 16, background: 'var(--accent)', borderRadius: 2, animation: 'pulse 0.8s infinite alternate' }} />
              <div style={{ width: 4, height: 22, background: 'var(--accent)', borderRadius: 2, animation: 'pulse 0.6s infinite alternate 0.2s' }} />
              <div style={{ width: 4, height: 12, background: 'var(--accent)', borderRadius: 2, animation: 'pulse 0.9s infinite alternate 0.4s' }} />
              <div style={{ width: 4, height: 18, background: 'var(--accent)', borderRadius: 2, animation: 'pulse 0.7s infinite alternate 0.1s' }} />
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginLeft: '6px' }}>
                Listening to your voice... (बोलते रहिए)
              </span>
            </div>
          )}

          {/* Transcript box */}
          <div
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border-soft)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              color: 'var(--text)',
              maxHeight: '75px',
              overflowY: 'auto',
              lineHeight: 1.45
            }}
          >
            <span style={{ color: 'var(--text)' }}>{transcript}</span>
            {interimTranscript && (
              <span style={{ color: 'var(--accent)', fontStyle: 'italic', marginLeft: '4px' }}>
                {interimTranscript}
              </span>
            )}
            {!transcript && !interimTranscript && isListening && (
              <span style={{ color: 'var(--text-faint)' }}>
                Speak now... e.g. "Gadi number DL01AB1234, Model Innova, Fuel Diesel, Driver Rahul Sharma, 7 seater"
              </span>
            )}
          </div>

          {/* Detected Fields Pill Cloud */}
          {detectedCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} color="var(--accent)" />
                Detected ({detectedCount} fields matched):
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {detectedData.registrationNumber && (
                  <span style={pillStyle}>
                    ✓ Reg: <strong>{detectedData.registrationNumber}</strong>
                  </span>
                )}
                {detectedData.model && (
                  <span style={pillStyle}>
                    ✓ Model: <strong>{detectedData.model}</strong>
                  </span>
                )}
                {detectedData.type && (
                  <span style={pillStyle}>
                    ✓ Type: <strong>{detectedData.type}</strong>
                  </span>
                )}
                {detectedData.departmentName && (
                  <span style={pillStyle}>
                    ✓ Dept: <strong>{detectedData.departmentName}</strong>
                  </span>
                )}
                {detectedData.assignedDriver && (
                  <span style={pillStyle}>
                    ✓ Driver: <strong>{detectedData.assignedDriver}</strong>
                  </span>
                )}
                {detectedData.fuelType && (
                  <span style={pillStyle}>
                    ✓ Fuel: <strong>{detectedData.fuelType}</strong>
                  </span>
                )}
                {detectedData.seatingCapacity && (
                  <span style={pillStyle}>
                    ✓ Seats: <strong>{detectedData.seatingCapacity}</strong>
                  </span>
                )}
                {detectedData.odometer && (
                  <span style={pillStyle}>
                    ✓ Odo: <strong>{detectedData.odometer} KM</strong>
                  </span>
                )}
                {detectedData.fastagBalance && (
                  <span style={pillStyle}>
                    ✓ FASTag: <strong>₹{detectedData.fastagBalance}</strong>
                  </span>
                )}
              </div>

              {/* Instant Apply Button if stopped */}
              {!isListening && (
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleApply}
                    style={{
                      background: 'var(--accent-dim)',
                      border: '1px solid rgba(57, 255, 110, 0.4)',
                      color: 'var(--accent)',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Check size={13} /> Auto-fill These In Form
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetTranscript();
                      setDetectedData({});
                      setDetectedCount(0);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-faint)',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Helpful Hint when idle */}
      {!isListening && !transcript && (
        <div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.35 }}>
          💡 <em>Example bolen: "Gaadi number DL 01 AB 1234, Model Innova Crysta, Fuel Diesel, Driver Rahul Sharma, 7 seater"</em>
        </div>
      )}
    </div>
  );
};

const pillStyle: React.CSSProperties = {
  background: 'var(--accent-dim)',
  border: '1px solid rgba(57, 255, 110, 0.3)',
  color: 'var(--accent)',
  borderRadius: '5px',
  padding: '3px 8px',
  fontSize: '11px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
};
