
import { z } from 'zod';

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
  'Investments', // Can be an expense (e.g. brokerage fees) or outflow
  'Bills & Fees',
  'Personal Care',
  'Groceries',
  'Other',
];

export const incomeCategories: Category[] = [
  'Salary',
  'Investments', // Can be income (e.g. dividends)
  'Gifts & Donations',
  'Other',
];

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: Category;
  merchant?: string;
  type: 'expense' | 'income';
}

export interface Budget {
  id: string;
  name: string;
  category: Category;
  amount: number; // Target budget amount
  spentAmount: number; // Actual amount spent in this category for the period
}

export interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string; // YYYY-MM-DD
  transactionCount: number;
  totalSpent: number;
}
