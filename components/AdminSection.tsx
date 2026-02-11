
import React, { useState, useMemo } from 'react';
import { Package, Search, Edit2, Trash2, X, Plus, Filter, AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react';
import { Product, Category } from '../types';

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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
      const isLivre = p.categoria === 'Combos';
      const hasStock = isLivre || p.qtd > 0;
      
      if (statusFilter === 'disponivel') return matchesSearch && hasStock;
      if (statusFilter === 'zerado') return matchesSearch && !hasStock;
      return matchesSearch;
    });
  }, [products, search, statusFilter]);

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

  const handleSaveProduct = async () => {
    if (!nome.trim() || !preco) return;
    setIsSaving(true);
    try {
      const payload: any = {
        nome: nome.trim(),
        preco: Number(preco.toString().replace(',', '.')),
        custo: Number(custo.toString().replace(',', '.')) || 0,
        qtd: Number(qtd.toString().replace(',', '.')) || 0,
        categoria: categoria
      };
      if (editingId) payload.id = editingId;
      await onUpsertProduct(payload);
      resetForm();
    } finally { setIsSaving(false); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNome('');
    setPreco('');
    setCusto('');
    setQtd('');
    setCategoria('Adega');
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-[#FFD700] font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
          <Package className="w-8 h-8"/> Almoxarifado
        </h2>
        <button 
          onClick={() => { editingId ? resetForm() : setShowForm(!showForm) }} 
          className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${showForm ? 'bg-zinc-800 text-zinc-400' : 'bg-[#FFD700] text-black shadow-lg shadow-yellow-500/10'}`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} 
          {showForm ? 'Cancelar' : 'Novo Produto'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111111] p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl space-y-6 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[8px] text-zinc-600 font-black uppercase ml-2 mb-1 block">Nome do Produto</label>
              <input type="text" placeholder="Ex: Cerveja Brahma 350ml" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-[#FFD700]" />
            </div>
            <div>
              <label className="text-[8px] text-zinc-600 font-black uppercase ml-2 mb-1 block">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value as any)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-[#FFD700]">
                <option value="Adega">Adega</option>
                <option value="Tabacaria">Tabacaria</option>
                <option value="Combos">Combos</option>
                <option value="Doses">Doses (Controle Fracionado)</option>
                <option value="Comidas">Comidas</option>
              </select>
            </div>
            <div>
              <label className="text-[8px] text-zinc-600 font-black uppercase ml-2 mb-1 block">Qtd em Estoque</label>
              <input type="text" placeholder="Doses: 1.0 = 1 Garrafa" value={qtd} onChange={e => setQtd(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-[#FFD700]" />
            </div>
            <div>
              <label className="text-[8px] text-zinc-600 font-black uppercase ml-2 mb-1 block">Preço de Custo (R$)</label>
              <input type="text" placeholder="0,00" value={custo} onChange={e => setCusto(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-[#FFD700]" />
            </div>
            <div>
              <label className="text-[8px] text-zinc-600 font-black uppercase ml-2 mb-1 block">Preço de Venda (R$)</label>
              <input type="text" placeholder="0,00" value={preco} onChange={e => setPreco(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-[#FFD700]" />
            </div>
          </div>
          <button disabled={isSaving} onClick={handleSaveProduct} className="w-full bg-[#FFD700] text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl shadow-yellow-500/20 active:scale-95 transition-all">
            {isSaving ? 'Salvando...' : editingId ? 'Atualizar Produto' : 'Cadastrar Produto'}
          </button>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-[#111111] p-6 rounded-[2rem] border border-zinc-900 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
          <input 
            type="text" 
            placeholder="Buscar no almoxarifado..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-black border border-zinc-800 rounded-2xl p-4 pl-12 text-white outline-none focus:border-[#FFD700]" 
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStatusFilter('todos')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${statusFilter === 'todos' ? 'bg-zinc-800 border-[#FFD700] text-white' : 'bg-black border-zinc-900 text-zinc-600'}`}>Todos</button>
          <button onClick={() => setStatusFilter('disponivel')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${statusFilter === 'disponivel' ? 'bg-green-900/20 border-green-500 text-green-500' : 'bg-black border-zinc-900 text-zinc-600'}`}>Com Estoque</button>
          <button onClick={() => setStatusFilter('zerado')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${statusFilter === 'zerado' ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-black border-zinc-900 text-zinc-600'}`}>Zerados</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredProducts.map(p => {
          const isDose = p.categoria === 'Doses';
          const isZerado = p.categoria !== 'Combos' && Number(p.qtd) <= 0;
          
          return (
            <div key={p.id} className="bg-[#111111] p-6 rounded-[2rem] border border-zinc-900 flex justify-between items-center group hover:border-zinc-700 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-white font-black uppercase text-sm group-hover:text-[#FFD700] transition-colors">{p.nome}</span>
                  <span className="text-[8px] bg-black border border-zinc-800 px-2 py-0.5 rounded text-zinc-500 font-bold uppercase">{p.categoria}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black uppercase tracking-tight">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-zinc-700">Venda:</span> <span className="text-[#FFD700]">R$ {Number(p.preco).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <span className="text-zinc-700">Custo:</span> R$ {Number(p.custo || 0).toFixed(2)}
                  </div>
                  <div className={`flex items-center gap-2 ${isZerado ? 'text-red-500' : 'text-zinc-400'}`}>
                    {p.categoria === 'Combos' ? (
                      <span className="text-blue-500">Estoque Livre</span>
                    ) : (
                      <>
                        <span className="text-zinc-700">Saldo:</span> 
                        {isDose ? `${Number(p.qtd).toFixed(2)} Garrafas (~${(Number(p.qtd) * 10).toFixed(0)} doses)` : p.qtd}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => handleEdit(p)} className="p-4 bg-zinc-900 text-zinc-400 rounded-2xl hover:bg-zinc-800 hover:text-white transition-all"><Edit2 className="w-4 h-4"/></button>
                <button onClick={() => onDeleteProduct(p.id)} className="p-4 bg-red-950/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-[#111111] rounded-[3rem] border border-dashed border-zinc-900">
            <AlertCircle className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-700 font-black uppercase text-[10px] tracking-widest">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSection;
