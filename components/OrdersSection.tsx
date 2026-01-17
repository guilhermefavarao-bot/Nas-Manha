
import React, { useState, useMemo } from 'react';
import { Printer, MessageSquare, Check, Search, Trash2, Wallet, CheckCircle2, CreditCard, Landmark, Banknote, X } from 'lucide-react';
import { Order } from '../types';

interface Props {
  orders: Order[];
  onReady: (id: number) => void;
  onCloseOrder: (id: number, payment: any) => void;
  onDelete: (id: number) => void;
}

const OrdersSection: React.FC<Props> = ({ orders, onReady, onCloseOrder, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aberto' | 'pronto' | 'fechado'>('aberto');
  const [closingOrderId, setClosingOrderId] = useState<number | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return alert("Pop-ups bloqueados.");
    const itensHtml = order.itens.map(item => `<div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; font-family: monospace;"><span style="flex: 1;">${item.qtd}x ${item.nome}</span><span style="width: 80px; text-align: right;">R$ ${(item.qtd * item.preco).toFixed(2)}</span></div>`).join('');
    const htmlContent = `<html><body style="font-family: monospace; width: 80mm; margin: 0 auto; padding: 10px;"><div style="text-align: center; border-bottom: 1px dashed #000; margin-bottom: 10px;"><h2>ADEGA NAS MANHA</h2><p>PEDIDO #${order.id.toString().slice(-4)}</p></div><div style="font-size: 12px; margin-bottom: 10px;"><strong>CLIENTE:</strong> ${order.cliente.toUpperCase()}<br><strong>DATA:</strong> ${new Date(order.data).toLocaleString()}</div>${itensHtml}<div style="font-size: 18px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">TOTAL: R$ ${order.total.toFixed(2)}</div><script>window.onload=function(){window.print();window.close();}</script></body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleWhatsAppNotify = (order: Order) => {
    if (!order.telefone || order.telefone.length < 10) return alert("WhatsApp não cadastrado.");
    
    const cleanPhone = order.telefone.replace(/\D/g, '');
    const hour = new Date().getHours();
    const saudacao = hour < 12 ? 'Bom dia' : (hour < 18 ? 'Boa tarde' : 'Boa noite');
    const comandaNum = order.id.toString().slice(-4);
    
    // Formatação da lista de itens para o WhatsApp
    const itensFormatados = order.itens.map(item => `• ${item.qtd}x ${item.nome}`).join('\n');

    const message = `*ADEGA NAS MANHA* 🍻\n\n` +
      `${saudacao}, *${order.cliente}*!\n\n` +
      `Seu pedido *#${comandaNum}* está *PRONTO* para retirada! 🚀\n\n` +
      `📝 *ITENS DO PEDIDO:*\n${itensFormatados}\n\n` +
      `💰 *TOTAL:* R$ ${order.total.toFixed(2)}\n\n` +
      `Aguardamos você! 🥂`;

    window.open(`https://wa.me/${cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleConfirmClosing = (orderId: number, type: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    onCloseOrder(orderId, [{ type, value: Number(order.total) }]);
    setClosingOrderId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-[#141414] p-4 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:border-[#FFD700] outline-none" />
        </div>
        <div className="flex gap-2">
          {['aberto', 'pronto', 'fechado', 'todos'].map(status => (
            <button key={status} onClick={() => setStatusFilter(status as any)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === status ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'bg-black text-zinc-600 border-zinc-900'}`}>{status}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrders.map(order => (
          <div key={order.id} className={`bg-[#141414] border-l-4 rounded-3xl p-6 shadow-2xl transition-all relative overflow-hidden ${order.status === 'fechado' ? 'border-green-500' : order.status === 'pronto' ? 'border-blue-500' : 'border-yellow-500'}`}>
            
            {closingOrderId === order.id && (
              <div className="absolute inset-0 z-10 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                <button onClick={() => setClosingOrderId(null)} className="absolute top-4 right-4 text-zinc-500"><X className="w-6 h-6"/></button>
                <h4 className="text-[#FFD700] font-black uppercase text-xs mb-6 tracking-widest">Selecione o Pagamento</h4>
                <div className="grid grid-cols-1 w-full gap-3">
                  <button onClick={() => handleConfirmClosing(order.id, 'Pix')} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-blue-400 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-all">
                    <span className="flex items-center gap-3"><Landmark className="w-4 h-4"/> Pix</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </button>
                  <button onClick={() => handleConfirmClosing(order.id, 'Cartão')} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-purple-400 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-all">
                    <span className="flex items-center gap-3"><CreditCard className="w-4 h-4"/> Cartão</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </button>
                  <button onClick={() => handleConfirmClosing(order.id, 'Dinheiro')} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-yellow-500 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-all">
                    <span className="flex items-center gap-3"><Banknote className="w-4 h-4"/> Dinheiro</span>
                    <span>R$ {order.total.toFixed(2)}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-white uppercase text-lg">{order.cliente}</h3>
                <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-wider">PEDIDO #{order.id.toString().slice(-4)}</span>
              </div>
              <div className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${order.status === 'fechado' ? 'bg-green-500/10 text-green-500 border-green-500/20' : order.status === 'pronto' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>{order.status}</div>
            </div>
            
            <div className="space-y-2 mb-6 bg-black/40 p-4 rounded-2xl border border-zinc-900 min-h-[80px]">
              {order.itens.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-zinc-400 font-medium">{item.qtd}x {item.nome}</span>
                  <span className="text-zinc-500 font-mono">R$ {(item.qtd * item.preco).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-zinc-600 uppercase">Total</span>
                <span className="text-[#FFD700] text-2xl font-black">R$ {order.total.toFixed(2)}</span>
              </div>
              {order.pagamento && <div className="text-green-500/70 text-[9px] font-black uppercase mt-1 flex items-center gap-2"><Wallet className="w-3 h-3" /> {order.pagamento}</div>}
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => handlePrint(order)} className="flex-1 min-w-[50px] bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-white flex justify-center items-center hover:bg-zinc-800"><Printer className="w-5 h-5" /></button>
              
              {order.status === 'pronto' && (
                <>
                  <button onClick={() => handleWhatsAppNotify(order)} className="flex-1 bg-green-600 hover:bg-green-500 text-white p-4 rounded-2xl flex justify-center gap-2 items-center transition-all shadow-lg shadow-green-900/20">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Avisar</span>
                  </button>
                  
                  <button 
                    onClick={() => setClosingOrderId(order.id)} 
                    className="flex-[2] bg-[#ff5733] hover:bg-[#e64a2e] text-white p-4 rounded-2xl flex justify-center gap-2 items-center transition-all shadow-lg shadow-orange-900/20"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Fechar Comanda</span>
                  </button>
                </>
              )}

              {order.status === 'aberto' && (
                <button onClick={() => onReady(order.id)} className="flex-[3] bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl text-white flex justify-center items-center gap-3 transition-all">
                  <Check className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Marcar Pronto</span>
                </button>
              )}
              
              {order.status === 'fechado' && (
                <button onClick={() => onDelete(order.id)} className="bg-red-900/10 p-4 rounded-2xl text-red-500 border border-red-900/20 hover:bg-red-600 hover:text-white transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersSection;
