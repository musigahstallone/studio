
"use client";

// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Commented out
// import { Label } from "@/components/ui/label"; // Commented out
// import { fontPairings, type FontPairing } from '@/lib/fonts'; // Commented out
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { useSettings } from '@/contexts/SettingsContext'; // Commented out

export function FontSwitcher() {
  // const { fontTheme, setFontTheme, isMounted } = useSettings(); // Commented out

  /* // All original logic commented out
  if (!isMounted) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>Choose the font pairing that best suits your style.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 border rounded-md">
                <div className="h-5 w-5 rounded-full bg-muted animate-pulse mt-1"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-full bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Typography</CardTitle>
        <CardDescription>Choose the font pairing that best suits your style.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={fontTheme}
          onValueChange={setFontTheme}
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
  */

  // Render a placeholder indicating the feature is disabled
  return (
     <Card className="shadow-lg opacity-50">
      <CardHeader>
        <CardTitle>Typography (Feature Disabled)</CardTitle>
        <CardDescription>Font customization is currently disabled.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          The ability to change font pairings has been temporarily commented out. 
          The application will use default system fonts.
        </p>
      </CardContent>
    </Card>
  );
}
