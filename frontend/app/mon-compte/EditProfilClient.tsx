'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CropModal from '@/components/CropModal';
import { useTranslations } from 'next-intl';

const PAYS_AFRIQUE = [
  'Afrique du Sud','Algérie','Angola','Bénin','Botswana','Burkina Faso','Burundi',
  'Cabo Verde','Cameroun','Comores','Congo (Brazzaville)','Congo (RDC)',
  "Côte d'Ivoire",'Djibouti','Égypte','Érythrée','Eswatini','Éthiopie',
  'Gabon','Gambie','Ghana','Guinée','Guinée-Bissau','Guinée équatoriale',
  'Kenya','Lesotho','Liberia','Libye','Madagascar','Malawi','Mali','Maroc',
  'Maurice','Mauritanie','Mozambique','Namibie','Niger','Nigeria','Ouganda',
  'Rwanda','São Tomé-et-Príncipe','Sénégal','Seychelles','Sierra Leone',
  'Somalie','Soudan','Soudan du Sud','Tanzanie','Tchad','Togo','Tunisie',
  'Zambie','Zimbabwe',
  '─── Diaspora ───',
  'France','Belgique','Canada','États-Unis','Royaume-Uni','Suisse','Allemagne',
  'Italie','Espagne','Portugal','Pays-Bas','Suède','Norvège','Autre',
];

const CATEGORIES = ['data','devops','cloud','ia','cyber','frontend','backend','fullstack','mobile','web3','embedded','autre'];
const CAT_LABELS: Record<string,string> = { data:'Data', devops:'DevOps', cloud:'Cloud', ia:'IA', cyber:'Cyber-Sécurité', frontend:'Frontend', backend:'Backend', fullstack:'Full-Stack', mobile:'Mobile', web3:'Web3', embedded:'Embedded / IoT', autre:'Autre' };

const BADGES = [
  { value: 'MENTOR',      label: 'Mentor',      desc: 'Tu accompagnes d\'autres praticiens',     color: 'var(--f-orange)', border: 'rgba(249,115,22,.35)', bg: 'rgba(249,115,22,.08)' },
  { value: 'SPEAKER',     label: 'Speaker',     desc: 'Tu parles en conférences ou meetups',     color: '#a78bfa',          border: 'rgba(167,139,250,.35)', bg: 'rgba(167,139,250,.08)' },
  { value: 'OPEN SOURCE', label: 'Open Source', desc: 'Tu contribues à des projets open source', color: 'var(--f-green)',   border: 'rgba(52,211,153,.35)',  bg: 'rgba(52,211,153,.08)' },
  { value: 'CERTIFIÉ',    label: 'Certifié',    desc: 'Tu détiens des certifications reconnues',  color: 'var(--f-sky)',     border: 'rgba(56,189,248,.35)',  bg: 'rgba(56,189,248,.08)' },
];

