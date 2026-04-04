import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo
const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file     = form.get('file') as File | null;
    const username = String(form.get('username') || Date.now());

    if (!file) return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Fichier trop lourd (max 2 Mo).' }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Format non accepté (JPG, PNG, WebP).' }, { status: 400 });

    const ext  = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
    const path = `${username}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(path, buffer, { contentType: file.type, upsert: true, cacheControl: '3600' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: { publicUrl } } = supabaseAdmin.storage.from('avatars').getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[upload-avatar]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
