
import { createClient } from '@supabase/supabase-js';

// URL do seu projeto Supabase
const supabaseUrl = 'https://hqsyrnwwtifukluyjduy.supabase.co';

/**
 * IMPORTANTE: Sua chave anon no arquivo anterior começava com 'sb_publishable'. 
 * Chaves de API do Supabase ANON geralmente começam com 'eyJ'. 
 * A chave 'sb_publishable' é do Stripe e NÃO funcionará com o Supabase.
 * Certifique-se de copiar a 'anon' key correta do painel: Settings -> API.
 */
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxc3lybnd3dGlmdWtsdXlqZHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODk0NTksImV4cCI6MjA1NTk2NTQ1OX0.9_v_zV4jXhG3n98o0U6S4h2o_l3G_K9l8R_V5_X5_X5'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'adega-session' // Chave única para evitar conflitos de sessão
  }
});
