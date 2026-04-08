'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

type Notif = {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'coauteur';
  read: boolean;
  content_type?: string;
  content_id?: string;
  content_title?: string;
  created_at: string;
  praticiens?: { name: string; slug: string; photo_url?: string } | null;
};

const TYPE_LABEL: Record<string, string> = {
  like:      'a aimé',
  comment:   'a commenté',
  follow:    'te suit désormais',
  coauteur:  'tu es crédité(e) comme co-auteur',
};

const TYPE_ICON: Record<string, string> = {
  like: '♥', comment: '💬', follow: '＋', coauteur: '✦',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'à l\'instant';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/notification').catch(() => null);
    if (!res || !res.ok) return;
    const d = await res.json();
    setNotifs(d.notifications ?? []);
    setUnread(d.unread ?? 0);
    setLoggedIn(true);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Fermer en cliquant dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleOpen() {
    setOpen(o => !o);
    if (!open && unread > 0) {
      setUnread(0);
      setNotifs(ns => ns.map(n => ({ ...n, read: true })));
      await fetch('/api/notification', { method: 'PATCH' }).catch(() => {});
    }
  }

  if (!loggedIn) return null;

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Bouton cloche */}
      <button
        onClick={handleOpen}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px', position: 'relative', display: 'flex', alignItems: 'center',
          color: open ? 'var(--f-sky)' : 'var(--f-text-3)',
          transition: 'color .15s',
        }}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#f87171', color: '#fff',
            borderRadius: 99, fontSize: '.52rem', fontWeight: 700,
            fontFamily: "'Geist Mono', monospace",
            minWidth: 14, height: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '1.5px solid var(--f-bg)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 320, maxHeight: 420, overflowY: 'auto',
          background: 'var(--f-surface)', border: '1px solid var(--f-border)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.25)',
          zIndex: 200,
        }}>
          <div style={{ padding: '.85rem 1rem .6rem', borderBottom: '1px solid var(--f-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)' }}>
              // notifications
            </span>
          </div>

          {notifs.length === 0 ? (
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-3)', padding: '1.5rem 1rem', margin: 0, textAlign: 'center' }}>
              Aucune notification.
            </p>
          ) : (
            <div>
              {notifs.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex', gap: '.6rem', alignItems: 'flex-start',
                    padding: '.65rem 1rem',
                    borderBottom: '1px solid var(--f-border)',
                    background: n.read ? 'transparent' : 'rgba(56,189,248,.04)',
                    transition: 'background .15s',
                  }}
                >
                  {/* Icône type */}
                  <span style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: n.type === 'like' ? 'rgba(248,113,113,.15)' :
                                n.type === 'comment' ? 'rgba(56,189,248,.15)' :
                                n.type === 'follow' ? 'rgba(52,211,153,.15)' : 'rgba(251,146,60,.15)',
                    fontSize: '.75rem',
                  }}>
                    {TYPE_ICON[n.type]}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: 'var(--f-text-1)', margin: '0 0 .2rem 0', lineHeight: 1.45 }}>
                      <span style={{ color: 'var(--f-sky)', fontWeight: 600 }}>
                        @{n.praticiens?.slug ?? '?'}
                      </span>{' '}
                      {TYPE_LABEL[n.type]}
                      {n.content_title && (
                        <span style={{ color: 'var(--f-text-3)' }}> · {n.content_title}</span>
                      )}
                    </p>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.57rem', color: 'var(--f-text-3)' }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>

                  {!n.read && (
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--f-sky)', flexShrink: 0, marginTop: 5 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
