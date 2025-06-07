
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, CreditCard, Target, Settings as CogIcon, ShieldCheck } from 'lucide-react'; // Renamed Settings to CogIcon
import { cn } from '@/lib/utils';

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Transactions', icon: CreditCard },
  { href: '/budgets', label: 'Budgets', icon: Target },
];

const adminNavItem = { href: '/admin', label: 'Admin Panel', icon: ShieldCheck };

const footerNavItems = [
  { href: '/settings', label: 'Settings', icon: CogIcon },
];

interface AppSidebarNavProps {
  onLinkClick?: () => void; 
  isMobileLayout?: boolean; 
  isAdmin?: boolean; // Added isAdmin prop
}

export function AppSidebarNav({ onLinkClick, isMobileLayout = false, isAdmin = false }: AppSidebarNavProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const mainNavItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

  const renderNavItem = (item: typeof mainNavItems[0]) => (
    <SidebarMenuItem key={item.href} className={isMobileLayout ? "px-2 py-1" : ""}>
      <SidebarMenuButton
        asChild
        isActive={pathname === item.href}
        className={cn(
          "justify-start w-full text-base md:text-sm",
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
