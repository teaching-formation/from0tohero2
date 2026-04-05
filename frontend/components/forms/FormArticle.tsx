'use client';
import { useState } from 'react';
import CollabInput from './CollabInput';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT' };
const PLATEFORMES = ['linkedin','medium','devto','substack','blog','youtube','autre'];
const PLAT_LABELS: Record<string,string> = { linkedin:'LinkedIn', medium:'Medium', devto:'Dev.to', substack:'Substack', blog:'Blog perso', youtube:'YouTube', autre:'Autre' };

type Props = { onSuccess: () => void; username?: string; hideEmail?: boolean; initialEmail?: string; initialCountry?: string };

export default function FormArticle({ onSuccess, username = '', hideEmail = false, initialEmail = '', initialCountry = '' }: Props) {
  const [form, setForm] = useState({
    title: '', username: username, author_country: initialCountry, email: initialEmail,
    category: '', source: '', source_autre: '', external_url: '',
    date_published: '', excerpt: '',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [collaborateurs, setCollaborateurs] = useState<string[]>([]);
  const [afUrl,     setAfUrl]     = useState('');
  const [afLoading, setAfLoading] = useState(false);
  const [afMsg,     setAfMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function detectSource(url: string): string {
    if (url.includes('medium.com'))   return 'medium';
    if (url.includes('substack.com')) return 'substack';
    if (url.includes('dev.to'))       return 'devto';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('youtube.com'))  return 'youtube';
    return 'blog';
  }

  async function handleAutofill() {
    if (!afUrl.trim()) return;
    setAfLoading(true);
    setAfMsg(null);
    try {
      const res  = await fetch(`/api/autofill?url=${encodeURIComponent(afUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      const src = detectSource(afUrl);
      setForm(f => ({
        ...f,
        title:        data.title   || f.title,
        excerpt:      data.excerpt || f.excerpt,
        external_url: afUrl.trim(),
        source:       src,
      }));
      const filled = [data.title, data.excerpt].filter(Boolean).length;
      setAfMsg({ type: 'ok', text: `✓ ${filled} champ${filled > 1 ? 's' : ''} rempli${filled > 1 ? 's' : ''} automatiquement` });
    } catch (e: unknown) {
      setAfMsg({ type: 'err', text: e instanceof Error ? e.message : 'Impossible de récupérer les infos' });
    } finally {
      setAfLoading(false);
    }
  }

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
    if (!form.author_country.trim()) e.author_country = 'Champ requis';
    if (!form.category)            e.category     = 'Sélectionne une catégorie';
    if (!form.source)              e.source       = 'Sélectionne une plateforme';
    if (form.source === 'autre' && !form.source_autre.trim()) e.source_autre = 'Précise la plateforme';
    if (!form.external_url.trim()) e.external_url = 'Champ requis';
    else if (!isValidUrl(form.external_url)) e.external_url = 'URL invalide';
    if (!form.date_published)      e.date_published = 'Champ requis';
    if (!form.excerpt.trim())      e.excerpt      = 'Champ requis';
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
        type: 'article',
        payload: {
          ...form,
          source_label: form.source === 'autre' ? form.source_autre : PLAT_LABELS[form.source],
          collaborateurs,
        },
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur serveur' }));
      setErrors(e => ({ ...e, external_url: error || 'Erreur lors de la soumission' }));
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Bloc Autofill ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--f-sky-bg) 0%, rgba(56,189,248,.04) 100%)',
        border: '1px solid var(--f-sky-border)',
        borderRadius: 10,
        padding: '1.1rem 1.25rem',
      }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', fontWeight: 600, color: 'var(--f-sky)', marginBottom: '.25rem' }}>
          ✦ Autofill depuis une URL
        </p>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', marginBottom: '.85rem' }}>
          Colle le lien de ton article — on remplit le formulaire automatiquement.
        </p>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="f-input"
            type="text"
            placeholder="https://medium.com/@toi/mon-article"
            value={afUrl}
            onChange={e => setAfUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAutofill())}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn-f btn-f-primary"
            onClick={handleAutofill}
            disabled={afLoading || !afUrl.trim()}
            style={{ flexShrink: 0, fontSize: '.72rem' }}
          >
            {afLoading ? '…' : 'Autofill →'}
          </button>
        </div>
        {afMsg && (
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: afMsg.type === 'ok' ? 'var(--f-green)' : '#f87171', marginTop: '.5rem' }}>
            {afMsg.text}
          </p>
        )}
      </div>

      <Field label="Titre de l'article" required error={errors.title}>
        <input className="f-input" placeholder="Ex: Comment j'ai migré vers dbt en production" value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Ton username" required error={errors.username}>
        <input className="f-input" type="text" value={form.username} readOnly
          style={{ maxWidth: '100%', opacity: .6, cursor: 'not-allowed', background: 'var(--f-surface)' }} />
      </Field>

      <Field label="Ton pays" required error={errors.author_country}>
        <input className="f-input" placeholder="Ex: Sénégal" value={form.author_country} onChange={e => set('author_country', e.target.value)}
          readOnly={!!initialCountry}
          style={{ maxWidth: '100%', ...(initialCountry ? { opacity: .7, cursor: 'not-allowed', background: 'var(--f-surface)' } : {}) }} />
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

      <Field label="Plateforme de publication" required error={errors.source}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {PLATEFORMES.map(p => (
            <button key={p} type="button" className={`filter-pill${form.source === p ? ' active' : ''}`} onClick={() => set('source', p)}>
              {PLAT_LABELS[p]}
            </button>
          ))}
        </div>
        {form.source === 'autre' && (
          <input
            className="f-input"
            placeholder="Précise la plateforme (ex: Hashnode, Dev Community…)"
            value={form.source_autre}
            onChange={e => set('source_autre', e.target.value)}
            style={{ maxWidth: '100%', marginTop: '.75rem' }}
          />
        )}
        {errors.source_autre && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.source_autre}</span>}
      </Field>

      <Field label="Lien vers l'article" required error={errors.external_url}>
        <input className="f-input" type="text" placeholder="https://medium.com/..." value={form.external_url} onChange={e => set('external_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('external_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Date de publication" required error={errors.date_published}>
        <input className="f-input" type="date" value={form.date_published} onChange={e => set('date_published', e.target.value)} style={{ maxWidth: '280px' }} />
      </Field>

      <Field label="Co-auteurs" error={errors.collaborateurs}>
        <CollabInput value={collaborateurs} onChange={setCollaborateurs} />
      </Field>

      <Field label="Résumé (1-2 phrases)" required error={errors.excerpt}>
        <textarea className="f-input" placeholder="De quoi parle cet article ?" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
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
        {loading ? 'Envoi…' : 'Soumettre l\'article →'}
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
