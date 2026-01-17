
import { createClient } from '@supabase/supabase-js';

// No Vercel, estas variáveis devem ser configuradas no painel de Environment Variables (Settings -> Environment Variables).
const supabaseUrl = 'https://hqsyrnwwtifukluyjduy.supabase.co';

// IMPORTANTE: A chave que você tinha no código ('sb_publishable_...') é do Stripe.
// Você deve pegar a chave 'anon' ou 'public' no painel do Supabase (Settings -> API).
// Ela deve começar com 'eyJ...'.
const supabaseAnonKey = 'SUA_CHAVE_ANON_DO_SUPABASE_AQUI'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
