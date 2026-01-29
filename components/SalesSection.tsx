
import React, { useState, useMemo } from 'react';
/* Added ShoppingCart to the import list from lucide-react */
import { Plus, ShoppingBag, Search, History, Check, UserPlus, Smartphone, CheckCircle2, Wallet, X, Zap, ListChecks, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';
import { Order, Product, ItemPedido } from '../types';

interface Props {
  orders: Order[];
  products: Product[];
  salesHistory: Order[];
  onCreateOrder: (name: string, phone: string) => void;
  onAddItem: (orderId: number, productId: string, qty: number) => void;
  onFinishOrder: (orderId: number, payments: any) => void;
  onQuickSale: (items: ItemPedido[], total: number, paymentType: string) => void;
  onVoidSale: (id: number) => void;
}

const SalesSection: React.FC<Props> = ({ orders, products, salesHistory, onCreateOrder, onAddItem, onFinishOrder, onQuickSale, onVoidSale }) => {
  const [saleMode, setSaleMode] = useState<'direta' | 'comanda'>('direta');
  
  // States para Comanda
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  
  // States para Venda Direta (Carrinho)
  const [cart, setCart] = useState<ItemPedido[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // States comuns
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [qty, setQty] = useState<number | string>(1);
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.nome.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'fechado'), [orders]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
  }, [cart]);

  const handleCreate = () => {
    if (!newName) return alert("Informe o nome");
    onCreateOrder(newName, newPhone.replace(/\D/g, ''));
    setNewName(''); setNewPhone('');
  };

  const handleAddItemToComanda = () => {
    if (!selectedOrder || !selectedProduct) return;
    const finalQty = Math.max(1, parseInt(qty.toString()) || 1);
    onAddItem(parseInt(selectedOrder), selectedProduct, finalQty);
    setQty(1); setSelectedProduct(''); setProductSearch('');
  };

  const handleAddToCart = (product: Product) => {
    const finalQty = Math.max(1, parseInt(qty.toString()) || 1);
    const existingIndex = cart.findIndex(item => item.nome === product.nome);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].qtd += finalQty;
      setCart(newCart);
    } else {
      setCart([...cart, { 
        nome: product.nome, 
        qtd: finalQty, 
        preco: product.preco,
        custo: product.custo 
      }]);
    }
    setQty(1);
    setSelectedProduct('');
    setProductSearch('');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalizeQuickSale = (paymentType: string) => {
    onQuickSale(cart, cartTotal, paymentType);
    setCart([]);
    setShowPaymentModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Modo de Venda */}
      <div className="flex p-1.5 bg-[#141414] rounded-2xl border border-zinc-900">
        <button 
          onClick={() => setSaleMode('direta')}
          className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${saleMode === 'direta' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-zinc-600'}`}
        >
          <Zap className="w-4 h-4" /> Venda Rápida
        </button>
        <button 
          onClick={() => setSaleMode('comanda')}
          className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${saleMode === 'comanda' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-zinc-600'}`}
        >
          <ListChecks className="w-4 h-4" /> Comandas
        </button>
      </div>

      {/* MODALS PAGAMENTO */}
      {(showPaymentModal || closingOrder) && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#1a1a1a] rounded-[2.5rem] p-8 border border-[#FFD700]/30 shadow-2xl relative">
            <button onClick={() => { setShowPaymentModal(false); setClosingOrder(null); }} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h3 className="text-[#FFD700] font-black uppercase text-center mb-8 tracking-widest">Finalizar Pagamento</h3>
            <div className="space-y-4">
              {['Pix', 'Cartão', 'Dinheiro'].map(type => (
                <button 
                  key={type} 
                  onClick={() => { 
                    if (saleMode === 'direta') handleFinalizeQuickSale(type);
                    else if (closingOrder) { onFinishOrder(closingOrder.id, type); setClosingOrder(null); }
                  }} 
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center transition-all group"
                >
                  <span className="text-white font-black uppercase text-xs">{type}</span>
                  <span className="text-[#FFD700] font-black text-lg">R$ {(saleMode === 'direta' ? cartTotal : (closingOrder?.total || 0)).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO: VENDA DIRETA */}
      {saleMode === 'direta' ? (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <div className="bg-[#141414] p-6 rounded-[2rem] border border-zinc-800 shadow-2xl">
            <h2 className="text-white font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#FFD700]"/> Escolher Produtos
            </h2>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                <input 
                  type="text" 
                  placeholder="Buscar produto..." 
                  value={productSearch} 
                  onChange={e => setProductSearch(e.target.value)} 
                  className="w-full bg-black border border-zinc-800 rounded-2xl p-4 pl-12 text-white outline-none focus:border-[#FFD700]" 
                />
              </div>
              <input 
                type="number" 
                min="1"
                value={qty} 
                onFocus={(e) => e.target.select()}
                onChange={e => setQty(e.target.value)}
                className="w-20 bg-black border border-zinc-800 rounded-2xl p-4 text-white text-center font-bold outline-none focus:border-[#FFD700]" 
              />
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {filteredProducts.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => handleAddToCart(p)} 
                  className="p-3 rounded-xl border border-zinc-800 bg-black hover:border-[#FFD700] hover:bg-zinc-900 flex flex-col transition-all group"
                >
                  <span className="font-bold text-[10px] truncate text-white group-hover:text-[#FFD700]">{p.nome}</span>
                  <span className="text-zinc-500 text-[9px] font-black mt-1">R$ {p.preco.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Carrinho de Venda Rápida */}
          <div className="bg-[#141414] p-6 rounded-[2rem] border border-zinc-800 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#FFD700]"/> Carrinho de Venda
              </h2>
              <span className="text-[10px] font-black text-zinc-600 bg-black px-3 py-1 rounded-full uppercase">{cart.length} Itens</span>
            </div>

            <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-zinc-900 group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-black text-[#FFD700]">{item.qtd}x</div>
                    <span className="text-xs font-bold text-white uppercase">{item.nome}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-zinc-400">R$ {(item.preco * item.qtd).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(idx)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="py-10 text-center text-zinc-800 text-[10px] font-black uppercase tracking-widest">Seu carrinho está vazio</div>
              )}
            </div>

            <div className="pt-6 border-t border-zinc-900 flex flex-col gap-4">
              <div className="flex justify-between items-end px-2">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total da Venda</span>
                <span className="text-4xl font-black text-[#FFD700] tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                disabled={cart.length === 0}
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-[#FFD700] disabled:opacity-20 text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl shadow-yellow-500/10 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Finalizar Venda <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CONTEÚDO: COMANDAS (EVENTOS) */
        <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
          <div className="bg-[#141414] p-6 rounded-[2rem] border border-zinc-800 shadow-2xl">
            <h2 className="text-white font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-3"><UserPlus className="w-5 h-5 text-[#FFD700]"/> Novo Atendimento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nome do Cliente" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-[#FFD700]" />
              <input type="text" placeholder="WhatsApp" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-[#FFD700]" />
            </div>
            <button onClick={handleCreate} className="w-full bg-[#FFD700] text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-yellow-500/10">Abrir Comanda</button>
          </div>

          <div className="bg-[#141414] p-6 rounded-[2rem] border border-zinc-800 shadow-2xl">
            <h2 className="text-[#FFD700] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4"/> Lançar Itens na Comanda</h2>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white outline-none appearance-none">
                <option value="">Selecione a comanda...</option>
                {activeOrders.map(o => <option key={o.id} value={o.id}>{o.cliente} (R$ {o.total.toFixed(2)})</option>)}
              </select>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                  <input type="text" placeholder="Buscar produto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 pl-12 text-white outline-none" />
                </div>
                <input 
                  type="number" 
                  min="1"
                  value={qty} 
                  onFocus={(e) => e.target.select()}
                  onChange={e => setQty(e.target.value)}
                  className="w-20 bg-black border border-zinc-800 rounded-2xl p-4 text-white text-center font-bold outline-none focus:border-[#FFD700]" 
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => setSelectedProduct(p.id)} className={`p-3 rounded-xl border text-left flex flex-col transition-all ${selectedProduct === p.id ? 'border-[#FFD700] bg-zinc-900' : 'border-zinc-800 bg-black'}`}>
                    <span className="font-bold text-[10px] truncate text-white">{p.nome}</span>
                    <span className="text-[#FFD700] text-[9px] font-black">R$ {p.preco.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
            <button disabled={!selectedOrder || !selectedProduct} onClick={handleAddItemToComanda} className="w-full bg-[#FFD700] disabled:opacity-30 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Lançar Item</button>
          </div>

          <div className="space-y-4">
            <h2 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2 px-2"><History className="w-4 h-4 text-[#FFD700]"/> Comandas Ativas</h2>
            <div className="grid grid-cols-1 gap-3">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-[#141414] border border-zinc-800 rounded-3xl p-6 flex justify-between items-center group hover:border-zinc-700">
                  <div>
                    <h3 className="font-black text-white uppercase text-sm">{order.cliente}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[#FFD700] font-black text-lg">R$ {order.total.toFixed(2)}</span>
                      <span className="text-zinc-600 text-[9px] font-black uppercase">#{order.id.toString().slice(-4)}</span>
                    </div>
                  </div>
                  <button onClick={() => setClosingOrder(order)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Fechar</button>
                </div>
              ))}
              {activeOrders.length === 0 && <div className="text-center py-10 text-zinc-700 text-[10px] font-black uppercase">Nenhuma comanda aberta</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSection;
