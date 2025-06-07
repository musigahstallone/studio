
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'; // We can reuse these styled components
import { LayoutDashboard, CreditCard, Target, Cog, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/budgets', label: 'Budgets', icon: Target },
];

const footerNavItems = [
  { href: '/settings', label: 'Settings', icon: Cog },
  // { href: '#', label: 'Log Out', icon: LogOut }, // TODO: Implement actual log out
];

interface AppSidebarNavProps {
  onLinkClick?: () => void; // Callback for when a link is clicked, e.g. to close mobile drawer
  isMobileLayout?: boolean; // To adjust styles if needed for mobile drawer context
}

export function AppSidebarNav({ onLinkClick, isMobileLayout = false }: AppSidebarNavProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const renderNavItem = (item: typeof mainNavItems[0]) => (
    <SidebarMenuItem key={item.href} className={isMobileLayout ? "px-2 py-1" : ""}>
      <SidebarMenuButton
        asChild
        isActive={pathname === item.href}
        className={cn(
          "justify-start w-full text-base md:text-sm",
           // Specific styling for mobile drawer items
          isMobileLayout ? "py-3 px-3 hover:bg-muted" : "",
          pathname === item.href && (isMobileLayout ? "bg-muted text-primary font-semibold" : "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary")
        )}
        onClick={handleLinkClick}
      >
        <Link href={item.href}>
          <item.icon className="h-5 w-5 mr-3 shrink-0" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
  
  return (
    <>
      <div className={cn("p-4", isMobileLayout ? "pt-2" : "")}>
        <SidebarMenu className={isMobileLayout ? "flex flex-col gap-2" : ""}>
          {mainNavItems.map(renderNavItem)}
        </SidebarMenu>
      </div>
      {footerNavItems.length > 0 && (
        <div className={cn("mt-auto border-t p-4", isMobileLayout ? "pt-2" : "")}>
           <SidebarMenu className={isMobileLayout ? "flex flex-col gap-2" : ""}>
            {footerNavItems.map(renderNavItem)}
          </SidebarMenu>
        </div>
      )}
    </>
  );
}
