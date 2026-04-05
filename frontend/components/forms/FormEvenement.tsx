'use client';
import { useState } from 'react';

const TYPES = ['conference','meetup','hackathon','webinaire','bootcamp','autre'];
const TYPE_LABELS: Record<string,string> = {
  conference:'Conférence', meetup:'Meetup', hackathon:'Hackathon',
  webinaire:'Webinaire', bootcamp:'Bootcamp', autre:'Autre',
};

const PAYS_AFRIQUE = [
  'Afrique du Sud','Algérie','Angola','Bénin','Botswana','Burkina Faso','Burundi',
  'Cabo Verde','Cameroun','Comores','Congo (Brazzaville)','Congo (RDC)',"Côte d'Ivoire",
  'Djibouti','Égypte','Érythrée','Eswatini','Éthiopie','Gabon','Gambie','Ghana',
  'Guinée','Guinée-Bissau','Guinée équatoriale','Kenya','Lesotho','Liberia','Libye',
  'Madagascar','Malawi','Mali','Maroc','Maurice','Mauritanie','Mozambique','Namibie',
  'Niger','Nigeria','Ouganda','Rwanda','São Tomé-et-Príncipe','Sénégal','Seychelles',
  'Sierra Leone','Somalie','Soudan','Soudan du Sud','Tanzanie','Tchad','Togo','Tunisie',
  'Zambie','Zimbabwe',
  '─── Diaspora ───',
  'France','Belgique','Canada','États-Unis','Royaume-Uni','Suisse','Allemagne',
  'Italie','Espagne','Portugal','Pays-Bas','Suède','Norvège','Autre',
];

type Props = { onSuccess: () => void; username?: string; hideEmail?: boolean; initialEmail?: string; initialCountry?: string };

