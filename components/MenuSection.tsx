
import React, { useState, useMemo } from 'react';
import { Search, Beer, Wine, GlassWater, Zap, Flame, Box, Cigarette, Utensils, Layers, CupSoda } from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
}

const MenuSection: React.FC<Props> = ({ products }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<NonNullable<Product['categoria']>>('Adega');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
      const pCategory = p.categoria || 'Adega';
      return matchesSearch && pCategory === activeTab;
    });
  }, [products, search, activeTab]);

  const tabs: {id: NonNullable<Product['categoria']>, label: string, icon: React.ReactNode}[] = [
    { id: 'Adega', label: 'Adega', icon: <Beer className="w-4 h-4" /> },
    { id: 'Tabacaria', label: 'Tabacaria', icon: <Flame className="w-4 h-4" /> },
    { id: 'Combos', label: 'Combos', icon: <Layers className="w-4 h-4" /> },
    { id: 'Doses', label: 'Doses', icon: <CupSoda className="w-4 h-4" /> },
    { id: 'Comidas', label: 'Comidas', icon: <Utensils className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <h2 className="text-[#FFD700] font-black text-2xl uppercase tracking-tighter">Cardápio Digital</h2>
        <div className="flex gap-2 p-1.5 bg-[#141414] rounded-2xl border border-zinc-900 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 flex items-center gap-3 py-4 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#FFD700] text-black' : 'text-zinc-600'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
          <input type="text" placeholder={`Buscar em ${activeTab}...`} value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#141414] border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#FFD700] outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredProducts.map(product => {
          const isDose = product.categoria === 'Doses';
          const hasStock = product.categoria === 'Combos' || product.qtd > (isDose ? 0.05 : 0);
          return (
            <div key={product.id} className="bg-[#141414] border border-zinc-800 rounded-2xl p-5 flex justify-between items-center group hover:border-[#FFD700]/50 transition-all">
              <div>
                <h3 className="text-zinc-100 font-bold text-lg leading-tight group-hover:text-white">{product.nome}</h3>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${hasStock ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                    {hasStock ? (isDose ? `Saldo: ${product.qtd.toFixed(2)} Garrafa` : 'Disponível') : 'Esgotado'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#FFD700] font-black text-2xl tracking-tighter">R$ {product.preco.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-600 font-bold uppercase">{isDose ? 'Dose' : 'Unitário'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuSection;
