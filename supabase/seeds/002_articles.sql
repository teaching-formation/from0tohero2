-- ─────────────────────────────────────────
-- SEED — Articles
-- À exécuter dans le dashboard Supabase (SQL Editor)
-- ─────────────────────────────────────────

insert into articles (
  slug, title, author, author_country,
  praticien_id, category, source,
  external_url, excerpt, date_published, status
) values

-- 1. Article Data Engineering
(
  'construire-pipeline-kafka-spark',
  'Comment j''ai construit un pipeline temps réel avec Kafka et Spark',
  'Diakité Mamadou Youssouf',
  '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'data',
  'linkedin',
  'https://www.linkedin.com/pulse/comment-jai-construit-un-pipeline-temps-r%C3%A9el-avec-kafka-diakite',
  'Retour d''expérience sur la mise en place d''un pipeline de traitement de données temps réel : ingestion Kafka, transformation Spark Streaming, et stockage BigQuery.',
  '2024-06-01',
  'approved'
),

-- 2. Article dbt en production
(
  'dbt-en-production-guide-pratique',
  'dbt en production : guide pratique pour les équipes Data africaines',
  'Diakité Mamadou Youssouf',
  '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'data',
  'medium',
  'https://medium.com/@diakite-data/dbt-en-production',
  'Comment déployer et maintenir dbt en production avec des équipes distribuées : bonnes pratiques, CI/CD, tests et documentation automatique.',
  '2024-03-15',
  'approved'
),

-- 3. Article GCP pour Data Engineers
(
  'gcp-data-engineer-africain',
  'GCP pour le Data Engineer africain : par où commencer ?',
  'Diakité Mamadou Youssouf',
  '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'cloud',
  'linkedin',
  'https://www.linkedin.com/pulse/gcp-pour-le-data-engineer-africain-diakite',
  'Tour d''horizon des services GCP les plus utiles pour un Data Engineer : BigQuery, Dataflow, Pub/Sub, Cloud Composer — avec des cas concrets.',
  '2024-01-20',
  'approved'
),

-- 4. Article Airflow
(
  'apache-airflow-orchestration-data',
  'Apache Airflow : orchestrer ses pipelines data comme un pro',
  'Diakité Mamadou Youssouf',
  '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'data',
  'youtube',
  'https://www.youtube.com/@from0tohero',
  'Vidéo complète sur Apache Airflow : installation, création de DAGs, gestion des dépendances, monitoring et déploiement en production.',
  '2023-11-10',
  'approved'
),

-- 5. Article MLOps
(
  'mlops-deployer-modele-ml-production',
  'MLOps : comment déployer son modèle ML en production en 2024',
  'Diakité Mamadou Youssouf',
  '🇨🇮',
  (select id from praticiens where slug = 'diakite'),
  'ia',
  'medium',
  'https://medium.com/@diakite-data/mlops-production-2024',
  'Du notebook Jupyter à la production : packaging, containerisation Docker, déploiement sur GCP Cloud Run, monitoring et gestion du drift.',
  '2024-09-05',
  'approved'
)

on conflict (slug) do nothing;
