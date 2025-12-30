export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Comida', icon: '🍽️', color: '#FDCB6E' },
  { id: 'transport', label: 'Transporte', icon: '🚗', color: '#74B9FF' },
  { id: 'home', label: 'Vivienda', icon: '🏠', color: '#00B894' },
  { id: 'health', label: 'Salud', icon: '⚕️', color: '#FF7675' },
  { id: 'entertainment', label: 'Entretenimiento', icon: '🎮', color: '#A29BFE' },
  { id: 'others', label: 'Otros', icon: '📦', color: '#B2BEC3' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salario', icon: '💼', color: '#00D4AA' },
  { id: 'freelance', label: 'Freelance', icon: '💻', color: '#6C5CE7' },
  { id: 'investment', label: 'Inversión', icon: '📈', color: '#00B894' },
  { id: 'other', label: 'Otro', icon: '💵', color: '#B2BEC3' },
];

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxTransactions: 50,
    features: ['50 transacciones/mes', 'Historial 3 meses', '6 categorías'],
  },
  premium: {
    name: 'Premium',
    price: 19.90,
    maxTransactions: null,
    features: ['Transacciones ilimitadas', 'OCR', 'IA', 'Calculadora tributaria'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    maxTransactions: null,
    features: ['Todo Premium', 'Multi-empresa', 'API', 'Soporte 24/7'],
  },
};
