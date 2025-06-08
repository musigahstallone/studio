
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Home, LineChart } from 'lucide-react'; // Added LineChart for clarity, Home is for app root
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const adminNavItems = [
  { href: '/admin', label: 'Platform Stats', icon: LineChart }, // Changed icon to LineChart
  { href: '/admin/users', label: 'User Management', icon: Users },
];

export const utilityNavItems = [
   { href: '/dashboard', label: 'Back to Main App', icon: LayoutDashboard } // Link to /dashboard
];

interface AdminSidebarNavItemProps {
    href: string;
    label: string;
    icon: React.ElementType;
    pathname: string;
    isMobile?: boolean;
    onClick?: () => void;
}

export function AdminSidebarNavItem({ href, label, icon: Icon, pathname, isMobile = false, onClick }: AdminSidebarNavItemProps) {
    return (
        <li>
        <Button
            asChild
            variant={pathname === href ? (isMobile ? "secondary" : "secondary") : "ghost"}
            className={cn(
            "w-full justify-start text-base md:text-sm h-10",
            isMobile ? "py-3 px-3 text-foreground" : "", 
            pathname === href && (
                isMobile 
                ? "bg-muted text-primary font-semibold" 
                : "font-semibold text-primary bg-primary/10 hover:bg-primary/15"
            )
            )}
            onClick={onClick}
        >
            <Link href={href}>
            <Icon className="h-5 w-5 mr-3 shrink-0" />
            <span>{label}</span>
            </Link>
        </Button>
        </li>
    );
}


export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-background p-4 md:flex flex-col justify-between shadow-md">
      <nav className="flex flex-col gap-2">
        <p className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Management</p>
        <ul className="space-y-1">
          {adminNavItems.map(item => (
             <AdminSidebarNavItem 
                key={item.href} 
                {...item} 
                pathname={pathname}
             />
          ))}
        </ul>
      </nav>
      <nav className="flex flex-col gap-2 pt-4 border-t">
         <p className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Utilities</p>
        <ul className="space-y-1">
          {utilityNavItems.map(item => (
            <AdminSidebarNavItem 
                key={item.href}
                {...item}
                pathname={pathname}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

    