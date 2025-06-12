
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { SendMoneyForm } from '@/components/send-money/SendMoneyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SendHorizontal } from 'lucide-react';

export default function SendMoneyPage() {
  return (
    <AppShell>
      <div className="space-y-8 max-w-xl mx-auto">
        <div className="text-center">
          <h1 className="font-headline text-2xl md:text-3xl font-semibold text-foreground">
            Send Money
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Quickly and securely send money to other SM Cash users using their unique Transaction Tag.
          </p>
        </div>

        <Card className="shadow-xl rounded-xl">
          <CardHeader className="items-center">
            <div className="p-3 bg-primary/10 text-primary rounded-full mb-3">
                <SendHorizontal className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl md:text-2xl">Initiate Transfer</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Enter recipient's tag, amount, and an optional note.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SendMoneyForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
