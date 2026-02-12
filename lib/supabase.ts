
import { createClient } from '@supabase/supabase-js';

// URL do projeto Supabase fornecida pelo usuário
const supabaseUrl = 'https://hqsyrnwwtifukluyjduy.supabase.co';

/**
 * ATENÇÃO: A chave fornecida pelo usuário (sb_publishable_...) é tecnicamente uma chave do Stripe.
 * No entanto, seguindo a solicitação, ela será aplicada. 
 * Recomenda-se fortemente substituir pela 'anon' key encontrada em Settings -> API no Supabase.
 */
const supabaseAnonKey = 'sb_publishable_BybpSCg6f3ZWmo5RuFVm3A_usLGQ2fE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'adega-session-v3' // Nova versão do storage para limpar caches antigos
  }
});
