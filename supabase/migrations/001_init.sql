-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────
create type category_type as enum (
  'data', 'devops', 'cloud', 'ia', 'cyber', 'dev'
);

create type realisation_type as enum (
  'pipeline', 'dashboard', 'api', 'bootcamp',
  'youtube', 'podcast', 'newsletter', 'blog', 'autre'
);

create type article_source as enum (
  'medium', 'linkedin', 'devto', 'substack', 'blog', 'youtube', 'autre'
);

create type evenement_type as enum (
  'conference', 'meetup', 'hackathon', 'webinaire', 'bootcamp'
);

create type submission_status as enum (
  'pending', 'approved', 'rejected'
);

-- ─────────────────────────────────────────
-- PRATICIENS
-- ─────────────────────────────────────────
create table praticiens (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  name          text not null,
  role          text not null,
  category      category_type not null,
  country       text not null,
  city          text,
  bio           text,
  photo_url     text,
  stack         text[] default '{}',
  badges        text[] default '{}',        -- ex: MENTOR, SPEAKER, OPEN SOURCE, CERTIFIÉ
  skills        jsonb default '[]',         -- [{ label: string, items: string[] }]
  linkedin_url  text,
  github_url    text,
  youtube_url   text,
  website_url   text,
  open_to_work  boolean default false,
  status        submission_status default 'pending',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─────────────────────────────────────────
-- ARTICLES
-- ─────────────────────────────────────────
create table articles (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  title           text not null,
  author          text not null,
  author_country  text,
  praticien_id    uuid references praticiens(id) on delete set null,
  category        category_type not null,
  source          article_source not null,
  external_url    text not null,
  excerpt         text,
  date_published  date,
  status          submission_status default 'pending',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- REALISATIONS
-- ─────────────────────────────────────────
create table realisations (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  title           text not null,
  praticien_id    uuid references praticiens(id) on delete cascade,
  category        category_type not null,
  type            realisation_type not null,
  stack           text[] default '{}',
  excerpt         text,
  demo_url        text,
  repo_url        text,
  date_published  date,
  status          submission_status default 'pending',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- EVENEMENTS
-- ─────────────────────────────────────────
create table evenements (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  title       text not null,
  type        evenement_type not null,
  lieu        text,
  pays        text,
  online      boolean default false,
  url         text,
  excerpt     text,
  date_debut  date not null,
  date_fin    date,
  gratuit     boolean default true,
  status      submission_status default 'approved',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- SOUMISSIONS (inbox admin)
-- ─────────────────────────────────────────
create table soumissions (
  id           uuid primary key default uuid_generate_v4(),
  type         text not null,   -- 'praticien' | 'article' | 'realisation'
  payload      jsonb not null,  -- contenu brut du formulaire
  status       submission_status default 'pending',
  note_admin   text,
  created_at   timestamptz default now(),
  reviewed_at  timestamptz
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index on praticiens(status);
create index on praticiens(category);
create index on praticiens(open_to_work);
create index on articles(status);
create index on articles(category);
create index on articles(praticien_id);
create index on realisations(status);
create index on realisations(category);
create index on realisations(type);
create index on realisations(praticien_id);
create index on evenements(date_debut);
create index on evenements(status);
create index on soumissions(status);

-- ─────────────────────────────────────────
-- UPDATED_AT AUTO-UPDATE
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger praticiens_updated_at
  before update on praticiens
  for each row execute function update_updated_at();

create trigger articles_updated_at
  before update on articles
  for each row execute function update_updated_at();

create trigger realisations_updated_at
  before update on realisations
  for each row execute function update_updated_at();

create trigger evenements_updated_at
  before update on evenements
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────
alter table praticiens   enable row level security;
alter table articles     enable row level security;
alter table realisations enable row level security;
alter table evenements   enable row level security;
alter table soumissions  enable row level security;

-- Lecture publique — uniquement les contenus approuvés
create policy "public read praticiens"
  on praticiens for select
  using (status = 'approved');

create policy "public read articles"
  on articles for select
  using (status = 'approved');

create policy "public read realisations"
  on realisations for select
  using (status = 'approved');

create policy "public read evenements"
  on evenements for select
  using (status = 'approved');

-- Insertion publique pour les soumissions (formulaire)
create policy "public insert soumissions"
  on soumissions for insert
  with check (true);

-- ─────────────────────────────────────────
-- SEED — données initiales
-- ─────────────────────────────────────────

-- Praticien : Diakité Mamadou Youssouf
insert into praticiens (
  slug, name, role, category, country, city,
  bio, stack, badges, skills,
  linkedin_url, github_url,
  open_to_work, status
) values (
  'diakite',
  'Diakité Mamadou Youssouf',
  'Expert & Architecte Data',
  'data',
  '🇨🇮',
  'Abidjan',
  'Fondateur de from0tohero.dev. 1100+ apprenants formés en Data Engineering dans 40+ pays.',
  array['Python','Airflow','dbt','Spark','GCP','Kafka'],
  array['MENTOR','SPEAKER','OPEN SOURCE'],
  '[
    {"label":"Langages & Frameworks","items":["Python","PySpark","Scala","Spark-Scala","R","RShiny","Julia","Bash","Spark ML","Spark Streaming","Pandas","NumPy","Scikit-learn","FastAPI"]},
    {"label":"Big Data & Streaming","items":["Apache Spark","Hadoop HDFS","Apache Kafka","Apache Airflow","Hive","Apache Flink","RabbitMQ"]},
    {"label":"IA & ML","items":["Machine Learning","Statistiques","Modélisation prédictive","Data Mining","Deep Learning","CNN","NLP","Generative AI","MLOps","Model Deployment"]},
    {"label":"Bases de Données","items":["PostgreSQL","MySQL","Oracle","TeraData","MariaDB","Elasticsearch","MongoDB","Neo4J","Couchbase","AWS S3","MinIO","Google BigQuery"]},
    {"label":"Cloud & DevOps","items":["AWS","Google Cloud Platform","Microsoft Azure","Docker","Kubernetes","Microsoft Fabric","Power BI","CI/CD","GitLab","GitHub","Git","Rundeck"]}
  ]'::jsonb,
  'https://www.linkedin.com/in/mamadou-youssouf-diakite-083630135',
  'https://github.com/diakite-data',
  false,
  'approved'
);

-- Réalisation : Data Engineering Bootcamp
insert into realisations (
  slug, title, praticien_id,
  category, type, stack,
  excerpt, demo_url, repo_url,
  date_published, status
) values (
  'data-engineering-bootcamp',
  'Data Engineering Bootcamp',
  (select id from praticiens where slug = 'diakite'),
  'data',
  'bootcamp',
  array['Python','Airflow','dbt','Spark','GCP','Kafka'],
  '35 modules · 1100+ apprenants · 40+ pays. Le bootcamp Data Engineering complet en français.',
  'https://diakite-data.github.io/data-engineering-bootcamp/',
  'https://github.com/diakite-data/data-engineering-bootcamp',
  '2023-01-01',
  'approved'
);

-- Articles seed
insert into articles (
  slug, title, author, author_country,
  praticien_id, category, source,
  external_url, excerpt, date_published, status
) values
(
  'construire-pipeline-kafka-spark',
  'Comment j''ai construit un pipeline temps réel avec Kafka et Spark',
  'Diakité Mamadou Youssouf', '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'data', 'linkedin',
  'https://www.linkedin.com/pulse/comment-jai-construit-un-pipeline-temps-r%C3%A9el-avec-kafka-diakite',
  'Retour d''expérience sur la mise en place d''un pipeline de traitement de données temps réel : ingestion Kafka, transformation Spark Streaming, et stockage BigQuery.',
  '2024-06-01', 'approved'
),
(
  'dbt-en-production-guide-pratique',
  'dbt en production : guide pratique pour les équipes Data africaines',
  'Diakité Mamadou Youssouf', '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'data', 'medium',
  'https://medium.com/@diakite-data/dbt-en-production',
  'Comment déployer et maintenir dbt en production avec des équipes distribuées : bonnes pratiques, CI/CD, tests et documentation automatique.',
  '2024-03-15', 'approved'
),
(
  'gcp-data-engineer-africain',
  'GCP pour le Data Engineer africain : par où commencer ?',
  'Diakité Mamadou Youssouf', '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'cloud', 'linkedin',
  'https://www.linkedin.com/pulse/gcp-pour-le-data-engineer-africain-diakite',
  'Tour d''horizon des services GCP les plus utiles pour un Data Engineer : BigQuery, Dataflow, Pub/Sub, Cloud Composer — avec des cas concrets.',
  '2024-01-20', 'approved'
),
(
  'apache-airflow-orchestration-data',
  'Apache Airflow : orchestrer ses pipelines data comme un pro',
  'Diakité Mamadou Youssouf', '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'data', 'youtube',
  'https://www.youtube.com/@from0tohero',
  'Vidéo complète sur Apache Airflow : installation, création de DAGs, gestion des dépendances, monitoring et déploiement en production.',
  '2023-11-10', 'approved'
),
(
  'mlops-deployer-modele-ml-production',
  'MLOps : comment déployer son modèle ML en production en 2024',
  'Diakité Mamadou Youssouf', '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'ia', 'medium',
  'https://medium.com/@diakite-data/mlops-production-2024',
  'Du notebook Jupyter à la production : packaging, containerisation Docker, déploiement sur GCP Cloud Run, monitoring et gestion du drift.',
  '2024-09-05', 'approved'
)
on conflict (slug) do nothing;

-- Événement : SIADE 2026
insert into evenements (
  slug, title, type,
  lieu, pays, online,
  url, excerpt,
  date_debut, date_fin,
  gratuit, status
) values (
  'siade-2026',
  'SIADE 2026',
  'conference',
  'Stade Félix Houphouët-Boigny, Abidjan',
  '🇨🇮',
  false,
  'https://siade.ci/',
  'Le plus grand rassemblement annuel dédié à l''IA, la défense et l''espace en Afrique de l''Ouest. +7000 visiteurs · 13 pays · 50+ sponsors.',
  '2026-04-13',
  '2026-04-14',
  false,
  'approved'
);
