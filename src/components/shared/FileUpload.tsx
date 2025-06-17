
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useState } from "react";

interface FileUploadProps {
  onFileChange: (dataUri: string | null) => void;
  id?: string;
}

export function FileUpload({ onFileChange, id = "file-upload" }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPreview(dataUri);
        onFileChange(dataUri);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      onFileChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="block text-sm font-medium text-foreground">
        Upload Receipt Image
      </Label>
      <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-input px-6 pb-6 pt-5 hover:border-primary transition-colors">
        <div className="space-y-1 text-center">
          {preview ? (
            <Image
              src={preview}
              alt="Receipt preview"
              width={200}
              height={200}
              className="mx-auto mb-4 h-32 w-auto rounded-md object-contain"
              data-ai-hint="uploaded receipt document" // Updated hint
            />
          ) : (
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          )}
          <div className="flex text-sm text-muted-foreground">
            <Label
              htmlFor={id}
              className="relative cursor-pointer rounded-md bg-background font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
            >
              <span>Upload a file</span>
              <Input
                id={id}
                name={id}
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleFileChange}
              />
            </Label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>
    </div>
  );
}
