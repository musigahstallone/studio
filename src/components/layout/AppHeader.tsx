
"use client";

import Link from 'next/link';
import { PiggyBank, Menu, X, ShieldCheck, LogIn, LogOut, UserCircle, Settings as CogIcon } from 'lucide-react'; // Renamed Settings to CogIcon
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AppSidebarNav } from './AppSidebarNav'; 
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
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

// Define your admin email or a more robust check here
const ADMIN_EMAIL = 'admin@example.com'; // Replace with your actual admin email

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      // Replace with your actual admin checking logic (e.g., custom claims, Firestore role check)
      setIsAdmin(user.email === ADMIN_EMAIL);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login'); 
      setIsMobileMenuOpen(false); // Close menu on logout
    } catch (error) {
      console.error("Logout error:", error);
      // Handle logout error (e.g., display a toast)
    }
  };
  
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);


  if (pathname === '/login') {
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

        {hasMounted && user && (
          <nav className="hidden md:flex items-center gap-1">
            {/* Main nav links can be dynamically generated or kept static if they don't change based on role */}
            <ButtonLink href="/" isActive={pathname === '/'}>Dashboard</ButtonLink>
            <ButtonLink href="/expenses" isActive={pathname === '/expenses'}>Transactions</ButtonLink>
            <ButtonLink href="/budgets" isActive={pathname === '/budgets'}>Budgets</ButtonLink>
          </nav>
        )}

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
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {user && ( 
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
              <AppSidebarNav onLinkClick={handleMobileLinkClick} isMobileLayout={true} isAdmin={isAdmin} />
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

// CogIcon is now imported from lucide-react as Settings, then renamed.
// If you have a custom SVG for CogIcon, it's no longer used here unless you re-add it.
