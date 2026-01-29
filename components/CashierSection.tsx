
import React, { useState, useMemo } from 'react';
import { DollarSign, Wallet, CreditCard, Landmark, TrendingUp, Calendar, ArrowRight, FileSpreadsheet, Info, Loader2, Package } from 'lucide-react';
import { CashEntry, Order } from '../types';
import * as XLSX from 'xlsx';

interface Props {
  entries: CashEntry[];
  salesHistory: Order[];
}

const CashierSection: React.FC<Props> = ({ entries, salesHistory }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [isExporting, setIsExporting] = useState(false);

  const isInRange = (dateStr: string) => {
    if (!dateStr) return false;
    const itemDate = dateStr.split('T')[0];
    return itemDate >= startDate && itemDate <= endDate;
  };

  const { metrics, costFiltered, profitFiltered, entriesFiltered } = useMemo(() => {
    const filteredEntries = entries.filter(e => isInRange(e.data));
    const filteredSales = salesHistory.filter(s => isInRange(s.data));

    const m = filteredEntries.reduce((acc, curr) => {
      acc.revenue += curr.valor;
      const forma = curr.forma.toLowerCase();
      if (forma.includes('pix')) acc.pix += curr.valor;
      else if (forma.includes('cartão') || forma.includes('cartao')) acc.cartao += curr.valor;
      else if (forma.includes('dinheiro')) acc.dinheiro += curr.valor;
      return acc;
    }, { revenue: 0, pix: 0, cartao: 0, dinheiro: 0 });

    const totalCost = filteredSales.reduce((acc, sale) => {
      const saleCost = sale.itens?.reduce((itemAcc, item) => {
        return itemAcc + ((item.custo || 0) * item.qtd);
      }, 0) || 0;
      return acc + saleCost;
    }, 0);

    return {
      metrics: m,
      costFiltered: totalCost,
      profitFiltered: m.revenue - totalCost,
      entriesFiltered: filteredEntries
    };
  }, [entries, salesHistory, startDate, endDate]);

  const handleSetToday = () => {
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  const handleThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleExportXLSX = () => {
    if (entriesFiltered.length === 0) {
      return alert("Não existem dados para exportar no período selecionado.");
    }

    setIsExporting(true);
    
    try {
      const resumoData = [
        { "DESCRICAO": "RELATORIO FINANCEIRO - ADEGA NAS MANHA", "VALOR": "" },
        { "DESCRICAO": "Periodo", "VALOR": `${formatDate(startDate)} a ${formatDate(endDate)}` },
        { "DESCRICAO": "", "VALOR": "" },
        { "DESCRICAO": "FATURAMENTO BRUTO TOTAL", "VALOR": metrics.revenue.toFixed(2) },
        { "DESCRICAO": "LUCRO ESTIMADO", "VALOR": profitFiltered.toFixed(2) },
        { "DESCRICAO": "CUSTO TOTAL DE MERCADORIA", "VALOR": costFiltered.toFixed(2) },
        { "DESCRICAO": "", "VALOR": "" },
        { "DESCRICAO": "VALOR EM PIX", "VALOR": metrics.pix.toFixed(2) },
        { "DESCRICAO": "VALOR EM CARTAO", "VALOR": metrics.cartao.toFixed(2) },
        { "DESCRICAO": "VALOR EM DINHEIRO", "VALOR": metrics.dinheiro.toFixed(2) },
        { "DESCRICAO": "TOTAL DE VENDAS", "VALOR": entriesFiltered.length }
      ];

      const detalhesData = entriesFiltered.map(entry => {
        return {
          "Data": new Date(entry.data).toLocaleDateString('pt-BR'),
          "Hora": new Date(entry.data).toLocaleTimeString('pt-BR'),
          "Cliente": entry.cliente,
          "Forma": entry.forma,
          "Valor (R$)": entry.valor.toFixed(2),
          "Produtos": entry.itens?.map(i => `${i.qtd}x ${i.nome}`).join(", ") || ""
        };
      });

      const wb = XLSX.utils.book_new();
      const wsResumo = XLSX.utils.json_to_sheet(resumoData);
      const wsDetalhes = XLSX.utils.json_to_sheet(detalhesData);
      
      wsResumo['!cols'] = [{ wch: 40 }, { wch: 20 }];
      wsDetalhes['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 50 }];

      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");
      XLSX.utils.book_append_sheet(wb, wsDetalhes, "Vendas_Detalhadas");
      
      const fileName = `RELATORIO_ADEGA_${startDate}_A_${endDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (err) {
      console.error("Erro ao exportar:", err);
      alert("Erro ao gerar o arquivo Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#141414] p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-[#FFD700] font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Controle de Período
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handleSetToday} className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 font-black uppercase px-3 py-2 rounded-xl border border-zinc-800 transition-all">Hoje</button>
            <button onClick={handleThisMonth} className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-400 font-black uppercase px-3 py-2 rounded-xl border border-zinc-800 transition-all">Mês</button>
            <button 
              onClick={handleExportXLSX}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${isExporting ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : 'bg-green-600/10 border-green-600/20 text-green-500 hover:bg-green-600 hover:text-white'}`}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {isExporting ? 'Processando...' : 'Exportar Relatório'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[8px] text-zinc-600 font-black uppercase ml-1">Início</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[#FFD700] outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] text-zinc-600 font-black uppercase ml-1">Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[#FFD700] outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#141414] to-black p-8 rounded-[2rem] border border-zinc-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <TrendingUp className="w-24 h-24 text-[#FFD700]" />
          </div>
          <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Faturamento Total</div>
          <div className="text-5xl font-black text-[#FFD700] tracking-tighter">R$ {metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          
          <div className="mt-8 flex items-center gap-4">
            <div className="bg-black/50 border border-zinc-800 p-3 rounded-2xl min-w-[140px]">
              <div className="text-[8px] text-zinc-600 font-black uppercase mb-1">Lucro Estimado</div>
              <div className={`text-lg font-black ${profitFiltered >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                R$ {profitFiltered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex-1 text-[9px] text-zinc-700 font-medium leading-tight">
              <Info className="w-3 h-3 mb-1" />
              Calculado sobre {entriesFiltered.length} vendas no período.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <MiniStat icon={<Landmark className="text-blue-400 w-4 h-4"/>} label="Pix" value={metrics.pix} color="border-blue-500/20 bg-blue-500/5 text-blue-400" />
          <MiniStat icon={<CreditCard className="text-purple-400 w-4 h-4"/>} label="Cartão" value={metrics.cartao} color="border-purple-500/20 bg-purple-500/5 text-purple-400" />
          <MiniStat icon={<Wallet className="text-yellow-500 w-4 h-4"/>} label="Dinheiro" value={metrics.dinheiro} color="border-yellow-500/20 bg-yellow-500/5 text-yellow-500" />
        </div>
      </div>

      <div className="bg-[#141414] rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-black/20">
          <h2 className="text-white font-black uppercase text-[10px] tracking-widest">Entradas Detalhadas</h2>
          <span className="text-[9px] font-black text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full uppercase">
            {entriesFiltered.length} Itens
          </span>
        </div>
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          {entriesFiltered.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <DollarSign className="w-10 h-10 text-zinc-800 mx-auto" />
              <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">Nenhuma movimentação neste período</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900">
              {[...entriesFiltered].reverse().map(entry => (
                <div key={entry.id} className="p-5 flex flex-col gap-3 hover:bg-zinc-800/20 transition-all group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-transform group-hover:scale-110 ${
                        entry.forma.toLowerCase().includes('pix') ? 'bg-blue-900/20 text-blue-400' :
                        entry.forma.toLowerCase().includes('cart') ? 'bg-purple-900/20 text-purple-400' :
                        'bg-yellow-900/20 text-yellow-500'
                      }`}>
                        {entry.forma[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-white uppercase text-xs">{entry.cliente}</div>
                        <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-tight mt-1">
                          {entry.forma} • {new Date(entry.data).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white group-hover:text-[#FFD700] transition-colors">
                        R$ {entry.valor.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* LISTA DE PRODUTOS DIRETO DA CASH_ENTRY */}
                  {entry.itens && entry.itens.length > 0 && (
                    <div className="ml-16 bg-black/40 rounded-xl border border-zinc-900 p-3 space-y-1">
                      <div className="text-[8px] font-black text-zinc-700 uppercase mb-1 flex items-center gap-1.5">
                        <Package className="w-3 h-3" /> Itens da Venda
                      </div>
                      {entry.itens.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px]">
                          <span className="text-zinc-400 font-medium">{item.qtd}x {item.nome}</span>
                          <span className="text-zinc-600 font-mono">R$ {((Number(item.preco) || 0) * (Number(item.qtd) || 0)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-2xl border flex items-center gap-4 shadow-lg transition-transform hover:scale-102 ${color}`}>
    <div className="p-3 bg-black/40 rounded-xl">{icon}</div>
    <div>
      <div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</div>
      <div className="text-lg font-black">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </div>
  </div>
);

export default CashierSection;
