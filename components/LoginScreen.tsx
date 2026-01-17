
import React, { useState } from 'react';
import { Beer, Mail, Lock, Loader2, UserPlus, LogIn, ShieldCheck, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'atendente'>('atendente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        console.log("Sistema: Cadastrando novo", role.toUpperCase());
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: role } // Salvando explicitamente o cargo
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (data.session) {
          onLoginSuccess();
        } else {
          alert(`Conta de ${role.toUpperCase()} criada!\nFaça login agora para entrar no sistema.`);
          setIsRegister(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error("Erro Auth:", err);
      setError(err.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
      <div className="w-full max-w-md space-y-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FFD700] rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-28 h-28 rounded-3xl border-4 border-[#FFD700] flex items-center justify-center mb-8 bg-black shadow-2xl">
              <Beer className="w-14 h-14 text-[#FFD700]" />
            </div>
          </div>
          <h1 className="text-[#FFD700] font-black text-4xl uppercase tracking-tighter leading-none">ADEGA</h1>
          <h2 className="text-[#FFD700] font-black text-2xl uppercase tracking-[0.2em] -mt-1">NAS MANHA</h2>
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em] mt-4">Security Protocol Level 5 • Cloud Sync</p>
        </div>

        <form onSubmit={handleAuth} className="bg-[#0e0e0e] p-10 rounded-[3rem] border border-zinc-800 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
              <input 
                type="email" 
                placeholder="E-mail Corporativo" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-black border border-zinc-800 rounded-2xl py-5 pl-14 pr-4 text-white focus:border-[#FFD700] outline-none text-sm transition-all" 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
              <input 
                type="password" 
                placeholder="Senha de Acesso" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-black border border-zinc-800 rounded-2xl py-5 pl-14 pr-4 text-white focus:border-[#FFD700] outline-none text-sm transition-all" 
              />
            </div>

            {isRegister && (
              <div className="space-y-4 pt-2">
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] text-center">Definir Nível de Privilégios</p>
                <div className="grid grid-cols-2 gap-4 p-1.5 bg-black rounded-[1.8rem] border border-zinc-900">
                  <button 
                    type="button" 
                    onClick={() => setRole('atendente')} 
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'atendente' ? 'bg-zinc-800 text-white' : 'text-zinc-700 hover:text-zinc-500'}`}
                  >
                    <Users className="w-4 h-4" /> Atendente
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRole('admin')} 
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-[#FFD700] text-black shadow-lg shadow-yellow-500/10' : 'text-zinc-700 hover:text-zinc-500'}`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Admin
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-pulse">
               <p className="text-red-500 text-[9px] font-black uppercase text-center tracking-widest">{error}</p>
            </div>
          )}

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-[#FFD700] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-xs tracking-[0.3em] shadow-xl shadow-yellow-500/10"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isRegister ? <UserPlus className="w-6 h-6"/> : <LogIn className="w-6 h-6"/>}
            {isRegister ? `Confirmar Cadastro` : 'Acessar Terminal'}
          </button>

          <button 
            type="button" 
            onClick={() => { setIsRegister(!isRegister); setError(''); }} 
            className="w-full text-zinc-600 text-[9px] font-black uppercase tracking-widest hover:text-[#FFD700] transition-colors py-2 flex items-center justify-center gap-3"
          >
            {isRegister ? <><ArrowLeft className="w-4 h-4"/> Voltar para o Login</> : 'Não possui credenciais? Criar acesso'}
          </button>
        </form>

        <div className="text-center opacity-30">
           <p className="text-white text-[8px] font-black uppercase tracking-[0.6em]">Pro Version 2.5 • Adega Nas Manha LLC</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
