
// src/app/settings/page.tsx
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSwitcher } from '@/components/settings/ThemeSwitcher';
import { FontSwitcher } from '@/components/settings/FontSwitcher'; // Import the new component

export default function SettingsPage() {
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

        <FontSwitcher /> 

        {/* Add more settings sections here as needed */}
        {/* 
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Account settings coming soon.</p>
          </CardContent>
        </Card>
        */}
      </div>
    </AppShell>
  );
}
