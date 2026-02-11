
export interface CTeData {
  id: string;
  filename: string;
  nCT: string;
  chave: string;
  origem: string;
  origemUF: string;
  destino: string;
  destinoUF: string;
  valor: string;
  caracteristicasAdicionais: string | null;
  tipoOperacao: string;
  tipoVeiculo: string;
  tipoCobranca: string;
  rota: string;
  fretePeso: string;
  cfop: string;
  numeroLT: string;
  romaneio: string;
  emitente: string;
  categoriaCarga: string; 
  cnpjExpedidor: string;
  observacao: string;
  camposDinamicos: Record<string, string>;
  pathOperacao: string;
  pathVeiculo: string;
  pathCobranca: string;
  pathRota: string;
  pathFretePeso: string;
  pathCfop: string;
  pathNumeroLT: string;
  pathRomaneio: string;
  pathEmitente: string;
  pathCategoriaCarga: string; 
  pathCnpjExpedidor: string;
  pathObservacao: string;
  vBC: string;
  pICMS: string;
  vICMS: string;
  km: string;
  rawXml: string; // Armazena o XML bruto para o Explorador
}

export type AppTab = 'upload' | 'consult' | 'tags' | 'info' | 'fiscal' | 'xmlSearch' | 'export';
