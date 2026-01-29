
import React, { useState, useMemo, useRef } from 'react';
import { Package, Search, Edit2, Trash2, FileSpreadsheet, Loader2, Upload, Download, X, Save, FileText, Plus, AlertTriangle, Layers, Share } from 'lucide-react';
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
    const cleanNome = nome.trim();
    if (!cleanNome || !preco) return alert("Nome e Preço são obrigatórios.");
    
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
      alert("Erro ao validar dados: certifique-se de usar números válidos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      { nome: "CERVEJA SKOL LATA", preco: 5.50, custo: 3.20, qtd: 100, categoria: "Adega" },
      { nome: "ESSENCIA ZOMO", preco: 12.00, custo: 7.00, qtd: 50, categoria: "Tabacaria" },
      { nome: "COMBO WHISKY + GELO", preco: 150.00, custo: 90.00, qtd: 0, categoria: "Combos" },
      { nome: "DOSE DE CACHACA", preco: 5.00, custo: 1.50, qtd: 0, categoria: "Doses" },
      { nome: "COXINHA FRANGO", preco: 7.00, custo: 3.00, qtd: 20, categoria: "Comidas" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo_Importacao");
    XLSX.writeFile(wb, "MODELO_ADEGA_NAS_MANHA.xlsx");
  };

  const handleExportStock = () => {
    if (products.length === 0) return alert("Não há produtos no estoque para exportar.");
    
    const exportData = products.map(p => ({
      "Nome": p.nome,
      "Preço de Venda": p.preco,
      "Custo": p.custo,
      "Quantidade": p.qtd,
      "Categoria": p.categoria || 'Adega',
      "Valor Total em Estoque": (p.preco * p.qtd).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estoque_Atual");
    
    // Auto-ajuste de colunas
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }];
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `ESTOQUE_ADEGA_${date}.xlsx`);
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
            let cat: any = item.categoria || item.Categoria || item.CATEGORIA || 'Adega';
            const validCats = ['Adega', 'Tabacaria', 'Combos', 'Doses', 'Comidas'];
            if (!validCats.includes(cat)) cat = 'Adega';

            await onUpsertProduct({
              nome: String(pName).trim(),
              preco: Number(item.preco || item.Preço || item.PRECO || item['Preço de Venda'] || 0),
              custo: Number(item.custo || item.Custo || item.CUSTO || 0),
              qtd: Number(item.qtd || item.Quantidade || item.QTD || 0),
              categoria: cat
            });
            count++;
          }
        }
        alert(`${count} produtos processados com sucesso!`);
      } catch (err) {
        alert("Erro ao ler arquivo XLSX. Verifique se as colunas estão corretas.");
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
          <button onClick={handleDownloadTemplate} title="Baixar planilha modelo" className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-600/20 rounded-xl text-[9px] font-black uppercase text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
            <Download className="w-4 h-4" /> Modelo
          </button>
          
          <button onClick={handleExportStock} title="Exportar estoque atual para Excel" className="flex items-center gap-2 px-3 py-2 bg-green-600/10 border border-green-600/20 rounded-xl text-[9px] font-black uppercase text-green-500 hover:bg-green-600 hover:text-white transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Exportar
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-black uppercase text-zinc-400 hover:text-[#FFD700] transition-all disabled:opacity-20">
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />} Importar
          </button>

          <button onClick={() => setShowForm(!showForm)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${showForm ? 'bg-zinc-800 text-zinc-400' : 'bg-[#FFD700] text-black hover:scale-105 shadow-lg shadow-yellow-500/10'}`}>
            {showForm ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
            {showForm ? 'Fechar' : 'Novo Produto'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-[#111111] p-8 rounded-[3rem] border border-zinc-800 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Nome do Item</label>
              <input type="text" placeholder="Ex: Combo Gin + Redbull" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Categoria</label>
              <div className="relative">
                <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                <select 
                  value={categoria} 
                  onChange={e => setCategoria(e.target.value as any)} 
                  className="w-full bg-black border border-zinc-800 rounded-2xl p-5 pl-14 text-white text-sm focus:border-[#FFD700] outline-none appearance-none cursor-pointer"
                >
                  <option value="Adega">Adega (Bebidas)</option>
                  <option value="Tabacaria">Tabacaria (Hookah/Fumo)</option>
                  <option value="Combos">Combos (Kits Promocionais)</option>
                  <option value="Doses">Doses (Drinks/Shots)</option>
                  <option value="Comidas">Comidas (Salgados/Lanches)</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Preço de Venda (R$)</label>
              <input type="text" placeholder="0,00" value={preco} onChange={e => setPreco(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">Custo do Item (R$)</label>
              <input type="text" placeholder="0,00" value={custo} onChange={e => setCusto(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-600 font-black uppercase ml-2 tracking-widest">
                {(categoria === 'Combos' || categoria === 'Doses') ? 'Estoque (Será Ignorado)' : 'Qtd em Estoque'}
              </label>
              <input 
                type="number" 
                placeholder="0" 
                value={qtd} 
                onChange={e => setQtd(e.target.value)} 
                disabled={categoria === 'Combos' || categoria === 'Doses'}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white text-sm focus:border-[#FFD700] outline-none disabled:opacity-20" 
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCancel} className="flex-1 bg-zinc-900 text-zinc-400 font-black py-5 rounded-3xl uppercase text-xs border border-zinc-800">Cancelar</button>
            <button onClick={handleSaveProduct} disabled={isSaving} className="flex-[2] bg-[#FFD700] text-black font-black py-5 rounded-3xl uppercase text-xs tracking-[0.4em] shadow-2xl flex justify-center items-center gap-3 disabled:opacity-30">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5"/>} {editingId ? 'Salvar Edição' : 'Cadastrar'}
            </button>
          </div>
        </div>
      )}

      <div className="relative group">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-[#FFD700] transition-colors" />
         <input type="text" placeholder="Buscar no estoque..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800 rounded-[2rem] p-5 pl-16 text-white text-sm focus:border-[#FFD700] outline-none shadow-inner" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredProducts.map(p => (
          <div key={p.id} className="bg-[#111111] p-6 rounded-[2rem] border border-zinc-900 flex justify-between items-center group hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-xl text-zinc-600 group-hover:text-[#FFD700] transition-colors">{p.nome[0].toUpperCase()}</div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-black text-white uppercase text-sm tracking-widest">{p.nome}</div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                    p.categoria === 'Tabacaria' ? 'border-orange-500/30 text-orange-500 bg-orange-500/5' : 
                    p.categoria === 'Combos' ? 'border-purple-500/30 text-purple-500 bg-purple-500/5' :
                    p.categoria === 'Doses' ? 'border-blue-400/30 text-blue-400 bg-blue-400/5' :
                    p.categoria === 'Comidas' ? 'border-green-500/30 text-green-500 bg-green-500/5' :
                    'border-blue-500/30 text-blue-500 bg-blue-500/5'
                  }`}>
                    {p.categoria || 'Adega'}
                  </span>
                </div>
                <div className="flex gap-6 mt-2">
                  <span className="text-[#FFD700] text-[10px] font-black tracking-widest">R$ {Number(p.preco).toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.qtd < 5 && p.categoria !== 'Combos' && p.categoria !== 'Doses' ? 'text-red-500' : 'text-zinc-500'}`}>
                      {p.categoria === 'Combos' || p.categoria === 'Doses' ? 'Livre (Sem Estoque)' : `Estoque: ${p.qtd}`}
                    </span>
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
      </div>
    </div>
  );
};

export default AdminSection;
