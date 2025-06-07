
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
import { CategoryEnumSchema, allCategories, incomeCategories as appIncomeCategories } from '@/lib/types';

const ExtractExpenseDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt or financial document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractExpenseDataInput = z.infer<typeof ExtractExpenseDataInputSchema>;

const ExtractExpenseDataOutputSchema = z.object({
  merchant: z.string().describe('The name of the merchant or source. If not identifiable, use "Unknown Merchant/Source".'),
  amount: z.number().describe('The total amount of the transaction. If unclear or not found, YOU MUST use 0.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format. If not visible, YOU MUST use the current date.'),
  category: CategoryEnumSchema.describe(`The budget category of the transaction. Choose from: ${CategoryEnumSchema.options.join(', ')}. If unsure, YOU MUST use "Other".`),
  type: z.enum(["expense", "income"]).describe('Whether the transaction is an expense or income. Infer based on document. If unclear, default to "expense".'),
  description: z.string().describe('A concise description of the transaction (e.g., "Lunch at The Grand Cafe", "Salary deposit"). If cannot be determined, use a generic description like "[Income/Expense] from [Merchant/Source]".'),
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

You will use the provided image to extract key financial details. It is CRITICAL to return ALL fields defined in the output schema, even if some values must be defaulted.
- merchant: The name of the merchant or source. If not identifiable from the image, YOU MUST use "Unknown Merchant/Source".
- amount: The total transaction amount as a number. If this is not clearly visible or parsable, YOU MUST use 0.
- date: The transaction date in YYYY-MM-DD format. If the date is not clearly visible, YOU MUST use the current date.
- category: The budget category. Choose from: ${CategoryEnumSchema.options.join(', ')}. If unsure or cannot determine, YOU MUST use "Other".
- type: Classify as "expense" or "income". For example, a typical store receipt is an "expense". If the document indicates money received (e.g., payment confirmation, refund slip), classify as "income". If unclear, YOU MUST default to "expense".
- description: Generate a concise description (e.g., "Groceries from SuperMart", "Salary deposit from Acme Corp", "Refund from TechStore"). If details are sparse, use a generic like "[Income/Expense] from [Merchant/Source]".

Analyze this image carefully:
Image: {{media url=photoDataUri}}

Return a complete JSON object matching the specified output schema.
  `,
});

const extractExpenseDataFlow = ai.defineFlow(
  {
    name: 'extractExpenseDataFlow',
    inputSchema: ExtractExpenseDataInputSchema,
    outputSchema: ExtractExpenseDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    // Robust fallbacks if the AI output is incomplete, despite the strong prompt instructions.
    // This ensures the function always returns a valid ExtractExpenseDataOutput.
    const result: ExtractExpenseDataOutput = {
      merchant: output?.merchant || "Unknown Merchant/Source",
      amount: (typeof output?.amount === 'number' && !isNaN(output.amount)) ? output.amount : 0,
      date: (output?.date && /^\d{4}-\d{2}-\d{2}$/.test(output.date)) ? output.date : new Date().toISOString().split('T')[0],
      category: (output?.category && allCategories.includes(output.category as any)) ? output.category : 'Other',
      type: (output?.type === 'income' || output?.type === 'expense') ? output.type : 'expense',
      description: output?.description || `Transaction at ${output?.merchant || "Unknown Merchant/Source"}`
    };

    // Additional refinement for type based on category if not strongly determined by AI
    if (result.type === 'expense' && (!output?.type || (output.type !== 'income' && output.type !== 'expense'))) {
        if (result.category === 'Salary' || (result.merchant && result.merchant.toLowerCase().includes('refund'))) {
            result.type = 'income';
        }
    }
    
    // Ensure description makes sense with the type
    if (!output?.description) {
        result.description = `${result.type.charAt(0).toUpperCase() + result.type.slice(1)} at ${result.merchant}`;
    }

    // If type is income but category is an expense-only one, default to 'Other' or 'Salary'
    if (result.type === 'income' && !appIncomeCategories.includes(result.category as any)) {
        result.category = result.description.toLowerCase().includes('salary') ? 'Salary' : 'Other';
    }


    return result;
  }
);
