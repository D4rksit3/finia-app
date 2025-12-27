import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  fullName: string;
  plan: 'free' | 'premium' | 'enterprise';
  emailVerified: boolean;
  photoURL: string | null;
  isPremium: boolean;
  memberSince: string;
  transactionsThisMonth: number;
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  updatePlan: (plan: 'free' | 'premium' | 'enterprise') => void;
  updatePhoto: (photoURL: string) => void;
  incrementTransactions: () => void;
  canAddTransaction: () => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => set({ user }),

      logout: () => set({ user: null }),

      updatePlan: (plan) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              plan,
              isPremium: plan === 'premium' || plan === 'enterprise',
            },
          });
        }
      },

      updatePhoto: (photoURL) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              photoURL,
            },
          });
        }
      },

      incrementTransactions: () => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              transactionsThisMonth: currentUser.transactionsThisMonth + 1,
            },
          });
        }
      },

      canAddTransaction: () => {
        const currentUser = get().user;
        if (!currentUser) return false;
        if (currentUser.isPremium) return true;
        return currentUser.transactionsThisMonth < 50;
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
