export default function LegalPage() {
  const S = {
    h2: { fontFamily: "'Syne', sans-serif", fontWeight: 700 as const, color: 'var(--f-text-1)', fontSize: '1.05rem', margin: '2.5rem 0 .6rem 0', paddingBottom: '.4rem', borderBottom: '1px solid var(--f-border)' },
    p:  { color: 'var(--f-text-2)', lineHeight: 1.9, fontSize: '.88rem', margin: '0 0 .75rem 0' },
    li: { color: 'var(--f-text-2)', lineHeight: 1.9, fontSize: '.88rem', marginBottom: '.4rem' },
    a:  { color: 'var(--f-sky)', textDecoration: 'none' },
  };

  return (
    <div style={{ padding: '4rem 6vw', maxWidth: 760, margin: '0 auto' }}>
      <span className="f-label" style={{ marginBottom: '.5rem' }}>// légal</span>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 800, color: 'var(--f-text-1)', margin: '.4rem 0 .5rem 0' }}>
        Mentions légales & CGU
      </h1>
      <p style={{ ...S.p, color: 'var(--f-text-3)', marginBottom: '2.5rem' }}>
        Dernière mise à jour : mars 2026
      </p>

      {/* ── 1. ÉDITEUR ── */}
      <h2 style={S.h2}>1. Éditeur du site</h2>
      <p style={S.p}>
        <strong style={{ color: 'var(--f-text-1)' }}>from0tohero.dev</strong> est un projet personnel édité par{' '}
        <strong style={{ color: 'var(--f-text-1)' }}>Diakité Mamadou Youssouf</strong>, Expert & Architecte Data,
        basé à Abidjan, Côte d'Ivoire.
      </p>
      <p style={S.p}>
        Contact :{' '}
        <a href="https://www.linkedin.com/in/mamadou-youssouf-diakite-083630135" target="_blank" rel="noreferrer" style={S.a}>
          LinkedIn
        </a>{' '}·{' '}
        <a href="https://github.com/diakite-data" target="_blank" rel="noreferrer" style={S.a}>
          GitHub
        </a>
      </p>

      {/* ── 2. OBJET DE LA PLATEFORME ── */}
      <h2 style={S.h2}>2. Objet de la plateforme</h2>
      <p style={S.p}>
        from0tohero.dev est une plateforme communautaire gratuite qui répertorie les praticiens tech francophones
        (Data, DevOps, Cloud, IA, Cybersécurité, Dev) ainsi que leurs réalisations, articles et événements.
      </p>
      <p style={S.p}>
        La plateforme n'est pas un service de recrutement, une agence, ni un réseau social. Elle vise uniquement
        à rendre visibles les praticiens qui construisent des choses concrètes en Afrique et dans la diaspora.
      </p>

      {/* ── 3. CONDITIONS DE SOUMISSION ── */}
      <h2 style={S.h2}>3. Conditions de soumission de contenu</h2>
      <p style={S.p}>En soumettant un profil, un article ou une réalisation, vous acceptez les conditions suivantes :</p>
      <ul style={{ paddingLeft: '1.25rem', margin: '0 0 .75rem 0' }}>
        <li style={S.li}>Les informations soumises sont exactes et vous appartiennent.</li>
        <li style={S.li}>Vous disposez des droits nécessaires sur le contenu soumis.</li>
        <li style={S.li}>Le contenu ne contient pas de propos haineux, discriminatoires ou illégaux.</li>
        <li style={S.li}>La plateforme se réserve le droit de refuser tout contenu ne correspondant pas à sa ligne éditoriale.</li>
        <li style={S.li}>Tout contenu publié jugé non conforme aux présentes conditions peut être supprimé à tout moment, sans préavis et sans justification, à la seule discrétion de l'éditeur.</li>
      </ul>
      <p style={S.p}>
        Les soumissions acceptées peuvent être publiées, corrigées typographiquement ou retirées à tout moment
        par l'éditeur sans préavis.
      </p>

      {/* ── 4. PROPRIÉTÉ INTELLECTUELLE ── */}
      <h2 style={S.h2}>4. Propriété intellectuelle</h2>
      <p style={S.p}>
        Tout contenu soumis (textes, descriptions, liens) reste la <strong style={{ color: 'var(--f-text-1)' }}>propriété exclusive de son auteur</strong>.
        La plateforme ne revendique aucun droit de propriété sur les contenus soumis.
      </p>
      <p style={S.p}>
        En soumettant du contenu, vous accordez à from0tohero.dev une licence non exclusive, gratuite et mondiale
        pour l'afficher sur la plateforme.
      </p>
      <p style={S.p}>
        Le code source du site est open source et disponible sur{' '}
        <a href="https://github.com/diakite-data" target="_blank" rel="noreferrer" style={S.a}>GitHub</a>.
        La charte graphique, le nom et le logo from0tohero.dev sont la propriété de Diakité Mamadou Youssouf.
      </p>

      {/* ── 5. DONNÉES PERSONNELLES ── */}
      <h2 style={S.h2}>5. Données personnelles (RGPD)</h2>
      <p style={S.p}>
        Les données collectées via les formulaires (nom, URL LinkedIn, pays, bio, etc.) sont utilisées
        <strong style={{ color: 'var(--f-text-1)' }}> uniquement</strong> pour la publication de profils sur la plateforme.
        Elles ne sont jamais revendues ni partagées avec des tiers.
      </p>
      <p style={S.p}>Données stockées :</p>
      <ul style={{ paddingLeft: '1.25rem', margin: '0 0 .75rem 0' }}>
        <li style={S.li}><strong style={{ color: 'var(--f-text-1)' }}>Profils praticiens</strong> : nom, rôle, pays, bio, liens publics (LinkedIn, GitHub…)</li>
        <li style={S.li}><strong style={{ color: 'var(--f-text-1)' }}>Réalisations & articles</strong> : titre, description, liens externes</li>
        <li style={S.li}><strong style={{ color: 'var(--f-text-1)' }}>Soumissions</strong> : données brutes des formulaires, conservées le temps de la modération</li>
      </ul>
      <p style={S.p}>
        Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
        Pour exercer ces droits, contactez-nous via{' '}
        <a href="https://www.linkedin.com/in/mamadou-youssouf-diakite-083630135" target="_blank" rel="noreferrer" style={S.a}>LinkedIn</a>.
      </p>

      {/* ── 6. COOKIES ── */}
      <h2 style={S.h2}>6. Cookies</h2>
      <p style={S.p}>
        from0tohero.dev n'utilise <strong style={{ color: 'var(--f-text-1)' }}>aucun cookie de tracking</strong> ni outil d'analytics tiers.
        Aucune donnée de navigation n'est collectée à des fins publicitaires.
      </p>
      <p style={S.p}>
        Seuls des cookies techniques (nécessaires au fonctionnement du site) peuvent être déposés par les services
        d'hébergement (Vercel, Supabase). Ces cookies ne sont pas sous le contrôle direct de la plateforme.
      </p>

      {/* ── 7. RESPONSABILITÉ ── */}
      <h2 style={S.h2}>7. Limitation de responsabilité</h2>
      <p style={S.p}>
        La plateforme s'efforce de maintenir des informations à jour et exactes, mais ne garantit pas
        l'exhaustivité ni la précision des contenus publiés par les utilisateurs.
      </p>
      <p style={S.p}>
        Les liens externes (LinkedIn, GitHub, Medium, etc.) redirigent vers des sites tiers dont
        from0tohero.dev ne peut contrôler le contenu. Nous déclinons toute responsabilité quant aux
        contenus de ces sites.
      </p>

      {/* ── 8. CONTACT ── */}
      <h2 style={S.h2}>8. Contact</h2>
      <p style={S.p}>
        Pour toute question relative aux mentions légales, à vos données personnelles ou à un contenu
        publié sur la plateforme :
      </p>
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
