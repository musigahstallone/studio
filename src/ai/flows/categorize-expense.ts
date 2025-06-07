
'use server';

/**
 * @fileOverview Categorizes expenses from a free-form text description.
 *
 * - categorizeExpense - A function that categorizes expenses.
 * - CategorizeExpenseInput - The input type for the categorizeExpense function.
 * - CategorizeExpenseOutput - The return type for the categorizeExpense function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CategoryEnumSchema, allCategories } from '@/lib/types';

const CategorizeExpenseInputSchema = z.object({
  description: z
    .string()
    .describe('A free-form text description of the expense.'),
});

export type CategorizeExpenseInput = z.infer<typeof CategorizeExpenseInputSchema>;

const CategorizeExpenseOutputSchema = z.object({
  merchant: z.string().optional().describe('The name of the merchant. If not identifiable, set to empty string or omit.'),
  amount: z.number().describe('The amount of the transaction. If not found or unparsable, use 0.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format. If not specified, use the current date.'),
  category: CategoryEnumSchema.describe(`The budget category of the transaction. Choose from: ${CategoryEnumSchema.options.join(', ')}. If unsure, or if the description doesn't fit a specific category, use "Other".`),
  type: z.enum(["expense", "income"]).describe('Whether the transaction is an expense or income. Infer based on context (e.g., "received salary" implies income, "paid for lunch" implies expense). If unclear, default to "expense".'),
});

export type CategorizeExpenseOutput = z.infer<typeof CategorizeExpenseOutputSchema>;

export async function categorizeExpense(
  input: CategorizeExpenseInput
): Promise<CategorizeExpenseOutput> {
  return categorizeExpenseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeExpensePrompt',
  input: {schema: CategorizeExpenseInputSchema},
  output: {schema: CategorizeExpenseOutputSchema},
  prompt: `You are an AI assistant that categorizes transactions based on a free-form text description. Your goal is to extract as much information as possible and return a complete JSON object matching the specified output schema.

Analyze the following description:
Description: {{{description}}}

Extract the following details. It is CRITICAL to return ALL fields in the JSON output, even if some values are defaults.
- merchant: The name of the merchant. If not clearly identifiable, set to an empty string or omit.
- amount: The transaction amount as a number. If no amount is mentioned or inferable, YOU MUST use 0.
- date: The transaction date in YYYY-MM-DD format. If not specified or unparsable, YOU MUST use the current date.
- category: The budget category. Choose from the following: ${CategoryEnumSchema.options.join(', ')}. If unsure, or if the description doesn't fit a specific category, YOU MUST use "Other".
- type: Classify as "expense" or "income" based on context (e.g., "received salary" implies income, "paid for lunch" implies expense). If unclear, YOU MUST default to "expense".

Provide your best interpretation for all fields, ensuring the output is a valid JSON object matching the requested structure.
  `,
});

const categorizeExpenseFlow = ai.defineFlow(
  {
    name: 'categorizeExpenseFlow',
    inputSchema: CategorizeExpenseInputSchema,
    outputSchema: CategorizeExpenseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    // Fallback logic in case the AI fails to adhere perfectly to instructions
    // or if Zod parsing of the output has issues (though ai.definePrompt handles parsing)
    const result: CategorizeExpenseOutput = {
      merchant: output?.merchant || undefined, // Allow undefined if AI omits
      amount: (typeof output?.amount === 'number' && !isNaN(output.amount)) ? output.amount : 0,
      date: (output?.date && /^\d{4}-\d{2}-\d{2}$/.test(output.date)) ? output.date : new Date().toISOString().split('T')[0],
      category: (output?.category && allCategories.includes(output.category as any)) ? output.category : 'Other',
      type: (output?.type === 'income' || output?.type === 'expense') ? output.type : 'expense',
    };
    
    // Further refine type classification if it was defaulted by our code or AI was unsure
    if (result.type === 'expense' && (!output?.type || (output.type !== 'income' && output.type !== 'expense'))) {
        const descriptionLower = input.description.toLowerCase();
        if (descriptionLower.includes('salary') || 
            descriptionLower.includes('received') || 
            descriptionLower.includes('deposit') || 
            descriptionLower.includes('income') ||
            descriptionLower.includes('got paid') ||
            descriptionLower.includes('payment for')) {
            result.type = 'income';
            // If it's income, and category was defaulted to 'Other' or a common expense category, re-evaluate
            if (result.category === 'Other' || !incomeCategories.includes(result.category as any)) {
                if (descriptionLower.includes('salary')) result.category = 'Salary';
                else result.category = 'Other'; // Or a more sophisticated income category detection
            }
        }
    }
    
    // Ensure category is valid
    if (!allCategories.includes(result.category as any)) {
        result.category = 'Other';
    }
    // If type is income but category is an expense-only one, default to 'Other' or 'Salary'
    if (result.type === 'income' && !incomeCategories.includes(result.category as any)) {
        result.category = input.description.toLowerCase().includes('salary') ? 'Salary' : 'Other';
    }


    return result;
  }
);

const incomeCategories: Category[] = [ // Define locally if not already imported/available
  'Salary',
  'Investments',
  'Gifts & Donations',
  'Other',
];
