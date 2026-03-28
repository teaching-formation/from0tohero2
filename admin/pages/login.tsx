import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async () => ({ props: { noLayout: true } });

export default function LoginPage() {
  const router             = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem('admin_token', password);
      router.push('/');
    } else {
      setError('Mot de passe incorrect. Réessayez.');
    }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      {/* Subtle grid background */}
      <div className="login-bg-grid" aria-hidden="true" />

      <div className="login-card">
        {/* Eyebrow */}
        <p className="login-eyebrow">// admin console</p>

        {/* Title */}
        <h1 className="login-title">
          from0tohero<span>.</span>
        </h1>

        {/* Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="field-group">
            <label
              htmlFor="password"
              className="field-label"
              style={{ color: 'var(--text-3)' }}
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoFocus
              autoComplete="current-password"
              style={{ fontSize: '.85rem', letterSpacing: '.08em' }}
            />
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password.trim()}
            style={{ width: '100%', justifyContent: 'center', padding: '.75rem', fontSize: '.72rem', marginTop: '.25rem' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 13, height: 13, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} />
                Vérification…
              </>
            ) : (
              'Accéder au panneau →'
            )}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '.56rem',
          letterSpacing: '.08em',
          color: 'var(--text-4)',
          textAlign: 'center',
          marginTop: '1.5rem',
        }}>
          Accès réservé aux administrateurs
        </p>
      </div>
    </div>
  );
}
