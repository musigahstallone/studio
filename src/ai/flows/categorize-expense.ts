
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
import { CategoryEnumSchema } from '@/lib/types';

const CategorizeExpenseInputSchema = z.object({
  description: z
    .string()
    .describe('A free-form text description of the expense.'),
});

export type CategorizeExpenseInput = z.infer<typeof CategorizeExpenseInputSchema>;

const CategorizeExpenseOutputSchema = z.object({
  merchant: z.string().optional().describe('The name of the merchant, if identifiable.'),
  amount: z.number().describe('The amount of the transaction.'),
  date: z.string().describe('The date of the transaction in ISO format (YYYY-MM-DD). If not specified, use the current date.'),
  category: CategoryEnumSchema.describe('The budget category of the transaction.'),
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
  prompt: `You are an AI assistant that categorizes transactions based on a free-form text description.

  Analyze the following description and extract the merchant (if available), amount, date, budget category, and determine if it's an expense or income.
  If the date is not specified in the description, assume the current date, formatted as YYYY-MM-DD.
  Based on the context of the description (e.g., "received salary", "paid for lunch"), classify this as 'expense' or 'income'.

  Description: {{{description}}}

  Return the data in JSON format.
  The category should be one of the following: ${CategoryEnumSchema.options.join(', ')}.
  The date should be formatted as YYYY-MM-DD.
  The amount should be a number.
  If a merchant name is clearly identifiable, include it. Otherwise, omit the merchant field or set it to an empty string.
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
    if (!output) {
      throw new Error("AI failed to provide an output for categorization.");
    }
    if (!output.date) {
      output.date = new Date().toISOString().split('T')[0];
    }
    if (!output.type) {
        const descriptionLower = input.description.toLowerCase();
        if (descriptionLower.includes('salary') || descriptionLower.includes('received') || descriptionLower.includes('deposit') || descriptionLower.includes('income')) {
            output.type = 'income';
        } else {
            output.type = 'expense';
        }
    }
    return output;
  }
);
