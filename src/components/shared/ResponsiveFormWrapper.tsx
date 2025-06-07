
"use client";

import { ReactNode, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface ResponsiveFormWrapperProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right"; 
}

export function ResponsiveFormWrapper({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  side = "right" 
}: ResponsiveFormWrapperProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    // Optional: Add focus management if Radix doesn't handle it perfectly for your case
  }, [isOpen]);

  if (isMobile) {
    // On mobile, use a Sheet from the bottom
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
            side="bottom" 
            className="p-0 flex flex-col max-h-[90vh] rounded-t-lg sm:h-auto" // Use max-h for flexibility
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevents auto-focusing issues on mobile
        > 
          <SheetHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="p-6 flex-grow overflow-y-auto">
            {children}
          </div>
          {/* SheetClose is automatically handled by Radix when clicking outside or pressing Esc */}
        </SheetContent>
      </Sheet>
    );
  }

  // On desktop, use a Sheet from the side (default 'right')
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full sm:max-w-md p-0 flex flex-col"> {/* Adjusted max-width for desktop */}
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="p-6 flex-grow overflow-y-auto">
          {children}
        </div>
         {/* SheetClose is automatically handled by Radix */}
      </SheetContent>
    </Sheet>
  );
}

