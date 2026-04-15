import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const securityHeaders = [
  // Empêche le sniffing de type MIME
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Empêche l'intégration dans une iframe (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Force HTTPS pour 1 an
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Limite les infos du referrer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Désactive certaines fonctionnalités navigateur inutiles
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      // Par défaut : seulement soi-même
      "default-src 'self'",
      // Scripts : soi-même + inline (Next.js) + Google Analytics
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      // Styles : soi-même + inline (styles JSX)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Polices
      "font-src 'self' data: https://fonts.gstatic.com",
      // Images : tout HTTPS + data URIs + blob (avatars, photos Supabase)
      "img-src 'self' data: blob: https:",
      // Connexions API : Supabase + Google Analytics + soi-même
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
      // Iframes : aucune
      "frame-ancestors 'none'",
      // Formulaires : seulement soi-même
      "form-action 'self'",
      // Ressources base URI
      "base-uri 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
