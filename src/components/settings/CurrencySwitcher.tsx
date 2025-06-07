
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/contexts/SettingsContext";
import { supportedCurrencies, type CurrencyCode } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Euro, HandCoins, Palette } from "lucide-react";

const currencyIcons: Record<CurrencyCode, React.ElementType> = {
  USD: DollarSign,
  EUR: Euro,
  KES: HandCoins,
};


export function CurrencySwitcher() {
  // Use displayCurrency and localCurrency from settings
  const { 
    displayCurrency, 
    setDisplayCurrency, 
    localCurrency, 
    setLocalCurrency, 
    isMounted 
  } = useSettings();

  if (!isMounted) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" />Currency Preferences</CardTitle>
          <CardDescription>Manage your currency settings for display and input.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="display-currency-select-loading" className="text-sm font-medium">
              Display Currency
            </Label>
            <div className="h-10 w-full sm:max-w-xs bg-muted rounded-md animate-pulse mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Loading display currency setting...</p>
          </div>
          <div>
            <Label htmlFor="local-currency-select-loading" className="text-sm font-medium">
              Local Input Currency
            </Label>
            <div className="h-10 w-full sm:max-w-xs bg-muted rounded-md animate-pulse mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Loading input currency setting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" />Currency Preferences</CardTitle>
        <CardDescription>Manage your currency settings for display and input.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Currency Selector */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="display-currency-select" className="text-sm font-medium">
            Display Currency
          </Label>
          <Select
            value={displayCurrency}
            onValueChange={(value) => setDisplayCurrency(value as CurrencyCode)}
          >
            <SelectTrigger className="w-full sm:max-w-xs" id="display-currency-select" aria-label="Select display currency">
              <SelectValue placeholder="Select display currency" />
            </SelectTrigger>
            <SelectContent>
              {supportedCurrencies.map((code) => {
                const Icon = currencyIcons[code];
                return (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" /> {code}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            All monetary values will be displayed in {displayCurrency}.
          </p>
        </div>

        {/* Local Input Currency Selector */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="local-currency-select" className="text-sm font-medium">
            Local Input Currency
          </Label>
          <Select
            value={localCurrency}
            onValueChange={(value) => setLocalCurrency(value as CurrencyCode)}
          >
            <SelectTrigger className="w-full sm:max-w-xs" id="local-currency-select" aria-label="Select local input currency">
              <SelectValue placeholder="Select local input currency" />
            </SelectTrigger>
            <SelectContent>
              {supportedCurrencies.map((code) => {
                const Icon = currencyIcons[code];
                return (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" /> {code}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Amounts you enter in forms will be assumed to be in {localCurrency}. This will be converted to {DEFAULT_STORED_CURRENCY} for storage.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
