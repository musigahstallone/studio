
"use client";

import Link from 'next/link';
import { PiggyBank, LogOut, UserCircle, Settings, ShieldAlert, Menu, X, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AdminMobileNav } from './AdminMobileNav';
import { useState } from 'react';

export function AdminHeader() {
  const router = useRouter();
  const { user, appUser, isAdminUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-card px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open admin menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-7 w-7 text-primary" />
                  <span className="font-headline text-xl font-semibold tracking-tight text-foreground">Admin Menu</span>
                </SheetTitle>
              </SheetHeader>
              <AdminMobileNav onLinkClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
        <Link href="/admin" className="flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">
            SM Admin
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user && appUser && isAdminUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={appUser.photoURL || user.photoURL || undefined} alt={appUser.name || user.displayName || user.email || 'Admin'} data-ai-hint="admin avatar"/>
                  <AvatarFallback>
                    {appUser.email ? appUser.email.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{appUser.name || user.displayName || 'Admin User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {appUser.email || user.email} (Admin)
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile"><UserCircle className="mr-2 h-4 w-4" /> My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> App Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Back to Main App</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
