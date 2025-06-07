
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
  amount: number;
  date: string; // YYYY-MM-DD (keep as string for form consistency, convert from/to Timestamp for Firestore)
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
  amount: number;
  spentAmount: number; // Calculated client-side
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

// This is the app's internal User type, could store more profile info from Firestore
export interface AppUser {
  uid: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  joinDate?: string;
  isAdmin?: boolean; // This would ideally come from custom claims or a roles collection
  // For mock data consistency on admin page if needed, but ideally fetched
  transactionCount?: number;
  totalSpent?: number;
}

export const supportedCurrencies = ['USD', 'EUR', 'KES'] as const;
export type CurrencyCode = typeof supportedCurrencies[number];
export const DEFAULT_CURRENCY: CurrencyCode = 'USD';
export const CurrencyCodeSchema = z.enum(supportedCurrencies);

export type Theme = 'light' | 'dark' | 'system';
export const DEFAULT_THEME: Theme = 'system';

// Add font theme ID type if not already present from previous font work
export type FontThemeId = string; // Or a more specific enum if you have fixed font themes
export const DEFAULT_FONT_THEME_ID_CONST = 'work-sans-dm-serif-display'; // Ensure this matches your fonts.ts

