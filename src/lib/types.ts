
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
  | 'P2P Transfer' // For peer-to-peer transfers
  | 'Platform Payout' // For admin withdrawing platform revenue
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
  'P2P Transfer',
  'Platform Payout',
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
  'Savings',
  'P2P Transfer', // Added
  'Other',
];

export const incomeCategories: Category[] = [
  'Salary',
  'Investments',
  'Gifts & Donations',
  'Savings Withdrawal',
  'P2P Transfer', // Added
  'Platform Payout', // Added
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
  p2pRecipientTag?: string | null; // For P2P expense, recipient's tag
  p2pSenderName?: string | null; // For P2P income, sender's name
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
  warnOnExceed?: boolean; // New field for warning preference
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
  transactionTag?: string; // Unique tag for P2P transactions
  transactionCount: number; // Now mandatory
  totalSpent: number; // Now mandatory, assumed to be in DEFAULT_STORED_CURRENCY
  isActive?: boolean;
  isDeletedAccount?: boolean;
  deletedAt?: string | Timestamp; // ISO string or Firestore Timestamp
}

export const supportedCurrencies = ['USD', 'EUR', 'KES'] as const;
export type CurrencyCode = typeof supportedCurrencies[number];

export const DEFAULT_DISPLAY_CURRENCY: CurrencyCode = 'USD';
export const DEFAULT_LOCAL_CURRENCY: CurrencyCode = 'KES';
export const DEFAULT_STORED_CURRENCY: CurrencyCode = 'USD';

export const CurrencyCodeSchema = z.enum(supportedCurrencies);

export type Theme = 'light' | 'dark';
export const DEFAULT_THEME: Theme = 'light';

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
  incomeTransactionId: string | null; // Nullable if net amount is zero
  amountWithdrawn: number; // Gross amount taken from savings goal, in DEFAULT_STORED_CURRENCY
  penaltyAmount: number; // Penalty applied, in DEFAULT_STORED_CURRENCY
  transactionCost: number; // Transaction cost applied, in DEFAULT_STORED_CURRENCY
  netAmountToUser: number; // Amount user received as income, in DEFAULT_STORED_CURRENCY
  date: string; // YYYY-MM-DD
  isEarlyWithdrawal: boolean;
  createdAt?: string | Timestamp;
}

export interface PlatformRevenueEntry {
  id: string;
  userId: string; // User who incurred the penalty/fee, or admin performing payout
  relatedGoalId?: string | null; // If related to a specific savings goal
  relatedP2PTransactionId?: string | null; // If related to a P2P transaction
  type: 'penalty' | 'transaction_fee' | 'payout'; // Payout is negative
  amount: number; // In DEFAULT_STORED_CURRENCY (positive for income, negative for payout)
  description: string;
  date: string; // YYYY-MM-DD
  createdAt?: string | Timestamp;
}

export const generateTransactionTag = (length: number = 8): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
