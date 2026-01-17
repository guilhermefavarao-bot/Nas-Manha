
import React, { useState, useMemo } from 'react';
import { Search, Beer, Wine, GlassWater, Zap, Flame, Box, Cigarette } from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
}

const MenuSection: React.FC<Props> = ({ products }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Adega' | 'Tabacaria'>('Adega');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
      // Fallback: se o produto não tem categoria definida, assumimos Adega
      const pCategory = p.categoria || 'Adega';
      return matchesSearch && pCategory === activeTab;
    });
  }, [products, search, activeTab]);

  const getCategoryIcon = (name: string, category?: string) => {
    if (category === 'Tabacaria') {
      const n = name.toLowerCase();
      if (n.includes('carvão') || n.includes('carvao') || n.includes('fogo')) return <Flame className="w-4 h-4 text-orange-500" />;
      if (n.includes('essência') || n.includes('essencia')) return <Box className="w-4 h-4 text-purple-400" />;
      return <Cigarette className="w-4 h-4 text-zinc-400" />;
    }

    const n = name.toLowerCase();
    if (n.includes('vinho')) return <Wine className="w-4 h-4" />;
    if (n.includes('cerveja')) return <Beer className="w-4 h-4" />;
    if (n.includes('energético') || n.includes('energetico')) return <Zap className="w-4 h-4" />;
    return <GlassWater className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        <h2 className="text-[#FFD700] font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
          Cardápio Digital
        </h2>

        {/* Sistema de Abas */}
        <div className="flex gap-2 p-1.5 bg-[#141414] rounded-2xl border border-zinc-900">
          <button 
            onClick={() => setActiveTab('Adega')} 
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Adega' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Beer className="w-4 h-4" /> Adega
          </button>
          <button 
            onClick={() => setActiveTab('Tabacaria')} 
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Tabacaria' ? 'bg-[#FFD700] text-black shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Flame className="w-4 h-4" /> Tabacaria
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
          <input 
            type="text" 
            placeholder={`Buscar em ${activeTab}...`} 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#141414] border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#FFD700] outline-none transition-all shadow-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-[#141414] border border-zinc-800 rounded-2xl p-5 flex justify-between items-center shadow-lg group hover:border-[#FFD700]/50 transition-all">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                {getCategoryIcon(product.nome, product.categoria)}
                <span className="text-[10px] uppercase font-black tracking-widest">
                  {product.categoria === 'Tabacaria' ? 'Premium Smoke' : 'Adega Nas Manha'}
                </span>
              </div>
              <h3 className="text-zinc-100 font-bold text-lg leading-tight group-hover:text-white transition-colors">
                {product.nome}
              </h3>
              <div className="mt-2 flex items-center gap-3">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${product.qtd > 0 ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                  {product.qtd > 0 ? 'Em estoque' : 'Esgotado'}
                </span>
                {product.categoria === 'Tabacaria' && (
                  <span className="text-[9px] text-orange-500/60 font-black uppercase tracking-tighter">Hookah Selection</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#FFD700] font-black text-2xl tracking-tighter">
                R$ {product.preco.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-600 font-bold uppercase">Preço Unitário</div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-zinc-900 rounded-3xl">
            <p className="text-zinc-700 font-bold uppercase tracking-widest text-[10px]">Nenhum item de {activeTab} encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuSection;