export default function FormEvenement({ onSuccess, username = '', hideEmail = false, initialEmail = '', initialCountry = '' }: Props) {
  const [form, setForm] = useState({
    title: '', username: username, email: initialEmail,
    types: [] as string[], type_autre: '',
    pays: initialCountry, lieu: '',
    online: false, gratuit: false,
    url: '', date_debut: '', date_fin: '',
    excerpt: '',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [afUrl,     setAfUrl]     = useState('');
  const [afLoading, setAfLoading] = useState(false);
  const [afMsg,     setAfMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleAutofill() {
    if (!afUrl.trim()) return;
    setAfLoading(true); setAfMsg(null);
    try {
      const res  = await fetch(`/api/autofill?url=${encodeURIComponent(afUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setForm(f => ({
        ...f,
        ...(data.title   ? { title:   data.title   } : {}),
        ...(data.excerpt ? { excerpt: data.excerpt } : {}),
        ...(data.demo_url && !f.url ? { url: data.demo_url } : {}),
      }));
      const filled = [data.title, data.excerpt].filter(Boolean).length;
      setAfMsg({ type: 'ok', text: `✓ ${filled} champ${filled > 1 ? 's' : ''} rempli${filled > 1 ? 's' : ''} automatiquement` });
    } catch (e: unknown) {
      setAfMsg({ type: 'err', text: e instanceof Error ? e.message : 'Impossible de récupérer les infos' });
    } finally {
      setAfLoading(false);
    }
  }

  function set(key: string, val: string | boolean) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function toggleType(t: string) {
    setForm(f => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t],
    }));
    if (errors.types) setErrors(e => ({ ...e, types: '' }));
  }

  function isValidUrl(s: string) {
    try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim())       e.title    = 'Champ requis';
    if (!form.username.trim())    e.username = 'Champ requis';
    if (form.types.length === 0)  e.types    = 'Sélectionne au moins un type';
    if (form.types.includes('autre') && !form.type_autre.trim()) e.type_autre = 'Précise le type';
    if (!form.pays.trim())        e.pays     = 'Champ requis';
    if (!form.url.trim())      e.url      = 'Champ requis';
    else if (!isValidUrl(form.url)) e.url = 'URL invalide';
    if (!form.date_debut)      e.date_debut = 'Champ requis';
    if (!form.excerpt.trim())  e.excerpt  = 'Champ requis';
    if (!hideEmail && !initialEmail && !form.email.trim())    e.email    = 'Champ requis';
    if (!hideEmail && !initialEmail && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (form.date_fin && form.date_debut && form.date_fin < form.date_debut)
      e.date_fin = 'La date de fin doit être après la date de début';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'evenement',
        payload: {
          ...form,
          type:       form.types[0] || 'autre',
          type_label: form.types.includes('autre') ? form.type_autre : null,
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

      {/* Autofill */}
      <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,.07) 0%, rgba(56,189,248,.02) 100%)', border: '1px solid var(--f-sky-border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', fontWeight: 600, color: 'var(--f-sky)', marginBottom: '.2rem' }}>
          ✦ Autofill depuis l&apos;URL de l&apos;événement
        </p>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', marginBottom: '.75rem' }}>
          Colle le lien de la page événement pour remplir le titre et la description automatiquement.
        </p>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input className="f-input" type="text" placeholder="https://meetup.com/…"
            value={afUrl} onChange={e => setAfUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAutofill())}
            style={{ flex: 1 }} />
          <button type="button" className="btn-f btn-f-secondary"
            onClick={handleAutofill} disabled={afLoading || !afUrl.trim()}
            style={{ fontSize: '.72rem', flexShrink: 0 }}>
            {afLoading ? '…' : 'Autofill →'}
          </button>
        </div>
        {afMsg && (
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: afMsg.type === 'ok' ? 'var(--f-green)' : '#f87171', marginTop: '.4rem' }}>
            {afMsg.text}
          </p>
        )}
      </div>

      <Field label="Titre de l'événement" required error={errors.title}>
        <input className="f-input" placeholder="Ex: SIADE 2026 — Salon IA & Data d'Afrique"
          value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Ton username" required>
        <input className="f-input" type="text" value={form.username} readOnly
          style={{ maxWidth: '100%', opacity: .6, cursor: 'not-allowed', background: 'var(--f-surface)' }} />
      </Field>

      <Field label="Type(s) d'événement" required error={errors.types}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {TYPES.map(t => (
            <button key={t} type="button" className={`filter-pill${form.types.includes(t) ? ' active' : ''}`} onClick={() => toggleType(t)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {form.types.includes('autre') && (
          <input className="f-input" placeholder="Précise le type d'événement"
            value={form.type_autre} onChange={e => set('type_autre', e.target.value)}
            style={{ maxWidth: '100%', marginTop: '.75rem' }} />
        )}
        {errors.type_autre && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.type_autre}</span>}
      </Field>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Field label="Pays" required error={errors.pays} style={{ flex: 1, minWidth: 180 }}>
          <select className="f-input" value={form.pays} onChange={e => set('pays', e.target.value)} style={{ maxWidth: '100%', cursor: 'pointer' }}>
            <option value="">— Sélectionne un pays —</option>
            {PAYS_AFRIQUE.map(p => (
              p.startsWith('─')
                ? <option key={p} disabled style={{ color: 'var(--f-text-3)', fontStyle: 'italic' }}>{p}</option>
                : <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Ville / Lieu" style={{ flex: 1, minWidth: 180 }}>
          <input className="f-input" placeholder="Ex: Abidjan, Palais des Sports"
            value={form.lieu} onChange={e => set('lieu', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-2)' }}>
          <input type="checkbox" checked={form.online} onChange={e => set('online', e.target.checked)}
            style={{ accentColor: 'var(--f-sky)', width: 16, height: 16 }} />
          En ligne
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-2)' }}>
          <input type="checkbox" checked={form.gratuit} onChange={e => set('gratuit', e.target.checked)}
            style={{ accentColor: 'var(--f-green)', width: 16, height: 16 }} />
          Gratuit
        </label>
      </div>

      <Field label="Lien vers l'événement" required error={errors.url}>
        <input className="f-input" type="text" placeholder="https://..."
          value={form.url} onChange={e => set('url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Field label="Date de début" required error={errors.date_debut} style={{ flex: 1, minWidth: 180 }}>
          <input className="f-input" type="date" value={form.date_debut}
            onChange={e => set('date_debut', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
        <Field label="Date de fin (optionnel)" error={errors.date_fin} style={{ flex: 1, minWidth: 180 }}>
          <input className="f-input" type="date" value={form.date_fin}
            onChange={e => set('date_fin', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
      </div>

      <Field label="Description courte" required error={errors.excerpt}>
        <textarea className="f-input" placeholder="En quoi consiste cet événement ? Qui peut participer ?"
          value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
          rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
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
      <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
        {label} {required && <span style={{ color: 'var(--f-orange)' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{error}</span>}
    </div>
  );
}
