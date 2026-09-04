import React, { useState } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { parseVoiceForForm, VoiceParsingContext } from '../../utils/voiceParsers';
import { Mic, MicOff, Check, Sparkles } from 'lucide-react';

export interface MinimalVoiceFillerProps {
  formType: 'driver' | 'vehicle' | 'trip' | 'attendance' | 'expense' | 'dutyLog' | 'contract' | 'general';
  context?: VoiceParsingContext;
  onApplyParsedData: (data: Record<string, any>) => void;
  customParser?: (text: string) => { data: Record<string, any>; count: number };
  placeholder?: string;
}

export const MinimalVoiceFiller: React.FC<MinimalVoiceFillerProps> = ({
  formType,
  context = {},
  onApplyParsedData,
  customParser,
  placeholder = 'Speak to auto-fill form (बोलकर भरें)...'
}) => {
  const [lang, setLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [detectedCount, setDetectedCount] = useState(0);
  const [lastSpeech, setLastSpeech] = useState('');

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    lang,
    continuous: true,
    interimResults: true,
    onResult: (text) => {
      setLastSpeech(text);
      const res = customParser
        ? customParser(text)
        : parseVoiceForForm(formType, text, context);

      if (res && res.count > 0) {
        setDetectedCount(res.count);
        onApplyParsedData(res.data);
      }
    }
  });

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setDetectedCount(0);
      setLastSpeech('');
      startListening();
    }
  };

  if (!isSupported) return null;

  const currentDisplay = interimTranscript || transcript || lastSpeech;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '6px 12px',
        background: isListening
          ? 'linear-gradient(90deg, rgba(57, 255, 110, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)'
          : 'var(--surface-2)',
        border: isListening ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '999px',
        marginBottom: '14px',
        boxShadow: isListening ? '0 0 12px rgba(57, 255, 110, 0.25)' : 'none',
        transition: 'all 0.2s ease',
        minHeight: '38px',
        boxSizing: 'border-box'
      }}
    >
      {/* Mic Button & Wave / Text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        <button
          type="button"
          onClick={handleToggle}
          title={isListening ? 'Click to stop listening' : 'Click to speak and auto-fill form'}
          style={{
            background: isListening ? 'var(--accent)' : 'rgba(57, 255, 110, 0.12)',
            color: isListening ? '#000' : 'var(--accent)',
            border: 'none',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            boxShadow: isListening ? '0 0 10px var(--accent)' : 'none'
          }}
        >
          {isListening ? <MicOff size={13} /> : <Mic size={13} />}
        </button>

        {isListening ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            {/* Live Audio Wave Bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px', flexShrink: 0 }}>
              <span style={{ width: 2.5, height: 12, background: 'var(--accent)', borderRadius: 1, animation: 'soundWave 0.8s ease infinite alternate' }} />
              <span style={{ width: 2.5, height: 16, background: 'var(--accent)', borderRadius: 1, animation: 'soundWave 0.6s ease infinite alternate 0.2s' }} />
              <span style={{ width: 2.5, height: 8, background: 'var(--accent)', borderRadius: 1, animation: 'soundWave 0.7s ease infinite alternate 0.4s' }} />
            </div>

            <span
              style={{
                fontSize: '11.5px',
                color: 'var(--accent)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentDisplay ? `"${currentDisplay}"` : 'Listening... bolte rahiye'}
            </span>
          </div>
        ) : (
          <div
            onClick={handleToggle}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: 0,
              flex: 1
            }}
          >
            <Sparkles size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: '11.5px',
                color: 'var(--text-dim)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {placeholder}
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Detected Badge & Lang Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {detectedCount > 0 && (
          <span
            style={{
              background: 'rgba(57, 255, 110, 0.15)',
              color: 'var(--accent)',
              border: '1px solid rgba(57, 255, 110, 0.3)',
              borderRadius: '12px',
              padding: '2px 7px',
              fontSize: '10.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <Check size={10} /> {detectedCount} filled
          </span>
        )}

        {/* Minimalist Language Switch */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '2px',
            fontSize: '9.5px',
            fontWeight: 700
          }}
        >
          <button
            type="button"
            onClick={() => setLang('en-IN')}
            style={{
              background: lang === 'en-IN' ? 'var(--accent)' : 'transparent',
              color: lang === 'en-IN' ? '#000' : 'var(--text-faint)',
              border: 'none',
              borderRadius: '10px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'all 0.15s'
            }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('hi-IN')}
            style={{
              background: lang === 'hi-IN' ? 'var(--accent)' : 'transparent',
              color: lang === 'hi-IN' ? '#000' : 'var(--text-faint)',
              border: 'none',
              borderRadius: '10px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'all 0.15s'
            }}
          >
            HI
          </button>
        </div>
      </div>
    </div>
  );
};
