
import React, { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingCart, DollarSign, Settings, List, Loader2, CheckCircle2, X, Beer, Cloud, CloudOff, RefreshCw, LogOut, ShieldCheck, Users, Lock, ShieldAlert } from 'lucide-react';
import { Product, Order, CashEntry, Tab, RolePermissions } from './types';
import OrdersSection from './components/OrdersSection';
import SalesSection from './components/SalesSection';
import CashierSection from './components/CashierSection';
import AdminSection from './components/AdminSection';
import TeamSection from './components/TeamSection';
import MenuSection from './components/MenuSection';
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
    stock: false
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
      const [pRes, oRes, hRes, cRes] = await Promise.all([
        supabase.from('products').select('*').order('nome'),
        supabase.from('orders').select('*').neq('status', 'fechado'),
        supabase.from('orders').select('*').eq('status', 'fechado').order('data', { ascending: false }).limit(50),
        supabase.from('cash_entries').select('*').order('data', { ascending: false }).limit(50)
      ]);

      if (pRes.error) throw pRes.error;
      if (oRes.error) throw oRes.error;

      setProducts(pRes.data || []);
      setOrders(oRes.data || []);
      setSalesHistory(hRes.data || []);
      setCashier(cRes.data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      addNotification("Erro de conexão com o banco", "error");
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
          setUserRole(session.user.user_metadata?.role || 'atendente');
          fetchPermissions();
          // fetchData será chamado pelo useEffect que observa o 'user'
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserRole(session.user.user_metadata?.role || 'atendente');
        fetchPermissions();
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchPermissions]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleUpsertProduct = async (p: Partial<Product>) => {
    const { error } = await supabase.from('products').upsert(p);
    if (error) {
      addNotification("Erro: " + error.message, "error");
    } else {
      addNotification("Produto salvo!", "success");
      fetchData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      addNotification("Erro ao excluir", "error");
    } else {
      addNotification("Produto removido!", "success");
      fetchData();
    }
  };

  const handleCreateOrder = async (nome: string, telefone: string) => {
    const payload = {
      cliente: nome,
      telefone: telefone || "",
      status: 'aberto',
      itens: [],
      total: 0,
      atendente: user?.email || 'Admin',
      data: new Date().toISOString()
    };
    const { error } = await supabase.from('orders').insert(payload);
    if (error) {
      addNotification("Erro ao abrir: " + error.message, "error");
    } else {
      addNotification("Comanda iniciada!", "success");
      fetchData();
    }
  };

  const handleAddItemToOrder = async (orderId: number, productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    const order = orders.find(o => o.id === orderId);
    if (!product || !order) return;

    if (product.qtd < qty) return addNotification("Estoque esgotado!", "error");

    const newQty = Number(qty);
    const newItem = { nome: product.nome, qty: newQty, preco: Number(product.preco), custo: Number(product.custo) };
    const newItens = [...(order.itens || []), newItem];
    const newTotal = Number(order.total) + (Number(product.preco) * newQty);

    try {
      const { error: orderError } = await supabase.from('orders').update({ itens: newItens, total: newTotal }).eq('id', orderId);
      const { error: stockError } = await supabase.from('products').update({ qtd: product.qtd - newQty }).eq('id', productId);
      if (orderError || stockError) throw new Error("Erro de atualização");
      addNotification("Lançado!", "success");
      fetchData();
    } catch (err) {
      addNotification("Erro no lançamento", "error");
    }
  };

  const handleFinishOrder = async (orderId: number, paymentInput: any) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const timestamp = new Date().toISOString();
    let payments: { type: string, value: number }[] = [];

    if (typeof paymentInput === 'string') {
      payments = [{ type: paymentInput, value: Number(order.total) }];
    } else if (Array.isArray(paymentInput)) {
      payments = paymentInput;
    }

    const resumoPagto = payments.map(p => `${p.type}: R$${Number(p.value).toFixed(2)}`).join(", ");
    const cashEntries = payments.map(p => ({
      cliente: order.cliente,
      forma: p.type,
      valor: Number(p.value),
      data: timestamp
    }));

    try {
      const { error: updateError } = await supabase.from('orders').update({ 
        status: 'fechado', 
        pagamento: resumoPagto, 
        data: timestamp 
      }).eq('id', orderId);

      const { error: cashError } = await supabase.from('cash_entries').insert(cashEntries);
      if (updateError || cashError) throw new Error("Falha ao registrar no caixa");

      addNotification("Venda concluída!", "success");
      fetchData();
    } catch (err: any) {
      addNotification("Erro no fechamento", "error");
    }
  };

  const hasAccess = (tab: Tab) => {
    if (userRole === 'admin') return true;
    if (tab === Tab.Team) return false;
    if (tab === Tab.Menu) return atendentePermissions.menu;
    if (tab === Tab.Sales) return atendentePermissions.sales;
    if (tab === Tab.Orders) return atendentePermissions.orders;
    if (tab === Tab.Cashier) return atendentePermissions.cashier;
    if (tab === Tab.Admin) return atendentePermissions.stock;
    return false;
  };

  if (!user && !loading) return <LoginScreen onLoginSuccess={() => {}} />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 selection:bg-[#FFD700] selection:text-black">
      {loading ? (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
          <Loader2 className="w-16 h-16 text-[#FFD700] animate-spin mb-4" />
          <p className="text-[#FFD700] font-black uppercase text-[10px] tracking-widest animate-pulse">Iniciando Sistema...</p>
        </div>
      ) : (
        <>
          <header className="sticky top-0 z-[60] bg-black/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#FFD700] rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.1)]"><Beer className="w-6 h-6 text-black" /></div>
              <div>
                <h1 className="text-[#FFD700] font-black text-xl uppercase tracking-tighter">Adega Nas Manha</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}></div>
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{syncing ? 'Sincronizando' : 'Terminal Ativo'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={fetchData} disabled={syncing} className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-400 hover:text-[#FFD700] transition-all disabled:opacity-20"><RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} /></button>
               <button onClick={() => supabase.auth.signOut()} className="p-2.5 bg-red-950/10 border border-red-900/20 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"><LogOut className="w-5 h-5" /></button>
            </div>
          </header>

          <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
            {notifications.map(n => (
              <div key={n.id} className="pointer-events-auto bg-[#141414] border-l-4 border-[#FFD700] p-5 rounded-r-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-full">
                <div className={`p-2 rounded-full ${n.type === 'success' ? 'bg-green-500/10 text-green-500' : n.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  {n.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <p className="text-[10px] font-black uppercase text-white tracking-widest">{n.message}</p>
              </div>
            ))}
          </div>
          
          <main className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
            {activeTab === Tab.Menu && hasAccess(Tab.Menu) && <MenuSection products={products} />}
            {activeTab === Tab.Sales && hasAccess(Tab.Sales) && <SalesSection orders={orders} products={products} salesHistory={salesHistory} onCreateOrder={handleCreateOrder} onAddItem={handleAddItemToOrder} onFinishOrder={handleFinishOrder} onVoidSale={() => {}} />}
            {activeTab === Tab.Orders && hasAccess(Tab.Orders) && <OrdersSection orders={orders} onReady={async (id) => { await supabase.from('orders').update({status:'pronto'}).eq('id',id); fetchData(); }} onCloseOrder={handleFinishOrder} onDelete={async (id) => { await supabase.from('orders').delete().eq('id',id); fetchData(); }} />}
            {activeTab === Tab.Cashier && hasAccess(Tab.Cashier) && <CashierSection entries={cashier} salesHistory={salesHistory} />}
            {activeTab === Tab.Admin && hasAccess(Tab.Admin) && <AdminSection products={products} onUpsertProduct={handleUpsertProduct} onDeleteProduct={handleDeleteProduct} />}
            {activeTab === Tab.Team && userRole === 'admin' && <TeamSection atendentePermissions={atendentePermissions} onUpdatePermissions={async (perms) => { await supabase.from('system_configs').upsert({ key: 'atendente_permissions', value: perms }); setAtendentePermissions(perms); addNotification("Configurações Salvas", "success"); }} />}
          </main>

          <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-2xl border-t border-zinc-900 flex justify-around p-3 z-50">
            {(atendentePermissions.menu || userRole === 'admin') && <NavButton active={activeTab === Tab.Menu} onClick={() => setActiveTab(Tab.Menu)} icon={<List />} label="Cardápio" />}
            {(atendentePermissions.sales || userRole === 'admin') && <NavButton active={activeTab === Tab.Sales} onClick={() => setActiveTab(Tab.Sales)} icon={<ShoppingCart />} label="Vendas" />}
            {(atendentePermissions.orders || userRole === 'admin') && <NavButton active={activeTab === Tab.Orders} onClick={() => setActiveTab(Tab.Orders)} icon={<Package />} label="Pedidos" badge={orders.length} />}
            {(atendentePermissions.cashier || userRole === 'admin') && <NavButton active={activeTab === Tab.Cashier} onClick={() => setActiveTab(Tab.Cashier)} icon={<DollarSign />} label="Caixa" />}
            {(atendentePermissions.stock || userRole === 'admin') && <NavButton active={activeTab === Tab.Admin} onClick={() => setActiveTab(Tab.Admin)} icon={<Settings />} label="Estoque" />}
            {userRole === 'admin' && <NavButton active={activeTab === Tab.Team} onClick={() => setActiveTab(Tab.Team)} icon={<Users />} label="Equipe" />}
          </nav>
        </>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }> = ({ active, onClick, icon, label, badge }) => (
  <button onClick={onClick} className="relative flex flex-col items-center gap-1.5 px-4 py-2 transition-transform active:scale-90">
    <div className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-[#FFD700] text-black shadow-[0_10px_20px_rgba(255,215,0,0.2)] scale-110' : 'text-zinc-700 hover:text-zinc-500'}`}>{icon}</div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-[#FFD700]' : 'text-zinc-800'}`}>{label}</span>
    {badge ? badge > 0 && <span className="absolute top-2 right-3 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black border-2 border-black animate-bounce">{badge}</span> : null}
  </button>
);

export default App;
