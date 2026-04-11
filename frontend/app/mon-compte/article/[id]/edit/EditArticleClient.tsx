'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CollabInput from '@/components/forms/CollabInput';
import { useTranslations } from 'next-intl';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT' };
const PLATEFORMES = ['linkedin','medium','devto','substack','blog','youtube','autre'];
const PLAT_LABELS: Record<string,string> = { linkedin:'LinkedIn', medium:'Medium', devto:'Dev.to', substack:'Substack', blog:'Blog perso', youtube:'YouTube', autre:'Autre' };

type Props = { article: Record<string, unknown> };

export default function EditArticleClient({ article: a }: Props) {
  const router = useRouter();
  const t = useTranslations('forms');
  const tMC = useTranslations('monCompte');
  const [form, setForm] = useState({
    title:          String(a.title          || ''),
    category:       String(a.category       || ''),
    source:         String(a.source         || ''),
    source_autre:   String(a.source_label   || ''),
    external_url:   String(a.external_url   || ''),
    date_published: String(a.date_published || ''),
    excerpt:        String(a.excerpt        || ''),
  });
  const [collaborateurs, setCollaborateurs] = useState<string[]>(
    Array.isArray(a.collaborateurs) ? (a.collaborateurs as string[]) : []
  );
  const [afUrl,     setAfUrl]     = useState('');
  const [afLoading, setAfLoading] = useState(false);
  const [afMsg,     setAfMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      if (!res.ok) throw new Error(data.error || t('autofillFetchError'));
      const src = detectSource(afUrl);
      setForm(f => ({
        ...f,
        title:        data.title   || f.title,
        excerpt:      data.excerpt || f.excerpt,
        external_url: afUrl.trim(),
        source:       src,
      }));
      const filled = [data.title, data.excerpt].filter(Boolean).length;
      setAfMsg({ type: 'ok', text: t('autofillFieldsFilled', { count: filled }) });
    } catch (e: unknown) {
      setAfMsg({ type: 'err', text: e instanceof Error ? e.message : t('autofillFetchError') });
    } finally {
      setAfLoading(false);
    }
  }

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim())        e.title        = t('fieldRequired');
    if (!form.category)            e.category     = t('selectCategory');
    if (!form.source)              e.source       = t('article.selectPlatform');
    if (form.source === 'autre' && !form.source_autre.trim()) e.source_autre = t('article.preciserPlatform');
    if (!form.external_url.trim()) e.external_url = t('fieldRequired');
    if (!form.date_published)      e.date_published = t('fieldRequired');
    if (!form.excerpt.trim())      e.excerpt      = t('fieldRequired');
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
        collaborateurs,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: t('serverError') }));
      setErrors(e => ({ ...e, title: error || tMC('updateError') }));
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/mon-compte'), 1200);
  }

  if (success) {
    return (
      <div style={{ border: '1px solid var(--f-border)', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.8rem', color: 'var(--f-green)', margin: 0 }}>{tMC('article.successEdit')}</p>
      </div>
    );
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
          {t('article.autofillTitle')}
        </p>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', marginBottom: '.85rem' }}>
          {t('article.autofillDesc')}
        </p>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="f-input"
            type="text"
            placeholder={t('article.autofillPlaceholder')}
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
            {afLoading ? '…' : t('autofillBtn')}
          </button>
        </div>
        {afMsg && (
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: afMsg.type === 'ok' ? 'var(--f-green)' : '#f87171', marginTop: '.5rem' }}>
            {afMsg.text}
          </p>
        )}
      </div>

      <Field label={t('article.titleLabel')} required error={errors.title}>
        <input className="f-input" value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label={t('categoryLabel')} required error={errors.category}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {CATEGORIES.map(c => (
            <button key={c} type="button" className={`filter-pill${form.category === c ? ' active' : ''}`} onClick={() => set('category', c)}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </Field>

      <Field label={t('article.platformLabel')} required error={errors.source}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {PLATEFORMES.map(p => (
            <button key={p} type="button" className={`filter-pill${form.source === p ? ' active' : ''}`} onClick={() => set('source', p)}>
              {PLAT_LABELS[p]}
            </button>
          ))}
        </div>
        {form.source === 'autre' && (
          <input className="f-input" placeholder={t('article.preciserPlatform')} value={form.source_autre} onChange={e => set('source_autre', e.target.value)} style={{ maxWidth: '100%', marginTop: '.75rem' }} />
        )}
        {errors.source_autre && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.source_autre}</span>}
      </Field>

      <Field label={t('article.urlLabel')} required error={errors.external_url}>
        <input className="f-input" type="text" value={form.external_url} onChange={e => set('external_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('external_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label={t('article.dateLabel')} required error={errors.date_published}>
        <input className="f-input" type="date" value={form.date_published} onChange={e => set('date_published', e.target.value)} style={{ maxWidth: '280px' }} />
      </Field>

      <Field label={t('article.coauthorsLabel')} error={errors.collaborateurs}>
        <CollabInput value={collaborateurs} onChange={setCollaborateurs} />
      </Field>

      <Field label={t('article.excerptLabel')} required error={errors.excerpt}>
        <textarea className="f-input" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      <div style={{ display: 'flex', gap: '1rem', paddingTop: '.5rem' }}>
        <button type="submit" className="btn-f btn-f-primary" disabled={loading}>
          {loading ? tMC('saving') : tMC('save')}
        </button>
        <a href="/mon-compte" className="btn-f btn-f-secondary">{tMC('cancel')}</a>
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