const SKILL_GROUPS = [
  { key: 'langages_data',    label: 'Langages & Data',        categories: ['data','ia'],                                           skills: ['Python','R','SQL','Scala','Java','Bash','PySpark','Pandas','NumPy','Julia','MATLAB','SAS','SPSS','Groovy','Haskell','Clojure','Erlang'] },
  { key: 'bigdata',          label: 'Big Data & Streaming',   categories: ['data','ia','devops'],                                   skills: ['Apache Spark','Kafka','Airflow','dbt','Flink','Hive','Hadoop','NiFi','Databricks','Prefect','Luigi','Delta Lake'] },
  { key: 'ia',               label: 'IA & ML',                categories: ['ia','data'],                                           skills: ['Machine Learning','Deep Learning','NLP','MLOps','Generative AI','TensorFlow','PyTorch','scikit-learn','LangChain','RAG','Hugging Face','Computer Vision','Stable Diffusion'] },
  { key: 'dataviz',          label: 'Data Viz & BI',          categories: ['data','ia'],                                           skills: ['Power BI','Tableau','Looker','Looker Studio','Metabase','Grafana','Superset','Redash','Qlik','Plotly','Streamlit'] },
  { key: 'databases',        label: 'Bases de données',       categories: ['data','backend','fullstack','ia','cloud'],              skills: ['PostgreSQL','MySQL','MongoDB','Redis','BigQuery','Snowflake','Elasticsearch','MinIO','Cassandra','DynamoDB','ClickHouse','Supabase','PlanetScale'] },
  { key: 'cloud_devops',     label: 'Cloud & DevOps',         categories: ['cloud','devops','data','backend','fullstack'],          skills: ['GCP','AWS','Azure','Docker','Kubernetes','Terraform','CI/CD','GitHub Actions','Ansible','Jenkins','Pulumi','ArgoCD','Helm','Prometheus'] },
  { key: 'reseaux',          label: 'Réseaux & Systèmes',     categories: ['devops','cloud','cyber','embedded'],                    skills: ['Linux','Windows Server','Nginx','Apache','TCP/IP','DNS','VPN','Pare-feu','VLAN','SSH','Zabbix','Nagios','Wireshark'] },
  { key: 'cyber',            label: 'Cybersécurité',          categories: ['cyber'],                                               skills: ['Pentest','SIEM','SOC','CTF','OSCP','Forensics','WAF','Zero Trust','IAM','OWASP','Burp Suite','Metasploit','Nmap','Splunk','CrowdStrike'] },
  { key: 'frontend_skills',  label: 'Frontend',               categories: ['frontend','fullstack'],                                 skills: ['React','Vue.js','Angular','Next.js','Svelte','Nuxt.js','HTML/CSS','Tailwind CSS','SASS/SCSS','Redux','Zustand','GraphQL','Vite','Webpack','Storybook','Three.js','Figma'] },
  { key: 'backend_skills',   label: 'Backend',                categories: ['backend','fullstack'],                                  skills: ['Node.js','Express','NestJS','FastAPI','Django','Spring Boot','Laravel','Go (Gin)','Ruby on Rails','gRPC','REST API','GraphQL','Celery','RabbitMQ','JWT','tRPC'] },
  { key: 'mobile_skills',    label: 'Mobile',                 categories: ['mobile'],                                              skills: ['React Native','Flutter','Swift','Kotlin','Expo','Firebase','Jetpack Compose','SwiftUI','Android Studio','Xcode','Push Notifications','SQLite','RevenueCat'] },
  { key: 'web3_skills',      label: 'Web3 & Blockchain',      categories: ['web3'],                                                skills: ['Solidity','Ethereum','Hardhat','Truffle','Web3.js','Ethers.js','IPFS','Smart Contracts','Polygon','Chainlink','Foundry','OpenZeppelin','DeFi','NFT','Wagmi'] },
  { key: 'embedded_skills',  label: 'Embedded & IoT',         categories: ['embedded'],                                            skills: ['C','C++','Arduino','Raspberry Pi','MQTT','FreeRTOS','STM32','ESP32','Modbus','CAN Bus','FPGA','Zephyr OS','LoRa','Bluetooth/BLE','RTOS'] },
  { key: 'langages_web',     label: 'Langages',               categories: ['frontend','backend','fullstack','mobile','web3'],       skills: ['JavaScript','TypeScript','Python','Go','Java','Rust','C#','PHP','Ruby','Dart','Swift','Kotlin','Elixir','Lua','Groovy','Zig','OCaml','Clojure','Erlang','PowerShell','Bash'] },
  { key: 'langages_systems', label: 'Langages Systèmes',      categories: ['embedded','devops','cloud','cyber'],                    skills: ['C','C++','Rust','Assembly','Zig','Ada','VHDL','Verilog','Python','Bash','PowerShell','Go','Java','Groovy'] },
];

const ALL_GROUP_SKILLS = new Set(SKILL_GROUPS.flatMap(g => g.skills));

