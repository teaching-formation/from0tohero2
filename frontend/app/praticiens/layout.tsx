import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Praticiens — from0tohero.dev',
  description: 'Profils de praticiens tech francophones — Data, DevOps, Cloud, IA, Cybersécurité, Dev.',
  openGraph: {
    title: 'Praticiens — from0tohero.dev',
    description: 'Profils de praticiens tech francophones.',
    url: 'https://from0tohero.dev/praticiens',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
