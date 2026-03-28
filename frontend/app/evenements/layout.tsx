import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Événements — from0tohero.dev',
  description: 'Conférences, meetups, hackathons tech à ne pas manquer — en ligne et en présentiel.',
  openGraph: {
    title: 'Événements — from0tohero.dev',
    description: 'Conférences, meetups et hackathons tech.',
    url: 'https://from0tohero.dev/evenements',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
