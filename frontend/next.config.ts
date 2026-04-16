import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Note: CSP is handled per-request by middleware.ts (nonce-based)
// These static headers cover the rest of the security requirements
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
