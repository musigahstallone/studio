
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2, CornerDownLeft } from "lucide-react";
import { useState } from "react";
import { processTextExpense, type ProcessedExpenseData } from "@/actions/aiActions";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, convertToBaseCurrency } from "@/lib/utils"; // Import convertToBaseCurrency
import { DEFAULT_STORED_CURRENCY } from "@/lib/types";

const TextCategorizationSchema = z.object({
  description: z.string().min(5, { message: "Please enter a more detailed description." }).max(200, { message: "Description must be 200 characters or less."}),
});

interface TextCategorizationFormProps {
  onDataExtracted: (data: ProcessedExpenseData) => void;
}

export function TextCategorizationForm({ onDataExtracted }: TextCategorizationFormProps) {
  const { toast } = useToast();
  const { displayCurrency, localCurrency, isMounted: settingsMounted } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  // Store extracted data with amount in DEFAULT_STORED_CURRENCY
  const [extractedData, setExtractedData] = useState<ProcessedExpenseData | null>(null);

  const form = useForm<z.infer<typeof TextCategorizationSchema>>({
    resolver: zodResolver(TextCategorizationSchema),
    defaultValues: {
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof TextCategorizationSchema>) {
    if (!settingsMounted) {
        toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again."});
        return;
    }
    setIsLoading(true);
    setExtractedData(null);
    try {
      const resultFromAI = await processTextExpense({ description: values.description });
      
      // The AI returns a raw amount. Assume this amount is in the user's 'localCurrency'.
      // Convert it to DEFAULT_STORED_CURRENCY before passing to onDataExtracted.
      const amountInBaseCurrency = convertToBaseCurrency(resultFromAI.amount, localCurrency);

      const processedResultForForm: ProcessedExpenseData = {
        ...resultFromAI,
        amount: amountInBaseCurrency, // This is now in DEFAULT_STORED_CURRENCY
      };
      
      setExtractedData(processedResultForForm); // Store data with amount in base currency
      onDataExtracted(processedResultForForm); // Pass data with amount in base currency

      toast({
        title: "Data Extracted",
        // Format for display using displayCurrency
        description: `${resultFromAI.description} - Amount: ${formatCurrency(amountInBaseCurrency, displayCurrency)}`,
      });
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Error",
        description: error instanceof Error ? error.message : "Could not process text.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleUseExtractedData = () => {
    if (extractedData) { // extractedData.amount is already in DEFAULT_STORED_CURRENCY
      onDataExtracted(extractedData);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`e.g., Dinner with friends 55 ${localCurrency} on 2024-07-15, or Received payment 500 ${localCurrency}`}
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  AI will attempt to parse amount, date, merchant, and category. Amounts are assumed to be in your local input currency ({localCurrency}).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading || !settingsMounted} className="w-full">
            <Wand2 className="mr-2 h-4 w-4" /> {isLoading ? "Processing..." : "Extract Data"}
          </Button>
        </form>
      </Form>
      {extractedData && (
        <div className="mt-6 rounded-md border bg-muted/50 p-4 text-sm space-y-2">
          <h4 className="font-semibold mb-1 text-foreground">Previously Extracted:</h4>
          <p><span className="font-medium text-muted-foreground">Desc:</span> {extractedData.description}</p>
          <p><span className="font-medium text-muted-foreground">Merchant:</span> {extractedData.merchant || "N/A"}</p>
          {/* Display amount converted from base to display currency */}
          <p><span className="font-medium text-muted-foreground">Amount:</span> {formatCurrency(extractedData.amount, displayCurrency)} ({extractedData.type})</p>
          <p><span className="font-medium text-muted-foreground">Date:</span> {extractedData.date}</p>
          <p><span className="font-medium text-muted-foreground">Category:</span> {extractedData.category}</p>
          <Button onClick={handleUseExtractedData} variant="outline" size="sm" className="w-full mt-2" disabled={!settingsMounted}>
            <CornerDownLeft className="mr-2 h-4 w-4" /> Use This Data Again
          </Button>
          <p className="mt-1 text-xs text-muted-foreground/80 text-center pt-1">
            This data will pre-fill the main transaction form. The amount shown is in your display currency ({displayCurrency}).
          </p>
        </div>
      )}
    </div>
  );
}
