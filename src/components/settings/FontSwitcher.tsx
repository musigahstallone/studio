
"use client";

import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { fontPairings, DEFAULT_FONT_THEME_ID, type FontPairing } from '@/lib/fonts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function FontSwitcher() {
  const [selectedFontTheme, setSelectedFontTheme] = useState<string>(DEFAULT_FONT_THEME_ID);

  useEffect(() => {
    const storedFontTheme = localStorage.getItem('fontTheme');
    if (storedFontTheme && fontPairings.some(fp => fp.id === storedFontTheme)) {
      setSelectedFontTheme(storedFontTheme);
      applyFontTheme(storedFontTheme);
    } else {
      applyFontTheme(DEFAULT_FONT_THEME_ID); // Apply default if nothing stored or invalid
    }
  }, []);

  const applyFontTheme = (fontId: string) => {
    // Remove all other font theme classes
    fontPairings.forEach(fp => {
      document.documentElement.classList.remove(`font-theme-${fp.id}`);
    });
    // Add the selected font theme class
    document.documentElement.classList.add(`font-theme-${fontId}`);
  };

  const handleThemeChange = (newFontId: string) => {
    setSelectedFontTheme(newFontId);
    localStorage.setItem('fontTheme', newFontId);
    applyFontTheme(newFontId);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Typography</CardTitle>
        <CardDescription>Choose the font pairing that best suits your style.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedFontTheme}
          onValueChange={handleThemeChange}
          className="space-y-4"
        >
          {fontPairings.map((pairing: FontPairing) => (
            <div key={pairing.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={pairing.id} id={pairing.id} className="mt-1 translate-y-px" />
              <div className="flex-1">
                <Label htmlFor={pairing.id} className="font-semibold text-base cursor-pointer">
                  {pairing.name}
                </Label>
                <p style={{ fontFamily: pairing.headlineStack }} className="text-lg mt-1">Headline Example</p>
                <p style={{ fontFamily: pairing.bodyStack }} className="text-sm">Body text example for this pairing.</p>
                <p className="text-xs text-muted-foreground mt-2">{pairing.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
