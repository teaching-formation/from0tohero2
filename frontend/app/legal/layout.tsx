import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales & CGU — from0tohero.dev',
  description: 'Mentions légales et conditions générales d\'utilisation de from0tohero.dev.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
