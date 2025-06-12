
"use client";

import Link from 'next/link';
import { PiggyBank, Menu, UserCircle as UserIcon, LogIn, LogOut, UserCircle, Settings as CogIcon, LayoutDashboard, Sun, Moon, Laptop } from 'lucide-react'; // Added UserIcon
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebarNav } from './AppSidebarNav';
import { cn } from '@/lib/utils';
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
  DropdownMenuTrigger as DropdownMenuTriggerPrimitive,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import type { Theme } from '@/lib/types';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, appUser, isAdminUser, loading } = useAuth();
  const { theme, setTheme, isMounted: settingsAreMounted } = useSettings();

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      sessionStorage.setItem('justLoggedOut', 'true');
      router.push('/');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log you out. Please try again." });
    }
  };

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);


  if (pathname === '/login' || pathname === '/' || pathname === '/privacy' || pathname === '/terms' || pathname === '/contact' || pathname === '/features' || pathname === '/faq') {
    return null;
  }
  
  const toggleThemeForSettingsPage = () => {
    if (!settingsAreMounted) return;
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  const ThemeIconForSettingsPage = theme === 'light' ? Moon : Sun;


  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <PiggyBank className="h-7 w-7 text-primary" />
            <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
              PennyPincher AI
            </h1>
          </Link>
        </div>

        {hasMounted && user && (
          <nav className="hidden md:flex items-center gap-1">
            <ButtonLink href="/dashboard" currentPathname={pathname}>Dashboard</ButtonLink>
            <ButtonLink href="/expenses" currentPathname={pathname}>Transactions</ButtonLink>
            <ButtonLink href="/budgets" currentPathname={pathname}>Budgets</ButtonLink>
            <ButtonLink href="/savings-goals" currentPathname={pathname}>Savings Goals</ButtonLink>
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

          {hasMounted && user && appUser && (
             <DropdownMenu>
              <DropdownMenuTriggerPrimitive asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={appUser.photoURL || user.photoURL || undefined} alt={appUser.name || user.displayName || user.email || 'User'} data-ai-hint="user avatar"/>
                    <AvatarFallback>
                      {appUser.email ? appUser.email.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTriggerPrimitive>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{appUser.name || user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {appUser.email || user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                  <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" /> My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings"><CogIcon className="mr-2 h-4 w-4" /> Settings</Link>
                </DropdownMenuItem>
                {isAdminUser && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin"><UserCircle className="mr-2 h-4 w-4" /> Admin Panel</Link>
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

          {hasMounted && user && (
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-2 text-foreground hover:text-primary transition-colors"
                    aria-label="Open menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                 <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                      <PiggyBank className="h-7 w-7 text-primary" />
                      <span className="font-headline text-xl font-semibold tracking-tight text-foreground">PennyPincher AI</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-grow overflow-y-auto">
                    <AppSidebarNav onLinkClick={handleMobileLinkClick} isMobileLayout={true} isAdmin={isAdminUser} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

interface ButtonLinkProps {
  href: string;
  currentPathname: string;
  children: React.ReactNode;
}

function ButtonLink({ href, currentPathname, children }: ButtonLinkProps) {
  const isActive = currentPathname === href || (href.startsWith(currentPathname) && currentPathname !== '/');

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

