import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ exists: false });

  const { data } = await supabaseAdmin
    .from('praticiens')
    .select('slug, name')
    .eq('slug', slug.toLowerCase().trim())
    .eq('status', 'approved')
    .maybeSingle();

  return NextResponse.json({ exists: !!data, name: data?.name ?? null });
}
