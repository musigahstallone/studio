
"use client";

import Link from 'next/link';
import { PiggyBank, Menu, X, ShieldCheck, LogIn, LogOut, UserCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppSidebarNav } from './AppSidebarNav'; 
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { auth } from '@/lib/firebase'; // Import auth for signOut
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/budgets', label: 'Budgets' },
];

// Admin and Settings links will be conditional or in user menu
// const adminNavLink = { href: '/admin', label: 'Admin', icon: ShieldCheck };
// const settingsNavLink = { href: '/settings', label: 'Settings' };


export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, loading } = useAuth(); // Get user and loading state

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login'); // Redirect to login after logout
    } catch (error) {
      console.error("Logout error:", error);
      // Handle logout error (e.g., display a toast)
    }
  };
  
  // Prevent rendering auth-dependent parts during initial auth load to avoid flicker/hydration issues
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);


  if (pathname === '/login') { // Don't render AppHeader on the login page
    return null;
  }

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

        {/* Desktop Navigation - Only shown if user is logged in */}
        {hasMounted && user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <ButtonLink key={link.href} href={link.href} isActive={pathname === link.href}>
                {link.label}
              </ButtonLink>
            ))}
          </nav>
        )}

        {/* Auth controls and User Menu */}
        <div className="flex items-center gap-3">
          {hasMounted && !loading && !user && (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <LogIn className="mr-1.5 h-4 w-4" /> Login
              </Link>
            </Button>
          )}

          {hasMounted && user && (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} data-ai-hint="user avatar" />
                    <AvatarFallback>
                      {user.email ? user.email.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings"><CogIcon className="mr-2 h-4 w-4" /> Settings</Link>
                </DropdownMenuItem>
                {/* Conceptual Admin Link - would check role here */}
                {/* {IS_ADMIN_DEMO && ( */}
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel</Link>
                  </DropdownMenuItem>
                {/* )} */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu Button */}
          {user && ( // Only show mobile menu if logged in
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-foreground hover:text-primary transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer - Only shown if user is logged in */}
      {isMobile && user && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                 <PiggyBank className="h-7 w-7 text-primary" />
                 <span className="font-headline text-xl font-semibold tracking-tight text-foreground">PennyPincher AI</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto">
              {/* Pass user to AppSidebarNav if it needs it for conditional links */}
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

// Dummy CogIcon, replace with actual Lucide import if needed elsewhere
function CogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 2v2" />
      <path d="M12 22v-2" />
      <path d="m17 20.66-1-1.73" />
      <path d="M11 10.27 7 3.34" />
      <path d="m20.66 17-1.73-1" />
      <path d="m3.34 7 1.73 1" />
      <path d="M14 12h8" />
      <path d="M2 12h2" />
      <path d="m20.66 7-1.73 1" />
      <path d="m3.34 17 1.73-1" />
      <path d="m17 3.34-1 1.73" />
      <path d="m11 13.73 4 6.93" />
    </svg>
  )
}
