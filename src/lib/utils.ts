
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CurrencyCode } from "./types";
import { DEFAULT_STORED_CURRENCY } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const KES_LOCALE = 'sw-KE';
const USD_LOCALE = 'en-US';
const EUR_LOCALE = 'de-DE'; // German locale for EUR typically uses comma as decimal, dot as thousand.
// For EUR, 'fr-FR' or 'es-ES' might be more common for dot as decimal, comma as thousand.
// Let's stick with a common one or allow override. For now, de-DE is common for just symbol.
// Using 'en-IE' for EUR to get € symbol with dot decimal separator.
const EUR_LOCALE_EN = 'en-IE';


const localeMap: Record<CurrencyCode, string> = {
  KES: KES_LOCALE,
  USD: USD_LOCALE,
  EUR: EUR_LOCALE_EN, // Using English (Ireland) for EUR to get € symbol with standard dot decimal
};

// Rates to convert *FROM* DEFAULT_STORED_CURRENCY *TO* other currencies (for display)
// Example: If DEFAULT_STORED_CURRENCY is USD: 1 USD = X targetCurrency
const CONVERSION_RATES_FROM_BASE: Record<CurrencyCode, number> = {
  USD: 1,    // 1 USD = 1 USD
  EUR: 0.92, // 1 USD = 0.92 EUR
  KES: 130,  // 1 USD = 130 KES
};

// Rates to convert *FROM* a local currency *TO* DEFAULT_STORED_CURRENCY (for storage)
// Example: If DEFAULT_STORED_CURRENCY is USD: 1 localCurrency = X USD
const CONVERSION_RATES_TO_BASE: Record<CurrencyCode, number> = {
  USD: 1,                       // 1 USD = 1 USD (DEFAULT_STORED_CURRENCY)
  EUR: 1 / CONVERSION_RATES_FROM_BASE.EUR, // 1 EUR = 1/0.92 USD
  KES: 1 / CONVERSION_RATES_FROM_BASE.KES, // 1 KES = 1/130 USD
};

/**
 * Converts an amount from a given input currency to the DEFAULT_STORED_CURRENCY.
 * @param amount The amount in the inputCurrency.
 * @param inputCurrency The currency code of the input amount.
 * @returns The amount converted to DEFAULT_STORED_CURRENCY.
 */
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
    return amount; // Fallback: return original amount if no rate
  }
  return amount * rate;
}

/**
 * Formats an amount stored in DEFAULT_STORED_CURRENCY into the targetDisplayCurrency.
 * @param amountInBaseCurrency The amount in DEFAULT_STORED_CURRENCY.
 * @param targetDisplayCurrency The currency to display the amount in.
 * @returns A formatted currency string.
 */
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
      // Fallback: format the original amount but label it with the target currency
      // This is potentially misleading if conversion fails.
      // For now, we proceed to format 'displayAmount' which is still 'amountInBaseCurrency'.
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
