
import React, { useState, useMemo } from 'react';
import { Plus, ShoppingBag, Search, History, Check, UserPlus, Smartphone, CheckCircle2, Wallet, X } from 'lucide-react';
import { Order, Product } from '../types';

interface Props {
  orders: Order[];
  products: Product[];
  salesHistory: Order[];
  onCreateOrder: (name: string, phone: string) => void;
  onAddItem: (orderId: number, productId: string, qty: number) => void;
  onFinishOrder: (orderId: number, payments: any) => void;
  onVoidSale: (id: number) => void;
}

const SalesSection: React.FC<Props> = ({ orders, products, salesHistory, onCreateOrder, onAddItem, onFinishOrder, onVoidSale }) => {
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [qty, setQty] = useState<number | string>(1); // Permitir string para edição livre
  const [closingOrder, setClosingOrder] = useState<Order | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.nome.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'fechado'), [orders]);

  const handleCreate = () => {
    if (!newName) return alert("Informe o nome");
    onCreateOrder(newName, newPhone.replace(/\D/g, ''));
    setNewName(''); setNewPhone('');
  };

  const handleAddItem = () => {
    if (!selectedOrder || !selectedProduct) return;
    const finalQty = Math.max(1, parseInt(qty.toString()) || 1);
    onAddItem(parseInt(selectedOrder), selectedProduct, finalQty);
    setQty(1); setSelectedProduct(''); setProductSearch('');
  };

  return (
    <div className="space-y-6">
      {closingOrder && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-[#1a1a1a] rounded-[2.5rem] p-8 border border-[#FFD700]/30 shadow-2xl relative">
            <button onClick={() => setClosingOrder(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h3 className="text-[#FFD700] font-black uppercase text-center mb-8 tracking-widest">Finalizar Pagamento</h3>
            <div className="space-y-4">
              {['Pix', 'Cartão', 'Dinheiro'].map(type => (
                <button key={type} onClick={() => { onFinishOrder(closingOrder.id, type); setClosingOrder(null); }} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-5 rounded-2xl flex justify-between items-center transition-all group">
                  <span className="text-white font-black uppercase text-xs">{type}</span>
                  <span className="text-[#FFD700] font-black">R$ {closingOrder.total.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#141414] p-6 rounded-[2rem] border border-zinc-800 shadow-2xl">
        <h2 className="text-white font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-3"><UserPlus className="w-5 h-5 text-[#FFD700]"/> Novo Atendimento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input type="text" placeholder="Nome do Cliente" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-[#FFD700]" />
          <input type="text" placeholder="WhatsApp" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-[#FFD700]" />
        </div>
        <button onClick={handleCreate} className="w-full bg-[#FFD700] text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Abrir Comanda</button>
      </div>

      <div className="bg-[#141414] p-6 rounded-[2rem] border border-zinc-800 shadow-2xl">
        <h2 className="text-[#FFD700] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingBag className="w-4 h-4"/> Lançar Itens</h2>
        <div className="grid grid-cols-1 gap-3 mb-4">
          <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white outline-none">
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
              onFocus={(e) => e.target.select()} // Seleciona tudo ao clicar
              onChange={e => setQty(e.target.value)} // Permite apagar livremente
              onBlur={() => { if (!qty || Number(qty) < 1) setQty(1); }} // Valida ao sair do campo
              className="w-20 bg-black border border-zinc-800 rounded-2xl p-4 text-white text-center font-bold outline-none focus:border-[#FFD700]" 
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => setSelectedProduct(p.id)} className={`p-3 rounded-xl border text-left flex flex-col transition-all ${selectedProduct === p.id ? 'border-[#FFD700] bg-zinc-900' : 'border-zinc-800 bg-black'}`}>
                <span className="font-bold text-[10px] truncate text-white">{p.nome}</span>
                <span className="text-[#FFD700] text-[9px] font-black">R$ {p.preco.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
        <button disabled={!selectedOrder || !selectedProduct} onClick={handleAddItem} className="w-full bg-[#FFD700] disabled:opacity-30 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Lançar Item</button>
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
  );
};

export default SalesSection;
