import React, { useState, useRef } from 'react';
import {
  Truck,
  Upload,
  Link,
  Check,
  Search,
  X,
  Sparkles,
  Users,
  Fuel,
  Image as ImageIcon
} from 'lucide-react';
import { VEHICLE_PRESETS, VEHICLE_CATEGORIES, VehiclePreset } from '../../constants/vehiclePresets';
import { processAndCompressFile } from '../../utils/imageCompressor';

interface VehicleImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, imageName?: string) => void;
  currentImage?: string | null;
  suggestedModel?: string;
}

export const VehicleImagePickerModal: React.FC<VehicleImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  currentImage,
  suggestedModel = '',
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  
  // Upload state
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string>('');
  const [compressedSizeKb, setCompressedSizeKb] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL state
  const [urlInput, setUrlInput] = useState('');
  const [urlPreview, setUrlPreview] = useState('');

  if (!isOpen) return null;

  // Filter presets
  const filteredPresets = VEHICLE_PRESETS.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const result = await processAndCompressFile(file);
      setUploadedPreview(result.dataUrl);
      setUploadedName(result.name);
      setCompressedSizeKb(Math.round(result.sizeBytes / 1024));
    } catch (err) {
      console.error('File compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleApplyPreset = (preset: VehiclePreset) => {
    onSelectImage(preset.image, preset.name);
    onClose();
  };

  const handleApplyUpload = () => {
    if (uploadedPreview) {
      onSelectImage(uploadedPreview, uploadedName || 'Uploaded Vehicle Photo');
      onClose();
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onSelectImage(urlInput.trim(), 'Web Vehicle Photo');
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 100000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 680,
          width: '95%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-1, #131926)',
          border: '1px solid var(--border, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
                Vehicle Image Picker
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-faint)' }}>
                Choose a vehicle model from our fleet library or upload your own
              </p>
            </div>
          </div>

          <button
            type="button"
            data-no-modal-close="true"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
            background: 'var(--surface-2, #182234)',
            padding: '0 16px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            data-no-modal-close="true"
            onClick={() => setActiveTab('presets')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'presets' ? '2px solid var(--accent, #38bdf8)' : '2px solid transparent',
              color: activeTab === 'presets' ? 'var(--accent, #38bdf8)' : 'var(--text-faint)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} /> Fleet Presets Library
          </button>

          <button
            type="button"
            data-no-modal-close="true"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2px solid var(--accent, #38bdf8)' : '2px solid transparent',
              color: activeTab === 'upload' ? 'var(--accent, #38bdf8)' : 'var(--text-faint)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Upload size={14} /> Upload Custom Photo
          </button>

          <button
            type="button"
            data-no-modal-close="true"
            onClick={() => setActiveTab('url')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'url' ? '2px solid var(--accent, #38bdf8)' : '2px solid transparent',
              color: activeTab === 'url' ? 'var(--accent, #38bdf8)' : 'var(--text-faint)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Link size={14} /> Web URL
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
          {/* TAB 1: FLEET PRESETS */}
          {activeTab === 'presets' && (
            <div>
              {/* Search & Category Filter */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search vehicle model (e.g. Innova, Dzire, Ertiga)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ height: '36px', paddingLeft: '32px', fontSize: '12px' }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      data-no-modal-close="true"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-faint)',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {VEHICLE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      data-no-modal-close="true"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: selectedCategory === cat ? 'rgba(56, 189, 248, 0.15)' : 'var(--surface-2)',
                        color: selectedCategory === cat ? 'var(--accent, #38bdf8)' : 'var(--text-faint)',
                        borderColor: selectedCategory === cat ? 'rgba(56, 189, 248, 0.4)' : 'var(--border, rgba(255,255,255,0.08))',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                  gap: '12px',
                }}
              >
                {filteredPresets.map(preset => {
                  const isSelected = selectedPresetId === preset.id || currentImage === preset.image;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      onDoubleClick={() => handleApplyPreset(preset)}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'var(--surface-2, #182234)',
                        border: isSelected ? '1.5px solid var(--accent, #38bdf8)' : '1px solid var(--border, rgba(255,255,255,0.08))',
                        borderRadius: '12px',
                        padding: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                      }}
                    >
                      {/* Check badge if selected */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'var(--accent, #38bdf8)',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}

                      {/* Image container */}
                      <div
                        style={{
                          height: '105px',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          marginBottom: '8px',
                        }}
                      >
                        <img
                          src={preset.image}
                          alt={preset.name}
                          style={{
                            maxHeight: '90%',
                            maxWidth: '90%',
                            objectFit: 'contain',
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                          {preset.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '10.5px', color: 'var(--text-faint)', marginBottom: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Users size={11} /> {preset.seatingCapacity} Seats
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Fuel size={11} /> {preset.fuelType}
                          </span>
                        </div>

                        <button
                          type="button"
                          data-no-modal-close="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPreset(preset);
                          }}
                          style={{
                            width: '100%',
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isSelected ? 'var(--accent, #38bdf8)' : 'rgba(255,255,255,0.06)',
                            color: isSelected ? '#000' : 'var(--text)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: 'auto',
                            transition: 'background 0.12s',
                          }}
                        >
                          {isSelected ? '✓ Apply Model' : 'Select Photo'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredPresets.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)' }}>
                  <ImageIcon size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <div>No vehicle presets matched "{searchQuery}".</div>
                  <div style={{ fontSize: '11px', marginTop: '4px' }}>Try switching categories or upload a custom image.</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD FROM DEVICE */}
          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '20px 0' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  border: '2px dashed var(--border, rgba(255,255,255,0.15))',
                  borderRadius: '14px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: 'var(--surface-2, #182234)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {uploadedPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={uploadedPreview}
                      alt="Uploaded preview"
                      style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                    />
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                      {uploadedName}
                    </div>
                    {compressedSizeKb && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#22c55e',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                        }}
                      >
                        ⚡ Optimized ({compressedSizeKb} KB) — Instant upload safe
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--accent, #38bdf8)', marginTop: '4px' }}>
                      Click to choose a different photo
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: 'var(--accent, #38bdf8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Upload size={22} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {isCompressing ? 'Compressing and optimizing photo...' : 'Click to browse or drop vehicle photo here'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                      JPG, PNG, WebP or Camera snaps. Automatically optimized to &lt; 200 KB.
                    </div>
                  </div>
                )}
              </div>

              {uploadedPreview && (
                <button
                  type="button"
                  data-no-modal-close="true"
                  onClick={handleApplyUpload}
                  className="btn-primary"
                  style={{ minWidth: '200px', height: '40px', fontSize: '13px', fontWeight: 600 }}
                >
                  ✓ Use This Vehicle Photo
                </button>
              )}
            </div>
          )}

          {/* TAB 3: IMAGE URL */}
          {activeTab === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '500px', margin: '16px auto' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Paste Direct Vehicle Image URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="https://example.com/car-photo.jpg"
                    value={urlInput}
                    onChange={e => {
                      setUrlInput(e.target.value);
                      setUrlPreview(e.target.value);
                    }}
                    className="form-input"
                    style={{ flex: 1, height: '38px', fontSize: '12px' }}
                  />
                </div>
              </div>

              {urlPreview && (
                <div
                  style={{
                    height: '160px',
                    borderRadius: '10px',
                    background: 'var(--surface-2, #182234)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={urlPreview}
                    alt="Preview"
                    style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }}
                    onError={() => setUrlPreview('')}
                  />
                </div>
              )}

              {urlInput && (
                <button
                  type="button"
                  data-no-modal-close="true"
                  onClick={handleApplyUrl}
                  className="btn-primary"
                  style={{ height: '40px', fontSize: '13px', fontWeight: 600 }}
                >
                  ✓ Apply Vehicle Image URL
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            background: 'var(--surface-2, #182234)',
          }}
        >
          <button
            type="button"
            data-no-modal-close="true"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="btn-secondary"
            style={{ height: '34px', fontSize: '12px', padding: '0 16px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
