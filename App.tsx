
import React, { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingCart, DollarSign, Settings, List, Loader2, CheckCircle2, X, Beer, Cloud, CloudOff, RefreshCw, LogOut, ShieldCheck, Users, Lock, ShieldAlert, Star } from 'lucide-react';
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
      const [pRes, oRes, cRes] = await Promise.all([
        supabase.from('products').select('*').order('nome'),
        supabase.from('orders').select('*').order('data', { ascending: false }).limit(300),
        supabase.from('cash_entries').select('*').order('data', { ascending: false }).limit(300)
      ]);

      if (pRes.error) throw pRes.error;
      
      const allOrders = oRes.data || [];
      const allProducts = pRes.data || [];
      
      setProducts(allProducts);
      setOrders(allOrders); 
      setSalesHistory(allOrders.filter(o => o.status === 'fechado'));
      setCashier(cRes.data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      addNotification("Erro na sincronização", "error");
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
        } else {
          setLoading(false);
        }
      } catch (err) {
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

  // Sincronizar ao mudar de aba para garantir dados frescos
  useEffect(() => {
    if (user && !loading) {
      fetchData();
    }
  }, [activeTab]);

  const handleUpsertProduct = async (p: Partial<Product>) => {
    const { error } = await supabase.from('products').upsert(p);
    if (error) {
      addNotification("Falha ao salvar: " + error.message, "error");
    } else {
      addNotification("Estoque atualizado!", "success");
      fetchData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      addNotification("Erro ao remover do banco", "error");
    } else {
      addNotification("Produto excluído!", "success");
      fetchData();
    }
  };

  const handleCreateOrder = async (nome: string, telefone: string, status: any = 'aberto') => {
    const payload = {
      cliente: nome,
      telefone: telefone || "",
      status: status,
      itens: [],
      total: 0,
      atendente: user?.email || 'Admin',
      data: new Date().toISOString()
    };
    const { error } = await supabase.from('orders').insert(payload);
    if (error) {
      addNotification("Erro ao iniciar comanda", "error");
    } else {
      addNotification("Comanda aberta!", "success");
      fetchData();
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    try {
      if (order && order.itens) {
        for (const item of order.itens) {
          const product = products.find(p => p.nome === item.nome);
          if (product && product.categoria !== 'Combos') {
            const refundAmount = product.categoria === 'Doses' ? (Number(item.qtd) / 10) : Number(item.qtd);
            await supabase.from('products').update({ 
              qtd: Number(product.qtd) + refundAmount 
            }).eq('id', product.id);
          }
        }
      }
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      addNotification("Comanda removida!", "success");
      fetchData();
    } catch (err: any) {
      addNotification("Erro ao remover comanda", "error");
    }
  };

  const handleRemoveItemFromOrder = async (orderId: number, itemIdx: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.itens[itemIdx]) return;

    const itemToRemove = order.itens[itemIdx];
    const newItens = [...order.itens];
    newItens.splice(itemIdx, 1);
    
    const newTotal = newItens.reduce((acc, item) => acc + (Number(item.preco) * Number(item.qtd)), 0);

    try {
      const { error: orderError } = await supabase.from('orders').update({ itens: newItens, total: Number(newTotal) }).eq('id', orderId);
      if (orderError) throw orderError;

      const product = products.find(p => p.nome === itemToRemove.nome);
      if (product && product.categoria !== 'Combos') {
        const refundAmount = product.categoria === 'Doses' ? (Number(itemToRemove.qtd) / 10) : Number(itemToRemove.qtd);
        await supabase.from('products').update({ 
          qtd: Number(product.qtd) + refundAmount 
        }).eq('id', product.id);
      }

      addNotification("Item removido!", "success");
      fetchData();
    } catch (err) {
      addNotification("Erro ao remover item", "error");
    }
  };

  const handleQuickSale = async (items: ItemPedido[], total: number, paymentType: string) => {
    const timestamp = new Date().toISOString();
    try {
      const orderPayload = {
        cliente: "Venda Direta",
        status: 'fechado',
        itens: items,
        total: Number(total),
        pagamento: paymentType,
        atendente: user?.email || 'Balcão',
        data: timestamp
      };

      const { error: orderError } = await supabase.from('orders').insert(orderPayload);
      if (orderError) throw orderError;

      const cashPayload = { 
        cliente: "Venda Direta", 
        forma: paymentType, 
        valor: Number(total), 
        data: timestamp, 
        itens: items 
      };
      const { error: cashError } = await supabase.from('cash_entries').insert(cashPayload);
      if (cashError) throw cashError;

      for (const item of items) {
        const product = products.find(p => p.nome === item.nome);
        if (product && product.categoria !== 'Combos') {
          const deduction = product.categoria === 'Doses' ? (Number(item.qtd) / 10) : Number(item.qtd);
          await supabase.from('products').update({ qtd: Math.max(0, Number(product.qtd) - deduction) }).eq('id', product.id);
        }
      }

      addNotification("Venda direta concluída!", "success");
      fetchData();
    } catch (err: any) {
      console.error("QuickSale Error:", err);
      addNotification("Erro na venda rápida", "error");
    }
  };

  const handleAddItemToOrder = async (orderId: number, productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    const order = orders.find(o => o.id === orderId);
    if (!product || !order) return;

    const isCombo = product.categoria === 'Combos';
    const isDose = product.categoria === 'Doses';
    const stockDeduction = isDose ? (Number(qty) / 10) : Number(qty);

    if (!isCombo && Number(product.qtd) < stockDeduction) {
      return addNotification("Saldo de garrafa insuficiente!", "error");
    }

    const newItens = [...(order.itens || []), { 
      nome: product.nome, 
      qtd: Number(qty), 
      preco: Number(product.preco) || 0, 
      custo: Number(product.custo) || 0 
    }];
    
    const newTotal = newItens.reduce((acc, item) => acc + (Number(item.preco) * Number(item.qtd)), 0);

    try {
      const { error: orderError } = await supabase.from('orders').update({ 
        itens: newItens, 
        total: Number(newTotal) 
      }).eq('id', orderId);
      
      if (orderError) throw orderError;

      if (!isCombo) {
        await supabase.from('products').update({ 
          qtd: Math.max(0, Number(product.qtd) - stockDeduction) 
        }).eq('id', productId);
      }

      addNotification("Lançado!", "success");
      fetchData();
    } catch (err) {
      addNotification("Erro ao lançar", "error");
    }
  };

  const handleFinishOrder = async (orderId: number, paymentInput: any) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const timestamp = new Date().toISOString();
    
    if (order.status === 'consumo_interno') {
      try {
        await supabase.from('orders').update({ status: 'fechado', pagamento: 'CONSUMO INTERNO', data: timestamp }).eq('id', orderId);
        addNotification("Consumo interno finalizado!", "success");
        fetchData();
        return;
      } catch (err) {
        addNotification("Erro ao fechar consumo", "error");
        return;
      }
    }

    let payments = typeof paymentInput === 'string' ? [{ type: paymentInput, value: Number(order.total) }] : paymentInput;
    const resumoPagto = payments.map((p:any) => `${p.type}: R$${Number(p.value).toFixed(2)}`).join(", ");

    try {
      const { error: updateError } = await supabase.from('orders').update({ 
        status: 'fechado', 
        pagamento: resumoPagto, 
        data: timestamp,
        total: Number(order.total)
      }).eq('id', orderId);
      
      if (updateError) throw updateError;

      const cashEntriesToInsert = payments.map((p:any) => ({ 
        cliente: order.cliente, 
        forma: p.type, 
        valor: Number(p.value), 
        data: timestamp, 
        itens: order.itens 
      }));

      const { error: cashError } = await supabase.from('cash_entries').insert(cashEntriesToInsert);
      if (cashError) throw cashError;

      addNotification("Comanda fechada!", "success");
      fetchData();
    } catch (err: any) {
      addNotification("Erro ao encerrar", "error");
    }
  };

  const hasAccess = (tab: Tab) => {
    if (userRole === 'admin') return true;
    if (tab === Tab.Donos) return true;
    const perms: any = atendentePermissions;
    return perms[tab] || false;
  };

  if (!user && !loading) return <LoginScreen onLoginSuccess={() => {}} />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {loading ? (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
          <Loader2 className="w-16 h-16 text-[#FFD700] animate-spin mb-4" />
          <p className="text-[#FFD700] font-black uppercase text-[10px] tracking-widest animate-pulse">Iniciando Terminal...</p>
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
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{syncing ? 'Sincronizando...' : 'Conectado'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={fetchData} className="p-2.5 bg-zinc-900 rounded-xl text-zinc-400 hover:text-[#FFD700] transition-all"><RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} /></button>
               <button onClick={() => supabase.auth.signOut()} className="p-2.5 bg-red-950/20 border border-red-900/20 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all"><LogOut className="w-5 h-5" /></button>
            </div>
          </header>

          <div className="fixed top-24 right-4 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
            {notifications.map(n => (
              <div key={n.id} className="pointer-events-auto bg-[#141414] border-l-4 border-[#FFD700] p-5 rounded-r-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-full">
                <p className="text-[10px] font-black uppercase text-white tracking-widest">{n.message}</p>
              </div>
            ))}
          </div>
          
          <main className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
            {activeTab === Tab.Menu && hasAccess(Tab.Menu) && <MenuSection products={products} />}
            {activeTab === Tab.Sales && hasAccess(Tab.Sales) && (
              <SalesSection 
                orders={orders} products={products} salesHistory={salesHistory} 
                onCreateOrder={handleCreateOrder} onAddItem={handleAddItemToOrder} 
                onFinishOrder={handleFinishOrder} onQuickSale={handleQuickSale} onVoidSale={() => {}} 
              />
            )}
            {activeTab === Tab.Orders && hasAccess(Tab.Orders) && (
              <OrdersSection 
                orders={orders} 
                onReady={async (id) => { await supabase.from('orders').update({status:'pronto'}).eq('id',id); fetchData(); }} 
                onCloseOrder={handleFinishOrder} onDelete={handleDeleteOrder} onRemoveItem={handleRemoveItemFromOrder}
              />
            )}
            {activeTab === Tab.Donos && hasAccess(Tab.Donos) && (
              <DonosSection 
                orders={orders} products={products} 
                onCreateOwnerOrder={(name) => handleCreateOrder(name, '', 'consumo_interno')} 
                onAddItem={handleAddItemToOrder} 
                onFinishOrder={handleFinishOrder} 
                onRemoveItem={handleRemoveItemFromOrder}
                onDelete={handleDeleteOrder}
              />
            )}
            {activeTab === Tab.Cashier && hasAccess(Tab.Cashier) && <CashierSection entries={cashier} salesHistory={salesHistory} />}
            {activeTab === Tab.Admin && hasAccess(Tab.Admin) && <AdminSection products={products} onUpsertProduct={handleUpsertProduct} onDeleteProduct={handleDeleteProduct} />}
            {activeTab === Tab.Team && userRole === 'admin' && <TeamSection atendentePermissions={atendentePermissions} onUpdatePermissions={async (p) => { await supabase.from('system_configs').upsert({key:'atendente_permissions', value:p}); setAtendentePermissions(p); }} />}
          </main>

          <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-900 flex justify-around p-3 z-50 overflow-x-auto no-scrollbar">
            <NavButton active={activeTab === Tab.Menu} onClick={() => setActiveTab(Tab.Menu)} icon={<List />} label="Cardápio" />
            <NavButton active={activeTab === Tab.Sales} onClick={() => setActiveTab(Tab.Sales)} icon={<ShoppingCart />} label="Vendas" />
            <NavButton active={activeTab === Tab.Orders} onClick={() => setActiveTab(Tab.Orders)} icon={<Package />} label="Pedidos" badge={orders.filter(o => o.status === 'aberto' || o.status === 'pronto').length} />
            <NavButton active={activeTab === Tab.Donos} onClick={() => setActiveTab(Tab.Donos)} icon={<Star />} label="Donos" />
            <NavButton active={activeTab === Tab.Cashier} onClick={() => setActiveTab(Tab.Cashier)} icon={<DollarSign />} label="Caixa" />
            <NavButton active={activeTab === Tab.Admin} onClick={() => setActiveTab(Tab.Admin)} icon={<Settings />} label="Estoque" />
            {userRole === 'admin' && <NavButton active={activeTab === Tab.Team} onClick={() => setActiveTab(Tab.Team)} icon={<Users />} label="Equipe" />}
          </nav>
        </>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, badge }: any) => (
  <button onClick={onClick} className="relative flex flex-col items-center gap-1.5 px-4 py-2 flex-shrink-0">
    <div className={`p-3 rounded-2xl transition-all ${active ? 'bg-[#FFD700] text-black scale-110' : 'text-zinc-700'}`}>{icon}</div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-[#FFD700]' : 'text-zinc-800'}`}>{label}</span>
    {badge > 0 && <span className="absolute top-2 right-3 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black border-2 border-black">{badge}</span>}
  </button>
);

export default App;
