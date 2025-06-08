
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, LogOut, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const adminNavItems = [
  { href: '/admin', label: 'Platform Stats', icon: LayoutDashboard },
  { href: '/admin/users', label: 'User Management', icon: Users },
];

const utilityNavItems = [
   { href: '/', label: 'Back to Main App', icon: Home }
];

export function AdminSidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: typeof adminNavItems[0] | typeof utilityNavItems[0], isUtility: boolean = false) => (
    <li key={item.href}>
      <Button
        asChild
        variant={pathname === item.href ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start text-base md:text-sm h-10",
           pathname === item.href && "font-semibold text-primary bg-primary/10 hover:bg-primary/15"
        )}
      >
        <Link href={item.href}>
          <item.icon className="h-5 w-5 mr-3 shrink-0" />
          <span>{item.label}</span>
        </Link>
      </Button>
    </li>
  );

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background p-4 flex flex-col justify-between shadow-md">
      <nav className="flex flex-col gap-2">
        <p className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Management</p>
        <ul className="space-y-1">
          {adminNavItems.map(item => renderNavItem(item))}
        </ul>
      </nav>
      <nav className="flex flex-col gap-2 pt-4 border-t">
         <p className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Utilities</p>
        <ul className="space-y-1">
          {utilityNavItems.map(item => renderNavItem(item, true))}
        </ul>
      </nav>
    </aside>
  );
}
