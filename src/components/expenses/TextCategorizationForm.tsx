
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2, CornerDownLeft } from "lucide-react";
import { useState } from "react";
import { processTextExpense, type ProcessedExpenseData } from "@/actions/aiActions";

const TextCategorizationSchema = z.object({
  description: z.string().min(5, { message: "Please enter a more detailed description." }).max(200, { message: "Description must be 200 characters or less."}),
});

interface TextCategorizationFormProps {
  onDataExtracted: (data: ProcessedExpenseData) => void;
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
      setExtractedData(result);
      onDataExtracted(result);
      toast({
        title: "Data Extracted",
        description: `${result.description} - Amount: $${result.amount.toFixed(2)}`,
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
    if (extractedData) {
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
                    placeholder="e.g., Dinner with friends $55 on 2024-07-15, or Received payment for freelance work $500"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            <Wand2 className="mr-2 h-4 w-4" /> {isLoading ? "Processing..." : "Extract Data"}
          </Button>
        </form>
      </Form>
      {extractedData && (
        <div className="mt-6 rounded-md border bg-muted/50 p-4 text-sm space-y-2">
          <h4 className="font-semibold mb-1 text-foreground">Previously Extracted:</h4>
          <p><span className="font-medium text-muted-foreground">Desc:</span> {extractedData.description}</p>
          <p><span className="font-medium text-muted-foreground">Merchant:</span> {extractedData.merchant || "N/A"}</p>
          <p><span className="font-medium text-muted-foreground">Amount:</span> ${extractedData.amount.toFixed(2)} ({extractedData.type})</p>
          <p><span className="font-medium text-muted-foreground">Date:</span> {extractedData.date}</p>
          <p><span className="font-medium text-muted-foreground">Category:</span> {extractedData.category}</p>
          <Button onClick={handleUseExtractedData} variant="outline" size="sm" className="w-full mt-2">
            <CornerDownLeft className="mr-2 h-4 w-4" /> Use This Data Again
          </Button>
          <p className="mt-1 text-xs text-muted-foreground/80 text-center pt-1">This data was used to pre-fill the form.</p>
        </div>
      )}
    </div>
  );
}
