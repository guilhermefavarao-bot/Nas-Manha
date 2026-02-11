
import React, { useState, useMemo } from 'react';
import { Star, UserPlus, Search, Plus, Trash2, CheckCircle2, X, ShoppingBag } from 'lucide-react';
import { Order, Product, ItemPedido } from '../types';

interface Props {
  orders: Order[];
  products: Product[];
  onCreateOwnerOrder: (name: string) => void;
  onAddItem: (orderId: number, productId: string, qty: number) => void;
  onFinishOrder: (orderId: number, payment: any) => void;
  onRemoveItem: (orderId: number, itemIdx: number) => void;
  onDelete: (orderId: number) => void;
}

const DonosSection: React.FC<Props> = ({ orders, products, onCreateOwnerOrder, onAddItem, onFinishOrder, onRemoveItem, onDelete }) => {
  const [ownerName, setOwnerName] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [qty, setQty] = useState<number | string>(1);

  const ownerOrders = useMemo(() => orders.filter(o => o.status === 'consumo_interno'), [orders]);
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.nome.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const handleCreate = () => {
    if (!ownerName.trim()) return alert("Informe quem está retirando");
    onCreateOwnerOrder(ownerName.trim());
    setOwnerName('');
  };

  const handleAddItem = () => {
    if (!selectedOrder || !selectedProduct) return;
    onAddItem(parseInt(selectedOrder), selectedProduct, Number(qty));
    setQty(1); setSelectedProduct(''); setProductSearch('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabeçalho Donos */}
      <div className="bg-gradient-to-r from-blue-900/20 to-black p-8 rounded-[2rem] border border-blue-900/30">
        <h2 className="text-blue-400 font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
          <Star className="w-8 h-8 fill-blue-400" /> Consumo de Sócios
        </h2>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Retiradas para uso interno (Não gera faturamento)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Abrir Nova Comanda de Dono */}
        <div className="bg-[#141414] p-6 rounded-[2rem] border border-zinc-800 space-y-4">
          <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-400" /> Abrir Comanda de Dono
          </h3>
          <input 
            type="text" 
            placeholder="Nome do Dono/Sócio" 
            value={ownerName} 
            onChange={e => setOwnerName(e.target.value)} 
            className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white outline-none focus:border-blue-500" 
          />
          <button onClick={handleCreate} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-blue-900/10">Abrir Comanda</button>
        </div>

        {/* Lançar Itens na Comanda de Dono */}
        <div className="bg-[#141414] p-6 rounded-[2rem] border border-zinc-800 space-y-4">
          <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-400" /> Registrar Itens
          </h3>
          <select 
            value={selectedOrder} 
            onChange={e => setSelectedOrder(e.target.value)} 
            className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white outline-none appearance-none"
          >
            <option value="">Selecione a comanda ativa...</option>
            {ownerOrders.map(o => <option key={o.id} value={o.id}>{o.cliente} (Consumo)</option>)}
          </select>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
              <input 
                type="text" 
                placeholder="Buscar produto..." 
                value={productSearch} 
                onChange={e => setProductSearch(e.target.value)} 
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 pl-12 text-white outline-none focus:border-blue-500" 
              />
            </div>
            <input 
              type="number" 
              value={qty} 
              onChange={e => setQty(e.target.value)} 
              className="w-20 bg-black border border-zinc-800 rounded-2xl p-4 text-white text-center font-bold outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {filteredProducts.slice(0, 10).map(p => (
              <button 
                key={p.id} 
                onClick={() => setSelectedProduct(p.id)} 
                className={`p-3 rounded-xl border text-left flex flex-col transition-all ${selectedProduct === p.id ? 'border-blue-500 bg-blue-900/10' : 'border-zinc-800 bg-black'}`}
              >
                <span className="font-bold text-[10px] truncate text-white">{p.nome}</span>
                <span className="text-zinc-600 text-[8px] font-black uppercase">Estoque: {p.qtd.toFixed(1)}</span>
              </button>
            ))}
          </div>
          <button 
            disabled={!selectedOrder || !selectedProduct} 
            onClick={handleAddItem} 
            className="w-full bg-blue-600 disabled:opacity-30 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs"
          >
            Lançar Consumo
          </button>
        </div>
      </div>

      {/* Comandas Ativas de Donos */}
      <div className="space-y-4 pt-4">
        <h3 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-2 px-2">
          <Star className="w-4 h-4 text-blue-400" /> Comandas de Consumo Interno
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {ownerOrders.map(order => (
            <div key={order.id} className="bg-[#141414] border border-blue-900/20 rounded-3xl p-6 shadow-xl group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-white uppercase text-lg">{order.cliente}</h4>
                  <div className="text-zinc-600 text-[9px] font-black uppercase mt-1">
                    Retirado em {new Date(order.data).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onDelete(order.id)}
                    className="p-3 bg-red-950/20 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onFinishOrder(order.id, 'Cortesia')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Finalizar
                  </button>
                </div>
              </div>

              <div className="bg-black/40 rounded-2xl border border-zinc-900 p-4 space-y-2">
                {order.itens.length === 0 && <p className="text-center py-4 text-zinc-700 text-[10px] font-black uppercase">Nenhum item lançado ainda</p>}
                {order.itens.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group/item">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-400 font-black text-xs">{item.qtd}x</span>
                      <span className="text-zinc-400 text-xs font-bold uppercase">{item.nome}</span>
                    </div>
                    <button onClick={() => onRemoveItem(order.id, idx)} className="opacity-0 group-hover/item:opacity-100 text-zinc-700 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {ownerOrders.length === 0 && (
            <div className="text-center py-20 border border-dashed border-zinc-900 rounded-[3rem]">
              <p className="text-zinc-700 font-black uppercase text-[10px] tracking-widest">Nenhuma comanda de dono aberta</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonosSection;
