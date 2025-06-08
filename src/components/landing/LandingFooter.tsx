
"use client";

import Link from 'next/link';
import { PiggyBank } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/50 dark:bg-muted/10">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <PiggyBank className="h-7 w-7 text-primary" />
              <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
                PennyPincher AI
              </h1>
            </Link>
            <p className="text-sm text-muted-foreground">
              Smart finance, simplified. Take control of your financial future.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-sm text-muted-foreground hover:text-primary">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-primary">How It Works</Link></li>
              <li><Link href="/login" className="text-sm text-muted-foreground hover:text-primary">Login/Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Legal & Support</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PennyPincher AI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Made with ❤️ by <a href="https://musigahstallone.tech" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stallone Musigah</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
