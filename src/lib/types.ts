
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
  amount: number; // Assumed to be in DEFAULT_STORED_CURRENCY
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
  amount: number; // Assumed to be in DEFAULT_STORED_CURRENCY
  spentAmount: number; // Calculated client-side, also in DEFAULT_STORED_CURRENCY before display conversion
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
  totalSpent?: number;
}

export const supportedCurrencies = ['USD', 'EUR', 'KES'] as const;
export type CurrencyCode = typeof supportedCurrencies[number];

// DEFAULT_CURRENCY is the one selected by default in settings if nothing is in localStorage
export const DEFAULT_CURRENCY: CurrencyCode = 'USD'; 
// DEFAULT_STORED_CURRENCY is the currency in which all raw numerical amounts are assumed to be stored in Firestore
export const DEFAULT_STORED_CURRENCY: CurrencyCode = 'USD'; 

export const CurrencyCodeSchema = z.enum(supportedCurrencies);

export type Theme = 'light' | 'dark' | 'system';
export const DEFAULT_THEME: Theme = 'system';

export type FontThemeId = string; 
export const DEFAULT_FONT_THEME_ID_CONST = 'work-sans-dm-serif-display';
