
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
import { CategoryEnumSchema, allCategories } from '@/lib/types'; // Import allCategories for validation

const CategorizeExpenseInputSchema = z.object({
  description: z
    .string()
    .describe('A free-form text description of the expense.'),
});

export type CategorizeExpenseInput = z.infer<typeof CategorizeExpenseInputSchema>;

const CategorizeExpenseOutputSchema = z.object({
  merchant: z.string().optional().describe('The name of the merchant, if identifiable.'),
  amount: z.number().describe('The amount of the transaction. If not found, use 0.'),
  date: z.string().describe('The date of the transaction in ISO format (YYYY-MM-DD). If not specified, use the current date.'),
  category: CategoryEnumSchema.describe('The budget category of the transaction. If unsure, use "Other".'),
  type: z.enum(["expense", "income"]).describe('Whether the transaction is an expense or income.'),
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
  prompt: `You are an AI assistant that categorizes transactions based on a free-form text description. Your goal is to extract as much information as possible.

Analyze the following description:
Description: {{{description}}}

Extract the following details and return them in JSON format:
- merchant: The name of the merchant. If not clearly identifiable, omit this field or set it to an empty string.
- amount: The transaction amount as a number. If no amount is mentioned or inferable, use 0.
- date: The transaction date in YYYY-MM-DD format. If not specified, use the current date.
- category: The budget category. Choose from the following: ${CategoryEnumSchema.options.join(', ')}. If unsure, or if the description doesn't fit a specific category, use "Other".
- type: Classify as "expense" or "income" based on context (e.g., "received salary" implies income, "paid for lunch" implies expense).

Even if some details are unclear, provide your best interpretation for all fields. It's important to return a complete JSON object matching the requested structure.
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

    // Initialize a default output structure, ensuring all fields are present.
    // The AI is expected to return data conforming to CategorizeExpenseOutputSchema.
    // These defaults act as a fallback if the AI's output is unexpectedly sparse or if a field needs to be normalized.
    
    const result: CategorizeExpenseOutput = {
      merchant: output?.merchant || undefined,
      amount: typeof output?.amount === 'number' ? output.amount : 0,
      date: output?.date && /^\d{4}-\d{2}-\d{2}$/.test(output.date) ? output.date : new Date().toISOString().split('T')[0],
      category: output?.category && allCategories.includes(output.category as any) ? output.category : 'Other',
      type: output?.type === 'income' || output?.type === 'expense' ? output.type : 'expense', // Default to expense
    };

    // Refine type classification if AI didn't confidently set it or if it was defaulted
    if (!output?.type || (output.type !== 'income' && output.type !== 'expense')) {
        const descriptionLower = input.description.toLowerCase();
        if (descriptionLower.includes('salary') || 
            descriptionLower.includes('received') || 
            descriptionLower.includes('deposit') || 
            descriptionLower.includes('income') ||
            descriptionLower.includes('got paid') ||
            descriptionLower.includes('payment for')) {
            result.type = 'income';
        } else {
            // More robust expense detection - if not clearly income, assume expense
            result.type = 'expense';
        }
    } else {
        result.type = output.type; // Use AI's type if it was valid
    }
    
    // Ensure category is valid, falling back to 'Other' if the AI's choice isn't in our list.
    // The schema validation from Zod on the prompt output should ideally catch invalid enum values.
    // This is an additional safeguard.
    if (!allCategories.includes(result.category as any)) {
        result.category = 'Other';
    }

    return result;
  }
);

