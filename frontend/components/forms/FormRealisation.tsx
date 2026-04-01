'use client';
import { useState } from 'react';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT' };
const TYPES = ['pipeline','dashboard','api','app','bootcamp','youtube','autre'];
const TYPE_LABELS: Record<string,string> = { pipeline:'Pipeline', dashboard:'Dashboard', api:'API', app:'App Web / Mobile', bootcamp:'Bootcamp', youtube:'YouTube', autre:'Autre' };

type Props = { onSuccess: () => void; username?: string; hideEmail?: boolean; initialEmail?: string };

export default function FormRealisation({ onSuccess, username = '', hideEmail = false, initialEmail = '' }: Props) {
  const [form, setForm] = useState({
    title: '', username: username, category: '', type: '', type_autre: '',
    stack: '', excerpt: '', demo_url: '', repo_url: '', date_published: '', email: initialEmail,
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function isValidUrl(s: string) {
    try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim())        e.title        = 'Champ requis';
    if (!form.username.trim()) e.username = 'Champ requis';
    if (!form.category)            e.category     = 'Sélectionne une catégorie';
    if (!form.type)                e.type         = 'Sélectionne un type';
    if (form.type === 'autre' && !form.type_autre.trim()) e.type_autre = 'Précise le type';
    if (!form.stack.trim())        e.stack        = 'Champ requis';
    if (!form.excerpt.trim())      e.excerpt      = 'Champ requis';
    if (form.demo_url && !isValidUrl(form.demo_url)) e.demo_url = 'URL invalide';
    if (form.repo_url && !isValidUrl(form.repo_url)) e.repo_url = 'URL invalide';
    if (!hideEmail && !initialEmail && !form.email.trim())        e.email = 'Champ requis';
    if (!hideEmail && !initialEmail && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'realisation',
        payload: {
          ...form,
          stack: form.stack.split(',').map(s => s.trim()).filter(Boolean),
          type_label: form.type === 'autre' ? form.type_autre : TYPE_LABELS[form.type],
        },
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur serveur' }));
      setErrors(e => ({ ...e, title: error || 'Erreur lors de la soumission' }));
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Field label="Titre du projet" required error={errors.title}>
        <input className="f-input" placeholder="Ex: Pipeline de données temps réel avec Kafka" value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Ton username" required error={errors.username}>
        <input className="f-input" type="text" value={form.username} readOnly
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
        {errors.type_autre && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.type_autre}</span>}
      </Field>

      <Field label="Stack utilisée (séparé par ,)" required error={errors.stack}>
        <input className="f-input" placeholder="Ex: Python, Kafka, Spark, GCP" value={form.stack} onChange={e => set('stack', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Description courte" required error={errors.excerpt}>
        <textarea className="f-input" placeholder="Décris ce que tu as construit en 2-3 phrases." value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      <Field label="Lien demo / site" error={errors.demo_url}>
        <input className="f-input" type="text" placeholder="https://..." value={form.demo_url} onChange={e => set('demo_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('demo_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Lien repo GitHub" error={errors.repo_url}>
        <input className="f-input" type="text" placeholder="https://github.com/..." value={form.repo_url} onChange={e => set('repo_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('repo_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Date de réalisation" error={errors.date_published}>
        <input className="f-input" type="date" value={form.date_published} onChange={e => set('date_published', e.target.value)} style={{ maxWidth: '280px' }} />
      </Field>

      {!hideEmail && (
        <Field label="Email de contact" required={!initialEmail} error={errors.email}>
          <input className="f-input" type="email" placeholder="ton@email.com"
            value={form.email} readOnly={!!initialEmail}
            onChange={e => set('email', e.target.value)}
            style={{ maxWidth: '100%', ...(initialEmail ? { opacity: .7, cursor: 'not-allowed', background: 'var(--f-surface)' } : {}) }} />
          {initialEmail
            ? <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-green)' }}>✓ Email récupéré depuis ton compte</span>
            : <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>Utilisé uniquement pour te notifier du statut de ta soumission.</span>
          }
        </Field>
      )}

      <button type="submit" className="btn-f btn-f-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
        {loading ? 'Envoi…' : 'Soumettre la réalisation →'}
      </button>
    </form>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
        {label} {required && <span style={{ color: 'var(--f-orange)' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{error}</span>}
    </div>
  );
}
