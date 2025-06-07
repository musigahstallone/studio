
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/shared/FileUpload";
import { ScanLine } from "lucide-react";
import { processReceiptExpense, type ProcessedExpenseData } from "@/actions/aiActions";

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
    setExtractedData(null); 
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
      onDataExtracted({...result, type}); 
      toast({
        title: "Data Extracted",
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
    <div className="space-y-4">
      <FileUpload onFileChange={handleFileChange} />
      <Button onClick={handleSubmit} disabled={isLoading || !fileDataUri} className="w-full">
        <ScanLine className="mr-2 h-4 w-4" /> {isLoading ? "Processing..." : "Extract Data"}
      </Button>
      {extractedData && (
         <div className="mt-4 rounded-md border bg-muted/50 p-4 text-sm">
          <h4 className="font-semibold mb-2 text-foreground">Extracted Data:</h4>
          <p><span className="font-medium text-muted-foreground">Merchant:</span> {extractedData.merchant || "N/A"}</p>
          <p><span className="font-medium text-muted-foreground">Amount:</span> ${extractedData.amount.toFixed(2)}</p>
          <p><span className="font-medium text-muted-foreground">Date:</span> {extractedData.date}</p>
          <p><span className="font-medium text-muted-foreground">Category:</span> {extractedData.category}</p>
          <p className="mt-3 text-xs text-muted-foreground">This data has been used to pre-fill the manual entry form. Please review and submit.</p>
        </div>
      )}
    </div>
  );
}
