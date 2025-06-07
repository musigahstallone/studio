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
  amount: z.number().describe('The amount of the expense.'),
  date: z.string().describe('The date of the expense in ISO 8601 format (YYYY-MM-DD).'),
  category: z.string().describe('The budget category of the expense.'),
});
export type ExtractExpenseDataOutput = z.infer<typeof ExtractExpenseDataOutputSchema>;

export async function extractExpenseData(input: ExtractExpenseDataInput): Promise<ExtractExpenseDataOutput> {
  return extractExpenseDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractExpenseDataPrompt',
  input: {schema: ExtractExpenseDataInputSchema},
  output: {schema: ExtractExpenseDataOutputSchema},
  prompt: `You are an expert financial assistant specializing in extracting information from receipts.

You will use the receipt photo to extract the merchant, amount, date, and budget category.

Return the date in ISO 8601 format (YYYY-MM-DD).

Receipt Photo: {{media url=photoDataUri}}`,
});

const extractExpenseDataFlow = ai.defineFlow(
  {
    name: 'extractExpenseDataFlow',
    inputSchema: ExtractExpenseDataInputSchema,
    outputSchema: ExtractExpenseDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
