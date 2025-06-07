
"use client";

import { ExpenseProvider, BudgetProviderActual } from "@/contexts/ExpenseContext";
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider
import { SettingsProvider } from "@/contexts/SettingsContext"; // Import SettingsProvider
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider> {/* AuthProvider should be high up */}
      <SettingsProvider> {/* SettingsProvider wraps content needing settings */}
        <TooltipProvider delayDuration={0}>
          <ExpenseProvider>
            <BudgetProviderActual>
              {children}
            </BudgetProviderActual>
          </ExpenseProvider>
        </TooltipProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
