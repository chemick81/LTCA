import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables d\'environnement Supabase manquantes. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env',
  );
}

// Note: pas de generic <Database> ici — la forme interne exacte attendue par
// les génériques de @supabase/supabase-js s'est révélée trop fragile à
// répliquer à la main sans `supabase gen types`. On type chaque service
// manuellement à la place (cast explicite du résultat vers nos interfaces
// dans src/types/database.types.ts), ce qui donne la même sécurité de type
// dans le reste de l'app sans dépendre de l'inférence interne du client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
