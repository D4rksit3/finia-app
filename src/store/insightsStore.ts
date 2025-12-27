import { create } from 'zustand';

interface Insight {
  id: string;
  type: 'savings' | 'spending' | 'budget' | 'investment';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: Date;
}

interface InsightsStore {
  insights: Insight[];
  setInsights: (insights: Insight[]) => void;
  addInsight: (insight: Insight) => void;
  markAsRead: (id: string) => void;
  getUnreadCount: () => number;
}

export const useInsightsStore = create<InsightsStore>((set, get) => ({
  insights: [
    {
      id: '1',
      type: 'savings',
      title: 'Oportunidad de ahorro detectada',
      description: 'Podrías ahorrar S/ 150 al mes reduciendo gastos en comida rápida',
      priority: 'high',
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      type: 'spending',
      title: 'Gastos altos en entretenimiento',
      description: 'Tus gastos en entretenimiento este mes están 30% por encima del promedio',
      priority: 'medium',
      isRead: false,
      createdAt: new Date(),
    },
  ],

  setInsights: (insights) => set({ insights }),

  addInsight: (insight) => set((state) => ({
    insights: [insight, ...state.insights],
  })),

  markAsRead: (id) => set((state) => ({
    insights: state.insights.map(i => i.id === id ? { ...i, isRead: true } : i),
  })),

  getUnreadCount: () => {
    return get().insights.filter(i => !i.isRead).length;
  },
}));
