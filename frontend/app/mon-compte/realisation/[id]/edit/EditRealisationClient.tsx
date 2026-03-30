'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT' };
const TYPES = ['pipeline','dashboard','api','app','bootcamp','youtube','autre'];
const TYPE_LABELS: Record<string,string> = { pipeline:'Pipeline', dashboard:'Dashboard', api:'API', app:'App Web / Mobile', bootcamp:'Bootcamp', youtube:'YouTube', autre:'Autre' };

type Props = { realisation: Record<string, unknown> };

export default function EditRealisationClient({ realisation: r }: Props) {
  const router = useRouter();
  const initStack = Array.isArray(r.stack) ? (r.stack as string[]).join(', ') : String(r.stack || '');

  const [form, setForm] = useState({
    title:          String(r.title          || ''),
    category:       String(r.category       || ''),
    type:           String(r.type           || ''),
    type_autre:     String(r.type_label     || ''),
    stack:          initStack,
    excerpt:        String(r.excerpt        || ''),
    demo_url:       String(r.demo_url       || ''),
    repo_url:       String(r.repo_url       || ''),
    date_published: String(r.date_published || ''),
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
    if (!form.title.trim())        e.title    = 'Champ requis';
    if (!form.category)            e.category = 'Sélectionne une catégorie';
    if (!form.type)                e.type     = 'Sélectionne un type';
    if (form.type === 'autre' && !form.type_autre.trim()) e.type_autre = 'Précise le type';
    if (!form.stack.trim())        e.stack    = 'Champ requis';
    if (!form.excerpt.trim())      e.excerpt  = 'Champ requis';
    if (!form.date_published)      e.date_published = 'Champ requis';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const res = await fetch(`/api/realisation/${String(r.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        stack: form.stack.split(',').map(s => s.trim()).filter(Boolean),
        type_label: form.type === 'autre' ? form.type_autre : TYPE_LABELS[form.type] || form.type,
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
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.8rem', color: 'var(--f-green)', margin: 0 }}>✓ Réalisation mise à jour — redirection…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Field label="Titre du projet" required error={errors.title}>
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

      <Field label="Type" required error={errors.type}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {TYPES.map(t => (
            <button key={t} type="button" className={`filter-pill${form.type === t ? ' active' : ''}`} onClick={() => set('type', t)}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {form.type === 'autre' && (
          <input className="f-input" placeholder="Précise le type" value={form.type_autre} onChange={e => set('type_autre', e.target.value)} style={{ maxWidth: '100%', marginTop: '.75rem' }} />
        )}
        {errors.type_autre && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.type_autre}</span>}
      </Field>

      <Field label="Stack utilisée (séparé par ,)" required error={errors.stack}>
        <input className="f-input" placeholder="Ex: Python, Kafka, Spark" value={form.stack} onChange={e => set('stack', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Description courte" required error={errors.excerpt}>
        <textarea className="f-input" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      <Field label="Lien demo / site" error={errors.demo_url}>
        <input className="f-input" type="text" value={form.demo_url} onChange={e => set('demo_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('demo_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Lien repo GitHub" error={errors.repo_url}>
        <input className="f-input" type="text" value={form.repo_url} onChange={e => set('repo_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('repo_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Date de réalisation" required error={errors.date_published}>
        <input className="f-input" type="date" value={form.date_published} onChange={e => set('date_published', e.target.value)} style={{ maxWidth: '280px' }} />
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
