
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/shared/FileUpload";
import { ScanLine, CornerDownLeft } from "lucide-react";
import { processReceiptExpense, type ProcessedExpenseData } from "@/actions/aiActions";

interface ReceiptUploadFormProps {
  onDataExtracted: (data: ProcessedExpenseData) => void;
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
      setExtractedData(result);
      onDataExtracted(result);
      toast({
        title: "Data Extracted",
        description: `${result.description} - Amount: $${result.amount.toFixed(2)}`,
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

  const handleUseExtractedData = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload onFileChange={handleFileChange} />
      <Button onClick={handleSubmit} disabled={isLoading || !fileDataUri} className="w-full">
        <ScanLine className="mr-2 h-4 w-4" /> {isLoading ? "Processing..." : "Extract Data"}
      </Button>
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
