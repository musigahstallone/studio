
'use server';

import { categorizeExpense as categorizeExpenseFlow, type CategorizeExpenseInput, type CategorizeExpenseOutput as AiCategorizeOutput } from '@/ai/flows/categorize-expense';
import { extractExpenseData as extractExpenseDataFlow, type ExtractExpenseDataInput, type ExtractExpenseDataOutput as AiExtractOutput } from '@/ai/flows/extract-expense-data';
import type { Category } from '@/lib/types';
import { allCategories } from '@/lib/types';

// Helper to map AI category string to our Category type
const mapAiCategory = (aiCategory: string): Category => {
  const lowerAiCategory = aiCategory.toLowerCase();
  // Direct match
  const directMatch = allCategories.find(cat => cat.toLowerCase() === lowerAiCategory);
  if (directMatch) {
    return directMatch;
  }

  // Fuzzy matching or keyword-based mapping
  if (lowerAiCategory.includes('food') || lowerAiCategory.includes('drink') || lowerAiCategory.includes('restaurant')) return 'Food & Drink';
  if (lowerAiCategory.includes('transport') || lowerAiCategory.includes('gas') || lowerAiCategory.includes('taxi') || lowerAiCategory.includes('uber')) return 'Transportation';
  if (lowerAiCategory.includes('shop') || lowerAiCategory.includes('purchase') || lowerAiCategory.includes('store')) return 'Shopping';
  if (lowerAiCategory.includes('grocery')) return 'Groceries';
  if (lowerAiCategory.includes('bill') || lowerAiCategory.includes('fee') || lowerAiCategory.includes('utility')) return 'Bills & Fees';
  if (lowerAiCategory.includes('health') || lowerAiCategory.includes('medical') || lowerAiCategory.includes('doctor')) return 'Healthcare';
  if (lowerAiCategory.includes('entertain') || lowerAiCategory.includes('movie') || lowerAiCategory.includes('concert')) return 'Entertainment';
  if (lowerAiCategory.includes('salary') || lowerAiCategory.includes('income') || lowerAiCategory.includes('payment received')) return 'Salary';
  
  return 'Other';
};

export interface ProcessedExpenseData {
  merchant?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: Category;
  description: string; 
  type: "expense" | "income";
}

export async function processTextExpense(input: CategorizeExpenseInput): Promise<ProcessedExpenseData> {
  try {
    const result = await categorizeExpenseFlow(input);
    return {
      merchant: result.merchant,
      amount: result.amount,
      date: result.date, 
      category: mapAiCategory(result.category),
      description: input.description, // For text input, the user's description is kept.
      type: result.type,
    };
  } catch (error) {
    console.error("Error processing text expense:", error);
    throw new Error("Failed to categorize transaction from text. Please try entering manually.");
  }
}

export async function processReceiptExpense(input: ExtractExpenseDataInput): Promise<ProcessedExpenseData> {
  try {
    const result = await extractExpenseDataFlow(input);
    const merchantName = result.merchant && result.merchant.trim() !== "" ? result.merchant : "Unknown Merchant/Source";
    return {
      merchant: merchantName,
      amount: result.amount,
      date: result.date, 
      category: mapAiCategory(result.category),
      description: result.description || `${result.type === 'income' ? 'Income from' : 'Receipt from'} ${merchantName}`, // Use AI description or fallback
      type: result.type,
    };
  } catch (error) {
    console.error("Error processing receipt expense:", error);
    throw new Error("Failed to extract transaction data from receipt. Please try entering manually.");
  }
}

