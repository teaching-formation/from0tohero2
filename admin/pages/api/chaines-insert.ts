import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, description, url, subs, ordre, active } = req.body;
  if (!name?.trim() || !url?.trim()) {
    return res.status(400).json({ error: 'name et url sont requis' });
  }

  const { data, error } = await supabaseAdmin
    .from('chaines_youtube')
    .insert({
      name:        name.trim(),
      description: description?.trim() || null,
      url:         url.trim(),
      subs:        subs?.trim() || null,
      ordre:       Number(ordre) || 0,
      active:      active !== false,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
}
