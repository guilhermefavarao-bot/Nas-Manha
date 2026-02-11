
import React, { useState, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { 
  FileUp, LayoutGrid, FileText, Download, Search, Trash2, 
  ChevronRight, Truck, X, Loader2, Zap, ArrowRight, 
  Scale, Navigation, Globe, Menu, ExternalLink, 
  Link as LinkIcon, AlertCircle, Box, Terminal, Info, Code,
  CreditCard, MapPin, Weight, DollarSign, Hash,
  Tag, ClipboardList, Building2, SearchCode, CloudDownload, UserCheck, MessageSquare
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { CTeData, AppTab } from './types';
import { parseCTeXML } from './services/xmlParser';

const SidebarItem: React.FC<{ id: AppTab; active: boolean; icon: React.ReactNode; label: string; onClick: (id: AppTab) => void }> = ({ id, active, icon, label, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-4 px-5 py-4 mb-2 transition-all rounded-2xl text-base font-bold ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
  >
    {icon} <span>{label}</span>
  </button>
);

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('upload');
  const [data, setData] = useState<CTeData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingKM, setIsCalculatingKM] = useState(false);
  const [search, setSearch] = useState('');
  const [xmlSearchTerm, setXmlSearchTerm] = useState('');
  const [consultChave, setConsultChave] = useState('');

  const findValueInXml = useCallback((xmlString: string, target: string) => {
    if (!target || target.length < 2) return [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, "text/xml");
      const results: { path: string, value: string }[] = [];
      
      const traverse = (node: Node, path: string[]) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const tagName = el.localName || el.nodeName;
          const newPath = [...path, tagName];
          
          if (el.attributes) {
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i];
              if (attr.value.toLowerCase().includes(target.toLowerCase())) {
                results.push({ path: `${newPath.join(' / ')} [@${attr.name}]`, value: attr.value });
              }
            }
          }
          
          for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
              const val = child.textContent.trim();
              if (val.toLowerCase().includes(target.toLowerCase())) {
                results.push({ path: newPath.join(' / '), value: val });
              }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              traverse(child, newPath);
            }
          }
        }
      };
      
      if (doc.documentElement) traverse(doc.documentElement, []);
      return results;
    } catch (e) {
      console.error("Erro na busca XML profunda:", e);
      return [];
    }
  }, []);

  const xmlSearchResults = useMemo(() => {
    if (!xmlSearchTerm || xmlSearchTerm.length < 2) return [];
    return data.map(item => ({
      filename: item.filename,
      nCT: item.nCT,
      matches: findValueInXml(item.rawXml, xmlSearchTerm)
    })).filter(res => res.matches.length > 0);
  }, [data, xmlSearchTerm, findValueInXml]);

  const handleConsultExternal = async () => {
    const key = consultChave.trim().replace(/\D/g, '');
    if (key.length !== 44) {
      alert("A Chave de Acesso deve conter 44 dígitos.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/cte/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave: key }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.details || errorData.error || "Falha na consulta.");
        } catch (e) {
          throw new Error(responseText || "Erro na API externa.");
        }
      }

      const parsed = await parseCTeXML(`CLOUD_${key.slice(-8)}.xml`, responseText);
      
      if (parsed) {
        setData(prev => {
          if (prev.find(item => item.chave === parsed.chave)) {
            alert("Este CT-e já está no lote.");
            return prev;
          }
          return [...prev, parsed];
        });
        setConsultChave('');
        setActiveTab('tags');
        alert("CT-e importado com sucesso da Nuvem!");
      } else {
        alert("XML recebido, mas não pôde ser processado.");
      }
    } catch (error: any) {
      console.error("Erro na busca cloud:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateKMs = async () => {
    if (data.length === 0) return;
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("Chave de API não configurada.");
      return;
    }

    setIsCalculatingKM(true);
    const ai = new GoogleGenAI({ apiKey });
    const routesToCalculate = data.filter(d => d.km === "Pendente" || d.km === "Erro");
    const resultsMap: Record<string, string> = {};

    for (const d of routesToCalculate) {
      const routeKey = `${d.origem} até ${d.destino}`;
      if (resultsMap[routeKey]) continue;

      const prompt = `Informe apenas o número da distância rodoviária em KM entre ${d.origem}, ${d.origemUF} e ${d.destino}, ${d.destinoUF}. Responda apenas o número puro.`;
      
      try {
        const resp = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { tools: [{ googleMaps: {} }] }
        });
        const kmMatch = resp.text?.match(/\d+/);
        resultsMap[routeKey] = kmMatch ? kmMatch[0] : "N/A";
      } catch (e) {
        console.error(`Erro ao calcular rota ${routeKey}:`, e);
        resultsMap[routeKey] = "Erro";
      }
    }

    setData(prev => prev.map(d => {
      const key = `${d.origem} até ${d.destino}`;
      return resultsMap[key] ? { ...d, km: resultsMap[key] } : d;
    }));
    setIsCalculatingKM(false);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    const results: CTeData[] = [];
    const fileList = Array.from(files);

    for (const f of fileList) {
      try {
        const ext = f.name.toLowerCase().split('.').pop();
        if (ext === 'xml') {
          const content = await f.text();
          const p = await parseCTeXML(f.name, content);
          if (p) results.push(p);
        } else if (ext === 'zip') {
          const zip = await JSZip.loadAsync(f);
          const xmlFiles = Object.keys(zip.files).filter(name => name.toLowerCase().endsWith('.xml'));
          for (const name of xmlFiles) {
            const content = await zip.files[name].async("text");
            const p = await parseCTeXML(name, content);
            if (p) results.push(p);
          }
        }
      } catch (err) {
        console.error(`Falha ao ler arquivo ${f.name}:`, err);
      }
    }
    
    if (results.length > 0) {
      setData(prev => [...prev, ...results]);
      setActiveTab('tags');
    } else {
      alert("Nenhum CT-e válido encontrado.");
    }
    setIsLoading(false);
  };

  const filteredData = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return data;
    return data.filter(d => 
      d.nCT.includes(s) || 
      d.origem.toLowerCase().includes(s) || 
      d.destino.toLowerCase().includes(s) ||
      d.chave.includes(s) ||
      d.emitente.toLowerCase().includes(s)
    );
  }, [data, search]);

  const selectedData = selectedIdx !== -1 ? data[selectedIdx] : null;

  if (!hasStarted) return <LandingPage onStart={() => setHasStarted(true)} />;

  return (
    <div className="flex h-screen w-full bg-slate-50 flex-col overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
          <Truck className="animate-truck-jump text-blue-500 mb-6" size={64} />
          <h2 className="text-xl font-black uppercase tracking-widest mb-2">Processando Cloud</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sincronizando com Meu Danfe...</p>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-950 z-50 transform transition-transform duration-300 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">F</div>
            <h1 className="font-black italic text-sm uppercase tracking-tighter">FORJA <span className="text-blue-500">PRO</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
        </div>
        <nav className="p-6 space-y-2">
          <SidebarItem id="upload" label="Importar Local" active={activeTab === 'upload'} icon={<FileUp size={18}/>} onClick={t => {setActiveTab(t); setIsSidebarOpen(false);}} />
          <SidebarItem id="consult" label="Busca por Chave" active={activeTab === 'consult'} icon={<SearchCode size={18}/>} onClick={t => {setActiveTab(t); setIsSidebarOpen(false);}} />
          <SidebarItem id="tags" label="Lote XML" active={activeTab === 'tags'} icon={<LayoutGrid size={18}/>} onClick={t => {setActiveTab(t); setIsSidebarOpen(false);}} />
          <SidebarItem id="info" label="Detalhes" active={activeTab === 'info'} icon={<FileText size={18}/>} onClick={t => {setActiveTab(t); setIsSidebarOpen(false);}} />
          <SidebarItem id="fiscal" label="Geo-Audit" active={activeTab === 'fiscal'} icon={<Navigation size={18}/>} onClick={t => {setActiveTab(t); setIsSidebarOpen(false);}} />
          <SidebarItem id="xmlSearch" label="Deep Search" active={activeTab === 'xmlSearch'} icon={<Terminal size={18}/>} onClick={t => {setActiveTab(t); setIsSidebarOpen(false);}} />
          <SidebarItem id="export" label="Relatório" active={activeTab === 'export'} icon={<Download size={18}/>} onClick={t => {setActiveTab(t); setIsSidebarOpen(false);}} />
        </nav>
        <div className="absolute bottom-0 w-full p-6 border-t border-white/5">
           <button onClick={() => { if(confirm("Limpar lote atual?")) { setData([]); setActiveTab('upload'); setSelectedIdx(-1); setIsSidebarOpen(false); } }} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"><Trash2 size={14}/> Resetar Lote</button>
        </div>
      </aside>

      <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl active:scale-90 transition-transform hover:bg-slate-200"><Menu size={22}/></button>
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.1em] mb-0.5">Mapeador de Atributos</span>
            <h2 className="text-xs font-bold text-slate-800 uppercase leading-none">{activeTab}</h2>
          </div>
        </div>
        <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-tight">{data.length} ITENS NO LOTE</div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        {activeTab === 'upload' && (
          <div className="h-full flex flex-col items-center justify-center gap-8">
            <label className="w-full max-w-lg bg-white border-2 border-dashed border-slate-200 p-16 rounded-[2.5rem] text-center cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all group shadow-sm">
              <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} accept=".xml,.zip" />
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg"><FileUp size={40} /></div>
              <h3 className="font-black text-slate-800 uppercase text-lg mb-2">Upload de Arquivos</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Selecione XMLs ou ZIPs locais</p>
            </label>
          </div>
        )}

        {activeTab === 'consult' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white p-12 rounded-[3rem] border shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-blue-50/50 -rotate-12 pointer-events-none"><SearchCode size={200} /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40"><CloudDownload size={40}/></div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-2">Busca Direta Cloud</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Resgate de XML via Chave de Acesso</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Chave de Acesso CTe (44 dígitos)</label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                        <input 
                          type="text" 
                          value={consultChave}
                          onChange={e => setConsultChave(e.target.value.replace(/\D/g, ''))}
                          maxLength={44}
                          placeholder="Cole aqui a chave de acesso..."
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-6 pl-16 pr-8 text-xl font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                          onKeyDown={(e) => e.key === 'Enter' && handleConsultExternal()}
                        />
                      </div>
                      <button 
                        onClick={handleConsultExternal}
                        disabled={isLoading}
                        className="bg-slate-950 text-white px-10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 hover:shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center gap-3"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                        {isLoading ? "" : "BUSCAR"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                    <AlertCircle size={20} className="text-blue-500 shrink-0 mt-1" />
                    <div>
                        <p className="text-[11px] font-black text-blue-700 uppercase tracking-tight mb-1">Dica de Produtividade</p>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                            A chave é buscada diretamente no Meu Danfe. Se o documento não for encontrado, verifique se a chave foi digitada corretamente.
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-2xl border shadow-sm flex items-center">
              <div className="w-12 h-12 flex items-center justify-center text-slate-300"><Search size={20} /></div>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por nCT, Transportadora, Chave ou Trajeto..." className="flex-1 bg-transparent border-none py-4 text-sm font-semibold outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((d) => (
                <div key={d.id} onClick={() => { setSelectedIdx(data.findIndex(item => item.id === d.id)); setActiveTab('info'); }} className="bg-white p-6 rounded-[2.5rem] border hover:shadow-2xl transition-all cursor-pointer group border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">nCT {d.nCT}</span>
                    <span className="font-black text-slate-900 text-lg">R$ {d.valor}</span>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase truncate mb-4 border-b border-slate-50 pb-2">{d.emitente}</div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 mb-6">
                    <span className="truncate">{d.origem}</span> <ArrowRight size={10} className="text-slate-300 shrink-0"/> <span className="truncate">{d.destino}</span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                    <div className="flex items-center gap-1.5"><Truck size={10} className="text-blue-400"/> {d.tipoVeiculo}</div>
                    <div className="bg-slate-50 px-2 py-0.5 rounded-full text-blue-600 italic">{d.tipoOperacao}</div>
                  </div>
                </div>
              ))}
              {filteredData.length === 0 && data.length > 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 uppercase font-black text-xs tracking-widest opacity-30">Nenhum resultado para o filtro</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            {selectedData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border shadow-sm col-span-1 md:col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Building2 size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transportadora (Emitente)</span>
                    </div>
                    <p className="font-black text-slate-800 text-xl leading-tight">{selectedData.emitente}</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-2 break-all">{selectedData.pathEmitente}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Box size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria Carga</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.categoriaCarga}</p>
                    <p className="text-[9px] font-mono text-blue-400 mt-2 break-all">{selectedData.pathCategoriaCarga}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Truck size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo Veículo</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.tipoVeiculo}</p>
                    <p className="text-[9px] font-mono text-purple-400 mt-2 break-all">{selectedData.pathVeiculo}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><Zap size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operação</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.tipoOperacao}</p>
                    <p className="text-[9px] font-mono text-orange-400 mt-2 break-all">{selectedData.pathOperacao}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><CreditCard size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo Cobrança</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.tipoCobranca}</p>
                    <p className="text-[9px] font-mono text-green-400 mt-2 break-all">{selectedData.pathCobranca}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><MapPin size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rota</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.rota}</p>
                    <p className="text-[9px] font-mono text-indigo-400 mt-2 break-all">{selectedData.pathRota}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><DollarSign size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frete Peso</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">R$ {selectedData.fretePeso}</p>
                    <p className="text-[9px] font-mono text-rose-400 mt-2 break-all">{selectedData.pathFretePeso}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center"><Hash size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CFOP</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.cfop}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-2 break-all">{selectedData.pathCfop}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Tag size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número LT</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.numeroLT}</p>
                    <p className="text-[9px] font-mono text-amber-400 mt-2 break-all">{selectedData.pathNumeroLT}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center"><ClipboardList size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Romaneio</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.romaneio}</p>
                    <p className="text-[9px] font-mono text-violet-400 mt-2 break-all">{selectedData.pathRomaneio}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center"><UserCheck size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ Expedidor</span>
                    </div>
                    <p className="font-black text-slate-800 text-lg leading-tight">{selectedData.cnpjExpedidor}</p>
                    <p className="text-[9px] font-mono text-cyan-400 mt-2 break-all">{selectedData.pathCnpjExpedidor}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center"><MessageSquare size={20}/></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</span>
                    </div>
                    <p className="font-bold text-slate-700 text-xs leading-relaxed italic">{selectedData.observacao}</p>
                    <p className="text-[9px] font-mono text-slate-300 mt-2 break-all">{selectedData.pathObservacao}</p>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                  <h3 className="text-xs font-black uppercase text-blue-400 tracking-[0.3em] mb-10 flex items-center gap-3"><Scale size={18}/> AUDITORIA TÉCNICA</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="col-span-2 md:col-span-5 border-b border-white/10 pb-4 mb-2">
                       <span className="text-[9px] font-bold text-slate-500 uppercase">Emitente (Carrier)</span>
                       <p className="text-base font-black mt-1 text-slate-200">{selectedData.emitente}</p>
                    </div>
                    <div className="col-span-2 md:col-span-3 border-b border-white/10 pb-4 mb-2">
                       <span className="text-[9px] font-bold text-slate-500 uppercase">Expedidor (CNPJ)</span>
                       <p className="text-base font-black mt-1 text-cyan-400">{selectedData.cnpjExpedidor}</p>
                    </div>
                    <div className="col-span-2 md:col-span-2 border-b border-white/10 pb-4 mb-2">
                       <span className="text-[9px] font-bold text-slate-500 uppercase">nCT</span>
                       <p className="text-base font-black mt-1 text-blue-400">{selectedData.nCT}</p>
                    </div>
                    <div><span className="text-[9px] font-bold text-slate-500 uppercase">LT</span><p className="text-sm font-black mt-1 text-amber-400">{selectedData.numeroLT}</p></div>
                    <div><span className="text-[9px] font-bold text-slate-500 uppercase">Romaneio</span><p className="text-sm font-black mt-1 text-violet-400">{selectedData.romaneio}</p></div>
                    <div><span className="text-[9px] font-bold text-slate-500 uppercase">Valor</span><p className="text-sm font-black mt-1 text-green-400">R$ {selectedData.valor}</p></div>
                    <div><span className="text-[9px] font-bold text-slate-500 uppercase">KM</span><p className="text-sm font-black mt-1 text-blue-400">{selectedData.km}</p></div>
                    <div className="col-span-2 md:col-span-5 pt-4">
                       <span className="text-[9px] font-bold text-slate-500 uppercase">Observações (xObs)</span>
                       <p className="text-xs font-medium mt-1 text-slate-400 italic line-clamp-2">{selectedData.observacao}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('tags')} className="w-full py-5 bg-white text-slate-400 border rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:text-blue-600 transition-all shadow-sm">Voltar ao Lote</button>
              </>
            ) : (
              <div className="text-center p-20 text-slate-300 uppercase font-black text-xs tracking-widest opacity-30">Selecione um item no lote para ver os detalhes</div>
            )}
          </div>
        )}

        {activeTab === 'xmlSearch' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Terminal size={28}/></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Explorador XML</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Auditoria de Caminhos Brutos</p>
                </div>
              </div>
              <input 
                type="text" 
                value={xmlSearchTerm}
                onChange={e => setXmlSearchTerm(e.target.value)}
                placeholder="Busque por qualquer valor no XML (NCM, PLACA, LACRE...)"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 px-8 text-lg font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-6">
              {xmlSearchResults.map((res, idx) => (
                <div key={idx} className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-8 py-4 border-b flex justify-between items-center text-xs font-black uppercase">
                    <div className="flex items-center gap-2"><Code size={14}/> {res.filename}</div>
                    <div className="text-indigo-600">nCT {res.nCT}</div>
                  </div>
                  <div className="p-6 space-y-3">
                    {res.matches.map((match, mIdx) => (
                      <div key={mIdx} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                        <div className="text-[10px] font-mono text-indigo-500 font-bold break-all flex-1">{match.path}</div>
                        <div className="text-xs font-black text-slate-800">"{match.value}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'fiscal' && (
          <div className="space-y-8 max-w-6xl mx-auto">
            <div className="bg-white p-10 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl"><Globe size={32}/></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Geo-Audit Cloud</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Roteirização Gemini Híbrida</p>
                </div>
              </div>
              <button 
                onClick={calculateKMs} 
                disabled={isCalculatingKM || data.length === 0}
                className="w-full md:w-auto px-16 py-6 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-lg active:scale-95"
              >
                {isCalculatingKM ? <Loader2 className="animate-spin" size={20}/> : <Navigation size={20}/>}
                {isCalculatingKM ? 'Auditando...' : 'Calcular KM Rota'}
              </button>
            </div>
            <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-6">nCT</th>
                    <th className="px-8 py-6">Trajeto</th>
                    <th className="px-8 py-6 text-center">KM Auditado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map(d => (
                    <tr key={d.id}>
                      <td className="px-8 py-6 text-xs font-black text-slate-900">{d.nCT}</td>
                      <td className="px-8 py-6 text-[11px] font-bold text-slate-600 uppercase">{d.origem} {" > "} {d.destino}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] ${d.km === 'Pendente' ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600 border border-green-100'}`}>{d.km} KM</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 gap-8">
            <div className="w-28 h-28 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center shadow-2xl animate-pulse"><Download size={48}/></div>
            <h2 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">Relatório Mestre</h2>
            <button 
              onClick={() => {
                const ws = XLSX.utils.json_to_sheet(data.map(d => ({
                  NCT: d.nCT,
                  EMITENTE: d.emitente,
                  CHAVE: d.chave,
                  CNPJ_EXPEDIDOR: d.cnpjExpedidor,
                  LT: d.numeroLT,
                  ROMANEIO: d.romaneio,
                  CFOP: d.cfop,
                  ORIGEM: d.origem,
                  DESTINO: d.destino,
                  VALOR: d.valor,
                  KM: d.km,
                  CARGA: d.categoriaCarga,
                  OPERACAO: d.tipoOperacao,
                  VEICULO: d.tipoVeiculo,
                  COBRANCA: d.tipoCobranca,
                  ROTA: d.rota,
                  FRETE_PESO: d.fretePeso,
                  VBC: d.vBC,
                  V_ICMS: d.vICMS,
                  OBSERVACOES: d.observacao
                })));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
                XLSX.writeFile(wb, `Forja_Export_${Date.now()}.xlsx`);
              }}
              disabled={data.length === 0}
              className="px-16 py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl flex items-center gap-4 disabled:opacity-20 transition-all active:scale-95"
            >
              <Download size={24}/> Baixar Excel Auditado
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div onClick={onStart} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white cursor-pointer p-6 text-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent pointer-events-none"></div>
    <div className="w-28 h-28 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white mb-12 shadow-[0_0_70px_rgba(37,99,235,0.4)] animate-bounce duration-[2500ms] relative z-10"><Zap size={56} fill="white" /></div>
    <h1 className="text-7xl font-black uppercase tracking-tighter italic mb-4 relative z-10">FORJA <span className="text-blue-500 underline decoration-white/10 underline-offset-8">PRO</span></h1>
    <p className="text-slate-400 font-bold tracking-[0.5em] text-[10px] uppercase opacity-60 mb-16 relative z-10">Stable Build v5.3 • Cloud Environment</p>
    <div className="px-16 py-6 bg-white text-slate-950 rounded-full font-black text-xl flex items-center gap-4 shadow-2xl active:scale-95 transition-transform group relative z-10">
      <span>ACESSAR TERMINAL</span> 
      <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
    </div>
  </div>
);

export default App;
