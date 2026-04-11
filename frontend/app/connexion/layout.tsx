import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — from0tohero.dev',
  description: 'Connectez-vous à from0tohero.dev pour accéder à votre espace praticien.',
  openGraph: {
    title: 'Connexion — from0tohero.dev',
    description: 'Accédez à votre espace praticien.',
    url: 'https://from0tohero.dev/connexion',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
