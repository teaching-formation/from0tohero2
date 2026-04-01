-- Insère les bootcamps existants dans la table realisations

INSERT INTO realisations (slug, title, category, type, stack, excerpt, demo_url, repo_url, status)
VALUES
  (
    'data-engineering-bootcamp',
    'Data Engineering Bootcamp',
    'data',
    'bootcamp',
    ARRAY['Python','Airflow','dbt','Spark','GCP','Kafka'],
    '35 modules · 1 100+ apprenants · 40+ pays',
    'https://diakite-data.github.io/data-engineering-bootcamp/',
    NULL,
    'approved'
  ),
  (
    'data-analyst-bootcamp',
    'Data Analyst Bootcamp',
    'data',
    'bootcamp',
    ARRAY['SQL','Python','Power BI','Tableau','Stats'],
    'En construction',
    NULL,
    'https://da.from0tohero.dev',
    'approved'
  )
ON CONFLICT (slug) DO NOTHING;
