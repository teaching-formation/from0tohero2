import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CursorGlow from '@/components/CursorGlow';

export const metadata: Metadata = {
  title: 'from0tohero.dev',
  description: 'La plateforme des praticiens — Data, DevOps, Cloud, IA, Cybersécurité, Dev.',
  openGraph: {
    title: 'from0tohero.dev',
    description: 'La plateforme des praticiens',
    url: 'https://from0tohero.dev',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var t = localStorage.getItem('theme');
              if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){
                document.documentElement.classList.add('dark');
              }
            })();
          `
        }} />
      </head>
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--f-bg)' }}>
        <CursorGlow />
        <Navbar />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
