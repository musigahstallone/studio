
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

export type Category =
  | 'Food & Drink'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Travel'
  | 'Utilities'
  | 'Rent'
  | 'Salary'
  | 'Healthcare'
  | 'Education'
  | 'Gifts & Donations'
  | 'Investments'
  | 'Bills & Fees'
  | 'Personal Care'
  | 'Groceries'
  | 'Other';

export const allCategories: Category[] = [
  'Food & Drink',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Travel',
  'Utilities',
  'Rent',
  'Salary',
  'Healthcare',
  'Education',
  'Gifts & Donations',
  'Investments',
  'Bills & Fees',
  'Personal Care',
  'Groceries',
  'Other',
];

export const CategoryEnumSchema = z.enum(allCategories);

export const expenseCategories: Category[] = [
  'Food & Drink',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Travel',
  'Utilities',
  'Rent',
  'Healthcare',
  'Education',
  'Gifts & Donations',
  'Investments',
  'Bills & Fees',
  'Personal Care',
  'Groceries',
  'Other',
];

export const incomeCategories: Category[] = [
  'Salary',
  'Investments',
  'Gifts & Donations',
  'Other',
];

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number; // This will always be stored in DEFAULT_STORED_CURRENCY
  date: string; // YYYY-MM-DD
  category: Category;
  merchant?: string;
  type: 'expense' | 'income';
  receiptUrl?: string | null; // Firebase Storage URL
  createdAt?: string | Timestamp; // ISO string or Firestore Timestamp
  updatedAt?: string | Timestamp; // ISO string or Firestore Timestamp
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  category: Category;
  amount: number; // This will always be stored in DEFAULT_STORED_CURRENCY
  spentAmount: number; // Calculated client-side, converted to display currency before display
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface AppUser {
  uid: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  joinDate?: string; // ISO string date
  isAdmin?: boolean;
  transactionCount?: number;
  totalSpent?: number; // Assumed to be in DEFAULT_STORED_CURRENCY if aggregated on backend
}

export const supportedCurrencies = ['USD', 'EUR', 'KES'] as const;
export type CurrencyCode = typeof supportedCurrencies[number];

// DEFAULT_DISPLAY_CURRENCY is the one selected by default in settings if nothing is in localStorage for display
export const DEFAULT_DISPLAY_CURRENCY: CurrencyCode = 'USD';
// DEFAULT_LOCAL_CURRENCY is the one selected by default in settings if nothing is in localStorage for input
export const DEFAULT_LOCAL_CURRENCY: CurrencyCode = 'KES'; // Example: Kenyan user might input in KES
// DEFAULT_STORED_CURRENCY is the currency in which all raw numerical amounts are stored in Firestore
export const DEFAULT_STORED_CURRENCY: CurrencyCode = 'USD';

export const CurrencyCodeSchema = z.enum(supportedCurrencies);

export type Theme = 'light' | 'dark' | 'system';
export const DEFAULT_THEME: Theme = 'system';

export type FontThemeId = string;
export const DEFAULT_FONT_THEME_ID_CONST = 'work-sans-dm-serif-display';
