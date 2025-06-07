"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";
import { useState } from "react";
import { processTextExpense, type ProcessedExpenseData } from "@/actions/aiActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const TextCategorizationSchema = z.object({
  description: z.string().min(5, { message: "Please enter a more detailed description." }),
});

interface TextCategorizationFormProps {
  onDataExtracted: (data: ProcessedExpenseData & { type: "expense" | "income" }) => void;
}

export function TextCategorizationForm({ onDataExtracted }: TextCategorizationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ProcessedExpenseData | null>(null);

  const form = useForm<z.infer<typeof TextCategorizationSchema>>({
    resolver: zodResolver(TextCategorizationSchema),
    defaultValues: {
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof TextCategorizationSchema>) {
    setIsLoading(true);
    setExtractedData(null);
    try {
      const result = await processTextExpense({ description: values.description });
      // Determine if it's income or expense based on amount or category
      // For simplicity, assume expense if not explicitly salary/investment income from AI.
      // A more robust solution would involve AI explicitly stating type or more keywords.
      const type = (result.category === 'Salary' || (result.category === 'Investments' && result.amount > 0)) ? 'income' : 'expense';
      
      setExtractedData(result);
      onDataExtracted({...result, type }); // Pass to parent to pre-fill main form
      toast({
        title: "Data Extracted via Text",
        description: `Merchant: ${result.merchant || 'N/A'}, Amount: $${result.amount.toFixed(2)}`,
      });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorize by Text</CardTitle>
        <CardDescription>
          Enter a free-form description (e.g., &quot;Lunch at Cafe Mocha - $12.50&quot; or &quot;Spotify subscription for July $10.99&quot;) and let AI extract the details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Dinner at The Local Diner with friends $55 on 2024-07-15"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              <Wand2 className="mr-2 h-4 w-4" /> {isLoading ? "Processing..." : "Extract Data with AI"}
            </Button>
          </form>
        </Form>
        {extractedData && (
          <div className="mt-6 rounded-md border bg-muted p-4">
            <h4 className="font-semibold">Extracted Data:</h4>
            <p>Merchant: {extractedData.merchant || "N/A"}</p>
            <p>Amount: ${extractedData.amount.toFixed(2)}</p>
            <p>Date: {extractedData.date}</p>
            <p>Category: {extractedData.category}</p>
            <p className="mt-2 text-sm text-muted-foreground">This data has been used to pre-fill the manual entry form. Please review and submit.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
