'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TYPES = ['conference','meetup','hackathon','webinaire','bootcamp','autre'];
const TYPE_LABELS: Record<string,string> = {
  conference:'Conférence', meetup:'Meetup', hackathon:'Hackathon',
  webinaire:'Webinaire', bootcamp:'Bootcamp', autre:'Autre',
};

type Props = { evenement: Record<string, unknown> };

export default function EditEvenementClient({ evenement: ev }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title:      String(ev.title      || ''),
    type:       String(ev.type       || ''),
    type_autre: ev.type === 'autre' ? String(ev.type_label || '') : '',
    pays:       String(ev.pays       || ''),
    lieu:       String(ev.lieu       || ''),
    online:     Boolean(ev.online),
    gratuit:    Boolean(ev.gratuit),
    url:        String(ev.url        || ''),
    date_debut: String(ev.date_debut || ''),
    date_fin:   String(ev.date_fin   || ''),
    excerpt:    String(ev.excerpt    || ''),
  });
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [afUrl,     setAfUrl]     = useState('');
  const [afLoading, setAfLoading] = useState(false);
  const [afMsg,     setAfMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleAutofill() {
    const urlToFetch = afUrl.trim() || form.url.trim();
    if (!urlToFetch) return;
    if (urlToFetch.includes('linkedin.com')) {
      setAfMsg({ type: 'err', text: '⚠ LinkedIn ne permet pas la récupération automatique. Colle l\'URL directe de l\'événement (lu.ma, eventbrite, meetup…) pour l\'autofill.' });
      return;
    }
    setAfLoading(true); setAfMsg(null);
    try {
      const res  = await fetch(`/api/autofill?url=${encodeURIComponent(urlToFetch)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setForm(f => ({
        ...f,
        ...(data.title   ? { title:   data.title   } : {}),
        ...(data.excerpt ? { excerpt: data.excerpt } : {}),
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const res = await fetch(`/api/evenement/${String(ev.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        type_label: form.type === 'autre' ? form.type_autre : TYPE_LABELS[form.type],
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur serveur' }));
      setErrors(e => ({ ...e, title: error || 'Erreur lors de la mise à jour' }));
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/mon-compte?tab=evenements'), 1200);
  }

  if (success) {
    return (
      <div style={{ border: '1px solid var(--f-border)', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.8rem', color: 'var(--f-green)', margin: 0 }}>✓ Événement mis à jour — redirection…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Autofill */}
      <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,.07) 0%, rgba(56,189,248,.02) 100%)', border: '1px solid var(--f-sky-border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', fontWeight: 600, color: 'var(--f-sky)', marginBottom: '.2rem' }}>
          ✦ Autofill depuis l&apos;URL de l&apos;événement
        </p>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', marginBottom: '.75rem' }}>
          {form.url ? 'Clique sur Autofill pour utiliser le lien existant, ou colle un autre lien.' : 'Colle le lien de la page événement pour remplir le titre et la description automatiquement.'}
        </p>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input className="f-input" type="text" placeholder={form.url || 'https://meetup.com/…'}
            value={afUrl} onChange={e => setAfUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAutofill())}
            style={{ flex: 1 }} />
          <button type="button" className="btn-f btn-f-secondary"
            onClick={handleAutofill} disabled={afLoading || (!afUrl.trim() && !form.url.trim())}
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
        <input className="f-input" value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
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
        {errors.type_autre && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.type_autre}</span>}
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
        <input className="f-input" type="text" value={form.url}
          onChange={e => set('url', e.target.value)}
          onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('url', 'https://' + v); }}
          style={{ maxWidth: '100%' }} />
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
        <textarea className="f-input" value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
          rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      <div style={{ display: 'flex', gap: '1rem', paddingTop: '.5rem' }}>
        <button type="submit" className="btn-f btn-f-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer →'}
        </button>
        <a href="/mon-compte?tab=evenements" className="btn-f btn-f-secondary">Annuler</a>
      </div>
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
