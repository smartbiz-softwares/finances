export type TransactionType = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'once';
export type AccountType = 'cash' | 'card' | 'bank';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  lastDigits?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string; // ISO string
  isRecurring?: boolean;
  recurringId?: string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  frequency: Frequency;
  startDate: string;
  nextOccurrence: string;
  lastProcessed?: string;
  isActive: boolean;
}

export interface AISuggestion {
  title: string;
  content: string;
  type: 'saving' | 'warning' | 'insight';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  theme: 'light' | 'dark';
  currency: string;
  createdAt: string;
}
