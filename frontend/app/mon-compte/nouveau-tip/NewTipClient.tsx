'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded','autre'];
const CAT_LABELS: Record<string,string> = {
  data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité',
  frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile',
  web3:'Web3', embedded:'Embedded / IoT', autre:'Autre',
};
const TYPES = ['tip','TIL','snippet'] as const;
const TYPE_LABELS: Record<string,string> = { tip:'💡 Tip', TIL:'🧠 TIL', snippet:'{ } Snippet' };

const INSPIRATIONS = [
  'Une commande que tu utilises tout le temps mais que personne ne connaît…',
  'Un pattern qui t\'a simplifié la vie ce mois-ci…',
  'La différence entre X et Y que tu n\'avais pas comprise au début…',
  'L\'erreur que tout le monde fait avec cette techno…',
  'Ce que tu aurais voulu savoir quand tu as débuté en…',
  'Un outil sous-estimé que tu recommandes…',
  'Ce qui change vraiment entre la théorie et la prod…',
  'Le truc contre-intuitif que tu as appris en debboguant…',
  'Une config ou option cachée qui fait gagner du temps…',
  'La ressource qui t\'a le plus aidé à comprendre…',
];

export default function NewTipClient() {
  const router = useRouter();
  const t = useTranslations('forms');
  const tMC = useTranslations('monCompte');

  const TYPE_DESC: Record<string,string> = {
    tip:     tMC('tip.tipDesc'),
    TIL:     tMC('tip.tilDesc'),
    snippet: tMC('tip.snippetDesc'),
  };

  const [content,       setContent]       = useState('');
  const [type,          setType]          = useState<typeof TYPES[number]>('tip');
  const [category,      setCategory]      = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [stack,         setStack]         = useState('');
  const [errors,        setErrors]        = useState<Record<string,string>>({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const inspo = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
  const remaining = 280 - content.length;

  function validate() {
    const e: Record<string,string> = {};
    if (!content.trim())  e.content  = t('fieldRequired');
    if (content.length > 280) e.content = tMC('maxChars');
    if (!category)        e.category = t('selectCategory');
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          type,
          category,
          category_label: category === 'autre' ? categoryLabel.trim() || null : null,
          stack: stack.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ content: data.error || t('serverError') }); return; }
      setSuccess(true);
      setTimeout(() => router.push('/mon-compte?tab=tips'), 1200);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: 680, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ border: '1px solid var(--f-border)', borderRadius: 12, padding: '3rem 2rem', background: 'var(--f-surface)' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', color: 'var(--f-green)', margin: 0 }}>
            {tMC('tip.successNew')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <a href="/mon-compte?tab=tips" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-3)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
        {tMC('back')}
      </a>

      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--f-orange)', marginBottom: '.5rem' }}>
        {tMC('tip.newLabel')}
      </p>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: 'var(--f-text-1)', margin: '0 0 .5rem 0' }}>
        {tMC('tip.newTitle')}
      </h1>
      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-text-3)', margin: '0 0 2.5rem 0', lineHeight: 1.7 }}>
        {tMC('tip.newSubtitle')}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            Type <span style={{ color: 'var(--f-orange)' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {TYPES.map(tp => (
              <button
                key={tp}
                type="button"
                className={`filter-pill${type === tp ? ' active' : ''}`}
                onClick={() => setType(tp)}
              >
                {TYPE_LABELS[tp]}
              </button>
            ))}
          </div>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: 0 }}>
            {TYPE_DESC[type]}
          </p>
        </div>

        {/* Contenu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            {tMC('tip.contentLabel')} <span style={{ color: 'var(--f-orange)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              className="f-input"
              value={content}
              onChange={e => {
                setContent(e.target.value);
                if (errors.content) setErrors(er => ({ ...er, content: '' }));
              }}
              rows={5}
              placeholder={inspo}
              style={{ maxWidth: '100%', resize: 'vertical', paddingBottom: '2rem' }}
              maxLength={300}
            />
            <span style={{
              position: 'absolute', bottom: '.5rem', right: '.75rem',
              fontFamily: "'Geist Mono', monospace",
              fontSize: '.6rem',
              color: remaining < 20 ? '#f87171' : remaining < 50 ? 'var(--f-orange)' : 'var(--f-text-3)',
            }}>
              {remaining}
            </span>
          </div>
          {errors.content && (
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.content}</span>
          )}
        </div>

        {/* Catégorie */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            {tMC('tip.categoryLabel')} <span style={{ color: 'var(--f-orange)' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                className={`filter-pill${category === c ? ' active' : ''}`}
                onClick={() => { setCategory(c); if (errors.category) setErrors(er => ({ ...er, category: '' })); }}
              >
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
          {category === 'autre' && (
            <input
              className="f-input"
              type="text"
              placeholder={tMC('tip.categoryOtherPlaceholder')}
              value={categoryLabel}
              onChange={e => setCategoryLabel(e.target.value)}
              style={{ maxWidth: '100%', marginTop: '.25rem' }}
            />
          )}
          {errors.category && (
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.category}</span>
          )}
        </div>

        {/* Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            Stack / Tags <span style={{ fontWeight: 400, color: 'var(--f-text-3)' }}>(optionnel)</span>
          </label>
          <input
            className="f-input"
            type="text"
            placeholder="Ex: Python, Pandas, SQL"
            value={stack}
            onChange={e => setStack(e.target.value)}
            style={{ maxWidth: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', paddingTop: '.5rem' }}>
          <button type="submit" className="btn-f btn-f-primary" disabled={loading}>
            {loading ? tMC('publishing') : tMC('tip.publishBtn')}
          </button>
          <a href="/mon-compte?tab=tips" className="btn-f btn-f-secondary">{tMC('cancel')}</a>
        </div>
      </form>
    </div>
  );
}
