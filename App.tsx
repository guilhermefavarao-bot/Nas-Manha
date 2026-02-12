
import React, { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingCart, DollarSign, Settings, List, Loader2, Beer, RefreshCw, LogOut, Users, Star } from 'lucide-react';
import { Product, Order, CashEntry, Tab, RolePermissions, ItemPedido } from './types';
import OrdersSection from './components/OrdersSection';
import SalesSection from './components/SalesSection';
import CashierSection from './components/CashierSection';
import AdminSection from './components/AdminSection';
import TeamSection from './components/TeamSection';
import MenuSection from './components/MenuSection';
import DonosSection from './components/DonosSection';
import LoginScreen from './components/LoginScreen';
import { supabase } from './lib/supabase';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'atendente' | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Menu);
  
  const [atendentePermissions, setAtendentePermissions] = useState<RolePermissions>({
    menu: true,
    sales: true,
    orders: true,
    cashier: false,
    stock: false,
    donos: false
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesHistory, setSalesHistory] = useState<Order[]>([]);
  const [cashier, setCashier] = useState<CashEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const [pRes, oRes, cRes] = await Promise.all([
        supabase.from('products').select('*').order('nome'),
        supabase.from('orders').select('*').order('data', { ascending: false }).limit(300),
        supabase.from('cash_entries').select('*').order('data', { ascending: false }).limit(300)
      ]);

      if (pRes.error) throw pRes.error;
      
      setProducts(pRes.data || []);
      setOrders(oRes.data || []); 
      setSalesHistory((oRes.data || []).filter((o:any) => o.status === 'fechado'));
      setCashier(cRes.data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      if (err.message?.includes('API key')) {
         addNotification("Erro: Chave API Inválida no Supabase", "error");
      }
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [user, addNotification]);

  const fetchPermissions = useCallback(async () => {
    try {
      const { data } = await supabase.from('system_configs').select('value').eq('key', 'atendente_permissions').single();
      if (data && data.value) setAtendentePermissions(data.value);
    } catch (e) {}
  }, []);

  const initAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Lógica de role mais robusta para Vercel
        const roleFromMetadata = session.user.user_metadata?.role || session.user.app_metadata?.role;
        const roleFromEmail = session.user.email?.toLowerCase().includes('admin') ? 'admin' : null;
        const finalRole = roleFromMetadata || roleFromEmail || 'atendente';
        
        setUserRole(finalRole as any);
        await fetchPermissions();
      }
    } catch (err) {
      console.error("Auth init error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchPermissions]);

  useEffect(() => {
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const role = session.user.user_metadata?.role || session.user.app_metadata?.role || 
                     (session.user.email?.toLowerCase().includes('admin') ? 'admin' : 'atendente');
        setUserRole(role as any);
        fetchPermissions();
      } else {
        setUser(null);
        setUserRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [initAuth, fetchPermissions]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleUpsertProduct = async (p: Partial<Product>) => {
    const { error } = await supabase.from('products').upsert(p);
    if (!error) { addNotification("Estoque atualizado!", "success"); fetchData(); }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { addNotification("Produto excluído!", "success"); fetchData(); }
  };

  const handleCreateOrder = async (nome: string, telefone: string, status: any = 'aberto') => {
    const payload = {
      cliente: nome, telefone: telefone || "", status, itens: [], total: 0,
      atendente: user?.email || 'Admin', data: new Date().toISOString()
    };
    const { error } = await supabase.from('orders').insert(payload);
    if (!error) { addNotification("Comanda aberta!", "success"); fetchData(); }
  };

  const hasAccess = (tab: Tab) => {
    // Admin tem acesso TOTAL e INCONDICIONAL a todas as abas
    if (userRole === 'admin') return true;
    
    // Atendente depende das permissões do banco
    const perms = atendentePermissions;
    switch(tab) {
      case Tab.Menu: return perms.menu;
      case Tab.Sales: return perms.sales;
      case Tab.Orders: return perms.orders;
      case Tab.Cashier: return perms.cashier;
      case Tab.Admin: return perms.stock;
      case Tab.Donos: return perms.donos;
      case Tab.Team: return false; // Equipe é APENAS admin
      default: return false;
    }
  };

  if (!user && !loading) return <LoginScreen onLoginSuccess={initAuth} />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {loading ? (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
          <Loader2 className="w-16 h-16 text-[#FFD700] animate-spin mb-4" />
          <p className="text-[#FFD700] font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Terminal...</p>
        </div>
      ) : (
        <>
          <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#FFD700] rounded-xl"><Beer className="w-6 h-6 text-black" /></div>
              <div>
                <h1 className="text-[#FFD700] font-black text-xl uppercase tracking-tighter leading-none">Adega Nas Manha</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{userRole?.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={fetchData} className="p-2.5 bg-zinc-900 rounded-xl text-zinc-400 hover:text-[#FFD700] transition-transform active:scale-90"><RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} /></button>
               <button onClick={() => supabase.auth.signOut()} className="p-2.5 bg-red-950/20 border border-red-900/20 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"><LogOut className="w-5 h-5" /></button>
            </div>
          </header>

          <main className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
            {activeTab === Tab.Menu && hasAccess(Tab.Menu) && <MenuSection products={products} />}
            {activeTab === Tab.Sales && hasAccess(Tab.Sales) && (
              <SalesSection 
                orders={orders} products={products} salesHistory={salesHistory} 
                onCreateOrder={handleCreateOrder} onAddItem={() => {}} 
                onFinishOrder={() => {}} onQuickSale={() => {}} onVoidSale={() => {}} 
              />
            )}
            {activeTab === Tab.Orders && hasAccess(Tab.Orders) && (
              <OrdersSection orders={orders} onReady={() => {}} onCloseOrder={() => {}} onDelete={() => {}} onRemoveItem={() => {}} />
            )}
            {activeTab === Tab.Donos && hasAccess(Tab.Donos) && (
              <DonosSection 
                orders={orders} products={products} 
                onCreateOwnerOrder={(name) => handleCreateOrder(name, '', 'consumo_interno')} 
                onAddItem={() => {}} onFinishOrder={() => {}} onRemoveItem={() => {}} onDelete={() => {}}
              />
            )}
            {activeTab === Tab.Cashier && hasAccess(Tab.Cashier) && <CashierSection entries={cashier} salesHistory={salesHistory} />}
            {activeTab === Tab.Admin && hasAccess(Tab.Admin) && <AdminSection products={products} onUpsertProduct={handleUpsertProduct} onDeleteProduct={handleDeleteProduct} />}
            {activeTab === Tab.Team && userRole === 'admin' && <TeamSection atendentePermissions={atendentePermissions} onUpdatePermissions={async (p) => { await supabase.from('system_configs').upsert({key:'atendente_permissions', value:p}); setAtendentePermissions(p); }} />}
          </main>

          <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-900 flex justify-around p-3 z-50 overflow-x-auto no-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <NavButton active={activeTab === Tab.Menu} onClick={() => setActiveTab(Tab.Menu)} icon={<List />} label="Cardápio" />
            <NavButton active={activeTab === Tab.Sales} onClick={() => setActiveTab(Tab.Sales)} icon={<ShoppingCart />} label="Vendas" />
            <NavButton active={activeTab === Tab.Orders} onClick={() => setActiveTab(Tab.Orders)} icon={<Package />} label="Pedidos" badge={orders.filter(o => o.status === 'aberto' || o.status === 'pronto').length} />
            {hasAccess(Tab.Donos) && <NavButton active={activeTab === Tab.Donos} onClick={() => setActiveTab(Tab.Donos)} icon={<Star />} label="Donos" />}
            {hasAccess(Tab.Cashier) && <NavButton active={activeTab === Tab.Cashier} onClick={() => setActiveTab(Tab.Cashier)} icon={<DollarSign />} label="Caixa" />}
            {hasAccess(Tab.Admin) && <NavButton active={activeTab === Tab.Admin} onClick={() => setActiveTab(Tab.Admin)} icon={<Settings />} label="Estoque" />}
            {userRole === 'admin' && <NavButton active={activeTab === Tab.Team} onClick={() => setActiveTab(Tab.Team)} icon={<Users />} label="Equipe" />}
          </nav>
        </>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, badge }: any) => (
  <button onClick={onClick} className="relative flex flex-col items-center gap-1.5 px-4 py-2 flex-shrink-0 min-w-[70px]">
    <div className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-[#FFD700] text-black scale-110 shadow-lg shadow-yellow-500/20' : 'text-zinc-700 hover:text-zinc-500'}`}>{icon}</div>
    <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${active ? 'text-[#FFD700]' : 'text-zinc-800'}`}>{label}</span>
    {badge > 0 && <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black border-2 border-black animate-bounce">{badge}</span>}
  </button>
);

export default App;
