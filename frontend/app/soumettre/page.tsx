'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FormProfil      from '@/components/forms/FormProfil';
import FormArticle     from '@/components/forms/FormArticle';
import FormRealisation from '@/components/forms/FormRealisation';
import FormEvenement   from '@/components/forms/FormEvenement';

type FormType = 'profil' | 'article' | 'realisation' | 'evenement' | null;
type GateState = 'idle' | 'checking' | 'found' | 'not_found';

export default function SoumettreePage() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [showForm, setShowForm]     = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [userEmail, setUserEmail]   = useState('');
  const [hasProfil, setHasProfil]   = useState(false);
  const [userSlug,    setUserSlug]    = useState('');
  const [userName,    setUserName]    = useState('');
  const [userCountry, setUserCountry] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const pendingCardRef = useRef<FormType>(null);

  // Gate
  const [usernameInput, setUsernameInput] = useState('');
  const [gateState, setGateState]         = useState<GateState>('idle');
  const [praticienName, setPraticienName] = useState('');

  function selectCard(type: FormType, slug?: string, name?: string, profil?: boolean) {
    const resolvedSlug   = slug   ?? userSlug;
    const resolvedName   = name   ?? userName;
    const resolvedProfil = profil ?? hasProfil;

    if (type === 'profil' && resolvedProfil) {
      router.push('/mon-compte/edit');
      return;
    }
    setActiveForm(type);
    setSubmitted(false);
    setGateState('idle');
    setPraticienName('');
    if (type === 'profil') {
      setUsernameInput('');
      setShowForm(true);
    } else if (resolvedSlug) {
      // Connecté avec un profil → on saute la gate
      setUsernameInput(resolvedSlug);
      setPraticienName(resolvedName);
      setGateState('found');
      setShowForm(true);
    } else {
      setUsernameInput('');
      setShowForm(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      let slug = '', name = '', country = '', profil = false;
      if (data.user) {
        if (data.user.email) setUserEmail(data.user.email);
        const { data: p } = await supabase
          .from('praticiens').select('id, slug, name, country').eq('user_id', data.user.id).maybeSingle();
        if (p) {
          profil  = true;
          slug    = p.slug;
          name    = p.name;
          country = p.country || '';
          setHasProfil(true);
          setUserSlug(p.slug);
          setUserName(p.name);
          if (p.country) setUserCountry(p.country);
        }
      }
      setAuthLoading(false);
      // Si l'utilisateur avait cliqué avant que l'auth se résolve → on déclenche maintenant
      if (pendingCardRef.current) {
        const pending = pendingCardRef.current;
        pendingCardRef.current = null;
        selectCard(pending, slug, name, profil);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkUsername() {
    if (!usernameInput.trim()) return;
    setGateState('checking');
    const { data } = await createClient()
      .from('praticiens')
      .select('name')
      .eq('status', 'approved')
      .eq('slug', usernameInput.trim().toLowerCase())
      .maybeSingle();

    if (data) {
      setPraticienName(data.name);
      setGateState('found');
    } else {
      setGateState('not_found');
    }
  }

  function handleSuccess() {
    setSubmitted(true);
    setShowForm(false);
  }

  const CARDS = [
    { type: 'profil' as FormType, icon: '👤', num: '01', title: 'Mon profil', desc: hasProfil ? 'Modifier mon profil existant →' : "Figurer dans l'annuaire des praticiens.", iconBg: 'rgba(14,165,233,.1)' },
    { type: 'article'     as FormType, icon: '✍️', num: '02', title: 'Un article',      desc: "Medium, LinkedIn, Dev.to, Substack…",      iconBg: 'rgba(249,115,22,.1)' },
    { type: 'realisation' as FormType, icon: '🚀', num: '03', title: 'Une réalisation', desc: "Pipeline, dashboard, API, bootcamp, YT…",  iconBg: 'rgba(16,185,129,.1)' },
    { type: 'evenement'   as FormType, icon: '📅', num: '04', title: 'Un événement',    desc: "Conférence, meetup, hackathon, webinaire…", iconBg: 'rgba(167,139,250,.1)' },
  ];

  return (
    <div style={{ padding: '4rem 6vw', maxWidth: 820, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '3.5rem' }}>
        <span className="f-label" style={{ marginBottom: '.6rem' }}>// soumettre</span>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.9rem,4vw,2.8rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '.4rem 0 .8rem 0' }}>
          Montre ce que tu construis.
        </h1>
        <p style={{ color: 'var(--f-text-3)', fontSize: '.95rem', lineHeight: 1.85, maxWidth: 500, margin: 0 }}>
          Tu es praticien tech ? Soumets ton profil, un article, une réalisation ou un événement.
        </p>
      </div>

      {/* CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {CARDS.map(card => (
          <div key={card.type as string}
            className={`submit-card${activeForm === card.type ? ' selected' : ''}`}
            onClick={() => {
              if (authLoading) {
                // Auth pas encore résolue → mémorise la carte et sélectionne visuellement
                pendingCardRef.current = card.type;
                setActiveForm(card.type);
              } else {
                selectCard(card.type);
              }
            }}>
            <div className="submit-icon" style={{ background: card.iconBg }}>{card.icon}</div>
            <p className="f-label" style={{ marginBottom: '.5rem', fontSize: '.65rem' }}>{card.num}</p>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .4rem 0' }}>{card.title}</h3>
            <p style={{ fontSize: '.82rem', color: 'var(--f-text-2)', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
          </div>
        ))}
      </div>

      {activeForm && (
        <div>
          <hr className="f-hr" style={{ marginBottom: '2rem' }} />

          {/* ── SUCCÈS ── */}
          {submitted && (
            <div style={{ background: 'var(--f-green-bg)', border: '1.5px solid var(--f-green-border)', borderRadius: 14, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .25rem 0' }}>
                  {activeForm === 'profil' ? 'Profil créé !' : 'Soumission reçue !'}
                </p>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-3)', margin: '0 0 .5rem 0' }}>
                  {activeForm === 'profil'
                    ? 'Ton profil est maintenant en ligne et visible dans l\'annuaire.'
                    : 'Contenu publié instantanément.'}
                </p>
                {activeForm === 'profil' && (
                  <a href="/mon-compte" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-sky)', textDecoration: 'none' }}>
                    → Accéder à mon espace pour soumettre des articles, réalisations et événements
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── Chargement auth ── */}
          {authLoading && activeForm && activeForm !== 'profil' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1.5rem 0', color: 'var(--f-text-3)', fontFamily: "'Geist Mono', monospace", fontSize: '.75rem' }}>
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Vérification de ton compte…
            </div>
          )}

          {/* ── GATE (article / réalisation / événement) ── */}
          {(activeForm === 'article' || activeForm === 'realisation' || activeForm === 'evenement') && !showForm && !submitted && !authLoading && (
            <div className="gate-box">
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--f-text-1)', margin: '0 0 .4rem 0' }}>
                Vérifions ton profil
              </h3>
              <p style={{ fontSize: '.83rem', color: 'var(--f-text-3)', margin: '0 0 1.5rem 0' }}>
                Entre ton username — on vérifie que tu es déjà dans l&apos;annuaire.
              </p>

              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <input
                    className="f-input"
                    type="text"
                    placeholder="Ex: mamadou-diakite"
                    value={usernameInput}
                    onChange={e => { setUsernameInput(e.target.value); setGateState('idle'); }}
                    style={{ maxWidth: '100%' }}
                  />
                </div>
                <button
                  className="btn-f btn-f-primary"
                  onClick={checkUsername}
                  disabled={gateState === 'checking' || !usernameInput.trim()}
                  style={{ fontSize: '.72rem' }}>
                  {gateState === 'checking' ? 'Vérification…' : 'Vérifier →'}
                </button>
              </div>

              {/* ✅ Profil trouvé */}
              {gateState === 'found' && (
                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--f-green-bg)', border: '1px solid var(--f-green-border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-green)', margin: 0 }}>
                    ✓ Profil trouvé — <strong>{praticienName}</strong>
                  </p>
                  <button className="btn-f btn-f-primary" onClick={() => setShowForm(true)} style={{ fontSize: '.72rem' }}>
                    Continuer →
                  </button>
                </div>
              )}

              {/* ❌ Profil non trouvé */}
              {gateState === 'not_found' && (
                <div style={{ marginTop: '1.25rem', background: 'rgba(249,115,22,.06)', border: '1px solid rgba(249,115,22,.2)', borderRadius: 10, padding: '1rem 1.25rem' }}>
                  <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', color: 'var(--f-orange)', margin: '0 0 .75rem 0' }}>
                    ✗ Aucun profil trouvé avec ce username.
                  </p>
                  <p style={{ fontSize: '.82rem', color: 'var(--f-text-2)', margin: '0 0 1rem 0' }}>
                    Soumets d&apos;abord ton profil — publication instantanée.
                  </p>
                  <button className="btn-f btn-f-secondary" onClick={() => { setActiveForm('profil'); setShowForm(true); }} style={{ fontSize: '.72rem' }}>
                    Soumettre mon profil →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── FORMULAIRES ── */}
          {showForm && !submitted && (
            <>
              {activeForm === 'profil'      && <FormProfil      onSuccess={handleSuccess} initialEmail={userEmail} />}
              {activeForm === 'article'     && <FormArticle     onSuccess={handleSuccess} username={usernameInput} initialEmail={userEmail} hideEmail={!!userEmail} initialCountry={userCountry} />}
              {activeForm === 'realisation' && <FormRealisation onSuccess={handleSuccess} username={usernameInput} initialEmail={userEmail} hideEmail={!!userEmail} />}
              {activeForm === 'evenement'   && <FormEvenement   onSuccess={handleSuccess} username={usernameInput} initialEmail={userEmail} hideEmail={!!userEmail} initialCountry={userCountry} />}
            </>
          )}
        </div>
      )}

      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', marginTop: '3rem', lineHeight: 1.8 }}>
        Publication instantanée.
      </p>
    </div>
  );
}
