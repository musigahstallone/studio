
import { Suspense } from 'react';
import { SavingsGoalsClientPage } from './SavingsGoalsClientPage';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2 } from 'lucide-react';

// This component acts as the shell for the savings goals page,
// providing a Suspense boundary for the client-rendered content.
export default function SavingsGoalsPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground text-sm md:text-base">Loading savings goals...</p>
        </div>
      }>
        <SavingsGoalsClientPage />
      </Suspense>
    </AppShell>
  );
}
