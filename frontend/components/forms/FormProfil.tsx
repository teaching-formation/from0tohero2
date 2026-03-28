'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['data','devops','cloud','ia','cyber','dev'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', dev:'Dev' };

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
    name: '', role: '', pays: '', ville: '', bio: '',
    category: '', linkedin_url: '', github_url: '', email: '',
  });
  const [skills, setSkills] = useState<SkillMap>({});
  const [customSkill, setCustomSkill] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
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
    if (!form.role.trim())         e.role         = 'Champ requis';
    if (!form.pays.trim())         e.pays         = 'Champ requis';
    if (!form.ville.trim())        e.ville        = 'Champ requis';
    if (!form.bio.trim())          e.bio          = 'Champ requis';
    if (!form.category)            e.category     = 'Sélectionne une catégorie';
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

      <Field label="Catégorie principale" required error={errors.category}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {CATEGORIES.map(c => (
            <button key={c} type="button"
              className={`filter-pill${form.category === c ? ' active' : ''}`}
              onClick={() => set('category', c)}>
              {CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Bio courte" required error={errors.bio}>
        <textarea className="f-input" placeholder="2-3 phrases sur ton parcours et ce que tu construis." value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      {/* COMPÉTENCES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
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
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '.6rem' }}>
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
                        fontFamily: "'Space Mono', monospace",
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
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '.6rem' }}>
              Autre (non listée)
            </p>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              {(skills.autre ?? []).map(s => (
                <button key={s} type="button" onClick={() => toggleSkill('autre', s)}
                  style={{ fontFamily: "'Space Mono', monospace", fontSize: '.68rem', padding: '4px 10px', borderRadius: 4, border: '1px solid var(--f-sky)', background: 'var(--f-sky-bg)', color: 'var(--f-sky)', cursor: 'pointer' }}>
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
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.skills}</span>
        )}
      </div>

      <Field label="LinkedIn" required error={errors.linkedin_url}>
        <input className="f-input" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="GitHub" error={errors.github_url}>
        <input className="f-input" type="url" placeholder="https://github.com/..." value={form.github_url} onChange={e => set('github_url', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Email de contact" required error={errors.email}>
        <input className="f-input" type="email" placeholder="ton@email.com" value={form.email} onChange={e => set('email', e.target.value)} style={{ maxWidth: '100%' }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>Utilisé uniquement pour te notifier du statut de ta soumission.</span>
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
      <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
        {label} {required && <span style={{ color: 'var(--f-orange)' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{error}</span>}
    </div>
  );
}
