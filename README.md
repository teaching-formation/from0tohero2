# from0tohero.dev

Annuaire de praticiens data & IA — profils, réalisations, articles et événements soumis par la communauté.

## Structure

```
from0tohero-v2/
├── frontend/          # Site public (Next.js App Router)
├── admin/             # Panneau d'administration (Next.js Pages Router)
├── supabase/          # Migrations et configuration Supabase
└── docker-compose.yml # Environnement de développement local
```

## Stack

- **Frontend / Admin** — Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Base de données** — Supabase (PostgreSQL)
- **Emails** — Resend
- **Déploiement** — Vercel

## URLs de production

| App | URL |
|-----|-----|
| Frontend | https://from0tohero-frontend.vercel.app |
| Admin | https://from0tohero-admin.vercel.app |

## Développement local

### Prérequis

- Docker & Docker Compose
- Node.js 20+

### Lancer le projet

```bash
docker compose up
```

- **Frontend** → http://localhost:3000
- **Admin** → http://localhost:3001

### Variables d'environnement

#### `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PASSWORD=
RESEND_API_KEY=
```

#### `admin/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
ADMIN_PASSWORD=
RESEND_API_KEY=
```

## Pages frontend

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/praticiens` | Annuaire des praticiens |
| `/praticiens/[slug]` | Profil d'un praticien |
| `/realisations` | Liste des réalisations |
| `/articles` | Liste des articles |
| `/evenements` | Liste des événements |
| `/soumettre` | Formulaire de soumission |

## Panneau admin

Accessible sur `/` après login avec le mot de passe admin.

| Page | Description |
|------|-------------|
| `/soumissions` | Gérer les soumissions en attente |
| `/praticiens` | Gérer les profils publiés |
| `/realisations` | Gérer les réalisations publiées |
| `/articles` | Gérer les articles publiés |
| `/evenements` | Gérer les événements publiés |

## Déploiement

Les deux apps sont déployées séparément sur Vercel :

```bash
# Frontend
cd frontend && vercel --prod

# Admin
cd admin && vercel --prod
```
