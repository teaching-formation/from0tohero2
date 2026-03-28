import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export type Soumission = {
  id: string;
  type: 'praticien' | 'article' | 'realisation' | 'evenement';
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  note_admin?: string;
  created_at: string;
  reviewed_at?: string;
};
