import type { Metadata } from 'next';
import Script from 'next/script';
import { headers } from 'next/headers';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CursorGlow from '@/components/CursorGlow';
import PageTransition from '@/components/PageTransition';
import SplashScreen from '@/components/SplashScreen';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  metadataBase: new URL('https://from0tohero.dev'),
  title: 'from0tohero.dev',
  description: 'La plateforme des praticiens — Data, DevOps, Cloud, IA, Cybersécurité, Dev.',
  openGraph: {
    title: 'from0tohero.dev',
    description: 'La plateforme des praticiens',
    url: 'https://from0tohero.dev',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* suppressHydrationWarning: browsers strip nonce from DOM after reading (security), causing expected SSR/client mismatch */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var t = localStorage.getItem('theme');
              if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
              } else {
                document.documentElement.classList.add('light');
                document.documentElement.classList.remove('dark');
              }
            })();
          `
        }} />
      </head>
      <Script nonce={nonce} src="https://www.googletagmanager.com/gtag/js?id=G-X97KF9BC91" strategy="afterInteractive" />
      <Script nonce={nonce} id="gtag-init" strategy="afterInteractive" dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-X97KF9BC91');
        `
      }} />
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--f-bg)' }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SplashScreen />
          <CursorGlow />
          <Navbar />
          <main style={{ flex: 1 }}>
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
