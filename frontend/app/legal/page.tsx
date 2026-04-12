import { getTranslations } from 'next-intl/server';

export default async function LegalPage() {
  const t = await getTranslations('legal');

  const S = {
    h2: { fontFamily: "'Syne', sans-serif", fontWeight: 700 as const, color: 'var(--f-text-1)', fontSize: '1.05rem', margin: '2.5rem 0 .6rem 0', paddingBottom: '.4rem', borderBottom: '1px solid var(--f-border)' },
    p:  { color: 'var(--f-text-2)', lineHeight: 1.9, fontSize: '.88rem', margin: '0 0 .75rem 0' },
    li: { color: 'var(--f-text-2)', lineHeight: 1.9, fontSize: '.88rem', marginBottom: '.4rem' },
    a:  { color: 'var(--f-sky)', textDecoration: 'none' },
  };

  return (
    <div style={{ padding: '4rem 6vw', maxWidth: 760, margin: '0 auto' }}>
      <span className="f-label" style={{ marginBottom: '.5rem' }}>{t('label')}</span>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '.4rem 0 .5rem 0' }}>
        {t('title')}
      </h1>
      <p style={{ ...S.p, color: 'var(--f-text-3)', marginBottom: '2.5rem' }}>
        {t('lastUpdate')}
      </p>

      {/* ── 1. ÉDITEUR ── */}
      <h2 style={S.h2}>{t('s1Title')}</h2>
      <p style={S.p}>{t('s1p1')}</p>
      <p style={S.p}>
        {t('s1p2')}{' '}
        <a href="https://www.linkedin.com/in/mamadou-youssouf-diakite-083630135" target="_blank" rel="noreferrer" style={S.a}>LinkedIn</a>
        {' '}·{' '}
        <a href="https://github.com/diakite-data" target="_blank" rel="noreferrer" style={S.a}>GitHub</a>
      </p>

      {/* ── 2. OBJET ── */}
      <h2 style={S.h2}>{t('s2Title')}</h2>
      <p style={S.p}>{t('s2p1')}</p>
      <p style={S.p}>{t('s2p2')}</p>

      {/* ── 3. CONDITIONS ── */}
      <h2 style={S.h2}>{t('s3Title')}</h2>
      <p style={S.p}>{t('s3intro')}</p>
      <ul style={{ paddingLeft: '1.25rem', margin: '0 0 .75rem 0' }}>
        <li style={S.li}>{t('s3li1')}</li>
        <li style={S.li}>{t('s3li2')}</li>
        <li style={S.li}>{t('s3li3')}</li>
        <li style={S.li}>{t('s3li4')}</li>
        <li style={S.li}>{t('s3li5')}</li>
      </ul>
      <p style={S.p}>{t('s3p2')}</p>

      {/* ── 4. PROPRIÉTÉ INTELLECTUELLE ── */}
      <h2 style={S.h2}>{t('s4Title')}</h2>
      <p style={S.p}>{t('s4p1')}</p>
      <p style={S.p}>{t('s4p2')}</p>
      <p style={S.p}>
        {t('s4p3pre')}{' '}
        <a href="https://github.com/diakite-data" target="_blank" rel="noreferrer" style={S.a}>GitHub</a>.{' '}
        {t('s4p3post')}
      </p>

      {/* ── 5. DONNÉES PERSONNELLES ── */}
      <h2 style={S.h2}>{t('s5Title')}</h2>
      <p style={S.p}>{t('s5p1')}</p>
      <p style={S.p}>{t('s5stored')}</p>
      <ul style={{ paddingLeft: '1.25rem', margin: '0 0 .75rem 0' }}>
        <li style={S.li}>{t('s5li1')}</li>
        <li style={S.li}>{t('s5li2')}</li>
        <li style={S.li}>{t('s5li3')}</li>
      </ul>
      <p style={S.p}>
        {t('s5p2pre')}{' '}
        <a href="https://www.linkedin.com/in/mamadou-youssouf-diakite-083630135" target="_blank" rel="noreferrer" style={S.a}>LinkedIn</a>.
      </p>

      {/* ── 6. COOKIES ── */}
      <h2 style={S.h2}>{t('s6Title')}</h2>
      <p style={S.p}>{t('s6p1')}</p>
      <p style={S.p}>{t('s6p2')}</p>

      {/* ── 7. RESPONSABILITÉ ── */}
      <h2 style={S.h2}>{t('s7Title')}</h2>
      <p style={S.p}>{t('s7p1')}</p>
      <p style={S.p}>{t('s7p2')}</p>

      {/* ── 8. CONTACT ── */}
      <h2 style={S.h2}>{t('s8Title')}</h2>
      <p style={S.p}>{t('s8intro')}</p>
      <ul style={{ paddingLeft: '1.25rem', margin: '0 0 .75rem 0' }}>
        <li style={S.li}>
          LinkedIn :{' '}
          <a href="https://www.linkedin.com/in/mamadou-youssouf-diakite-083630135" target="_blank" rel="noreferrer" style={S.a}>
            Diakité Mamadou Youssouf
          </a>
        </li>
        <li style={S.li}>
          GitHub :{' '}
          <a href="https://github.com/diakite-data" target="_blank" rel="noreferrer" style={S.a}>
            github.com/diakite-data
          </a>
        </li>
      </ul>
    </div>
  );
}
