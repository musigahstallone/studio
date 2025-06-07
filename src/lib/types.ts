
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
  userId: string; // Added for user association
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: Category;
  merchant?: string;
  type: 'expense' | 'income';
  receiptUrl?: string; // Optional: For storing Firebase Storage URL
}

export interface Budget {
  id: string;
  userId: string; // Added for user association
  name: string;
  category: Category;
  amount: number; // Target budget amount
  spentAmount: number; // Actual amount spent in this category for the period
}

// Updated User type, more aligned with potential Firebase Auth structure
export interface User {
  uid: string; // Firebase User ID
  name?: string | null; // Display name
  email?: string | null;
  photoURL?: string | null; // Profile picture URL
  joinDate?: string; // YYYY-MM-DD - App specific
  // For mock data consistency on admin page
  transactionCount?: number;
  totalSpent?: number;
  // In a real system, roles would be managed via custom claims or a roles collection
  isAdmin?: boolean; 
}
