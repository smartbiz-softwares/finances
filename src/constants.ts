import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salario', icon: 'Wallet', color: '#1EE07A' },
  { id: 'food', name: 'Alimentación', icon: 'Utensils', color: '#FF5C1A' },
  { id: 'rent', name: 'Vivienda', icon: 'Home', color: '#3B9EFF' },
  { id: 'transport', name: 'Transporte', icon: 'Car', color: '#F5C842' },
  { id: 'entertainment', name: 'Ocio', icon: 'Gamepad', color: '#A855F7' },
  { id: 'health', name: 'Salud', icon: 'HeartPulse', color: '#FF4757' },
  { id: 'shopping', name: 'Compras', icon: 'ShoppingBag', color: '#FF8A50' },
  { id: 'others', name: 'Otros', icon: 'MoreHorizontal', color: '#7A7874' },
];

export const INITIAL_TRANSACTIONS = [
  {
    id: '1',
    type: 'income' as const,
    amount: 2500,
    categoryId: 'salary',
    description: 'Nómina Marzo',
    date: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'expense' as const,
    amount: 850,
    categoryId: 'rent',
    description: 'Alquiler piso',
    date: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'expense' as const,
    amount: 45.5,
    categoryId: 'food',
    description: 'Supermercado',
    date: new Date().toISOString(),
  },
];
