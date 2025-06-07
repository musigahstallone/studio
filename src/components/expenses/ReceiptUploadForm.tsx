"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/shared/FileUpload";
import { ScanLine } from "lucide-react";
import { processReceiptExpense, type ProcessedExpenseData } from "@/actions/aiActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";


interface ReceiptUploadFormProps {
  onDataExtracted: (data: ProcessedExpenseData & { type: "expense" | "income" }) => void;
}

export function ReceiptUploadForm({ onDataExtracted }: ReceiptUploadFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ProcessedExpenseData | null>(null);


  const handleFileChange = (dataUri: string | null) => {
    setFileDataUri(dataUri);
    setExtractedData(null); // Clear previous extracted data when new file is selected
  };

  async function handleSubmit() {
    if (!fileDataUri) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please upload a receipt image first.",
      });
      return;
    }

    setIsLoading(true);
    setExtractedData(null);
    try {
      const result = await processReceiptExpense({ photoDataUri: fileDataUri });
      const type = (result.category === 'Salary' || (result.category === 'Investments' && result.amount > 0)) ? 'income' : 'expense';
      
      setExtractedData(result);
      onDataExtracted({...result, type}); // Pass to parent to pre-fill main form
      toast({
        title: "Data Extracted from Receipt",
        description: `Merchant: ${result.merchant || 'N/A'}, Amount: $${result.amount.toFixed(2)}`,
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "AI Error",
        description: error instanceof Error ? error.message : "Could not process receipt.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extract from Receipt</CardTitle>
        <CardDescription>
          Upload an image of your receipt, and AI will attempt to extract the details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FileUpload onFileChange={handleFileChange} />
          <Button onClick={handleSubmit} disabled={isLoading || !fileDataUri} className="w-full sm:w-auto">
            <ScanLine className="mr-2 h-4 w-4" /> {isLoading ? "Processing..." : "Extract Data with AI"}
          </Button>
        </div>
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
