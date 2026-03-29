import { createClient } from '@supabase/supabase-js';

// Client server-side uniquement — ne pas importer dans des composants client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
