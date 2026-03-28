'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const TYPES = ['conference','meetup','hackathon','webinaire','bootcamp','autre'];
const TYPE_LABELS: Record<string,string> = {
  conference:'Conférence', meetup:'Meetup', hackathon:'Hackathon',
  webinaire:'Webinaire', bootcamp:'Bootcamp', autre:'Autre',
};

type Props = { onSuccess: () => void; linkedinUrl?: string };

export default function FormEvenement({ onSuccess, linkedinUrl = '' }: Props) {
  const [form, setForm] = useState({
    title: '', linkedin_url: linkedinUrl,
    type: '', type_autre: '',
    pays: '', lieu: '',
    online: false, gratuit: false,
    url: '', date_debut: '', date_fin: '',
    excerpt: '',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(key: string, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim())    e.title    = 'Champ requis';
    if (!form.type)            e.type     = 'Sélectionne un type';
    if (form.type === 'autre' && !form.type_autre.trim()) e.type_autre = 'Précise le type';
    if (!form.pays.trim())     e.pays     = 'Champ requis';
    if (!form.url.trim())      e.url      = 'Champ requis';
    if (!form.date_debut)      e.date_debut = 'Champ requis';
    if (!form.excerpt.trim())  e.excerpt  = 'Champ requis';
    if (form.date_fin && form.date_debut && form.date_fin < form.date_debut)
      e.date_fin = 'La date de fin doit être après la date de début';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await supabase.from('soumissions').insert({
      type: 'evenement',
      payload: {
        ...form,
        type_label: form.type === 'autre' ? form.type_autre : TYPE_LABELS[form.type],
      },
    });
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'evenement', title: form.title, linkedinUrl: form.linkedin_url }),
    });
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Field label="Titre de l'événement" required error={errors.title}>
        <input className="f-input" placeholder="Ex: SIADE 2026 — Salon IA & Data d'Afrique"
          value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Ton profil LinkedIn" required>
        <input className="f-input" type="url" value={form.linkedin_url} readOnly
          style={{ maxWidth: '100%', opacity: .6, cursor: 'not-allowed', background: 'var(--f-surface)' }} />
      </Field>

      <Field label="Type d'événement" required error={errors.type}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {TYPES.map(t => (
            <button key={t} type="button" className={`filter-pill${form.type === t ? ' active' : ''}`} onClick={() => set('type', t)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {form.type === 'autre' && (
          <input className="f-input" placeholder="Précise le type d'événement"
            value={form.type_autre} onChange={e => set('type_autre', e.target.value)}
            style={{ maxWidth: '100%', marginTop: '.75rem' }} />
        )}
        {errors.type_autre && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.type_autre}</span>}
      </Field>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Field label="Pays" required error={errors.pays} style={{ flex: 1, minWidth: 180 }}>
          <input className="f-input" placeholder="Ex: Côte d'Ivoire" value={form.pays}
            onChange={e => set('pays', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
        <Field label="Ville / Lieu" style={{ flex: 1, minWidth: 180 }}>
          <input className="f-input" placeholder="Ex: Abidjan, Palais des Sports"
            value={form.lieu} onChange={e => set('lieu', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-2)' }}>
          <input type="checkbox" checked={form.online} onChange={e => set('online', e.target.checked)}
            style={{ accentColor: 'var(--f-sky)', width: 16, height: 16 }} />
          En ligne
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-2)' }}>
          <input type="checkbox" checked={form.gratuit} onChange={e => set('gratuit', e.target.checked)}
            style={{ accentColor: 'var(--f-green)', width: 16, height: 16 }} />
          Gratuit
        </label>
      </div>

      <Field label="Lien vers l'événement" required error={errors.url}>
        <input className="f-input" type="url" placeholder="https://..."
          value={form.url} onChange={e => set('url', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Field label="Date de début" required error={errors.date_debut} style={{ flex: 1, minWidth: 180 }}>
          <input className="f-input" type="date" value={form.date_debut}
            onChange={e => set('date_debut', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
        <Field label="Date de fin" error={errors.date_fin} style={{ flex: 1, minWidth: 180 }}>
          <input className="f-input" type="date" value={form.date_fin}
            onChange={e => set('date_fin', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
      </div>

      <Field label="Description courte" required error={errors.excerpt}>
        <textarea className="f-input" placeholder="En quoi consiste cet événement ? Qui peut participer ?"
          value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
          rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      <button type="submit" className="btn-f btn-f-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
        {loading ? 'Envoi…' : 'Soumettre l\'événement →'}
      </button>
    </form>
  );
}

function Field({ label, required, error, children, style }: {
  label: string; required?: boolean; error?: string;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', ...style }}>
      <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
        {label} {required && <span style={{ color: 'var(--f-orange)' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{error}</span>}
    </div>
  );
}
