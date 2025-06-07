
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CurrencyCode } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const KES_LOCALE = 'sw-KE'; // Swahili - Kenya, commonly shows KES symbol correctly
const USD_LOCALE = 'en-US';
const EUR_LOCALE = 'de-DE'; // German - Germany, common for EUR symbol prefixing

const localeMap: Record<CurrencyCode, string> = {
  KES: KES_LOCALE,
  USD: USD_LOCALE,
  EUR: EUR_LOCALE,
};

export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode,
  locale?: string
): string {
  const effectiveLocale = locale || localeMap[currencyCode] || USD_LOCALE; // Fallback to USD_LOCALE if something is wrong

  try {
    return new Intl.NumberFormat(effectiveLocale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error("Currency formatting error:", error);
    // Fallback formatting
    return `${currencyCode} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
}
