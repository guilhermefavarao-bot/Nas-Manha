
import { createClient } from '@supabase/supabase-js';

// No Vercel, estas variáveis devem ser configuradas no painel de Environment Variables.
// Se não houver processo de build, usamos os valores fixos fornecidos.
const supabaseUrl = 'https://hqsyrnwwtifukluyjduy.supabase.co';
const supabaseAnonKey = 'sb_publishable_BybpSCg6f3ZWmo5RuFVm3A_usLGQ2fE'; 

// NOTA: A chave acima parece ser curta demais para uma chave anon do Supabase. 
// Certifique-se de usar a 'anon public' key que começa com 'eyJ...' no painel do Supabase.

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
