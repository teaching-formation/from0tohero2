// ─────────────────────────────────────────────────────────────
//  Constantes partagées — from0tohero.dev
//  Source unique de vérité pour toute l'application.
//  À importer partout, ne jamais redéfinir localement.
// ─────────────────────────────────────────────────────────────

// ── Catégories ───────────────────────────────────────────────

export const CAT_COLOR: Record<string, string> = {
  data:      'var(--f-sky)',
  devops:    '#a78bfa',
  cloud:     'var(--f-sky)',
  ia:        'var(--f-orange)',
  cyber:     '#f87171',
  frontend:  'var(--f-green)',
  backend:   '#a78bfa',
  fullstack: 'var(--f-orange)',
  mobile:    'var(--f-green)',
  web3:      '#a78bfa',
  embedded:  'var(--f-sky)',
  mlops:     '#fb923c',
  dev:       '#f472b6',
  autre:     'var(--f-text-3)',
};

export const CAT_LABEL: Record<string, string> = {
  data:      'Data',
  devops:    'DevOps',
  cloud:     'Cloud',
  ia:        'IA',
  cyber:     'Cybersécurité',
  frontend:  'Frontend',
  backend:   'Backend',
  fullstack: 'Full-Stack',
  mobile:    'Mobile',
  web3:      'Web3',
  embedded:  'Embedded / IoT',
  mlops:     'MLOps',
  dev:       'Dev',
  autre:     'Autre',
};

// ── Types de réalisation ─────────────────────────────────────

export const REAL_TYPE_LABELS: Record<string, string> = {
  pipeline:   'Pipeline',
  dashboard:  'Dashboard',
  api:        'API',
  bootcamp:   'Bootcamp',
  youtube:    'YouTube',
  app:        'App',
  cours:      'Cours',
  podcast:    'Podcast',
  newsletter: 'Newsletter',
  blog:       'Blog',
  autre:      'Autre',
};

export const REAL_TYPE_ICONS: Record<string, string> = {
  pipeline:   '⬡',
  dashboard:  '◧',
  api:        '◈',
  bootcamp:   '◎',
  youtube:    '▷',
  app:        '⬟',
  cours:      '◉',
  podcast:    '◌',
  newsletter: '◫',
  blog:       '◪',
  autre:      '◦',
};

// ── Sources d'article ─────────────────────────────────────────

export const SOURCE_ICON: Record<string, string> = {
  medium:   'M',
  linkedin: 'in',
  devto:    'DEV',
  hashnode: 'H',
  substack: '◎',
  youtube:  '▷',
  blog:     '◧',
  autre:    '◦',
};

// ── Types de tip ──────────────────────────────────────────────

export const TIP_TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  tip:     { label: 'Tip',     color: 'var(--f-orange)', bg: 'rgba(251,146,60,.12)',  icon: '💡' },
  TIL:     { label: 'TIL',     color: 'var(--f-sky)',    bg: 'rgba(56,189,248,.12)',  icon: '🧠' },
  snippet: { label: 'Snippet', color: 'var(--f-green)',  bg: 'rgba(52,211,153,.12)',  icon: '</>' },
};

// ── Types d'événement ─────────────────────────────────────────

export const EVENT_TYPE_LABELS: Record<string, string> = {
  conference: 'Conférence',
  meetup:     'Meetup',
  hackathon:  'Hackathon',
  webinaire:  'Webinaire',
  bootcamp:   'Bootcamp',
  atelier:    'Atelier',
  autre:      'Autre',
};

export const EVENT_TYPE_COLOR: Record<string, string> = {
  conference: '#60a5fa',
  meetup:     'var(--f-green)',
  hackathon:  '#f87171',
  webinaire:  '#a78bfa',
  bootcamp:   'var(--f-sky)',
  atelier:    '#fb923c',
  autre:      'var(--f-text-3)',
};

export const EVENT_TYPE_ICON: Record<string, string> = {
  conference: '◎',
  meetup:     '◉',
  hackathon:  '⚡',
  webinaire:  '◈',
  bootcamp:   '⬡',
  atelier:    '◧',
  autre:      '◦',
};
