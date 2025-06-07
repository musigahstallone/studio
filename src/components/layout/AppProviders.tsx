
"use client";

import { ExpenseProvider, BudgetProviderActual } from "@/contexts/ExpenseContext"; // Added BudgetProviderActual
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";


export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <ExpenseProvider>
        <BudgetProviderActual> {/* Added BudgetProviderActual wrapper */}
          {children}
        </BudgetProviderActual>
      </ExpenseProvider>
    </TooltipProvider>
  );
}
