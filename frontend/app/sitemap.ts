import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const BASE = 'https://from0tohero.dev';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: praticiens } = await supabase
    .from('praticiens')
    .select('slug, updated_at')
    .eq('status', 'approved');

  const praticienUrls = (praticiens ?? []).map(p => ({
    url: `${BASE}/praticiens/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: BASE,                      lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/praticiens`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/realisations`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/evenements`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/articles`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/tips`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/soumettre`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/legal`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...praticienUrls,
  ];
}
