
import React, { useState, useMemo } from 'react';
import { Search, Beer, Wine, GlassWater, Zap } from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
}

const MenuSection: React.FC<Props> = ({ products }) => {
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('vinho')) return <Wine className="w-4 h-4" />;
    if (n.includes('cerveja')) return <Beer className="w-4 h-4" />;
    if (n.includes('energético') || n.includes('energetico')) return <Zap className="w-4 h-4" />;
    return <GlassWater className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4">
        <h2 className="text-[#FFD700] font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
          Cardápio Digital
        </h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
          <input 
            type="text" 
            placeholder="O que você procura hoje?" 
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
                {getCategoryIcon(product.nome)}
                <span className="text-[10px] uppercase font-black tracking-widest">Adega Premium</span>
              </div>
              <h3 className="text-zinc-100 font-bold text-lg leading-tight group-hover:text-white transition-colors">
                {product.nome}
              </h3>
              <div className="mt-2 flex items-center gap-3">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${product.qtd > 0 ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                  {product.qtd > 0 ? 'Em estoque' : 'Esgotado'}
                </span>
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
          <div className="col-span-full py-20 text-center">
            <p className="text-zinc-600 font-bold uppercase tracking-widest">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuSection;
