
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
  | 'Savings' // For contributions to savings goals
  | 'Savings Withdrawal' // For withdrawals from savings goals
  | 'Penalty Revenue' // For penalties collected by the platform
  | 'Other';

export const allCategories = [
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
  'Savings',
  'Savings Withdrawal',
  'Penalty Revenue',
  'Other',
] as const;

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
  'Savings', // Added for context
  'Other',
];

export const incomeCategories: Category[] = [
  'Salary',
  'Investments',
  'Gifts & Donations',
  'Savings Withdrawal', // Added for context
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
  relatedSavingsGoalId?: string | null; // Link to savings goal if transaction is related
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
  transactionCount: number; // Now mandatory
  totalSpent: number; // Now mandatory, assumed to be in DEFAULT_STORED_CURRENCY
}

export const supportedCurrencies = ['USD', 'EUR', 'KES'] as const;
export type CurrencyCode = typeof supportedCurrencies[number];

export const DEFAULT_DISPLAY_CURRENCY: CurrencyCode = 'USD';
export const DEFAULT_LOCAL_CURRENCY: CurrencyCode = 'KES';
export const DEFAULT_STORED_CURRENCY: CurrencyCode = 'USD';

export const CurrencyCodeSchema = z.enum(supportedCurrencies);

export type Theme = 'light' | 'dark' | 'system';
export const DEFAULT_THEME: Theme = 'system';

// --- Savings Goal Specific Types ---
export type SavingsGoalStatus = 'active' | 'matured' | 'completed' | 'withdrawnEarly' | 'cancelled';
export type SavingsGoalWithdrawalCondition = 'targetAmountReached' | 'maturityDateReached';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number; // In DEFAULT_STORED_CURRENCY
  currentAmount: number; // In DEFAULT_STORED_CURRENCY
  
  targetDate: string | null; // YYYY-MM-DD, if goal type is 'targetDate'
  startDate: string | null; // YYYY-MM-DD, if goal type is 'duration'
  durationMonths: number | null; // Number of months, if goal type is 'duration'

  allowsEarlyWithdrawal: boolean;
  earlyWithdrawalPenaltyRate: number; // Decimal, e.g., 0.05 for 5%

  withdrawalCondition: SavingsGoalWithdrawalCondition; // How the goal is considered ready
  status: SavingsGoalStatus; // e.g., active, matured, completed

  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

export interface SavingsGoalContribution {
  id: string;
  userId: string;
  savingsGoalId: string;
  expenseId: string; // ID of the 'expense' record that represents this contribution
  amount: number; // In DEFAULT_STORED_CURRENCY
  date: string; // YYYY-MM-DD
  createdAt?: string | Timestamp;
}

export interface SavingsGoalWithdrawal {
  id: string;
  userId: string;
  savingsGoalId: string;
  incomeTransactionId: string; // ID of the 'income' transaction created for this withdrawal
  amountWithdrawn: number; // Gross amount taken from savings goal, in DEFAULT_STORED_CURRENCY
  penaltyAmount: number; // Penalty applied, in DEFAULT_STORED_CURRENCY
  transactionCost: number; // Future use, in DEFAULT_STORED_CURRENCY
  netAmountToUser: number; // Amount user received as income, in DEFAULT_STORED_CURRENCY
  date: string; // YYYY-MM-DD
  isEarlyWithdrawal: boolean;
  createdAt?: string | Timestamp;
}

export interface PlatformRevenueEntry {
  id: string;
  userId: string; // User who incurred the penalty/fee
  relatedGoalId?: string; // If related to a specific savings goal
  type: 'penalty' | 'transaction_fee';
  amount: number; // In DEFAULT_STORED_CURRENCY
  description: string;
  date: string; // YYYY-MM-DD
  createdAt?: string | Timestamp;
}
