
"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { ExpenseProvider } from "@/contexts/ExpenseContext";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <ExpenseProvider>
        {children}
      </ExpenseProvider>
    </SidebarProvider>
  );
}
