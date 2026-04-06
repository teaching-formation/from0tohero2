import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PraticienClient from './PraticienClient';
import type { Praticien, Realisation } from '@/lib/supabase';

type CollectionItem = { id: string; title: string; url: string; description: string };
type Collection = { id: string; title: string; description?: string; items: CollectionItem[] };
type Tip = { id: string; content: string; type: string; category: string; stack: string[]; created_at: string };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('praticiens')
    .select('name, role, bio, photo_url')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();
  if (!data) return { title: 'Praticien · from0tohero' };
  return {
    title: `${data.name} · from0tohero`,
    description: data.bio ? `${data.role} — ${String(data.bio).slice(0, 150)}` : data.role,
    openGraph: {
      title: `${data.name} · from0tohero`,
      description: data.bio ? String(data.bio).slice(0, 200) : data.role,
      ...(data.photo_url ? { images: [{ url: String(data.photo_url) }] } : {}),
    },
  };
}

export default async function PraticienPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: praticienRaw } = await supabase
    .from('praticiens')
    .select('id,slug,name,role,country,city,bio,categories,category,category_label,stack,skills,badges,certifications,linkedin_url,github_url,twitter_url,youtube_url,website_url,whatsapp_url,photo_url,status,created_at,user_id')
    .eq('slug', slug)
    .single();

  if (!praticienRaw) notFound();
  const praticien = praticienRaw as unknown as Praticien;

  const [{ data: realsOwned }, { data: realsCollab }, { data: cols }, { data: tps }] = await Promise.all([
    supabase.from('realisations').select('*').eq('praticien_id', praticien.id).eq('status', 'approved'),
    supabase.from('realisations').select('*').contains('collaborateurs', [slug]).eq('status', 'approved'),
    supabase.from('collections').select('id, title, description, items, ordre').eq('praticien_id', praticien.id).eq('status', 'approved').order('ordre', { ascending: true }),
    supabase.from('tips').select('id, content, type, category, stack, created_at').eq('praticien_id', praticien.id).eq('status', 'approved').order('created_at', { ascending: false }).limit(20),
  ]);

  // Fusionner réalisations possédées + en tant que co-auteur (sans doublons)
  const ownedIds = new Set((realsOwned ?? []).map((r: Record<string,unknown>) => r.id));
  const reals = [
    ...(realsOwned ?? []),
    ...(realsCollab ?? []).filter((r: Record<string,unknown>) => !ownedIds.has(r.id)),
  ];

  return (
    <PraticienClient
      praticien={praticien}
      realisations={reals as Realisation[]}
      collections={(cols ?? []) as Collection[]}
      tips={(tps ?? []) as Tip[]}
    />
  );
}
