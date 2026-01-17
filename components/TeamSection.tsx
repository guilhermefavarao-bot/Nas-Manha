
import React, { useState } from 'react';
import { Users, ShieldCheck, UserPlus, Mail, Lock, Loader2, Eye, EyeOff, Info } from 'lucide-react';
import { RolePermissions } from '../types';
import { createClient } from '@supabase/supabase-js';

interface Props {
  atendentePermissions: RolePermissions;
  onUpdatePermissions: (perms: RolePermissions) => Promise<void>;
}

const TeamSection: React.FC<Props> = ({ atendentePermissions, onUpdatePermissions }) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'atendente'>('atendente');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const togglePermission = (key: keyof RolePermissions) => {
    const newPerms = { ...atendentePermissions, [key]: !atendentePermissions[key] };
    onUpdatePermissions(newPerms);
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || newUserPass.length < 6) return alert("E-mail válido e senha de no mínimo 6 dígitos obrigatórios.");
    setIsCreatingUser(true);
    try {
      const supabaseUrl = 'https://hqsyrnwwtifukluyjduy.supabase.co';
      const supabaseAnonKey = 'sb_publishable_BybpSCg6f3ZWmo5RuFVm3A_usLGQ2fE';
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
      const { error } = await tempSupabase.auth.signUp({
        email: newUserEmail,
        password: newUserPass,
        options: { data: { role: newUserRole } }
      });
      if (error) throw error;
      alert(`SUCESSO! Novo ${newUserRole.toUpperCase()} cadastrado.`);
      setNewUserEmail(''); setNewUserPass('');
    } catch (err: any) {
      alert("Erro ao criar usuário: " + err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Controle de Acessos Dinâmico */}
      <div className="bg-[#111111] p-10 rounded-[3rem] border border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#FFD700]/20 flex items-center justify-center border border-[#FFD700]/30">
            <ShieldCheck className="w-7 h-7 text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-white font-black uppercase text-xl tracking-tighter">Controle de Acessos (Atendentes)</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Defina quais abas a equipe pode acessar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <PermissionToggle label="Aba Cardápio" active={atendentePermissions.menu} onClick={() => togglePermission('menu')} />
          <PermissionToggle label="Aba Vendas" active={atendentePermissions.sales} onClick={() => togglePermission('sales')} />
          <PermissionToggle label="Aba Pedidos" active={atendentePermissions.orders} onClick={() => togglePermission('orders')} />
          <PermissionToggle label="Aba Caixa" active={atendentePermissions.cashier} onClick={() => togglePermission('cashier')} />
          <PermissionToggle label="Aba Estoque" active={atendentePermissions.stock} onClick={() => togglePermission('stock')} />
        </div>
      </div>

      {/* Cadastro de Novos Colaboradores */}
      <div className="bg-[#111111] p-10 rounded-[3rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-600/30">
            <UserPlus className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-black uppercase text-xl tracking-tighter">Gestão de Equipe</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Crie novas contas de acesso para funcionários</p>
          </div>
        </div>

        <form onSubmit={handleCreateNewUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">E-mail de Login</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                <input type="email" required placeholder="email@adega.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 pl-14 text-white text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Senha Provisória</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                <input type="password" required minLength={6} placeholder="Mínimo 6 dígitos" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 pl-14 text-white text-sm focus:border-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Cargo / Hierarquia</label>
            <div className="grid grid-cols-2 gap-4 p-1.5 bg-black rounded-3xl border border-zinc-900">
              <button type="button" onClick={() => setNewUserRole('atendente')} className={`flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newUserRole === 'atendente' ? 'bg-zinc-800 text-white' : 'text-zinc-700 hover:text-zinc-500'}`}>
                <Users className="w-4 h-4" /> Atendente
              </button>
              <button type="button" onClick={() => setNewUserRole('admin')} className={`flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newUserRole === 'admin' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-zinc-700 hover:text-zinc-500'}`}>
                <ShieldCheck className="w-4 h-4" /> Administrador
              </button>
            </div>
          </div>

          <button disabled={isCreatingUser} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-blue-900/20 active:scale-95">
            {isCreatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            Criar acesso de {newUserRole.toUpperCase()}
          </button>
        </form>
      </div>

      <div className="bg-blue-600/5 p-8 rounded-[2rem] border border-dashed border-blue-500/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">
          Dica: Novos usuários podem logar imediatamente após o cadastro. <br/>As permissões de Atendente aplicam-se a todos os membros com esse cargo globalmente.
        </p>
      </div>
    </div>
  );
};

const PermissionToggle: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${active ? 'bg-zinc-900 border-[#FFD700]/30 text-white' : 'bg-black border-zinc-800 text-zinc-600'}`}>
    <span className="font-black uppercase text-[10px] tracking-widest">{label}</span>
    {active ? <Eye className="w-5 h-5 text-[#FFD700]" /> : <EyeOff className="w-5 h-5 text-zinc-800" />}
  </button>
);

export default TeamSection;
