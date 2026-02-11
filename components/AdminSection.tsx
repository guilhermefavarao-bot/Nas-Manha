
import React, { useState, useMemo, useRef } from 'react';
import { Package, Search, Edit2, Trash2, FileSpreadsheet, Loader2, Upload, X, Plus, AlertTriangle, List, CheckCircle, MinusCircle, DollarSign, Tag } from 'lucide-react';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setShowForm(false); setEditingId(null);
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-[#FFD700] font-black text-2xl uppercase tracking-tighter flex items-center gap-3"><Package className="w-8 h-8"/> Almoxarifado</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#FFD700] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
          {showForm ? <X /> : <Plus />} {showForm ? 'Fechar' : 'Novo Produto'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111111] p-8 rounded-[2rem] border border-zinc-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none" /></div>
            <select value={categoria} onChange={e => setCategoria(e.target.value as any)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white">
              <option value="Adega">Adega</option>
              <option value="Tabacaria">Tabacaria</option>
              <option value="Combos">Combos</option>
              <option value="Doses">Doses (1/10 Garrafa)</option>
              <option value="Comidas">Comidas</option>
            </select>
            <input type="text" placeholder="Estoque (Doses: use Garrafas)" value={qtd} onChange={e => setQtd(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white" />
            <input type="text" placeholder="Custo" value={custo} onChange={e => setCusto(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white" />
            <input type="text" placeholder="Preço" value={preco} onChange={e => setPreco(e.target.value)} className="bg-black border border-zinc-800 p-4 rounded-xl text-white" />
          </div>
          <button onClick={handleSaveProduct} className="w-full bg-[#FFD700] text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs">Salvar Produto</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {filteredProducts.map(p => {
          const isDose = p.categoria === 'Doses';
          const isZerado = p.categoria !== 'Combos' && p.qtd <= 0;
          return (
            <div key={p.id} className="bg-[#111111] p-6 rounded-[2rem] border border-zinc-900 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-black uppercase text-sm">{p.nome}</span>
                  <span className="text-[8px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-500">{p.categoria}</span>
                </div>
                <div className="mt-2 flex gap-4 text-[10px] font-black uppercase text-zinc-600">
                  <span className="text-[#FFD700]">Venda: R$ {p.preco.toFixed(2)}</span>
                  <span className={isZerado ? 'text-red-500' : ''}>
                    {p.categoria === 'Combos' ? 'Livre' : 
                     isDose ? `Saldo: ${p.qtd.toFixed(2)} Garrafas (~${(p.qtd * 10).toFixed(0)} doses)` : 
                     `Estoque: ${p.qtd}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="p-3 bg-zinc-900 text-zinc-500 rounded-xl"><Edit2 className="w-4 h-4"/></button>
                <button onClick={() => onDeleteProduct(p.id)} className="p-3 bg-red-950/20 text-red-500 rounded-xl"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSection;
