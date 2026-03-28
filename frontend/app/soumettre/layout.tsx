import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soumettre — from0tohero.dev',
  description: 'Soumets ton profil, un article ou une réalisation sur from0tohero.dev.',
  openGraph: {
    title: 'Soumettre — from0tohero.dev',
    description: 'Montre ce que tu construis.',
    url: 'https://from0tohero.dev/soumettre',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
