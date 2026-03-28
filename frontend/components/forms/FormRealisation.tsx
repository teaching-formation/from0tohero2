'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['data','devops','cloud','ia','cyber','dev'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', dev:'Dev' };
const TYPES = ['pipeline','dashboard','api','app','bootcamp','youtube','autre'];
const TYPE_LABELS: Record<string,string> = { pipeline:'Pipeline', dashboard:'Dashboard', api:'API', app:'App Web / Mobile', bootcamp:'Bootcamp', youtube:'YouTube', autre:'Autre' };

type Props = { onSuccess: () => void; linkedinUrl?: string };

export default function FormRealisation({ onSuccess, linkedinUrl = '' }: Props) {
  const [form, setForm] = useState({
    title: '', linkedin_url: linkedinUrl, category: '', type: '', type_autre: '',
    stack: '', excerpt: '', demo_url: '', repo_url: '', date_published: '', email: '',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim())        e.title        = 'Champ requis';
    if (!form.linkedin_url.trim()) e.linkedin_url = 'Champ requis';
    if (!form.category)            e.category     = 'Sélectionne une catégorie';
    if (!form.type)                e.type         = 'Sélectionne un type';
    if (form.type === 'autre' && !form.type_autre.trim()) e.type_autre = 'Précise le type';
    if (!form.stack.trim())        e.stack        = 'Champ requis';
    if (!form.excerpt.trim())      e.excerpt      = 'Champ requis';
    if (!form.date_published)      e.date_published = 'Champ requis';
    if (!form.email.trim())        e.email        = 'Champ requis';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await supabase.from('soumissions').insert({
      type: 'realisation',
      payload: {
        ...form,
        stack: form.stack.split(',').map(s => s.trim()).filter(Boolean),
        type_label: form.type === 'autre' ? form.type_autre : TYPE_LABELS[form.type],
      },
    });
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'realisation', title: form.title, linkedinUrl: form.linkedin_url }),
    });
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Field label="Titre du projet" required error={errors.title}>
        <input className="f-input" placeholder="Ex: Pipeline de données temps réel avec Kafka" value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Ton profil LinkedIn" required error={errors.linkedin_url}>
        <input className="f-input" type="url" value={form.linkedin_url} readOnly
          style={{ maxWidth: '100%', opacity: .6, cursor: 'not-allowed', background: 'var(--f-surface)' }} />
      </Field>

      <Field label="Catégorie" required error={errors.category}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {CATEGORIES.map(c => (
            <button key={c} type="button" className={`filter-pill${form.category === c ? ' active' : ''}`} onClick={() => set('category', c)}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Type" required error={errors.type}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {TYPES.map(t => (
            <button key={t} type="button" className={`filter-pill${form.type === t ? ' active' : ''}`} onClick={() => set('type', t)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {form.type === 'autre' && (
          <input
            className="f-input"
            placeholder="Précise le type (ex: Newsletter, Podcast, Tutoriel…)"
            value={form.type_autre}
            onChange={e => set('type_autre', e.target.value)}
            style={{ maxWidth: '100%', marginTop: '.75rem' }}
          />
        )}
        {errors.type_autre && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.type_autre}</span>}
      </Field>

      <Field label="Stack utilisée (séparé par ,)" required error={errors.stack}>
        <input className="f-input" placeholder="Ex: Python, Kafka, Spark, GCP" value={form.stack} onChange={e => set('stack', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Description courte" required error={errors.excerpt}>
        <textarea className="f-input" placeholder="Décris ce que tu as construit en 2-3 phrases." value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      <Field label="Lien demo / site" error={errors.demo_url}>
        <input className="f-input" type="url" placeholder="https://..." value={form.demo_url} onChange={e => set('demo_url', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Lien repo GitHub" error={errors.repo_url}>
        <input className="f-input" type="url" placeholder="https://github.com/..." value={form.repo_url} onChange={e => set('repo_url', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Date de réalisation" required error={errors.date_published}>
        <input className="f-input" type="date" value={form.date_published} onChange={e => set('date_published', e.target.value)} style={{ maxWidth: '280px' }} />
      </Field>

      <Field label="Email de contact" required error={errors.email}>
        <input className="f-input" type="email" placeholder="ton@email.com" value={form.email} onChange={e => set('email', e.target.value)} style={{ maxWidth: '100%' }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>Utilisé uniquement pour te notifier du statut de ta soumission.</span>
      </Field>

      <button type="submit" className="btn-f btn-f-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
        {loading ? 'Envoi…' : 'Soumettre la réalisation →'}
      </button>
    </form>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
        {label} {required && <span style={{ color: 'var(--f-orange)' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{error}</span>}
    </div>
  );
}
