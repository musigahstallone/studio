
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { processReceiptExpense, type ProcessedExpenseData } from "@/actions/aiActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, ScanLine, Zap } from "lucide-react";

interface CameraReceiptScanProps {
  onDataExtracted: (data: ProcessedExpenseData & { type: "expense" | "income" }) => void;
}

export function CameraReceiptScan({ onDataExtracted }: CameraReceiptScanProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ProcessedExpenseData | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas')); 

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      setIsCameraInitializing(true);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        setIsCameraInitializing(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        if (error instanceof Error && error.name === "NotAllowedError") {
            toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings and refresh the page.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Camera Error',
                description: 'Could not access the camera. Please ensure it is not in use by another application.',
            });
        }
      } finally {
        setIsCameraInitializing(false);
      }
    };

    getCameraPermission();

    return () => {
      stopCameraStream();
    };
  }, [toast, stopCameraStream]);

  const handleCapture = async () => {
    if (!videoRef.current || !hasCameraPermission) {
      toast({
        variant: "destructive",
        title: "Camera Not Ready",
        description: "Please ensure camera permission is granted and the video feed is active.",
      });
      return;
    }

    const video = videoRef.current;
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      toast({ variant: "destructive", title: "Capture Error", description: "Video stream not ready yet."});
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
      const type = (result.category === 'Salary' || (result.category === 'Investments' && result.amount > 0)) ? 'income' : 'expense';
      
      setExtractedData(result);
      onDataExtracted({...result, type});
      toast({
        title: "Data Extracted from Camera Scan",
        description: `Merchant: ${result.merchant || 'N/A'}, Amount: $${result.amount.toFixed(2)}`,
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "AI Error",
        description: error instanceof Error ? error.message : "Could not process receipt image from camera.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Receipt with Camera</CardTitle>
        <CardDescription>
          Point your camera at a receipt and capture it. AI will attempt to extract the details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
            <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                autoPlay 
                playsInline 
                muted 
            />
            { isCameraInitializing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-background/80">
                    <Camera className="h-16 w-16 text-muted-foreground mb-4 animate-pulse" />
                    <p className="text-muted-foreground">Initializing camera...</p>
                </div>
            )}
        </div>
        
        { hasCameraPermission === false && !isCameraInitializing && (
            <Alert variant="destructive">
                <Zap className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Camera access is denied or not available. Please enable permissions in your browser settings and refresh the page. If the issue persists, ensure your browser supports camera access and no other app is using the camera.
                </AlertDescription>
            </Alert>
        )}

        <Button 
            onClick={handleCapture} 
            disabled={isLoading || !hasCameraPermission || isCameraInitializing} 
            className="w-full sm:w-auto"
        >
          <ScanLine className="mr-2 h-4 w-4" /> 
          {isLoading ? "Processing..." : "Capture & Extract Data"}
        </Button>

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
