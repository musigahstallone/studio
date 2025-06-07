
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CurrencyCode } from "./types";
import { DEFAULT_STORED_CURRENCY } from "./types"; // Import the base currency

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Locales for formatting
const KES_LOCALE = 'sw-KE';
const USD_LOCALE = 'en-US';
const EUR_LOCALE = 'de-DE';

const localeMap: Record<CurrencyCode, string> = {
  KES: KES_LOCALE,
  USD: USD_LOCALE,
  EUR: EUR_LOCALE,
};

// Approximate conversion rates FROM DEFAULT_STORED_CURRENCY (e.g., USD)
// 1 DEFAULT_STORED_CURRENCY = X targetCurrency
// Example: If DEFAULT_STORED_CURRENCY is USD:
// 1 USD = 1 USD
// 1 USD = 0.92 EUR
// 1 USD = 130 KES
const APPROXIMATE_CONVERSION_RATES_FROM_DEFAULT: Record<CurrencyCode, number> = {
  USD: 1,       // If default is USD
  EUR: 0.92,    // 1 USD to EUR
  KES: 130,     // 1 USD to KES
  // Add other currencies if DEFAULT_STORED_CURRENCY is different.
  // E.g., if DEFAULT_STORED_CURRENCY was KES:
  // KES: 1,
  // USD: 1 / 130,
  // EUR: (1 / 130) * 0.92
};
// Ensure rates are correct if DEFAULT_STORED_CURRENCY changes from USD.
// The current rates assume DEFAULT_STORED_CURRENCY = 'USD'.


export function formatCurrency(
  amountInDefaultStoredCurrency: number,
  targetDisplayCurrency: CurrencyCode
): string {
  let displayAmount = amountInDefaultStoredCurrency;

  // Perform conversion if the target display currency is different from the default stored currency
  if (DEFAULT_STORED_CURRENCY !== targetDisplayCurrency) {
    // Assuming all amounts are stored in DEFAULT_STORED_CURRENCY (e.g., USD)
    // We need to convert from DEFAULT_STORED_CURRENCY to targetDisplayCurrency.
    // The APPROXIMATE_CONVERSION_RATES_FROM_DEFAULT provides direct rates from the default.
    
    const conversionRateToTarget = APPROXIMATE_CONVERSION_RATES_FROM_DEFAULT[targetDisplayCurrency];

    if (typeof conversionRateToTarget === 'number') {
      displayAmount = amountInDefaultStoredCurrency * conversionRateToTarget;
    } else {
      console.warn(
        `No conversion rate defined from ${DEFAULT_STORED_CURRENCY} to ${targetDisplayCurrency}. Displaying original amount for ${DEFAULT_STORED_CURRENCY}.`
      );
      // Fallback: format the original amount but label it with the target currency - this is potentially misleading.
      // A better fallback might be to show in DEFAULT_STORED_CURRENCY, or throw an error.
      // For now, we proceed to format 'displayAmount' which is still 'amountInDefaultStoredCurrency'.
    }
  }
  // If DEFAULT_STORED_CURRENCY === targetDisplayCurrency, displayAmount remains amountInDefaultStoredCurrency

  const effectiveLocale = localeMap[targetDisplayCurrency] || USD_LOCALE;

  try {
    return new Intl.NumberFormat(effectiveLocale, {
      style: 'currency',
      currency: targetDisplayCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayAmount);
  } catch (error) {
    console.error("Currency formatting error:", error);
    // Fallback formatting (shows target currency code, which might be incorrect if conversion failed)
    return `${targetDisplayCurrency} ${displayAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
}
