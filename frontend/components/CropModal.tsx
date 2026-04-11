'use client';
import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/getCroppedImg';

type Area = { x: number; y: number; width: number; height: number };

type Props = {
  imageSrc: string;
  onCrop:   (blob: Blob) => void;
  onCancel: () => void;
};

export default function CropModal({ imageSrc, onCrop, onCancel }: Props) {
  const t = useTranslations('cropModal');
  const [crop,          setCrop]          = useState({ x: 0, y: 0 });
  const [zoom,          setZoom]          = useState(1);
  const [croppedArea,   setCroppedArea]   = useState<Area | null>(null);
  const [processing,    setProcessing]    = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  async function handleValidate() {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedArea, 400);
      onCrop(blob);
    } finally {
      setProcessing(false);
    }
  }

  return (
    /* Overlay */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.82)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--f-bg)',
        border: '1px solid var(--f-border)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--f-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--f-orange)', margin: '0 0 .2rem 0' }}>
              {t('label')}
            </p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: 0 }}>
              {t('title')}
            </h2>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-text-3)', fontSize: '1.2rem', lineHeight: 1, padding: '.25rem' }}
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>

        {/* Crop area */}
        <div style={{ position: 'relative', width: '100%', height: 320, background: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { background: '#0d1117' },
              cropAreaStyle: {
                border: '2px solid var(--f-sky)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,.65)',
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ padding: '.85rem 1.5rem', borderTop: '1px solid var(--f-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', flexShrink: 0 }}>
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: 'var(--f-sky)',
                cursor: 'pointer',
                height: 4,
              }}
            />
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', flexShrink: 0, minWidth: 28, textAlign: 'right' }}>
              {zoom.toFixed(1)}×
            </span>
          </div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', margin: '.5rem 0 0 0', textAlign: 'center' }}>
            {t('hint')}
          </p>
        </div>

        {/* Actions */}
        <div style={{
          padding: '.85rem 1.25rem',
          borderTop: '1px solid var(--f-border)',
          display: 'flex', gap: '.75rem', justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-f btn-f-secondary"
            style={{ fontSize: '.72rem' }}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={processing}
            className="btn-f btn-f-primary"
            style={{ fontSize: '.72rem', minWidth: 90 }}
          >
            {processing ? '…' : t('validate')}
          </button>
        </div>
      </div>
    </div>
  );
}
