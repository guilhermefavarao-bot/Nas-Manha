
import { createClient } from '@supabase/supabase-js';

// No Vercel, configure estas variáveis em Settings -> Environment Variables
// SUPABASE_URL e SUPABASE_ANON_KEY
const supabaseUrl = 'https://hqsyrnwwtifukluyjduy.supabase.co';

// Lembrete: Chaves Supabase geralmente começam com 'eyJ...'. 
// A chave 'sb_publishable' é do Stripe e pode não funcionar aqui.
const supabaseAnonKey = 'sb_publishable_BybpSCg6f3ZWmo5RuFVm3A_usLGQ2fE'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
