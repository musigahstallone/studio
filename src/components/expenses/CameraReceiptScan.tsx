
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processReceiptExpense, type ProcessedExpenseData } from "@/actions/aiActions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, ScanLine, Zap, Maximize, Minimize, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraReceiptScanProps {
  onDataExtracted: (data: ProcessedExpenseData) => void; // Type is now part of ProcessedExpenseData
}

export function CameraReceiptScan({ onDataExtracted }: CameraReceiptScanProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ProcessedExpenseData | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas')); 

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCameraStream = useCallback(async () => {
    setIsCameraInitializing(true);
    setHasCameraPermission(null); 
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      setIsCameraInitializing(false);
      toast({
        variant: 'destructive',
        title: 'Camera Not Supported',
        description: 'Your browser does not support camera access.',
      });
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      if (error instanceof Error && error.name === "NotAllowedError") {
          toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings and try again.',
          });
      } else {
          toast({
              variant: 'destructive',
              title: 'Camera Error',
              description: 'Could not access the camera. Ensure it is not in use by another app.',
          });
      }
      return false;
    } finally {
      setIsCameraInitializing(false);
    }
  }, [toast]);

  useEffect(() => {
    startCameraStream();
    return () => {
      stopCameraStream();
    };
  }, [startCameraStream, stopCameraStream]);

  const handleCapture = async () => {
    if (isFullScreen) {
      setIsFullScreen(false); // Minimize first if in fullscreen
      // Adding a very brief pause to allow UI to redraw before capturing canvas might be beneficial on some systems
      await new Promise(resolve => setTimeout(resolve, 50)); 
    }

    if (!videoRef.current || !hasCameraPermission) {
      toast({
        variant: "destructive",
        title: "Camera Not Ready",
        description: "Please ensure camera permission is granted and the video feed is active.",
      });
      return;
    }

    const video = videoRef.current;
    if (video.readyState < HTMLMediaElement.HAVE_METADATA || video.videoWidth === 0 || video.videoHeight === 0) {
      toast({ variant: "destructive", title: "Capture Error", description: "Video stream not ready or dimensions are zero."});
      return;
    }
    
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        toast({ variant: "destructive", title: "Capture Error", description: "Could not get canvas context." });
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoDataUri = canvas.toDataURL('image/jpeg');

    setIsLoading(true);
    setExtractedData(null);
    try {
      const result = await processReceiptExpense({ photoDataUri });
      setExtractedData(result);
      onDataExtracted(result); // Type is now included in result
      toast({
        title: "Data Extracted",
        description: `${result.description} - Amount: $${result.amount.toFixed(2)}`,
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "AI Error",
        description: error instanceof Error ? error.message : "Could not process receipt image.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        "relative bg-muted rounded-md overflow-hidden shadow-inner group", // Added group for button visibility
        isFullScreen ? "fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center" : "w-full aspect-[4/3] sm:aspect-video md:h-96 lg:h-[500px]"
      )}>
        <video 
            ref={videoRef} 
            className={cn("object-contain", isFullScreen ? "max-w-full max-h-full" : "w-full h-full" )}
            autoPlay 
            playsInline 
            muted 
        />
        { isCameraInitializing && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-background/80">
                <Camera className="h-12 w-12 text-muted-foreground mb-3 animate-pulse" />
                <p className="text-muted-foreground">Initializing camera...</p>
            </div>
        )}
        { hasCameraPermission === false && !isCameraInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-background/80">
                <Zap className="h-12 w-12 text-destructive mb-3" />
                <p className="text-destructive-foreground mb-3">Camera Access Denied</p>
                <Button onClick={startCameraStream} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
            </div>
        )}
         <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFullScreen(!isFullScreen)} 
            className="absolute top-2 right-2 z-20 bg-black/30 hover:bg-black/50 text-white" // z-index increased
            aria-label={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
        {isFullScreen && hasCameraPermission && !isCameraInitializing && (
             <Button 
                onClick={handleCapture} 
                disabled={isLoading} 
                className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-primary/80 hover:bg-primary text-primary-foreground px-6 py-3"
                size="lg"
                aria-label="Capture and Extract"
             >
                <ScanLine className="mr-2 h-5 w-5" /> 
                {isLoading ? "Processing..." : "Capture"}
            </Button>
        )}
      </div>
      
      { hasCameraPermission === false && !isCameraInitializing && (
          <Alert variant="destructive">
              <Zap className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                  Camera access is denied or not available. Please enable permissions in your browser settings. If the issue persists, ensure your browser supports camera access and no other app is using the camera.
              </AlertDescription>
          </Alert>
      )}

      {!isFullScreen && ( // Only show the main button if not in fullscreen
        <Button 
            onClick={handleCapture} 
            disabled={isLoading || !hasCameraPermission || isCameraInitializing} 
            className="w-full"
        >
          <ScanLine className="mr-2 h-4 w-4" /> 
          {isLoading ? "Processing..." : "Capture & Extract"}
        </Button>
      )}


      {extractedData && (
         <div className="mt-4 rounded-md border bg-muted/50 p-4 text-sm">
          <h4 className="font-semibold mb-2 text-foreground">Extracted Data:</h4>
          <p><span className="font-medium text-muted-foreground">Description:</span> {extractedData.description}</p>
          <p><span className="font-medium text-muted-foreground">Merchant:</span> {extractedData.merchant || "N/A"}</p>
          <p><span className="font-medium text-muted-foreground">Amount:</span> ${extractedData.amount.toFixed(2)}</p>
          <p><span className="font-medium text-muted-foreground">Date:</span> {extractedData.date}</p>
          <p><span className="font-medium text-muted-foreground">Category:</span> {extractedData.category}</p>
          <p><span className="font-medium text-muted-foreground">Type:</span> {extractedData.type}</p>
          <p className="mt-3 text-xs text-muted-foreground">This data has been used to pre-fill the manual entry form. Please review and submit.</p>
        </div>
      )}
    </div>
  );
}

