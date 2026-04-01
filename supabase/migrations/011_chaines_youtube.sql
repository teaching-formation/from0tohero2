-- ─────────────────────────────────────────
-- TABLE : chaines_youtube
-- ─────────────────────────────────────────
create table if not exists chaines_youtube (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  url         text not null,
  subs        text,
  ordre       integer default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- RLS
alter table chaines_youtube enable row level security;

-- Lecture publique (frontend)
create policy "chaines_youtube_public_read"
  on chaines_youtube for select
  using (true);

-- ─────────────────────────────────────────
-- SEED : données initiales
-- ─────────────────────────────────────────
insert into chaines_youtube (name, description, url, subs, ordre) values
  ('from0tohero',    'Data Engineering · Cloud · DevOps · pratique',           'https://www.youtube.com/@from0tohero',     '1 100+ apprenants', 1),
  ('Xavki',          'DevOps · Linux · Ansible · Docker · Kubernetes',          'https://www.youtube.com/@xavki',           '100k+ abonnés',     2),
  ('Grafikart',      'Dev Web · PHP · JavaScript · frameworks modernes',        'https://www.youtube.com/@grafikart',       '200k+ abonnés',     3),
  ('Cocadmin',       'Sysadmin · Linux · Réseau · Infra',                       'https://www.youtube.com/@cocadmin',        'FR · Sysadmin',     4),
  ('Cookie connecté','Cybersécurité · OSCP · pentest · CTF',                   'https://www.youtube.com/@cookieconnecte',  'FR · Cyber',        5);
