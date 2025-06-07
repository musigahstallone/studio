
"use client";

import Link from 'next/link';
import { PiggyBank, Menu, X, ShieldCheck } from 'lucide-react'; // Added ShieldCheck
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppSidebarNav } from './AppSidebarNav'; 
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/settings', label: 'Settings' },
  { href: '/admin', label: 'Admin', icon: ShieldCheck }, // Added Admin link
];

export function AppHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <PiggyBank className="h-7 w-7 text-primary" />
            <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
              PennyPincher AI
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <ButtonLink key={link.href} href={link.href} isActive={pathname === link.href}>
              {link.icon && <link.icon className="h-4 w-4 mr-1.5" />} 
              {link.label}
            </ButtonLink>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                 <PiggyBank className="h-7 w-7 text-primary" />
                 <span className="font-headline text-xl font-semibold tracking-tight text-foreground">PennyPincher AI</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto">
              <AppSidebarNav onLinkClick={handleMobileLinkClick} isMobileLayout={true} />
            </div>
             <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

interface ButtonLinkProps {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}

function ButtonLink({ href, isActive, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {children}
    </Link>
  );
}
