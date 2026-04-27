import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createAdminClient } from '@/lib/supabase/admin';

// Correspondance table → content_type dans content_embeddings
const TABLE_TO_CONTENT_TYPE: Record<string, string> = {
  tips:        'tip',
  articles:    'article',
  realisations:'realisation',
  collections: 'collection',
};

const ALLOWED_TABLES = ['articles', 'realisations', 'evenements', 'collections', 'tips'] as const;
type AllowedTable = typeof ALLOWED_TABLES[number];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { table, id } = await req.json();

    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      return NextResponse.json({ error: 'Table non autorisée' }, { status: 400 });
    }
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    // Récupère le praticien lié à cet utilisateur
    const { data: praticien } = await supabaseAdmin
      .from('praticiens')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!praticien) {
      return NextResponse.json({ error: 'Praticien introuvable' }, { status: 403 });
    }

    // Vérifie que le contenu appartient bien au praticien de l'utilisateur
    const { data: row } = await supabaseAdmin
      .from(table)
      .select('id, praticien_id')
      .eq('id', id)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: 'Contenu introuvable' }, { status: 404 });
    }
    if (row.praticien_id !== praticien.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Supprimer aussi de l'index Ask Hero si ce type est indexé
    const contentType = TABLE_TO_CONTENT_TYPE[table];
    if (contentType) {
      createAdminClient()
        .from('content_embeddings')
        .delete()
        .eq('content_type', contentType)
        .eq('content_id', id)
        .then(() => {})
        .catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[delete-content]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
