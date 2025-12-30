import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: Date;
  currency: string;
}

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
  getRecentTransactions: (limit: number) => Transaction[];
  syncWithBackend: (userId: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loading: false,

  setTransactions: (transactions) => set({ transactions }),

  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));
  },

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  getTotalIncome: () => {
    return get().transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getTotalExpenses: () => {
    return get().transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getBalance: () => {
    return get().getTotalIncome() - get().getTotalExpenses();
  },

  getRecentTransactions: (limit) => {
    return get().transactions.slice(0, limit);
  },

  syncWithBackend: async (userId: string) => {
    try {
      set({ loading: true });
      
      const response = await axios.get(`${API_URL}/transactions/${userId}`);
      
      const backendTransactions = response.data.transactions.map((t: any) => ({
        id: t.id.toString(),
        userId: t.user_id,
        type: t.type,
        amount: parseFloat(t.amount),
        category: t.category,
        description: t.description,
        date: new Date(t.transaction_date),
        currency: 'PEN',
      }));

      set({ transactions: backendTransactions, loading: false });
    } catch (error) {
      console.error('Error syncing transactions:', error);
      set({ loading: false });
    }
  },
}));
