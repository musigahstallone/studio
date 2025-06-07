
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
import { DollarSign, Euro, HandCoins } from "lucide-react"; // KES doesn't have a direct Lucide icon, using generic

const currencyIcons: Record<CurrencyCode, React.ElementType> = {
  USD: DollarSign,
  EUR: Euro,
  KES: HandCoins,
};


export function CurrencySwitcher() {
  const { currency, setCurrency, isMounted } = useSettings();

  if (!isMounted) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Select your preferred currency for displaying amounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full bg-muted rounded-md animate-pulse" />
          <p className="text-xs text-muted-foreground mt-2">Loading currency setting...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Currency</CardTitle>
        <CardDescription>Select your preferred currency for displaying amounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <Label htmlFor="currency-select" className="text-sm font-medium">
            Preferred Currency
          </Label>
          <Select
            value={currency}
            onValueChange={(value) => setCurrency(value as CurrencyCode)}
          >
            <SelectTrigger className="w-full sm:w-auto" id="currency-select" aria-label="Select currency">
              <SelectValue placeholder="Select currency" />
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
            All monetary values will be displayed in {currency}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
