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
  'Other',
]);

const CategorizeExpenseOutputSchema = z.object({
  merchant: z.string().describe('The name of the merchant.'),
  amount: z.number().describe('The amount of the expense.'),
  date: z.string().describe('The date of the expense in ISO format (YYYY-MM-DD).'),
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

  Analyze the following description and extract the merchant, amount, date, and budget category.

  Description: {{{description}}}

  Return the data in JSON format.
  The category should be one of the following: Food & Drink, Transportation, Entertainment, Shopping, Travel, Utilities, Rent, Salary, Other.
  The date should be formatted as YYYY-MM-DD.
  The amount should be a number.
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
    return output!;
  }
);
