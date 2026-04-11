'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Item = { id: string; title: string; url: string; description: string };
type Props = { collection: { id: string; title: string; description: string; items: Item[] } };

function uid() { return Math.random().toString(36).slice(2); }

export default function EditCollectionClient({ collection }: Props) {
  const router = useRouter();
  const t = useTranslations('forms');
  const tMC = useTranslations('monCompte');

  const [title,       setTitle]       = useState(collection.title);
  const [description, setDescription] = useState(collection.description || '');
  const [items,       setItems]       = useState<Item[]>(collection.items || []);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newUrl,   setNewUrl]   = useState('');
  const [newDesc,  setNewDesc]  = useState('');

  function addItem() {
    if (!newTitle.trim()) return;
    let url = newUrl.trim();
    if (url && !url.startsWith('http')) url = 'https://' + url;
    setItems(its => [...its, { id: uid(), title: newTitle.trim(), url, description: newDesc.trim() }]);
    setNewTitle(''); setNewUrl(''); setNewDesc('');
  }

  function removeItem(id: string) { setItems(its => its.filter(i => i.id !== id)); }

  async function save() {
    if (!title.trim()) { setError(tMC('collection.titleRequired')); return; }
    setSaving(true); setError('');
    const res = await fetch(`/api/collection/${collection.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim(), items }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || t('serverError')); return; }
    setSuccess(true);
    setTimeout(() => router.push('/mon-compte?tab=collections'), 1000);
  }

  async function deleteCollection() {
    if (!window.confirm(tMC('collection.confirmDelete', { title }))) return;
    setDeleting(true);
    await fetch(`/api/collection/${collection.id}`, { method: 'DELETE' });
    router.push('/mon-compte?tab=collections');
    router.refresh();
  }

  if (success) return (
    <div style={{ border: '1px solid var(--f-border)', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.8rem', color: 'var(--f-green)', margin: 0 }}>{tMC('collection.successEdit')}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            {tMC('collection.titleLabel')} <span style={{ color: 'var(--f-orange)' }}>*</span>
          </label>
          <input className="f-input" placeholder="Ex: Mes livres Data, Outils DevOps…" value={title} onChange={e => setTitle(e.target.value)} style={{ maxWidth: '100%' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
            {tMC('collection.descLabel')}
          </label>
          <input className="f-input" placeholder="Ex: Les ressources qui ont changé ma façon de travailler" value={description} onChange={e => setDescription(e.target.value)} style={{ maxWidth: '100%' }} />
        </div>
      </div>

      <div>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)', marginBottom: '.75rem' }}>
          {tMC('collection.resourcesLabel', { count: items.length })}
        </p>
        {items.length === 0 ? (
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-3)', fontStyle: 'italic' }}>
            {tMC('collection.emptyResources')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {items.map((item, i) => (
              <div key={item.id} style={{ background: 'var(--f-surface)', border: '1px solid var(--f-border)', borderRadius: 8, padding: '.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: item.description ? '.2rem' : 0 }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', flexShrink: 0 }}>{i + 1}.</span>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', fontWeight: 600, color: 'var(--f-sky)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </a>
                    ) : (
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.75rem', fontWeight: 600, color: 'var(--f-text-1)' }}>{item.title}</span>
                    )}
                  </div>
                  {item.description && (
                    <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: 'var(--f-text-3)', margin: '0 0 0 1.1rem' }}>{item.description}</p>
                  )}
                </div>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--f-text-3)', fontSize: '.75rem', flexShrink: 0, padding: '2px 4px' }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--f-surface)', border: '1px dashed var(--f-border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', fontWeight: 600, color: 'var(--f-text-2)', marginBottom: '.85rem' }}>
          {tMC('collection.addResource')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          <input className="f-input" placeholder={tMC('collection.itemTitlePlaceholder')} value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())} style={{ maxWidth: '100%' }} />
          <input className="f-input" placeholder={tMC('collection.itemUrlPlaceholder')} value={newUrl} onChange={e => setNewUrl(e.target.value)} style={{ maxWidth: '100%' }} />
          <input className="f-input" placeholder={tMC('collection.itemDescPlaceholder')} value={newDesc} onChange={e => setNewDesc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())} style={{ maxWidth: '100%' }} />
          <button type="button" className="btn-f btn-f-secondary" onClick={addItem} disabled={!newTitle.trim()} style={{ alignSelf: 'flex-start', fontSize: '.72rem' }}>
            {tMC('collection.addBtn')}
          </button>
        </div>
      </div>

      {error && <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', color: '#f87171' }}>⚠ {error}</p>}

      <div style={{ display: 'flex', gap: '1rem', paddingTop: '.25rem' }}>
        <button className="btn-f btn-f-primary" onClick={save} disabled={saving}>
          {saving ? tMC('saving') : tMC('save')}
        </button>
        <a href="/mon-compte?tab=collections" className="btn-f btn-f-secondary">{tMC('cancel')}</a>
        <button className="btn-f btn-f-danger" onClick={deleteCollection} disabled={deleting} style={{ marginLeft: 'auto' }}>
          {deleting ? '…' : tMC('collection.deleteBtn')}
        </button>
      </div>
    </div>
  );
}
