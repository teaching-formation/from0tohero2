'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

function toSlug(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT' };

const SKILL_GROUPS = [
  {
    key: 'langages',
    label: 'Langages & Frameworks',
    skills: ['Python','JavaScript','TypeScript','Go','Java','Scala','Bash','R','SQL','PySpark','Pandas','FastAPI','Django','React','Node.js','Rust'],
  },
  {
    key: 'bigdata',
    label: 'Big Data & Streaming',
    skills: ['Apache Spark','Kafka','Airflow','dbt','Flink','Hive','Hadoop','NiFi','Databricks','Prefect','Luigi'],
  },
  {
    key: 'ia',
    label: 'IA & ML',
    skills: ['Machine Learning','Deep Learning','NLP','MLOps','Generative AI','TensorFlow','PyTorch','scikit-learn','LangChain','RAG','Hugging Face'],
  },
  {
    key: 'databases',
    label: 'Bases de données',
    skills: ['PostgreSQL','MySQL','MongoDB','Redis','BigQuery','Snowflake','Elasticsearch','MinIO','Cassandra','DynamoDB','ClickHouse'],
  },
  {
    key: 'cloud',
    label: 'Cloud & DevOps',
    skills: ['GCP','AWS','Azure','Docker','Kubernetes','Terraform','CI/CD','GitHub Actions','Ansible','Jenkins','Pulumi'],
  },
  {
    key: 'cyber',
    label: 'Cybersécurité',
    skills: ['Pentest','SIEM','SOC','CTF','OSCP','Forensics','WAF','Zero Trust','IAM','OWASP','Burp Suite'],
  },
  {
    key: 'dataviz',
    label: 'Data Viz & BI',
    skills: ['Power BI','Tableau','Looker','Looker Studio','Metabase','Grafana','Superset','Redash','Qlik','Excel','Plotly','Streamlit'],
  },
  {
    key: 'reseaux',
    label: 'Réseaux & Systèmes',
    skills: ['Linux','Windows Server','Nginx','Apache','TCP/IP','DNS','VPN','Pare-feu','VLAN','SSH','Bash','Zabbix','Nagios','Wireshark'],
  },
];

type SkillMap = Record<string, string[]>;
type Props = { onSuccess: () => void };

export default function FormProfil({ onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '', username: '', role: '', pays: '', ville: '', bio: '',
    categories: [] as string[], linkedin_url: '', github_url: '',
    twitter_url: '', youtube_url: '', website_url: '', whatsapp_url: '', email: '',
  });
  const [activeSocials, setActiveSocials] = useState<string[]>([]);
  const [skills, setSkills] = useState<SkillMap>({});
  const [customSkill, setCustomSkill] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  function set(key: string, val: string | string[]) {
    setForm(f => {
      const next = { ...f, [key]: val };
      // Auto-génère le username depuis le nom si l'user n'a pas encore modifié manuellement
      if (key === 'name' && typeof val === 'string') {
        next.username = toSlug(val);
      }
      return next;
    });
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    if (key === 'name' || key === 'username') {
      const slug = key === 'username' ? val as string : toSlug(val as string);
      checkUsernameAvailability(slug);
    }
  }

  function checkUsernameAvailability(slug: string) {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (!slug.trim()) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      const { data } = await supabase.rpc('is_slug_available', { p_slug: slug.trim() });
      setUsernameStatus(data === true ? 'available' : 'taken');
    }, 500);
  }

  function toggleSkill(groupKey: string, skill: string) {
    setSkills(prev => {
      const current = prev[groupKey] ?? [];
      const next = current.includes(skill)
        ? current.filter(s => s !== skill)
        : [...current, skill];
      return { ...prev, [groupKey]: next };
    });
    if (errors.skills) setErrors(e => ({ ...e, skills: '' }));
  }

  function addCustomSkill() {
    const s = customSkill.trim();
    if (!s) return;
    setSkills(prev => ({
      ...prev,
      autre: [...(prev.autre ?? []), s].filter((v, i, a) => a.indexOf(v) === i),
    }));
    setCustomSkill('');
  }

  function totalSkills() {
    return Object.values(skills).flat().length;
  }

  function buildSkillsPayload() {
    return SKILL_GROUPS
      .map(g => ({ category: g.label, items: skills[g.key] ?? [] }))
      .filter(g => g.items.length > 0)
      .concat(skills.autre?.length ? [{ category: 'Autre', items: skills.autre }] : []);
  }

  function buildStack() {
    return Object.values(skills).flat();
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())         e.name         = 'Champ requis';
    if (!form.username.trim())     e.username     = 'Champ requis';
    if (usernameStatus === 'taken') e.username    = 'Ce username est déjà utilisé';
    if (!form.role.trim())         e.role         = 'Champ requis';
    if (!form.pays.trim())         e.pays         = 'Champ requis';
    if (!form.ville.trim())        e.ville        = 'Champ requis';
    if (form.categories.length === 0) e.categories = 'Sélectionne au moins une catégorie';
    if (!form.linkedin_url.trim()) e.linkedin_url = 'Champ requis';
    if (!form.email.trim())        e.email        = 'Champ requis';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (totalSkills() === 0)       e.skills       = 'Sélectionne au moins une compétence';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await supabase.from('soumissions').insert({
      type: 'praticien',
      payload: {
        ...form,
        stack: buildStack(),
        skills: buildSkillsPayload(),
      },
    });
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'praticien', name: form.name, linkedinUrl: form.linkedin_url }),
    });
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <Field label="Nom complet" required error={errors.name}>
        <input className="f-input" placeholder="Ex: Mamadou Diakité" value={form.name} onChange={e => set('name', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Username" required error={errors.username}>
        <div style={{ position: 'relative', maxWidth: '100%' }}>
          <input
            className="f-input"
            placeholder="Ex: mamadou-diakite"
            value={form.username}
            onChange={e => set('username', toSlug(e.target.value))}
            style={{ maxWidth: '100%', paddingRight: '2.5rem',
              borderColor: usernameStatus === 'taken' ? '#f87171' : usernameStatus === 'available' ? 'var(--f-green)' : undefined }}
          />
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.8rem' }}>
            {usernameStatus === 'checking'  && <span style={{ color: 'var(--f-text-3)' }}>…</span>}
            {usernameStatus === 'available' && <span style={{ color: 'var(--f-green)' }}>✓</span>}
            {usernameStatus === 'taken'     && <span style={{ color: '#f87171' }}>✗</span>}
          </span>
        </div>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>
          from0tohero.dev/praticiens/{form.username || '...'}
        </span>
      </Field>

      <Field label="Rôle / titre" required error={errors.role}>
        <input className="f-input" placeholder="Ex: Data Engineer · GCP" value={form.role} onChange={e => set('role', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Pays" required error={errors.pays}>
          <input className="f-input" placeholder="Ex: Côte d'Ivoire" value={form.pays} onChange={e => set('pays', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
        <Field label="Ville" required error={errors.ville}>
          <input className="f-input" placeholder="Ex: Abidjan" value={form.ville} onChange={e => set('ville', e.target.value)} style={{ maxWidth: '100%' }} />
        </Field>
      </div>

      <Field label="Catégories" required error={errors.categories}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {CATEGORIES.map(c => (
            <button key={c} type="button"
              className={`filter-pill${form.categories.includes(c) ? ' active' : ''}`}
              onClick={() => {
                const next = form.categories.includes(c)
                  ? form.categories.filter(x => x !== c)
                  : [...form.categories, c];
                set('categories', next);
              }}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Bio courte" error={errors.bio}>
        <textarea className="f-input" placeholder="2-3 phrases sur ton parcours et ce que tu construis." value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      {/* COMPÉTENCES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
          Compétences techniques <span style={{ color: 'var(--f-orange)' }}>*</span>
          {totalSkills() > 0 && (
            <span style={{ marginLeft: '.75rem', color: 'var(--f-sky)', fontWeight: 400 }}>
              {totalSkills()} sélectionnée{totalSkills() > 1 ? 's' : ''}
            </span>
          )}
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--f-border)', borderRadius: 6, padding: '1.25rem' }}>
          {SKILL_GROUPS.map(group => (
            <div key={group.key}>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '.6rem' }}>
                {group.label}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                {group.skills.map(skill => {
                  const selected = (skills[group.key] ?? []).includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(group.key, skill)}
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: '.68rem',
                        padding: '4px 10px',
                        borderRadius: 4,
                        border: selected ? '1px solid var(--f-sky)' : '1px solid var(--f-border)',
                        background: selected ? 'var(--f-sky-bg)' : 'transparent',
                        color: selected ? 'var(--f-sky)' : 'var(--f-text-2)',
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Compétence custom */}
          <div>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '.6rem' }}>
              Autre (non listée)
            </p>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              {(skills.autre ?? []).map(s => (
                <button key={s} type="button" onClick={() => toggleSkill('autre', s)}
                  style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', padding: '4px 10px', borderRadius: 4, border: '1px solid var(--f-sky)', background: 'var(--f-sky-bg)', color: 'var(--f-sky)', cursor: 'pointer' }}>
                  {s} ×
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <input
                className="f-input"
                placeholder="Ex: dbt-core, Metabase, Airbyte…"
                value={customSkill}
                onChange={e => setCustomSkill(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                style={{ flex: 1, maxWidth: 280 }}
              />
              <button type="button" className="btn-f btn-f-secondary" onClick={addCustomSkill}
                style={{ fontSize: '.7rem', padding: '.45rem .9rem', flexShrink: 0 }}>
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {errors.skills && (
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.skills}</span>
        )}
      </div>

      <Field label="LinkedIn" required error={errors.linkedin_url}>
        <input className="f-input" type="text" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set('linkedin_url', 'https://' + v); }} style={{ maxWidth: '100%' }} />
      </Field>

      {/* Autres réseaux sociaux */}
      <div>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--f-text-3)', display: 'block', marginBottom: '.75rem' }}>
          Autres réseaux <span style={{ color: 'var(--f-text-3)', fontWeight: 400 }}>(optionnel)</span>
        </span>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {([
            { key: 'github_url',   label: 'GitHub',     placeholder: 'https://github.com/...',        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg> },
            { key: 'twitter_url',  label: 'Twitter / X', placeholder: 'https://x.com/...',             icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            { key: 'youtube_url',  label: 'YouTube',     placeholder: 'https://youtube.com/@...',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
            { key: 'website_url',  label: 'Portfolio',   placeholder: 'https://monsite.com',           icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
            { key: 'whatsapp_url',  label: 'WhatsApp',     placeholder: 'https://chat.whatsapp.com/...',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
          ] as { key: string; label: string; placeholder: string; icon: React.ReactNode }[]).map(({ key, label, placeholder, icon }) => {
            const isActive = activeSocials.includes(key);
            const hasValue = !!(form as any)[key];
            return (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => {
                  if (isActive && !hasValue) {
                    setActiveSocials(s => s.filter(k => k !== key));
                  } else {
                    setActiveSocials(s => isActive ? s : [...s, key]);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 9,
                  border: `1.5px solid ${isActive || hasValue ? 'var(--f-sky)' : 'var(--f-border)'}`,
                  background: isActive || hasValue ? 'var(--f-sky-bg)' : 'var(--f-surface)',
                  color: isActive || hasValue ? 'var(--f-sky)' : 'var(--f-text-3)',
                  cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
                }}
              >
                {icon}
              </button>
            );
          })}
        </div>

        {/* Inputs révélés dynamiquement */}
        {([
          { key: 'github_url',  label: 'GitHub',      placeholder: 'https://github.com/...' },
          { key: 'twitter_url', label: 'Twitter / X', placeholder: 'https://x.com/...' },
          { key: 'youtube_url', label: 'YouTube',     placeholder: 'https://youtube.com/@...' },
          { key: 'website_url', label: 'Portfolio',   placeholder: 'https://monsite.com' },
          { key: 'whatsapp_url', label: 'WhatsApp',  placeholder: 'https://chat.whatsapp.com/...' },
        ] as { key: string; label: string; placeholder: string }[])
          .filter(({ key }) => activeSocials.includes(key) || !!(form as any)[key])
          .map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: '.75rem' }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', display: 'block', marginBottom: '.35rem' }}>{label}</span>
              <input
                className="f-input"
                type="text"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => set(key, e.target.value)}
                onBlur={e => { const v = e.target.value.trim(); if (v && !v.startsWith('http')) set(key, 'https://' + v); }}
                style={{ maxWidth: '100%' }}
              />
            </div>
          ))
        }
      </div>

      <Field label="Email de contact" required error={errors.email}>
        <input className="f-input" type="email" placeholder="ton@email.com" value={form.email} onChange={e => set('email', e.target.value)} style={{ maxWidth: '100%' }} />
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>Utilisé uniquement pour te notifier du statut de ta soumission.</span>
      </Field>

      <button type="submit" className="btn-f btn-f-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
        {loading ? 'Envoi…' : 'Soumettre mon profil →'}
      </button>
    </form>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
        {label} {required && <span style={{ color: 'var(--f-orange)' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{error}</span>}
    </div>
  );
}
