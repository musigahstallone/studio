"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
        {children}
    </SidebarProvider>
  );
}
