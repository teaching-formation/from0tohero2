'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT' };
const PLATEFORMES = ['linkedin','medium','devto','substack','blog','youtube','autre'];
const PLAT_LABELS: Record<string,string> = { linkedin:'LinkedIn', medium:'Medium', devto:'Dev.to', substack:'Substack', blog:'Blog perso', youtube:'YouTube', autre:'Autre' };

type Props = { article: Record<string, unknown> };

export default function EditArticleClient({ article: a }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title:          String(a.title          || ''),
    category:       String(a.category       || ''),
    source:         String(a.source         || ''),
    source_autre:   String(a.source_label   || ''),
    external_url:   String(a.external_url   || ''),
    date_published: String(a.date_published || ''),
    excerpt:        String(a.excerpt        || ''),
  });
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim())        e.title        = 'Champ requis';
    if (!form.category)            e.category     = 'Sélectionne une catégorie';
    if (!form.source)              e.source       = 'Sélectionne une plateforme';
    if (form.source === 'autre' && !form.source_autre.trim()) e.source_autre = 'Précise la plateforme';
    if (!form.external_url.trim()) e.external_url = 'Champ requis';
    if (!form.date_published)      e.date_published = 'Champ requis';
    if (!form.excerpt.trim())      e.excerpt      = 'Champ requis';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const res = await fetch(`/api/article/${String(a.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        source_label: form.source === 'autre'
          ? form.source_autre
          : PLAT_LABELS[form.source] || form.source,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur serveur' }));
      setErrors(e => ({ ...e, title: error || 'Erreur lors de la mise à jour' }));
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/mon-compte'), 1200);
  }

  if (success) {
    return (
      <div style={{ border: '1px solid var(--f-border)', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.8rem', color: 'var(--f-green)', margin: 0 }}>✓ Article mis à jour — redirection…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Field label="Titre de l'article" required error={errors.title}>
        <input className="f-input" value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
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
          <input className="f-input" placeholder="Précise la plateforme" value={form.source_autre} onChange={e => set('source_autre', e.target.value)} style={{ maxWidth: '100%', marginTop: '.75rem' }} />
        )}
        {errors.source_autre && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.source_autre}</span>}
      </Field>

      <Field label="Lien vers l'article" required error={errors.external_url}>
        <input className="f-input" type="text" value={form.external_url} onChange={e => set('external_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('external_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Date de publication" required error={errors.date_published}>
        <input className="f-input" type="date" value={form.date_published} onChange={e => set('date_published', e.target.value)} style={{ maxWidth: '280px' }} />
      </Field>

      <Field label="Résumé (1-2 phrases)" required error={errors.excerpt}>
        <textarea className="f-input" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      <div style={{ display: 'flex', gap: '1rem', paddingTop: '.5rem' }}>
        <button type="submit" className="btn-f btn-f-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer →'}
        </button>
        <a href="/mon-compte" className="btn-f btn-f-secondary">Annuler</a>
      </div>
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
