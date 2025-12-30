import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/auth/authService';

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
  updatePlan: (plan: 'free' | 'premium' | 'enterprise') => Promise<boolean>;
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
      
      updatePlan: async (plan) => {
        try {
          console.log('📊 [Store] Actualizando plan a:', plan);
          
          const result = await authService.updatePlan(plan);
          
          if (!result.success) {
            console.error('❌ [Store] Error del backend:', result.error);
            return false;
          }
          
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
          
          console.log('✅ [Store] Plan actualizado exitosamente');
          return true;
          
        } catch (error) {
          console.error('❌ [Store] Error actualizando plan:', error);
          return false;
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