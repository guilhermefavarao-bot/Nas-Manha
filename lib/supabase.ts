
import { createClient } from '@supabase/supabase-js';

/**
 * Configurações de conexão com o Supabase.
 * Projeto: Adega Nas Manha (Novo Projeto)
 */

const supabaseUrl = 'https://hqsyrnwwtifukluyjduy.supabase.co';
const supabaseAnonKey = 'sb_publishable_BybpSCg6f3ZWmo5RuFVm3A_usLGQ2fE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
