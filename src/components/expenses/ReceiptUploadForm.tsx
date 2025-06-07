
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/shared/FileUpload";
import { ScanLine, CornerDownLeft } from "lucide-react";
import { processReceiptExpense, type ProcessedExpenseData } from "@/actions/aiActions";
// import { storage } from "@/lib/firebase"; // Step 1 for Firebase Storage
// import { ref, uploadString, getDownloadURL } from "firebase/storage"; // Step 1 for Firebase Storage

interface ReceiptUploadFormProps {
  onDataExtracted: (data: ProcessedExpenseData & { receiptUrl?: string }) => void;
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

    // --- Placeholder for Firebase Storage Upload ---
    let receiptFirebaseUrl: string | undefined = undefined;
    // if (fileDataUri) {
    //   try {
    //     console.log("Attempting to upload to Firebase Storage...");
    //     const userId = "some_user_id"; // Replace with actual user ID from auth
    //     const imageName = `receipt-upload-${Date.now()}.${fileDataUri.substring(fileDataUri.indexOf('/') + 1, fileDataUri.indexOf(';'))}`;
    //     const storageRef = ref(storage, `receipts/${userId}/${imageName}`);
    //     const snapshot = await uploadString(storageRef, fileDataUri, 'data_url');
    //     receiptFirebaseUrl = await getDownloadURL(snapshot.ref);
    //     console.log('Uploaded file available at', receiptFirebaseUrl);
    //     toast({ title: "Receipt Image Uploaded (Simulated)", description: "Image would be stored in Firebase."});
    //   } catch (uploadError) {
    //     console.error("Error uploading to Firebase Storage: ", uploadError);
    //     toast({ variant: "destructive", title: "Image Upload Failed", description: "Could not save receipt image." });
    //   }
    // }
    // --- End Placeholder ---

    try {
      const result = await processReceiptExpense({ photoDataUri: fileDataUri });
      const finalData = { ...result, receiptUrl: receiptFirebaseUrl };
      setExtractedData(finalData);
      onDataExtracted(finalData);
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
          {extractedData.receiptUrl && <p><span className="font-medium text-muted-foreground">Receipt URL:</span> <a href={extractedData.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Image</a></p>}
          <Button onClick={handleUseExtractedData} variant="outline" size="sm" className="w-full mt-2">
            <CornerDownLeft className="mr-2 h-4 w-4" /> Use This Data Again
          </Button>
          <p className="mt-1 text-xs text-muted-foreground/80 text-center pt-1">This data was used to pre-fill the form.</p>
        </div>
      )}
    </div>
  );
}
