
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CurrencyCode } from "./types";
import { DEFAULT_STORED_CURRENCY } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const KES_LOCALE = 'sw-KE';
const USD_LOCALE = 'en-US';
const EUR_LOCALE_EN = 'en-IE';


const localeMap: Record<CurrencyCode, string> = {
  KES: KES_LOCALE,
  USD: USD_LOCALE,
  EUR: EUR_LOCALE_EN, 
};

export const CONVERSION_RATES_FROM_BASE: Record<CurrencyCode, number> = {
  USD: 1,    
  EUR: 0.92, 
  KES: 130,  
};

const CONVERSION_RATES_TO_BASE: Record<CurrencyCode, number> = {
  USD: 1,                       
  EUR: 1 / CONVERSION_RATES_FROM_BASE.EUR, 
  KES: 1 / CONVERSION_RATES_FROM_BASE.KES, 
};

export function convertToBaseCurrency(
  amount: number,
  inputCurrency: CurrencyCode
): number {
  if (inputCurrency === DEFAULT_STORED_CURRENCY) {
    return amount;
  }
  const rate = CONVERSION_RATES_TO_BASE[inputCurrency];
  if (typeof rate !== 'number') {
    console.warn(
      `No conversion rate defined from ${inputCurrency} to ${DEFAULT_STORED_CURRENCY}. Returning original amount.`
    );
    return amount; 
  }
  return amount * rate;
}

export function formatCurrency(
  amountInBaseCurrency: number,
  targetDisplayCurrency: CurrencyCode
): string {
  let displayAmount = amountInBaseCurrency;

  if (DEFAULT_STORED_CURRENCY !== targetDisplayCurrency) {
    const conversionRateToTarget = CONVERSION_RATES_FROM_BASE[targetDisplayCurrency];
    if (typeof conversionRateToTarget === 'number') {
      displayAmount = amountInBaseCurrency * conversionRateToTarget;
    } else {
      console.warn(
        `No conversion rate defined from ${DEFAULT_STORED_CURRENCY} to ${targetDisplayCurrency}. Displaying original amount in ${DEFAULT_STORED_CURRENCY}.`
      );
    }
  }

  const effectiveLocale = localeMap[targetDisplayCurrency] || USD_LOCALE;

  try {
    return new Intl.NumberFormat(effectiveLocale, {
      style: 'currency',
      currency: targetDisplayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayAmount);
  } catch (error) {
    console.error("Currency formatting error:", error, { amountInBaseCurrency, targetDisplayCurrency, displayAmount });
    return `${targetDisplayCurrency} ${displayAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
}

// Transaction cost calculation for P2P and other platform services
// Assumes amount is already in DEFAULT_STORED_CURRENCY (USD)
export const calculateTransactionCost = (amountInBaseCurrency: number): number => {
  const minCost = 0.20; // Min cost in USD
  const maxCost = 10.00; // Max cost in USD, reduced from 15 for P2P
  let cost = 0;

  if (amountInBaseCurrency <= 0) return 0;

  // Tiered approach for P2P, different from savings withdrawal
  if (amountInBaseCurrency <= 50) { // Tier 1: Up to $50
    cost = amountInBaseCurrency * 0.015; // 1.5%
  } else if (amountInBaseCurrency <= 500) { // Tier 2: $50.01 to $500
    cost = (50 * 0.015) + ((amountInBaseCurrency - 50) * 0.01); // $0.75 + 1% of amount over $50
  } else { // Tier 3: Over $500
    cost = (50 * 0.015) + (450 * 0.01) + ((amountInBaseCurrency - 500) * 0.005); // $0.75 + $4.50 + 0.5% of amount over $500
    // $0.75 (tier1) + $4.50 (tier2) = $5.25 base for this tier
  }
  
  cost = Math.max(minCost, cost);
  cost = Math.min(maxCost, cost);

  return parseFloat(cost.toFixed(2));
};
