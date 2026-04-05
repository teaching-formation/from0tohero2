'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded','autre'];
const CAT_LABELS: Record<string,string> = {
  data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité',
  frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile',
  web3:'Web3', embedded:'Embedded / IoT', autre:'Autre',
};
const TYPES = ['tip','TIL','snippet'] as const;
const TYPE_LABELS: Record<string,string> = { tip:'💡 Tip', TIL:'🧠 TIL', snippet:'{ } Snippet' };

type Tip = { id: string; content: string; type: string; category: string; stack: string[] };

export default function EditTipClient({ tip }: { tip: Tip }) {
  const router = useRouter();

  const [content,  setContent]  = useState(tip.content);
  const [type,     setType]     = useState(tip.type as typeof TYPES[number]);
  const [category, setCategory] = useState(tip.category);
  const [stack,    setStack]    = useState(Array.isArray(tip.stack) ? tip.stack.join(', ') : '');
  const [errors,   setErrors]   = useState<Record<string,string>>({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const remaining = 280 - content.length;

  function validate() {
    const e: Record<string,string> = {};
    if (!content.trim()) e.content = 'Champ requis';
    if (content.length > 280) e.content = 'Maximum 280 caractères';
    if (!category) e.category = 'Sélectionne une catégorie';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/tip/${tip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          type,
          category,
          stack: stack.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ content: data.error || 'Erreur' }); return; }
      setSuccess(true);
      setTimeout(() => router.push('/mon-compte?tab=tips'), 1000);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: 680, margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ border: '1px solid var(--f-border)', borderRadius: 12, padding: '3rem 2rem', background: 'var(--f-surface)' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.85rem', color: 'var(--f-green)', margin: 0 }}>
            ✓ Tip mis à jour — redirection…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <a href="/mon-compte?tab=tips" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-3)', textDecoration: 'none', display: 'inline-block', marginBottom: '2rem' }}>
        ← Mon espace
      </a>

      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--f-orange)', marginBottom: '.5rem' }}>
        // modifier le tip
      </p>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: 'var(--f-text-1)', margin: '0 0 2rem 0' }}>
        Modifier
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            Type <span style={{ color: 'var(--f-orange)' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {TYPES.map(t => (
              <button key={t} type="button" className={`filter-pill${type === t ? ' active' : ''}`} onClick={() => setType(t)}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            Contenu <span style={{ color: 'var(--f-orange)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              className="f-input"
              value={content}
              onChange={e => { setContent(e.target.value); if (errors.content) setErrors(er => ({ ...er, content: '' })); }}
              rows={5}
              style={{ maxWidth: '100%', resize: 'vertical', paddingBottom: '2rem' }}
              maxLength={300}
            />
            <span style={{
              position: 'absolute', bottom: '.5rem', right: '.75rem',
              fontFamily: "'Geist Mono', monospace", fontSize: '.6rem',
              color: remaining < 20 ? '#f87171' : remaining < 50 ? 'var(--f-orange)' : 'var(--f-text-3)',
            }}>
              {remaining}
            </span>
          </div>
          {errors.content && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.content}</span>}
        </div>

        {/* Catégorie */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            Catégorie <span style={{ color: 'var(--f-orange)' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {CATEGORIES.map(c => (
              <button key={c} type="button" className={`filter-pill${category === c ? ' active' : ''}`}
                onClick={() => { setCategory(c); if (errors.category) setErrors(er => ({ ...er, category: '' })); }}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
          {errors.category && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.category}</span>}
        </div>

        {/* Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            Stack / Tags <span style={{ fontWeight: 400, color: 'var(--f-text-3)' }}>(optionnel)</span>
          </label>
          <input className="f-input" type="text" placeholder="Ex: Python, Pandas, SQL" value={stack} onChange={e => setStack(e.target.value)} style={{ maxWidth: '100%' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', paddingTop: '.5rem' }}>
          <button type="submit" className="btn-f btn-f-primary" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Enregistrer →'}
          </button>
          <a href="/mon-compte?tab=tips" className="btn-f btn-f-secondary">Annuler</a>
        </div>
      </form>
    </div>
  );
}
