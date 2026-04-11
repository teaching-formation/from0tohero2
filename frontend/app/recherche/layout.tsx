import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recherche — from0tohero.dev',
  description: 'Recherche globale sur from0tohero.dev — praticiens, réalisations, articles, tips et événements.',
  openGraph: {
    title: 'Recherche — from0tohero.dev',
    description: 'Trouvez praticiens, projets et contenus tech.',
    url: 'https://from0tohero.dev/recherche',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
