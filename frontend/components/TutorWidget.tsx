'use client';
import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';

type Message = { role: 'user' | 'assistant'; content: string };

export default function TutorWidget() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const placeholder = locale === 'fr'
    ? 'Pose ta question tech…'
    : 'Ask your tech question…';
  const greeting = locale === 'fr'
    ? 'Salut 👋 Je suis **Ask Hero**, ton tuteur IA. Pose-moi n\'importe quelle question tech — je m\'appuie sur les ressources de la communauté from0tohero pour t\'aider !'
    : 'Hey 👋 I\'m **Ask Hero**, your AI tutor. Ask me any tech question — I\'ll use the from0tohero community resources to help you!';

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          locale,
          history: newMessages.slice(-8),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || (locale === 'fr' ? 'Désolé, une erreur est survenue.' : 'Sorry, an error occurred.'),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: locale === 'fr' ? 'Désolé, une erreur est survenue.' : 'Sorry, an error occurred.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function renderContent(text: string) {
    // Simple markdown: **bold**
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  }

  return (
    <>
      {/* ── Panel ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '5rem', right: '1.25rem',
          width: 'min(380px, calc(100vw - 2rem))',
          height: 'min(540px, calc(100dvh - 7rem))',
          background: 'var(--f-surface)',
          border: '1.5px solid var(--f-border)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,.35)',
          display: 'flex', flexDirection: 'column',
          zIndex: 900,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '.9rem 1.1rem',
            borderBottom: '1px solid var(--f-border)',
            display: 'flex', alignItems: 'center', gap: '.6rem',
            background: 'var(--f-bg)',
            flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #f97316, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', flexShrink: 0,
            }}>🦸</div>
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '.88rem', fontWeight: 800, color: 'var(--f-text-1)', margin: 0 }}>Ask Hero</p>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.58rem', color: 'var(--f-text-3)', margin: 0 }}>
                {locale === 'fr' ? 'Tuteur IA · from0tohero' : 'AI Tutor · from0tohero'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: 'auto', background: 'none', border: '1px solid var(--f-border)',
                borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                color: 'var(--f-text-3)', fontSize: '.7rem',
              }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {/* Greeting */}
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem',
              }}>🦸</div>
              <div style={{
                background: 'var(--f-bg)', border: '1px solid var(--f-border)',
                borderRadius: '4px 12px 12px 12px', padding: '.6rem .8rem',
                fontSize: '.8rem', color: 'var(--f-text-2)', lineHeight: 1.6, maxWidth: '85%',
              }}>
                {renderContent(greeting)}
              </div>
            </div>

            {/* Conversation */}
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: '.5rem', alignItems: 'flex-start',
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem',
                  }}>🦸</div>
                )}
                <div style={{
                  background: m.role === 'user' ? 'var(--f-sky)' : 'var(--f-bg)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--f-border)',
                  borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                  padding: '.6rem .8rem',
                  fontSize: '.8rem',
                  color: m.role === 'user' ? '#0d1117' : 'var(--f-text-2)',
                  lineHeight: 1.6, maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.role === 'assistant' ? renderContent(m.content) : m.content}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem',
                }}>🦸</div>
                <div style={{
                  background: 'var(--f-bg)', border: '1px solid var(--f-border)',
                  borderRadius: '4px 12px 12px 12px', padding: '.6rem .8rem',
                  fontSize: '.8rem', color: 'var(--f-text-3)',
                }}>
                  <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, display: 'inline-block' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '.75rem',
            borderTop: '1px solid var(--f-border)',
            flexShrink: 0,
            background: 'var(--f-bg)',
          }}>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={placeholder}
                rows={2}
                maxLength={500}
                style={{
                  flex: 1, resize: 'none',
                  background: 'var(--f-surface)', border: '1.5px solid var(--f-border)',
                  borderRadius: 8, padding: '.45rem .6rem',
                  fontFamily: "'Geist Mono', monospace", fontSize: '.74rem',
                  color: 'var(--f-text-1)', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color .15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--f-border)'}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                style={{
                  background: input.trim() && !loading ? 'linear-gradient(135deg, #f97316, #f59e0b)' : 'var(--f-border)',
                  border: 'none', borderRadius: 8, padding: '8px 14px',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  color: input.trim() && !loading ? '#fff' : 'var(--f-text-3)',
                  fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', fontWeight: 700,
                  flexShrink: 0, transition: 'background .15s',
                }}
              >→</button>
            </div>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.55rem', color: 'var(--f-text-3)', margin: '.4rem 0 0', textAlign: 'center' }}>
              Ask Hero · Beta
            </p>
          </div>
        </div>
      )}

      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ask Hero — Tuteur IA"
        style={{
          position: 'fixed', bottom: '1.25rem', right: '1.25rem',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f97316, #f59e0b)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(249,115,22,.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', zIndex: 901,
          transition: 'transform .2s, box-shadow .2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(249,115,22,.6)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(249,115,22,.45)';
        }}
      >
        {open ? '✕' : '🦸'}
      </button>
    </>
  );
}
