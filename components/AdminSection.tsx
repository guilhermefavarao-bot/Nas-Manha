
import React, { useState, useMemo, useRef } from 'react';
import { Package, Search, Edit2, Trash2, FileSpreadsheet, Loader2, Upload, Download, X, Save, Plus, AlertTriangle, Layers, List, CheckCircle, MinusCircle, DollarSign, Tag } from 'lucide-react';
import { Product, Category } from '../types';
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
  const [categoria, setCategoria] = useState<Category>('Adega');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponivel' | 'zerado'>('todos');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
      const isLivre = p.categoria === 'Combos' || p.categoria === 'Doses';
      const hasStock = isLivre || p.qtd > 0;
      
      if (statusFilter === 'disponivel') return matchesSearch && hasStock;
      if (statusFilter === 'zerado') return matchesSearch && !hasStock;
      return matchesSearch;
    });
  }, [products, search, statusFilter]);

  const counts = useMemo(() => {
    return products.reduce((acc, p) => {
      const isLivre = p.categoria === 'Combos' || p.categoria === 'Doses';
      if (isLivre || p.qtd > 0) acc.disponivel++;
      else acc.zerado++;
      return acc;
    }, { disponivel: 0, zerado: 0 });
  }, [products]);

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setNome(p.nome);
    setPreco(p.preco.toString());
    setCusto(p.custo ? p.custo.toString() : '0');
    setQtd(p.qtd.toString());
    setCategoria((p.categoria as Category) || 'Adega');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    setNome(''); setPreco(''); setCusto(''); setQtd(''); setCategoria('Adega');
  };

  const handleSaveProduct = async () => {
    if (isSaving) return;
    const cleanNome = nome.trim();
    if (!cleanNome || !preco) return alert("Preencha o Nome e Preço.");
    
    setIsSaving(true);
    try {
      const payload: any = {
        nome: cleanNome,
        preco: Number(preco.toString().replace(',', '.')),
        custo: Number(custo.toString().replace(',', '.')) || 0,
        qtd: parseInt(qtd.toString()) || 0,
        categoria: categoria
      };
      if (editingId) payload.id = editingId;
      await onUpsertProduct(payload);
      handleCancel();
    } catch (err: any) {
      alert("Erro ao salvar produto.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportStock = () => {
    if (products.length === 0) return alert("Estoque vazio.");
    const ws = XLSX.utils.json_to_sheet(products.map(p => ({
      "Item": p.nome,
      "Categoria": p.categoria || 'Adega',
      "Preço de Venda": p.preco,
      "Custo Unitário": p.custo || 0,
      "Estoque": p.qtd,
      "Valor Total em Estoque (Custo)": ((p.custo || 0) * p.qtd).toFixed(2)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");
    XLSX.writeFile(wb, `ESTOQUE_COMPLETO_ADEGA_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
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
        for (const item of data) {
          const pName = item.nome || item.Item || item.NOME || item.item;
          if (pName) {
            await onUpsertProduct({
              nome: String(pName).trim(),
              preco: Number(item.preco || item.Preço || item['Preço de Venda'] || 0),
              custo: Number(item.custo || item.Custo || item['Custo Unitário'] || 0),
              qtd: Number(item.qtd || item.Estoque || item.estoque || 0),
              categoria: (item.categoria || item.Categoria || 'Adega') as Category
            });
          }
        }
        alert("Produtos importados com sucesso!");
      } catch (err) { alert("Erro na importação. Verifique o formato do arquivo."); } finally { setIsImporting(false); }
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
          <button onClick={handleExportStock} className="flex items-center gap-2 px-3 py-2 bg-green-600/10 border border-green-600/20 rounded-xl text-[9px] font-black uppercase text-green-500 hover:bg-green-600 hover:text-white transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Exportar Planilha
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-black uppercase text-zinc-400 hover:text-[#FFD700] transition-all">
            <Upload className="w-4 h-4" /> Importar Planilha
          </button>
          <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${showForm ? 'bg-zinc-800 text-zinc-400' : 'bg-[#FFD700] text-black hover:scale-105 shadow-lg'}`}>
            {showForm ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
            {showForm ? 'Fechar' : 'Novo Produto'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#111111] p-8 rounded-[3rem] border border-zinc-800 shadow-2xl animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Nome do Item</label>
              <input type="text" placeholder="Nome do produto" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none">
                <option value="Adega">Adega</option>
                <option value="Tabacaria">Tabacaria</option>
                <option value="Combos">Combos</option>
                <option value="Doses">Doses</option>
                <option value="Comidas">Comidas</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Estoque Atual</label>
              <input type="number" placeholder="0" value={qtd} onChange={e => setQtd(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Custo Unitário (R$)</label>
              <input type="text" placeholder="0,00" value={custo} onChange={e => setCusto(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-blue-500 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Preço de Venda (R$)</label>
              <input type="text" placeholder="0,00" value={preco} onChange={e => setPreco(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCancel} className="flex-1 bg-zinc-900 text-zinc-400 font-black py-5 rounded-3xl uppercase text-xs">Cancelar</button>
            <button onClick={handleSaveProduct} disabled={isSaving} className="flex-[2] bg-[#FFD700] text-black font-black py-5 rounded-3xl uppercase text-xs tracking-[0.4em] shadow-2xl flex justify-center items-center gap-3">
              {isSaving && <Loader2 className="w-5 h-5 animate-spin" />} {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-[#FFD700] transition-colors" />
          <input type="text" placeholder="Buscar no estoque..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800 rounded-[2rem] p-5 pl-16 text-white text-sm focus:border-[#FFD700] outline-none shadow-inner" />
        </div>

        <div className="flex gap-2 p-1.5 bg-[#141414] rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
          <button onClick={() => setStatusFilter('todos')} className={`flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'todos' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-zinc-600'}`}>
            <List className="w-4 h-4" /> Todos <span className="opacity-40 ml-1">({products.length})</span>
          </button>
          <button onClick={() => setStatusFilter('disponivel')} className={`flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'disponivel' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-600'}`}>
            <CheckCircle className="w-4 h-4" /> Em Estoque <span className="opacity-40 ml-1">({counts.disponivel})</span>
          </button>
          <button onClick={() => setStatusFilter('zerado')} className={`flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === 'zerado' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-600'}`}>
            <MinusCircle className="w-4 h-4" /> Esgotados <span className="opacity-40 ml-1">({counts.zerado})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredProducts.map(p => {
          const isLivre = p.categoria === 'Combos' || p.categoria === 'Doses';
          const isZerado = !isLivre && p.qtd <= 0;
          return (
            <div key={p.id} className={`bg-[#111111] p-6 rounded-[2rem] border transition-all ${isZerado ? 'border-red-900/40 bg-red-900/5' : 'border-zinc-900 hover:border-zinc-700'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-black text-xl ${isZerado ? 'bg-red-900/20 text-red-500 border-red-800' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}>
                    {p.nome[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`font-black uppercase text-sm tracking-widest ${isZerado ? 'text-red-400' : 'text-white'}`}>{p.nome}</div>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-zinc-800 text-zinc-500">{p.categoria || 'Adega'}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-zinc-600" />
                        <span className="text-[#FFD700] text-[10px] font-black tracking-widest">Venda: R$ {Number(p.preco).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-zinc-700" />
                        <span className="text-zinc-500 text-[10px] font-black tracking-widest">Custo: R$ {Number(p.custo || 0).toFixed(2)}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isZerado ? 'text-red-500 flex items-center gap-1' : 'text-zinc-500'}`}>
                        {isZerado && <AlertTriangle className="w-3 h-3"/>}
                        {isLivre ? 'Disponibilidade Livre' : `Em Estoque: ${p.qtd}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <button onClick={() => handleEdit(p)} className="flex-1 sm:flex-none p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-all"><Edit2 className="w-4 h-4 mx-auto"/></button>
                   <button onClick={() => confirm(`Excluir ${p.nome}?`) && onDeleteProduct(p.id)} className="flex-1 sm:flex-none p-3 bg-red-950/20 text-red-500 hover:bg-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4 mx-auto"/></button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-zinc-900 rounded-[3rem]">
            <p className="text-zinc-700 font-bold uppercase tracking-widest text-[10px]">Nenhum item encontrado nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSection;
