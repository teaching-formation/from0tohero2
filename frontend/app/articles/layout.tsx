import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles — from0tohero.dev',
  description: 'Articles écrits par des praticiens tech francophones — Medium, LinkedIn, Dev.to et plus.',
  openGraph: {
    title: 'Articles — from0tohero.dev',
    description: 'Ce que les praticiens francophones écrivent.',
    url: 'https://from0tohero.dev/articles',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
