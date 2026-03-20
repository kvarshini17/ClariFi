export type TransactionType = 'expense' | 'income';
export type Category = 'Food' | 'Travel' | 'Bills' | 'Shopping' | 'Health' | 'Entertainment' | 'Others' | 'Income';
export type Theme = 'light' | 'dark' | 'system';

export interface Transaction {
  id: string;
  uid: string;
  amount: number;
  category: Category;
  type: TransactionType;
  date: Date;
  note?: string;
  createdAt: Date;
}

export interface Budget {
  id: string;
  uid: string;
  category: Category;
  amount: number;
  period: 'monthly' | 'weekly';
  alertThreshold: number; // percentage (e.g. 80)
  createdAt: string;
}

export interface AppNotification {
  id: string;
  uid: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  country?: string;
  phoneNumber?: string;
  theme?: Theme;
  streak?: {
    count: number;
    lastLoginDate: string; // ISO date string YYYY-MM-DD
  };
  currency?: {
    code: string;
    symbol: string;
    name: string;
  };
  budgets?: Budget[];
  goals?: Goal[];
  createdAt: Date;
}

export interface Goal {
  id: string;
  uid: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO date
  category: string;
  icon: string;
  createdAt: string;
}

export interface SavingChallenge {
  id: string;
  uid: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  duration: number; // in days
  startDate: string; // ISO date
  category: Category;
  status: 'active' | 'completed' | 'failed';
  reward: number; // points or something
  icon: string;
  createdAt: string;
}

export type PersonalityType = 'The Saver' | 'The Spender' | 'The Strategist' | 'The Impulse Buyer' | 'The Balanced';

export interface FinancialPersonality {
  type: PersonalityType;
  description: string;
  traits: string[];
  advice: string;
  score: number; // 0-100
}

export interface SpendingSummary {
  total: number;
  byCategory: Record<Category, number>;
  dailySpending: { date: string; amount: number }[];
}
