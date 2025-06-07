
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

const CategorizeExpenseInputSchema = z.object({
  description: z
    .string()
    .describe('A free-form text description of the expense.'),
});

export type CategorizeExpenseInput = z.infer<typeof CategorizeExpenseInputSchema>;

const CategorySchema = z.enum([
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
]);

const CategorizeExpenseOutputSchema = z.object({
  merchant: z.string().optional().describe('The name of the merchant, if identifiable.'),
  amount: z.number().describe('The amount of the expense.'),
  date: z.string().describe('The date of the expense in ISO format (YYYY-MM-DD). If not specified, use the current date.'),
  category: CategorySchema.describe('The budget category of the expense.'),
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
  prompt: `You are an AI assistant that categorizes expenses based on a free-form text description.

  Analyze the following description and extract the merchant (if available), amount, date, and budget category.
  If the date is not specified in the description, assume the current date.

  Description: {{{description}}}

  Return the data in JSON format.
  The category should be one of the following: ${CategorySchema.options.join(', ')}.
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
     // Ensure date is present, fallback to today if AI misses it (though prompt guides it)
    if (!output.date) {
      output.date = new Date().toISOString().split('T')[0];
    }
    return output;
  }
);
