import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon)

// ── Types (alignés sur le schéma SQL) ───────────────────────

export type Praticien = {
  id: string
  slug: string
  name: string
  role: string
  category: 'data' | 'devops' | 'cloud' | 'ia' | 'cyber' | 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'web3' | 'embedded'
  categories: string[]
  country: string
  city?: string
  bio?: string
  photo_url?: string
  stack: string[]
  badges: string[]
  certifications?: string
  skills: { label: string; items: string[] }[]
  linkedin_url?: string
  github_url?: string
  youtube_url?: string
  website_url?: string
  twitter_url?: string
  whatsapp_url?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export type Realisation = {
  id: string
  slug: string
  title: string
  praticien_id: string
  category: 'data' | 'devops' | 'cloud' | 'ia' | 'cyber' | 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'web3' | 'embedded'
  type: 'pipeline' | 'dashboard' | 'api' | 'app' | 'bootcamp' | 'youtube' | 'podcast' | 'newsletter' | 'blog' | 'autre'
  type_label?: string
  stack: string[]
  excerpt?: string
  demo_url?: string
  repo_url?: string
  date_published?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export type Evenement = {
  id: string
  slug: string
  title: string
  type: 'conference' | 'meetup' | 'hackathon' | 'webinaire' | 'bootcamp' | 'autre'
  type_label?: string
  lieu?: string
  pays?: string
  online: boolean
  url?: string
  excerpt?: string
  date_debut: string
  date_fin?: string
  gratuit: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export type Article = {
  id: string
  slug: string
  title: string
  author: string
  author_country?: string
  praticien_id?: string
  category: 'data' | 'devops' | 'cloud' | 'ia' | 'cyber' | 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'web3' | 'embedded'
  source: 'medium' | 'linkedin' | 'devto' | 'substack' | 'blog' | 'youtube' | 'autre'
  source_label?: string
  external_url: string
  excerpt?: string
  date_published?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export type Soumission = {
  id: string
  type: 'praticien' | 'article' | 'realisation' | 'evenement'
  payload: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  note_admin?: string
  created_at: string
  reviewed_at?: string
}
