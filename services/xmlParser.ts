
import { CTeData } from '../types';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15);
};

const findElementResilient = (parent: Element | Document, localName: string): Element | null => {
  if (!parent) return null;
  // Tenta buscar ignorando o namespace primeiro usando seletor curinga
  let el = parent.getElementsByTagNameNS("*", localName)[0];
  if (el) return el;
  
  // Fallback manual iterando sobre os filhos para casos onde o NS não é resolvido pelo browser
  const all = parent.getElementsByTagName("*");
  const searchName = localName.toLowerCase();
  for (let i = 0; i < all.length; i++) {
    const nodeName = (all[i].localName || all[i].nodeName.split(':').pop() || "").toLowerCase();
    if (nodeName === searchName) {
      return all[i] as Element;
    }
  }
  return null;
};

const getElementValueResilient = (parent: Element | Document, localName: string): string => {
  const el = findElementResilient(parent, localName);
  return el ? el.textContent?.trim() || "" : "";
};

export const parseCTeXML = async (filename: string, text: string): Promise<CTeData | null> => {
  try {
    const parser = new DOMParser();
    const cleanText = text.trim().replace(/^\uFEFF/, '');
    const xml = parser.parseFromString(cleanText, "text/xml");
    
    if (xml.getElementsByTagName("parsererror").length > 0) {
      console.warn(`Erro crítico de parser no arquivo: ${filename}`);
      return null;
    }

    const infCte = findElementResilient(xml, "infCte");
    if (!infCte) return null;

    const ide = findElementResilient(infCte, "ide");
    const cfop = ide ? getElementValueResilient(ide, "CFOP") : "N/A";
    const nCT = getElementValueResilient(infCte, "nCT");
    
    let chave = infCte.getAttribute("Id") || infCte.getAttribute("id") || "";
    chave = chave.replace(/[^0-9]/g, "");

    const origem = getElementValueResilient(infCte, "xMunIni");
    const origemUF = getElementValueResilient(infCte, "UFIni");
    const destino = getElementValueResilient(infCte, "xMunFim");
    const destinoUF = getElementValueResilient(infCte, "UFFim");
    
    const vPrest = findElementResilient(infCte, "vPrest");
    const valorTotal = vPrest ? getElementValueResilient(vPrest, "vTPrest") : "0,00";

    const emit = findElementResilient(infCte, "emit");
    const emitente = emit ? getElementValueResilient(emit, "xNome") : "N/A";

    // Extração do CNPJ do Expedidor
    const exped = findElementResilient(infCte, "exped");
    const cnpjExpedidor = exped ? getElementValueResilient(exped, "CNPJ") : "N/A";

    // Extração de Componentes do Valor
    let fretePesoMonetario = "0,00";
    if (vPrest) {
      const comps = vPrest.getElementsByTagNameNS("*", "Comp");
      for (let i = 0; i < comps.length; i++) {
        const xNome = getElementValueResilient(comps[i], "xNome").toLowerCase();
        if (xNome.includes("frete peso") || xNome.includes("fretemercadoria") || xNome.includes("frete-peso")) {
          fretePesoMonetario = getElementValueResilient(comps[i], "vComp");
          break;
        }
      }
    }

    // Impostos
    let vBC = "0,00", pICMS = "0,00", vICMS = "0,00";
    const icmsNodes = ["ICMS00", "ICMS20", "ICMS45", "ICMS60", "ICMS90", "ICMSOutraUF", "ICMSSN"];
    for (const tag of icmsNodes) {
      const node = findElementResilient(infCte, tag);
      if (node) {
        vBC = getElementValueResilient(node, "vBC") || vBC;
        pICMS = getElementValueResilient(node, "pICMS") || pICMS;
        vICMS = getElementValueResilient(node, "vICMS") || vICMS;
        break;
      }
    }

    // Carga
    const categoriaCarga = getElementValueResilient(infCte, "xOutCat") || "Não Identificada";

    // Campos Dinâmicos em ObsCont
    const camposDinamicos: Record<string, string> = {};
    const obsConts = infCte.getElementsByTagNameNS("*", "ObsCont");
    for (let i = 0; i < obsConts.length; i++) {
      const xCampo = obsConts[i].getAttribute("xCampo") || "";
      const xTexto = getElementValueResilient(obsConts[i], "xTexto");
      if (xCampo) camposDinamicos[xCampo] = xTexto;
    }

    // Extração de Observação Geral (xObs)
    const xObs = getElementValueResilient(infCte, "xObs");

    // Fallback: Tentar ler campos de xObs se não estiverem em ObsCont
    if (xObs) {
        if (!camposDinamicos["Romaneio"]) {
            const romMatch = xObs.match(/Romaneio:\s*(\d+)/i);
            if (romMatch) camposDinamicos["Romaneio"] = romMatch[1];
        }
        if (!camposDinamicos["TipoOperacao"]) {
            const opMatch = xObs.match(/Operacao:\s*(\d+)/i) || xObs.match(/TipoOperacao:\s*(\w+)/i);
            if (opMatch) camposDinamicos["TipoOperacao"] = opMatch[1];
        }
    }

    return {
      id: generateId(),
      filename,
      nCT: nCT || "S/N",
      chave,
      origem: origem || "Não Inf.",
      origemUF: origemUF || "??",
      destino: destino || "Não Inf.",
      destinoUF: destinoUF || "??",
      valor: valorTotal.replace('.', ','),
      categoriaCarga,
      pathCategoriaCarga: "infCte/infCTeNorm/infCarga/xOutCat",
      cnpjExpedidor,
      pathCnpjExpedidor: "infCte/exped/CNPJ",
      observacao: xObs || "N/A",
      pathObservacao: "infCte/compl/xObs",
      tipoOperacao: camposDinamicos["TipoOperacao"] || "N/A",
      tipoVeiculo: camposDinamicos["TipoVeiculo"] || "N/A",
      tipoCobranca: camposDinamicos["TipoCobranca"] || "N/A",
      rota: camposDinamicos["Rota"] || "N/A",
      fretePeso: fretePesoMonetario.replace('.', ','),
      cfop,
      numeroLT: camposDinamicos["NumeroLT"] || "N/A",
      romaneio: camposDinamicos["Romaneio"] || "N/A",
      emitente,
      camposDinamicos,
      pathOperacao: "infCte/compl/ObsCont[@xCampo='TipoOperacao']",
      pathVeiculo: "infCte/compl/ObsCont[@xCampo='TipoVeiculo']",
      pathCobranca: "infCte/compl/ObsCont[@xCampo='TipoCobranca']",
      pathRota: "infCte/compl/ObsCont[@xCampo='Rota']",
      pathFretePeso: "infCte/vPrest/Comp[xNome='Frete peso']/vComp",
      pathCfop: "infCte/ide/CFOP",
      pathNumeroLT: "infCte/compl/ObsCont[@xCampo='NumeroLT']",
      pathRomaneio: "infCte/compl/ObsCont[@xCampo='Romaneio']",
      pathEmitente: "infCte/emit/xNome",
      vBC: vBC.replace('.', ','), 
      pICMS: pICMS.replace('.', ','), 
      vICMS: vICMS.replace('.', ','),
      km: "Pendente",
      caracteristicasAdicionais: getElementValueResilient(infCte, "xCaracAd") || null,
      rawXml: cleanText
    };
  } catch (error) {
    console.error(`Falha no processamento do XML ${filename}:`, error);
    return null;
  }
};
