
import React, { useState, useMemo, useRef } from 'react';
import { Package, Search, Edit2, Trash2, FileSpreadsheet, Loader2, Upload, Download, X, Save, FileText, Plus, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import * as XLSX from 'xlsx';

interface Props {
  products: Product[];
  onUpsertProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

const AdminSection: React.FC<Props> = ({ products, onUpsertProduct, onDeleteProduct }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [custo, setCusto] = useState('');
  const [qtd, setQtd] = useState('');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setNome(p.nome);
    setPreco(p.preco.toString());
    setCusto(p.custo.toString());
    setQtd(p.qtd.toString());
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    setNome(''); setPreco(''); setCusto(''); setQtd('');
  };

  const handleSaveProduct = async () => {
    const cleanNome = nome.trim();
    if (!cleanNome || !preco) return alert("Nome e Preço são obrigatórios.");
    
    setIsSaving(true);
    try {
      const payload: any = {
        nome: cleanNome,
        preco: Number(preco.toString().replace(',', '.')),
        custo: Number(custo.toString().replace(',', '.')) || 0,
        qtd: parseInt(qtd.toString()) || 0
      };

      if (editingId) payload.id = editingId;
      
      await onUpsertProduct(payload);
      handleCancel();
    } catch (err: any) {
      alert("Erro ao validar dados: certifique-se de usar números válidos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [{ nome: "EXEMPLO PRODUTO", preco: 10.50, custo: 5.00, qtd: 100 }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "MODELO_IMPORTACAO_ADEGA.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
        
        let count = 0;
        for (const item of data) {
          const pName = item.nome || item.Nome || item.NOME;
          if (pName) {
            await onUpsertProduct({
              nome: String(pName).trim(),
              preco: Number(item.preco || item.Preço || item.PRECO || 0),
              custo: Number(item.custo || item.Custo || item.CUSTO || 0),
              qtd: Number(item.qtd || item.Quantidade || item.QTD || 0)
            });
            count++;
          }
        }
        alert(`${count} produtos importados com sucesso!`);
      } catch (err) {
        alert("Erro ao ler arquivo XLSX. Use o modelo padrão.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[#FFD700] font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
            <Package className="w-8 h-8"/> Almoxarifado
          </h2>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Gestão de Itens e Insumos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-600/20 rounded-xl text-[9px] font-black uppercase text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
            <FileText className="w-4 h-4" /> Modelo
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-black uppercase text-zinc-400 hover:text-[#FFD700] transition-all disabled:opacity-20">
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />} Importar
          </button>
          <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${showForm ? 'bg-zinc-800 text-zinc-400' : 'bg-[#FFD700] text-black hover:scale-105 shadow-lg shadow-yellow-500/10'}`}>
            {showForm ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
            {showForm ? 'Fechar' : 'Novo'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#111111] p-8 rounded-[3rem] border border-zinc-800 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Identificação do Produto</label>
              <input type="text" placeholder="Ex: Cerveja Antarctica" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Valor de Venda (R$)</label>
              <input type="text" placeholder="0,00" value={preco} onChange={e => setPreco(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Custo de Aquisição (R$)</label>
              <input type="text" placeholder="0,00" value={custo} onChange={e => setCusto(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Volume em Estoque</label>
              <input type="number" placeholder="0" value={qtd} onChange={e => setQtd(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCancel} className="flex-1 bg-zinc-900 text-zinc-400 font-black py-5 rounded-3xl uppercase text-xs border border-zinc-800">Descartar</button>
            <button onClick={handleSaveProduct} disabled={isSaving} className="flex-[2] bg-[#FFD700] text-black font-black py-5 rounded-3xl uppercase text-xs tracking-[0.4em] shadow-2xl flex justify-center items-center gap-3 disabled:opacity-30">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>} {editingId ? 'Salvar Edição' : 'Concluir Cadastro'}
            </button>
          </div>
        </div>
      )}

      <div className="relative group">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-[#FFD700] transition-colors" />
         <input type="text" placeholder="Pesquisar por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800 rounded-[2rem] p-5 pl-16 text-white text-sm focus:border-[#FFD700] outline-none shadow-inner" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredProducts.map(p => (
          <div key={p.id} className="bg-[#111111] p-6 rounded-[2rem] border border-zinc-900 flex justify-between items-center group hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-xl text-zinc-600 group-hover:text-[#FFD700] transition-colors">{p.nome[0].toUpperCase()}</div>
              <div>
                <div className="font-black text-white uppercase text-sm tracking-widest">{p.nome}</div>
                <div className="flex gap-6 mt-2">
                  <span className="text-[#FFD700] text-[10px] font-black tracking-widest">R$ {Number(p.preco).toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.qtd < 5 ? 'text-red-500' : 'text-zinc-500'}`}>Estoque: {p.qtd}</span>
                    {p.qtd < 5 && <AlertTriangle className="w-3 h-3 text-red-500" />}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => handleEdit(p)} className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-colors"><Edit2 className="w-4 h-4"/></button>
               <button onClick={() => confirm(`Excluir ${p.nome}?`) && onDeleteProduct(p.id)} className="p-3 bg-red-950/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 border border-dashed border-zinc-900 rounded-[3rem]">
            <Package className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-700 font-black uppercase text-[10px] tracking-widest">Nenhum produto em estoque</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSection;
