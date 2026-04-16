import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // ── 1. Nonce-based CSP ────────────────────────────────────────────────────
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = [
    "default-src 'self'",
    // Nonce authenticates our inline scripts; strict-dynamic propagates trust
    // unsafe-eval needed only in dev mode (React call stack reconstruction)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com`,
    // Styles: unsafe-inline needed for JSX/CSS-in-JS
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    // Images: Supabase storage, avatars, data URIs
    "img-src 'self' data: blob: https:",
    // API calls
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
    // Block plugins entirely
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; ');

  // Forward nonce to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith('/mon-compte') || pathname.startsWith('/soumettre');

  // ── 2. Supabase session + auth guard (routes protégées uniquement) ─────────
  if (isProtected) {
    let supabaseResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Rafraîchit la session — ne pas supprimer cette ligne
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      url.searchParams.set('next', pathname);
      const redirect = NextResponse.redirect(url);
      redirect.headers.set('Content-Security-Policy', csp);
      return redirect;
    }

    supabaseResponse.headers.set('Content-Security-Policy', csp);
    return supabaseResponse;
  }

  // ── 3. Routes publiques : juste le nonce CSP ──────────────────────────────
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static assets
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
