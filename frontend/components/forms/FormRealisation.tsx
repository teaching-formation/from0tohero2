'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import CollabInput from './CollabInput';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT' };
const TYPES = ['pipeline','dashboard','api','app','bootcamp','youtube','autre'];
const TYPE_LABELS: Record<string,string> = { pipeline:'Pipeline', dashboard:'Dashboard', api:'API', app:'App Web / Mobile', bootcamp:'Bootcamp', youtube:'Chaîne YouTube', autre:'Autre' };

type Props = { onSuccess: () => void; username?: string; hideEmail?: boolean; initialEmail?: string };

export default function FormRealisation({ onSuccess, username = '', hideEmail = false, initialEmail = '' }: Props) {
  const t = useTranslations('forms');
  const [form, setForm] = useState({
    title: '', username: username, category: '', type: '', type_autre: '',
    stack: '', excerpt: '', demo_url: '', repo_url: '', date_published: '', email: initialEmail,
  });
  const [collaborateurs, setCollaborateurs] = useState<string[]>([]);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [autofillUrl, setAutofillUrl]     = useState('');
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [autofillMsg, setAutofillMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleAutofill() {
    if (!autofillUrl.trim()) return;
    if (autofillUrl.trim().includes('linkedin.com')) {
      setAutofillMsg({ type: 'err', text: t('realisation.linkedinError') });
      return;
    }
    setAutofillLoading(true);
    setAutofillMsg(null);
    try {
      const res  = await fetch(`/api/autofill?url=${encodeURIComponent(autofillUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('autofillFetchError'));
      setForm(f => ({
        ...f,
        title:          data.title    || f.title,
        excerpt:        data.excerpt  || f.excerpt,
        stack:          data.stack    || f.stack,
        category:       data.category || f.category,
        type:           data.type     || f.type,
        demo_url:       data.demo_url || f.demo_url,
        repo_url:       data.repo_url || f.repo_url,
      }));
      const filled = [data.title, data.excerpt, data.stack].filter(Boolean).length;
      setAutofillMsg({ type: 'ok', text: t('autofillFieldsFilled', { count: filled }) });
    } catch (e: unknown) {
      setAutofillMsg({ type: 'err', text: e instanceof Error ? e.message : t('autofillFetchError') });
    } finally {
      setAutofillLoading(false);
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
    if (!form.title.trim())        e.title        = t('fieldRequired');
    if (!form.username.trim()) e.username = t('fieldRequired');
    if (!form.category)            e.category     = t('selectCategory');
    if (!form.type)                e.type         = t('realisation.selectType');
    if (form.type === 'autre' && !form.type_autre.trim()) e.type_autre = t('realisation.preciserType');
    if (!form.stack.trim())        e.stack        = t('fieldRequired');
    if (!form.excerpt.trim())      e.excerpt      = t('fieldRequired');
    if (form.demo_url && !isValidUrl(form.demo_url)) e.demo_url = t('urlInvalid');
    if (form.repo_url && !isValidUrl(form.repo_url)) e.repo_url = t('urlInvalid');
    if (!hideEmail && !initialEmail && !form.email.trim())        e.email = t('fieldRequired');
    if (!hideEmail && !initialEmail && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('emailInvalid');
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
          stack: form.stack.split(',').map(s => s.trim()).filter(s => {
            const v = s.toLowerCase();
            return s && v !== 'null' && v !== 'unfound' && v !== 'undefined';
          }),
          type_label: form.type === 'autre' ? form.type_autre : TYPE_LABELS[form.type],
          collaborateurs,
        },
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: t('serverError') }));
      setErrors(e => ({ ...e, title: error || t('submitError') }));
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
          {t('realisation.autofillTitle')}
        </p>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', marginBottom: '.85rem' }}>
          {t('realisation.autofillDesc')}
        </p>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input
            className="f-input"
            type="text"
            placeholder={t('realisation.autofillPlaceholder')}
            value={autofillUrl}
            onChange={e => setAutofillUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAutofill())}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn-f btn-f-primary"
            onClick={handleAutofill}
            disabled={autofillLoading || !autofillUrl.trim()}
            style={{ flexShrink: 0, fontSize: '.72rem' }}
          >
            {autofillLoading ? '…' : t('autofillBtn')}
          </button>
        </div>
        {autofillMsg && (
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: '.65rem',
            color: autofillMsg.type === 'ok' ? 'var(--f-green)' : '#f87171',
            marginTop: '.5rem',
          }}>
            {autofillMsg.text}
          </p>
        )}
      </div>

      <Field label={t('realisation.titleLabel')} required error={errors.title}>
        <input className="f-input" placeholder={t('realisation.titlePlaceholder')} value={form.title} onChange={e => set('title', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label={t('usernameLabel')} required error={errors.username}>
        <input className="f-input" type="text" value={form.username} readOnly
          style={{ maxWidth: '100%', opacity: .6, cursor: 'not-allowed', background: 'var(--f-surface)' }} />
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

      <Field label={t('realisation.typeLabel')} required error={errors.type}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {TYPES.map(tp => (
            <button key={tp} type="button" className={`filter-pill${form.type === tp ? ' active' : ''}`} onClick={() => set('type', tp)}>
              {TYPE_LABELS[tp]}
            </button>
          ))}
        </div>
        {form.type === 'autre' && (
          <input
            className="f-input"
            placeholder={t('realisation.typePlaceholder')}
            value={form.type_autre}
            onChange={e => set('type_autre', e.target.value)}
            style={{ maxWidth: '100%', marginTop: '.75rem' }}
          />
        )}
        {errors.type_autre && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.type_autre}</span>}
      </Field>

      <Field label={t('realisation.stackLabel')} required error={errors.stack}>
        <input className="f-input" placeholder={t('realisation.stackPlaceholder')} value={form.stack} onChange={e => set('stack', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label={t('descLabel')} required error={errors.excerpt}>
        <textarea className="f-input" placeholder={t('realisation.descPlaceholder')} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      <Field label={t('realisation.demoLabel')} error={errors.demo_url}>
        <input className="f-input" type="text" placeholder="https://..." value={form.demo_url} onChange={e => set('demo_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('demo_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label={t('realisation.repoLabel')} error={errors.repo_url}>
        <input className="f-input" type="text" placeholder="https://github.com/..." value={form.repo_url} onChange={e => set('repo_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('repo_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label={t('realisation.collabLabel')} error={errors.collaborateurs}>
        <CollabInput value={collaborateurs} onChange={setCollaborateurs} />
      </Field>

      <Field label={t('realisation.dateLabel')} error={errors.date_published}>
        <input className="f-input" type="date" value={form.date_published} onChange={e => set('date_published', e.target.value)} style={{ maxWidth: '280px' }} />
      </Field>

      {!hideEmail && (
        <Field label={t('emailLabel')} required={!initialEmail} error={errors.email}>
          <input className="f-input" type="email" placeholder={t('emailPlaceholder')}
            value={form.email} readOnly={!!initialEmail}
            onChange={e => set('email', e.target.value)}
            style={{ maxWidth: '100%', ...(initialEmail ? { opacity: .7, cursor: 'not-allowed', background: 'var(--f-surface)' } : {}) }} />
          {initialEmail
            ? <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-green)' }}>{t('emailFromAccount')}</span>
            : <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>{t('emailHint')}</span>
          }
        </Field>
      )}

      <button type="submit" className="btn-f btn-f-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
        {loading ? t('submitting') : t('realisation.submitBtn')}
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
