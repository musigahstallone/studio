
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processReceiptExpense, type ProcessedExpenseData } from "@/actions/aiActions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, ScanLine, Maximize, Minimize, RefreshCw, CornerDownLeft, VideoOff, CameraOff, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { storage } from "@/lib/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, convertToBaseCurrency } from "@/lib/utils"; // Import convertToBaseCurrency
import { DEFAULT_STORED_CURRENCY } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";


interface CameraReceiptScanProps {
  onDataExtracted: (data: ProcessedExpenseData & { receiptUrl?: string }) => void;
}

export function CameraReceiptScan({ onDataExtracted }: CameraReceiptScanProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { displayCurrency, localCurrency, isMounted: settingsMounted } = useSettings();

  const [isLoading, setIsLoading] = useState(false);
  // Store extracted data with amount in DEFAULT_STORED_CURRENCY
  const [extractedData, setExtractedData] = useState<ProcessedExpenseData & { receiptUrl?: string } | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [showCameraFeed, setShowCameraFeed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCameraFeed(false);
  }, []);

  const startCameraStream = useCallback(async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to use the camera." });
      return;
    }
    setIsCameraInitializing(true);
    setHasCameraPermission(null);
    setCapturedImageUri(null);
    setExtractedData(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      setIsCameraInitializing(false);
      toast({ variant: 'destructive', title: 'Camera Not Supported', description: 'Your browser does not support camera access.' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(err => console.error("Video play failed:", err));
      }
      setShowCameraFeed(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setShowCameraFeed(false);
      if (error instanceof Error && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions and try again.' });
      } else {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access camera.' });
      }
    } finally {
      setIsCameraInitializing(false);
    }
  }, [toast, user]);

  useEffect(() => {
    return () => stopCameraStream();
  }, [stopCameraStream]);

  const handleCapture = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please log in to capture." });
      return;
    }
    if (!settingsMounted) {
      toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again."});
      return;
    }
    if (isFullScreen) setIsFullScreen(false);
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!videoRef.current || !videoRef.current.srcObject || videoRef.current.videoWidth === 0) {
      toast({ variant: "destructive", title: "Camera Not Ready", description: "Start camera first." });
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) { toast({ variant: "destructive", title: "Canvas Error" }); return; }
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) { toast({ variant: "destructive", title: "Canvas Context Error" }); return; }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    setCapturedImageUri(photoDataUri);
    stopCameraStream();
    setIsLoading(true);
    setExtractedData(null);
    let receiptFirebaseUrl: string | undefined = undefined;

    try {
      const base64String = photoDataUri.split(',')[1];
      if (!base64String) throw new Error("Invalid data URI for upload.");
      const imageName = `receipt-camera-${Date.now()}.jpg`;
      const storagePath = `users/${user.uid}/receipts/${imageName}`;
      const imageStorageRef = ref(storage, storagePath);
      const snapshot = await uploadString(imageStorageRef, base64String, 'base64');
      receiptFirebaseUrl = await getDownloadURL(snapshot.ref);
      toast({ title: "Receipt Image Uploaded" });

      const resultFromAI = await processReceiptExpense({ photoDataUri });
      
      const amountInBaseCurrency = convertToBaseCurrency(resultFromAI.amount, localCurrency);

      const finalDataForForm = { ...resultFromAI, amount: amountInBaseCurrency, receiptUrl: receiptFirebaseUrl };
      
      if (!finalDataForForm || typeof finalDataForForm.amount !== 'number' || finalDataForForm.amount <= 0 || !finalDataForForm.date || !/^\d{4}-\d{2}-\d{2}$/.test(finalDataForForm.date) || !finalDataForForm.category) {
        toast({ variant: "destructive", title: "Extraction Incomplete", description: "AI couldn't extract details. Review or re-capture." });
        setExtractedData(finalDataForForm);
      } else {
        setExtractedData(finalDataForForm); 
        onDataExtracted(finalDataForForm); 
        toast({
          title: "Data Extracted & Ready for Form",
          description: `Review pre-filled details: ${resultFromAI.merchant || resultFromAI.category} - ${formatCurrency(amountInBaseCurrency, displayCurrency)}`,
        });
      }
    } catch (error: any) {
      let errorMessage = "Could not process image.";
      if (error.code === 'storage/retry-limit-exceeded') {
        errorMessage = "Upload failed after multiple retries. Please check your internet connection and try again. Ensure CORS is correctly configured for your Firebase Storage bucket if the issue persists.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Processing Error", description: errorMessage });
      console.error("Camera capture/upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseExtractedData = () => {
    if (extractedData) { 
      if (typeof extractedData.amount !== 'number' || extractedData.amount <= 0 || !extractedData.date || !/^\d{4}-\d{2}-\d{2}$/.test(extractedData.date) || !extractedData.category) {
         toast({ variant: "destructive", title: "Invalid Data", description: "Previously extracted data is incomplete. Scan again." });
      } else {
        onDataExtracted(extractedData);
         toast({ title: "Using Previous Data", description: "Form pre-filled with previously extracted details." });
      }
    }
  };

  const videoContainerClasses = cn(
    "relative bg-muted rounded-xl overflow-hidden shadow-inner group",
    isFullScreen ? "fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center" : "w-full aspect-[4/3] h-64 sm:h-80 md:h-96 lg:h-[450px]"
  );

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className={videoContainerClasses}>
        <video ref={videoRef} className={cn("object-contain", isFullScreen ? "max-w-full max-h-full" : "w-full h-full", !showCameraFeed && !capturedImageUri ? "hidden" : "")} autoPlay playsInline muted />
        {capturedImageUri && !showCameraFeed && <Image src={capturedImageUri} alt="Captured receipt" layout="fill" objectFit="contain" data-ai-hint="receipt photo"/>}
        {!capturedImageUri && !showCameraFeed && !isCameraInitializing && hasCameraPermission !== false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-background/80 rounded-xl">
            <CameraOff className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Camera is off.</p>
            <p className="text-xs text-muted-foreground mt-1">Click &quot;Start Camera&quot; to begin scanning.</p>
          </div>
        )}
        {isCameraInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-background/80 rounded-xl">
            <Camera className="h-12 w-12 text-muted-foreground mb-3 animate-pulse" />
            <p className="text-muted-foreground">Initializing camera...</p>
          </div>
        )}
        {hasCameraPermission === false && !isCameraInitializing && (
           <Alert variant="destructive" className="absolute bottom-4 left-4 right-4 sm:max-w-md mx-auto shadow-lg">
            <Zap className="h-4 w-4" />
            <AlertTitle>Camera Access Denied</AlertTitle>
            <AlertDescription>Please enable camera permissions in your browser settings and click &quot;Retry Camera Access&quot;.</AlertDescription>
          </Alert>
        )}
        {isLoading && capturedImageUri && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 rounded-xl">
            <div role="status" className="text-center">
                <svg aria-hidden="true" className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
                <p className="text-white text-sm mt-2">Analyzing receipt...</p>
            </div>
          </div>
        )}
        {(showCameraFeed || capturedImageUri) && !isLoading && (
           <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} className="absolute top-2 right-2 z-20 bg-black/30 hover:bg-black/50 text-white" aria-label={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!showCameraFeed && !isLoading && (
           <Button onClick={startCameraStream} disabled={isCameraInitializing || !user || !settingsMounted} className="w-full">
            {hasCameraPermission === false ? <RefreshCw className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
            {hasCameraPermission === false ? "Retry Camera Access" : (capturedImageUri ? "Scan New Receipt" : "Start Camera")}
          </Button>
        )}
        {showCameraFeed && !isLoading && (
          <Button onClick={handleCapture} disabled={isLoading || isCameraInitializing || !hasCameraPermission || !user || !settingsMounted} className="w-full">
            <ScanLine className="mr-2 h-4 w-4" /> Capture & Extract Data
          </Button>
        )}
        {showCameraFeed && !isLoading && (
          <Button onClick={stopCameraStream} variant="outline" className="w-full">
            <VideoOff className="mr-2 h-4 w-4" /> Stop Camera
          </Button>
        )}
      </div>
      {!user && <p className="text-xs text-destructive text-center">Please log in to use camera scanning.</p>}

      {extractedData && (
        <Card className="mt-6 rounded-xl shadow-lg border-primary/30 bg-primary/5 dark:bg-primary/10">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm md:text-base font-semibold text-primary flex items-center">
              <Info className="mr-2 h-4 w-4" /> Previously Extracted Data
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-xs sm:text-sm space-y-1 text-foreground/80">
            <p><span className="font-medium text-foreground">Desc:</span> {extractedData.description}</p>
            <p><span className="font-medium text-foreground">Merchant:</span> {extractedData.merchant || "N/A"}</p>
            <p><span className="font-medium text-foreground">Amount:</span> {settingsMounted ? formatCurrency(extractedData.amount, displayCurrency) : '$' + extractedData.amount.toFixed(2)} ({extractedData.type})</p>
            <p><span className="font-medium text-foreground">Date:</span> {extractedData.date}</p>
            <p><span className="font-medium text-foreground">Category:</span> {extractedData.category}</p>
            {extractedData.receiptUrl && <p><span className="font-medium text-foreground">Receipt URL:</span> <a href={extractedData.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Image</a></p>}
            <Button onClick={handleUseExtractedData} variant="outline" size="sm" className="w-full mt-3 text-xs" disabled={!settingsMounted}>
              <CornerDownLeft className="mr-2 h-3.5 w-3.5" /> Use This Data Again
            </Button>
            <CardDescription className="mt-2 text-muted-foreground text-center text-[11px] leading-tight">
              AI assumes the receipt is in your local input currency ({settingsMounted ? localCurrency : "..."}). The displayed amount is in your display currency ({settingsMounted ? displayCurrency : "..."}).
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
