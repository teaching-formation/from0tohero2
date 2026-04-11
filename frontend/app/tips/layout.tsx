import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tips & TIL — from0tohero.dev',
  description: 'Tips, TIL et snippets partagés par les praticiens tech — astuces concrètes en Data, DevOps, Cloud, IA et plus.',
  openGraph: {
    title: 'Tips & TIL — from0tohero.dev',
    description: 'Astuces concrètes partagées par les praticiens tech.',
    url: 'https://from0tohero.dev/tips',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
