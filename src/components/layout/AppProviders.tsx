
"use client";

import { ExpenseProvider, BudgetProviderActual } from "@/contexts/ExpenseContext";
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider> {/* Wrap with AuthProvider */}
      <TooltipProvider delayDuration={0}>
        <ExpenseProvider>
          <BudgetProviderActual>
            {children}
          </BudgetProviderActual>
        </ExpenseProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
