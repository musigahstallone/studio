
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/shared/FileUpload";
import { ScanLine, CornerDownLeft } from "lucide-react";
import { processReceiptExpense, type ProcessedExpenseData } from "@/actions/aiActions";
import { storage } from "@/lib/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, convertToBaseCurrency } from "@/lib/utils"; // Import convertToBaseCurrency
import { DEFAULT_STORED_CURRENCY } from "@/lib/types";

interface ReceiptUploadFormProps {
  onDataExtracted: (data: ProcessedExpenseData & { receiptUrl?: string }) => void;
}

export function ReceiptUploadForm({ onDataExtracted }: ReceiptUploadFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { displayCurrency, localCurrency, isMounted: settingsMounted } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  // Store extracted data with amount in DEFAULT_STORED_CURRENCY
  const [extractedData, setExtractedData] = useState<ProcessedExpenseData & { receiptUrl?: string } | null>(null);


  const handleFileChange = (dataUri: string | null) => {
    setFileDataUri(dataUri);
    setExtractedData(null);
  };

  async function handleSubmit() {
    if (!fileDataUri) {
      toast({ variant: "destructive", title: "No File Selected", description: "Please upload a receipt image first." });
      return;
    }
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to upload receipts." });
      return;
    }
    if (!settingsMounted) {
        toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again." });
        return;
    }

    setIsLoading(true);
    setExtractedData(null);
    let receiptFirebaseUrl: string | undefined = undefined;

    try {
      const fileExtension = fileDataUri.substring(fileDataUri.indexOf('/') + 1, fileDataUri.indexOf(';base64'));
      const imageName = `receipt-${Date.now()}.${fileExtension || 'jpg'}`;
      const storagePath = `users/${user.uid}/receipts/${imageName}`;
      const imageStorageRef = ref(storage, storagePath);
      const base64String = fileDataUri.split(',')[1];
      if (!base64String) throw new Error("Invalid data URI format for Firebase Storage upload.");
      const snapshot = await uploadString(imageStorageRef, base64String, 'base64');
      receiptFirebaseUrl = await getDownloadURL(snapshot.ref);
      toast({ title: "Receipt Image Uploaded", description: "Image saved to your account."});

      const resultFromAI = await processReceiptExpense({ photoDataUri: fileDataUri });
      
      const amountInBaseCurrency = convertToBaseCurrency(resultFromAI.amount, localCurrency);

      const finalDataForForm: ProcessedExpenseData & { receiptUrl?: string } = { 
        ...resultFromAI, 
        amount: amountInBaseCurrency, 
        receiptUrl: receiptFirebaseUrl 
      };
      
      setExtractedData(finalDataForForm); 
      onDataExtracted(finalDataForForm); 

      toast({
        title: "Data Extracted",
        description: `${resultFromAI.description} - Amount: ${formatCurrency(amountInBaseCurrency, displayCurrency)}`,
      });

    } catch (error: any) {
       let errorMessage = "Could not process or upload receipt.";
       if (error.code === 'storage/retry-limit-exceeded') {
         errorMessage = "Upload failed after multiple retries. Please check your internet connection and try again. Ensure CORS is correctly configured for your Firebase Storage bucket if the issue persists.";
       } else if (error.message) {
         errorMessage = error.message;
       }
       toast({
        variant: "destructive",
        title: "Error Processing Receipt",
        description: errorMessage,
      });
      console.error("Receipt processing/upload error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleUseExtractedData = () => {
    if (extractedData) { 
      onDataExtracted(extractedData);
       toast({
          title: "Using Previous Data",
          description: "Form pre-filled with previously extracted details.",
        });
    }
  };

  return (
    <div className="space-y-4">
      <FileUpload onFileChange={handleFileChange} />
      <Button onClick={handleSubmit} disabled={isLoading || !fileDataUri || !user || !settingsMounted} className="w-full">
        <ScanLine className="mr-2 h-4 w-4" /> {isLoading ? "Processing..." : "Extract Data"}
      </Button>
      {!user && <p className="text-xs text-destructive text-center">Please log in to upload and process receipts.</p>}
      {extractedData && (
         <div className="mt-6 rounded-md border bg-muted/50 p-4 text-sm space-y-2">
          <h4 className="font-semibold mb-1 text-foreground">Previously Extracted:</h4>
          <p><span className="font-medium text-muted-foreground">Desc:</span> {extractedData.description}</p>
          <p><span className="font-medium text-muted-foreground">Merchant:</span> {extractedData.merchant || "N/A"}</p>
          <p><span className="font-medium text-muted-foreground">Amount:</span> {formatCurrency(extractedData.amount, displayCurrency)} ({extractedData.type})</p>
          <p><span className="font-medium text-muted-foreground">Date:</span> {extractedData.date}</p>
          <p><span className="font-medium text-muted-foreground">Category:</span> {extractedData.category}</p>
          {extractedData.receiptUrl && <p><span className="font-medium text-muted-foreground">Receipt URL:</span> <a href={extractedData.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Image</a></p>}
          <Button onClick={handleUseExtractedData} variant="outline" size="sm" className="w-full mt-2" disabled={!settingsMounted}>
            <CornerDownLeft className="mr-2 h-4 w-4" /> Use This Data Again
          </Button>
          <p className="mt-1 text-xs text-muted-foreground/80 text-center pt-1">
            AI assumes the receipt is in your local input currency ({localCurrency}). The displayed amount is in your display currency ({displayCurrency}).
          </p>
        </div>
      )}
    </div>
  );
}

    