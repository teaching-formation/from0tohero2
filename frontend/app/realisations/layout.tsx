import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Réalisations — from0tohero.dev',
  description: 'Pipelines, dashboards, APIs, bootcamps — ce que les praticiens francophones construisent.',
  openGraph: {
    title: 'Réalisations — from0tohero.dev',
    description: 'Ce que les praticiens construisent.',
    url: 'https://from0tohero.dev/realisations',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
