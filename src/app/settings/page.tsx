
"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSwitcher } from '@/components/settings/ThemeSwitcher';
import { Loader2 } from 'lucide-react';
// import { FontSwitcher } from '@/components/settings/FontSwitcher'; // Commented out FontSwitcher
import { CurrencySwitcher } from '@/components/settings/CurrencySwitcher';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading Settings...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-semibold text-foreground">
          Settings
        </h1>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher />
          </CardContent>
        </Card>
 
        {/* <FontSwitcher /> */} {/* FontSwitcher component usage commented out */}
        
        <CurrencySwitcher />
      </div>
    </AppShell>
  );
}
