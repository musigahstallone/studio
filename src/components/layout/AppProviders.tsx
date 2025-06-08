
"use client";

import { ExpenseProvider, BudgetProviderActual } from "@/contexts/ExpenseContext";
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider
import { SettingsProvider } from "@/contexts/SettingsContext"; // Import SettingsProvider
import { SavingsGoalProvider } from "@/contexts/SavingsGoalContext"; // Import SavingsGoalProvider
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider> {/* AuthProvider should be high up */}
      <SettingsProvider> {/* SettingsProvider wraps content needing settings */}
        <ExpenseProvider>
          <BudgetProviderActual>
            <SavingsGoalProvider> {/* Add SavingsGoalProvider here */}
              <TooltipProvider delayDuration={0}>
                {children}
              </TooltipProvider>
            </SavingsGoalProvider>
          </BudgetProviderActual>
        </ExpenseProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
