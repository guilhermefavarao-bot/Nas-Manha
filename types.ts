
export type Role = 'admin' | 'atendente';

export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: Role;
}

export interface RolePermissions {
  menu: boolean;
  sales: boolean;
  orders: boolean;
  cashier: boolean;
  stock: boolean;
}

export type Category = 'Adega' | 'Tabacaria' | 'Combos' | 'Doses' | 'Comidas';

export interface Product {
  id: string;
  nome: string;
  preco: number;
  custo: number;
  qtd: number;
  categoria?: Category;
}

export interface ItemPedido {
  nome: string;
  qtd: number;
  preco: number;
  custo?: number;
}

export interface Order {
  id: number;
  cliente: string;
  telefone: string;
  atendente: string;
  itens: ItemPedido[];
  total: number;
  data: string;
  status: 'aberto' | 'pronto' | 'fechado' | 'cancelado';
  pagamento?: string; 
}

export interface CashEntry {
  id: string;
  cliente: string;
  forma: 'Pix' | 'Cartão' | 'Dinheiro';
  valor: number;
  data: string;
}

export enum Tab {
  Menu = 'menu',
  Orders = 'orders',
  Sales = 'sales',
  Cashier = 'cashier',
  Admin = 'admin',
  Team = 'team'
}