const SOCIALS = [
  { key: 'linkedin_url', label: 'LinkedIn',    placeholder: 'https://linkedin.com/in/...',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { key: 'github_url',   label: 'GitHub',      placeholder: 'https://github.com/...',        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg> },
  { key: 'twitter_url',  label: 'Twitter / X', placeholder: 'Ex : johndoe',                  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { key: 'youtube_url',  label: 'YouTube',     placeholder: 'https://youtube.com/@...',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { key: 'website_url',  label: 'Portfolio',   placeholder: 'https://monsite.com',           icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
  { key: 'whatsapp_url', label: 'WhatsApp',    placeholder: 'Ex : 2250700000000', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
];

type Props = { praticien: Record<string, unknown> };

export default function EditProfilClient({ praticien: p }: Props) {
  const router = useRouter();
  const t = useTranslations('forms');

  const initStack   = Array.isArray(p.stack)      ? (p.stack      as string[]) : [];
  const initCats    = Array.isArray(p.categories) ? (p.categories as string[]) : p.category ? [String(p.category)] : [];
  const initBadges  = Array.isArray(p.badges)     ? (p.badges     as string[]) : [];

  const [form, setForm] = useState({
    name:         String(p.name        || ''),
    role:         String(p.role        || ''),
    pays:         String(p.country     || ''),
    ville:        String(p.city        || ''),
    bio:          String(p.bio         || ''),
    categories:   initCats,
    linkedin_url: String(p.linkedin_url || ''),
    github_url:   String(p.github_url   || ''),
    twitter_url:  String(p.twitter_url  || ''),
    youtube_url:  String(p.youtube_url  || ''),
    website_url:  String(p.website_url  || ''),
    whatsapp_url: String(p.whatsapp_url || ''),
  });
  const [selectedBadges,  setSelectedBadges]  = useState<string[]>(initBadges);
  const [certifications,  setCertifications]  = useState(String(p.certifications || ''));
  const [categoryAutre,   setCategoryAutre]   = useState(String(p.category_label || ''));
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initStack);
  const [customSkill,    setCustomSkill]    = useState('');
  const [activeSocials,  setActiveSocials]  = useState<string[]>(
    SOCIALS.filter(s => !!(p as Record<string, unknown>)[s.key]).map(s => s.key)
  );
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Photo de profil ──
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(String(p.photo_url || '') || null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoError,   setPhotoError]   = useState('');
  const [cropSrc,      setCropSrc]      = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setPhotoError('Max 10 Mo.'); return; }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      setPhotoError('Format : JPG, PNG ou WebP.'); return;
    }
    setPhotoError('');
    // Ouvre la modale de recadrage
    const src = URL.createObjectURL(file);
    setCropSrc(src);
    // Reset l'input pour permettre de resélectionner le même fichier
    e.target.value = '';
  }

  function handleCropDone(blob: Blob) {
    if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    setPhotoFile(croppedFile);
    setPhotoPreview(URL.createObjectURL(croppedFile));
    setPhotoRemoved(false);
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function set(key: string, val: string | string[]) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  function toggleSkill(skill: string) {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  }

  function addCustomSkill() {
    const s = customSkill.trim();
    if (!s || selectedSkills.includes(s)) return;
    setSelectedSkills(prev => [...prev, s]);
    setCustomSkill('');
  }

  function buildSkillsPayload() {
    const payload = SKILL_GROUPS
      .map(g => ({ category: g.label, items: g.skills.filter(s => selectedSkills.includes(s)) }))
      .filter(g => g.items.length > 0);
    const custom = selectedSkills.filter(s => !ALL_GROUP_SKILLS.has(s));
    if (custom.length) payload.push({ category: 'Autre', items: custom });
    return payload;
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = t('fieldRequired');
    if (!form.role.trim())  e.role  = t('fieldRequired');
    if (!form.pays.trim())  e.pays  = t('profil.selectPaysError');
    if (form.categories.length === 0) e.categories = t('profil.selectCategoryError');
    if (selectedSkills.length === 0)  e.skills     = t('profil.selectSkillError');
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    // ── Upload photo si un nouveau fichier a été choisi ──
    // photoRemoved=true → suppression explicite → null
    // photoFile présent → nouvel upload (géré ci-dessous)
    // sinon → conserver l'URL existante
    let finalPhotoUrl: string | null = photoRemoved
      ? null
      : (photoPreview && !photoPreview.startsWith('blob:') ? photoPreview : (p.photo_url ? String(p.photo_url) : null));
    if (photoFile) {
      const fd = new FormData();
      fd.append('file', photoFile);
      fd.append('username', String(p.slug || p.id || Date.now()));
      const upRes = await fetch('/api/upload-avatar', { method: 'POST', body: fd });
      if (!upRes.ok) {
        const { error } = await upRes.json().catch(() => ({ error: 'Erreur upload' }));
        setPhotoError(error || "Erreur lors de l'upload.");
        setLoading(false);
        return;
      }
      const { url } = await upRes.json();
      finalPhotoUrl = url;
    }

    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        badges:         selectedBadges,
        certifications: certifications || null,
        stack:          selectedSkills,
        skills:         buildSkillsPayload(),
        category_label: form.categories.includes('autre') ? (categoryAutre || null) : null,
        photo_url:      finalPhotoUrl,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: t('serverError') }));
      setErrors(e => ({ ...e, name: error || t('serverError') }));
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/mon-compte'), 1200);
  }

  if (success) {
    return (
      <div style={{ border: '1px solid var(--f-border)', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.8rem', color: 'var(--f-green)', margin: 0 }}>
          ✓ Profil mis à jour — redirection…
        </p>
      </div>
    );
  }

  const initials = form.name.trim()
    ? form.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
    {cropSrc && (
      <CropModal
        imageSrc={cropSrc}
        onCrop={handleCropDone}
        onCancel={handleCropCancel}
      />
    )}
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Photo de profil ── */}
      <div>
        <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.7rem', color: 'var(--f-text-2)', margin: '0 0 .85rem 0', letterSpacing: '.04em' }}>
          Photo de profil <span style={{ color: 'var(--f-text-3)' }}>(optionnel)</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            title="Choisir une photo"
            style={{
              width: 72, height: 72, borderRadius: 14, flexShrink: 0,
              background: photoPreview ? 'transparent' : 'var(--f-sky-bg)',
              border: photoPreview ? '2px solid var(--f-sky)' : '2px dashed var(--f-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', overflow: 'hidden',
              transition: 'border-color .2s, box-shadow .2s',
              position: 'relative',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--f-sky)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--f-sky-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = photoPreview ? 'var(--f-sky)' : 'var(--f-border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--f-sky)', userSelect: 'none' }}>
                {initials}
              </span>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.45rem' }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-f btn-f-secondary" style={{ fontSize: '.68rem', padding: '.4rem .9rem' }}>
                {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
              </button>
              {photoPreview && (
                <button type="button"
                  onClick={() => { setPhotoFile(null); if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview); setPhotoPreview(null); setPhotoRemoved(true); setPhotoError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--f-text-3)', fontSize: '.68rem', cursor: 'pointer', fontFamily: "'Geist Mono', monospace" }}>
                  Retirer
                </button>
              )}
            </div>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.6rem', color: 'var(--f-text-3)', margin: 0 }}>
              JPG · PNG · WebP &nbsp;·&nbsp; max 10 Mo
            </p>
            {photoError && <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.63rem', color: '#f87171', margin: '.3rem 0 0' }}>{photoError}</p>}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange} />
      </div>

      <Field label="Nom complet" required error={errors.name}>
        <input className="f-input" value={form.name} onChange={e => set('name', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Rôle / titre" required error={errors.role}>
        <input className="f-input" placeholder="Ex: Data Engineer · GCP" value={form.role} onChange={e => set('role', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

      <Field label="Pays" required error={errors.pays}>
        <select
          className="f-input"
          value={form.pays}
          onChange={e => set('pays', e.target.value)}
          style={{ maxWidth: '100%', cursor: 'pointer' }}
        >
          <option value="">— Sélectionne ton pays —</option>
          {PAYS_AFRIQUE.map(p => (
            p.startsWith('─')
              ? <option key={p} disabled style={{ color: 'var(--f-text-3)', fontStyle: 'italic' }}>{p}</option>
              : <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>

      <Field label="Ville">
        <input className="f-input" placeholder="Ex: Abidjan, Paris…" value={form.ville} onChange={e => set('ville', e.target.value)} style={{ maxWidth: '100%' }} />
      </Field>

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
        {form.categories.includes('autre') && (
          <input
            className="f-input"
            placeholder="Précise ta catégorie (ex: QA, Product, FinTech…)"
            value={categoryAutre}
            onChange={e => setCategoryAutre(e.target.value)}
            style={{ maxWidth: '100%', marginTop: '.5rem' }}
          />
        )}
      </Field>

      {/* Badges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
          Badges <span style={{ color: 'var(--f-text-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.6rem' }}>
          {BADGES.map(b => {
            const active = selectedBadges.includes(b.value);
            return (
              <button key={b.value} type="button"
                onClick={() => setSelectedBadges(prev => active ? prev.filter(x => x !== b.value) : [...prev, b.value])}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '.2rem',
                  padding: '.75rem 1rem', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  border: `1.5px solid ${active ? b.border : 'var(--f-border)'}`,
                  background: active ? b.bg : 'var(--f-surface)',
                  transition: 'all .15s',
                }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', fontWeight: 600, letterSpacing: '.06em', color: active ? b.color : 'var(--f-text-2)' }}>
                  {active ? '✓ ' : ''}{b.label.toUpperCase()}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '.72rem', color: 'var(--f-text-3)', lineHeight: 1.4 }}>{b.desc}</span>
              </button>
            );
          })}
        </div>
        {selectedBadges.includes('CERTIFIÉ') && (
          <div style={{ marginTop: '.75rem' }}>
            <input
              className="f-input"
              type="text"
              placeholder="Tes certifications, séparées par des virgules (ex: AWS SAA, CKA, OSCP)"
              value={certifications}
              onChange={e => setCertifications(e.target.value)}
              style={{ maxWidth: '100%' }}
            />
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)', marginTop: '.35rem' }}>
              Ex: AWS Solutions Architect, Google Data Engineer, CKA
            </p>
          </div>
        )}
      </div>

      <Field label="Bio courte" error={errors.bio}>
        <textarea className="f-input" placeholder="2-3 phrases sur ton parcours." value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} style={{ maxWidth: '100%', resize: 'vertical' }} />
      </Field>

      {/* Compétences */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <label style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-2)' }}>
          Compétences techniques <span style={{ color: 'var(--f-orange)' }}>*</span>
          {selectedSkills.length > 0 && (
            <span style={{ marginLeft: '.75rem', color: 'var(--f-sky)', fontWeight: 400 }}>
              {selectedSkills.length} sélectionnée{selectedSkills.length > 1 ? 's' : ''}
            </span>
          )}
        </label>

        {form.categories.length === 0 ? (
          <div style={{ border: '1.5px dashed var(--f-border)', borderRadius: 8, padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.72rem', color: 'var(--f-text-3)', margin: 0 }}>
              ↑ Sélectionne d&apos;abord une ou plusieurs catégories
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--f-border)', borderRadius: 8, padding: '1.25rem' }}>
            {(() => {
              const alreadyShown = new Set<string>();
              return SKILL_GROUPS
                .filter(group => group.categories.some(c => form.categories.includes(c)))
                .map(group => {
                  const uniqueSkills = group.skills.filter(s => !alreadyShown.has(s));
                  uniqueSkills.forEach(s => alreadyShown.add(s));
                  if (uniqueSkills.length === 0) return null;
                  return (
                    <div key={group.key}>
                      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '.6rem' }}>
                        {group.label}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                        {uniqueSkills.map(skill => {
                          const sel = selectedSkills.includes(skill);
                          return (
                            <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                              style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', padding: '4px 10px', borderRadius: 4, border: sel ? '1px solid var(--f-sky)' : '1px solid var(--f-border)', background: sel ? 'var(--f-sky-bg)' : 'transparent', color: sel ? 'var(--f-sky)' : 'var(--f-text-2)', cursor: 'pointer', transition: 'all .15s' }}>
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
            })()}
            {/* Custom */}
            <div>
              <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--f-text-3)', marginBottom: '.6rem' }}>Autre (non listée)</p>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
                {selectedSkills.filter(s => !ALL_GROUP_SKILLS.has(s)).map(s => (
                  <button key={s} type="button" onClick={() => toggleSkill(s)}
                    style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', padding: '4px 10px', borderRadius: 4, border: '1px solid var(--f-sky)', background: 'var(--f-sky-bg)', color: 'var(--f-sky)', cursor: 'pointer' }}>
                    {s} ×
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input className="f-input" placeholder="Ex: dbt-core, Airbyte…" value={customSkill} onChange={e => setCustomSkill(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }} style={{ flex: 1, maxWidth: 280 }} />
                <button type="button" className="btn-f btn-f-secondary" onClick={addCustomSkill} style={{ fontSize: '.7rem', padding: '.45rem .9rem', flexShrink: 0 }}>Ajouter</button>
              </div>
            </div>
          </div>
        )}
        {errors.skills && <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.65rem', color: '#f87171' }}>{errors.skills}</span>}
      </div>

      {/* Réseaux sociaux */}
      <div>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.68rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--f-text-3)', display: 'block', marginBottom: '.75rem' }}>
          Réseaux sociaux <span style={{ fontWeight: 400 }}>(optionnel)</span>
        </span>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {SOCIALS.map(({ key, label, icon }) => {
            const isActive = activeSocials.includes(key);
            const hasValue = !!(form as unknown as Record<string, string>)[key];
            return (
              <button key={key} type="button" title={label}
                onClick={() => {
                  if (isActive && !hasValue) setActiveSocials(s => s.filter(k => k !== key));
                  else setActiveSocials(s => isActive ? s : [...s, key]);
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 9, border: `1.5px solid ${isActive || hasValue ? 'var(--f-sky)' : 'var(--f-border)'}`, background: isActive || hasValue ? 'var(--f-sky-bg)' : 'var(--f-surface)', color: isActive || hasValue ? 'var(--f-sky)' : 'var(--f-text-3)', cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}>
                {icon}
              </button>
            );
          })}
        </div>
        {SOCIALS
          .filter(({ key }) => activeSocials.includes(key) || !!(form as unknown as Record<string, string>)[key])
          .map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: '.75rem' }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--f-text-3)', display: 'block', marginBottom: '.35rem' }}>{label}</span>
              <input className="f-input" type="text" placeholder={placeholder}
                value={(form as unknown as Record<string, string>)[key]}
                onChange={e => set(key, e.target.value)}
                onBlur={e => {
                  const v = e.target.value.trim();
                  if (!v) return;
                  if (key === 'whatsapp_url') {
                    set(key, v.replace(/\D/g, ''));
                  } else if (key === 'twitter_url') {
                    const username = v
                      .replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, '')
                      .replace(/^@/, '')
                      .split('?')[0].split('/')[0].trim();
                    if (username) set(key, 'https://x.com/' + username);
                  } else if (!v.startsWith('http')) {
                    set(key, 'https://' + v);
                  }
                }}
                style={{ maxWidth: '100%' }}
              />
              {key === 'whatsapp_url' && (
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>
                  Indicatif pays + numéro, sans le + (ex : 2250700000000)
                </span>
              )}
              {key === 'twitter_url' && (
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '.62rem', color: 'var(--f-text-3)' }}>
                  Ton pseudo X, sans @
                </span>
              )}
            </div>
          ))
        }
      </div>

      <div style={{ display: 'flex', gap: '1rem', paddingTop: '.5rem' }}>
        <button type="submit" className="btn-f btn-f-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer les modifications →'}
        </button>
        <a href="/mon-compte" className="btn-f btn-f-secondary">Annuler</a>
      </div>
    </form>
    </>
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
