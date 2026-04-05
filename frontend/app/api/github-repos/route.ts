import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Récupère le github_url du praticien
  const { data: praticien } = await supabaseAdmin
    .from('praticiens')
    .select('github_url, slug')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!praticien?.github_url)
    return NextResponse.json({ error: 'Aucun lien GitHub dans ton profil.' }, { status: 404 });

  // Extrait le username depuis github_url
  const match = String(praticien.github_url).match(/github\.com\/([^/?#]+)/i);
  if (!match) return NextResponse.json({ error: 'URL GitHub invalide dans ton profil.' }, { status: 400 });
  const username = match[1];

  // Récupère les repos publics déjà importés (par repo_url) pour les filtrer
  const { data: existingRepos } = await supabaseAdmin
    .from('realisations')
    .select('repo_url')
    .eq('praticien_id', (
      await supabaseAdmin.from('praticiens').select('id').eq('user_id', user.id).maybeSingle()
    ).data?.id || '');

  const importedUrls = new Set(
    (existingRepos || []).map(r => String(r.repo_url || '').replace(/\/$/, '').toLowerCase())
  );

  // Appel GitHub API
  const ghRes = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=50&type=public`,
    { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'from0tohero' } }
  );
  if (!ghRes.ok) return NextResponse.json({ error: 'Impossible de récupérer les repos GitHub.' }, { status: 502 });

  const repos = await ghRes.json();
  if (!Array.isArray(repos)) return NextResponse.json({ error: 'Réponse GitHub invalide.' }, { status: 502 });

  const result = repos
    .filter(r => !r.fork) // exclure les forks
    .map(r => ({
      id:          r.id,
      name:        r.name,
      full_name:   r.full_name,
      description: r.description || '',
      url:         r.html_url,
      homepage:    r.homepage || '',
      language:    r.language || '',
      topics:      r.topics || [],
      stars:       r.stargazers_count || 0,
      updated_at:  r.updated_at,
      already_imported: importedUrls.has(r.html_url.replace(/\/$/, '').toLowerCase()),
    }));

  return NextResponse.json({ username, repos: result });
}
