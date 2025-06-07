
'use server';

/**
 * @fileOverview An AI agent that extracts expense data from a receipt image.
 *
 * - extractExpenseData - A function that handles the expense data extraction process.
 * - ExtractExpenseDataInput - The input type for the extractExpenseData function.
 * - ExtractExpenseDataOutput - The return type for the extractExpenseData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractExpenseDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractExpenseDataInput = z.infer<typeof ExtractExpenseDataInputSchema>;

const ExtractExpenseDataOutputSchema = z.object({
  merchant: z.string().describe('The name of the merchant.'),
  amount: z.number().describe('The total amount of the transaction.'),
  date: z.string().describe('The date of the transaction in ISO 8601 format (YYYY-MM-DD).'),
  category: z.string().describe('The budget category of the transaction (e.g., Food & Drink, Shopping).'),
  type: z.enum(["expense", "income"]).describe('Whether the transaction is an expense or income.'),
  description: z.string().describe('A concise and engaging description of the transaction derived from the receipt (e.g., "Lunch at The Grand Cafe including appetizers and drinks", or "Salary deposit from Acme Corp"). If it is an income type, it should reflect that e.g. "Payment received from [Client/Source]" or "Refund from [Merchant]"'),
});
export type ExtractExpenseDataOutput = z.infer<typeof ExtractExpenseDataOutputSchema>;

export async function extractExpenseData(input: ExtractExpenseDataInput): Promise<ExtractExpenseDataOutput> {
  return extractExpenseDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractExpenseDataPrompt',
  input: {schema: ExtractExpenseDataInputSchema},
  output: {schema: ExtractExpenseDataOutputSchema},
  prompt: `You are an expert financial assistant specializing in extracting information from receipts or financial documents.

You will use the provided image to extract the merchant, total amount, date, budget category, determine if it's an expense or income, and generate a concise, engaging description of the transaction.

Return the date in ISO 8601 format (YYYY-MM-DD). If the date is not clearly visible, assume the current date.
Based on the items, merchant, and total, classify this as 'expense' or 'income'. For example, a typical store receipt is an 'expense'. If the document indicates money received (e.g. a payment confirmation, a refund slip), classify it as 'income'.
The description should summarize what was purchased or the nature of the income (e.g., "Groceries from SuperMart including fresh produce and dairy" for an expense, or "Refund for returned item at TechStore" for income).

Image: {{media url=photoDataUri}}`,
});

const extractExpenseDataFlow = ai.defineFlow(
  {
    name: 'extractExpenseDataFlow',
    inputSchema: ExtractExpenseDataInputSchema,
    outputSchema: ExtractExpenseDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to provide an output for extraction.");
    }
    if (!output.date) {
      output.date = new Date().toISOString().split('T')[0];
    }
    if (!output.type) {
      // Basic fallback based on common receipt scenarios or if category suggests income
      output.type = (output.category === 'Salary' || (output.merchant && output.merchant.toLowerCase().includes('refund'))) ? 'income' : 'expense';
    }
    if (!output.description) {
      output.description = `${output.type === 'income' ? 'Income' : 'Purchase'} at ${output.merchant || 'Unknown Source/Merchant'}`;
    }
    return output;
  }
);

