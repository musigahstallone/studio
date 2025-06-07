
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  useSidebar, // Import useSidebar
} from '@/components/ui/sidebar';
import { LayoutDashboard, CreditCard, Target, Cog, LogOut, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/budgets', label: 'Budgets', icon: Target },
];

export function AppSidebarNav() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar(); // Get sidebar context

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false); // Close sidebar on mobile after link click
    }
  };

  return (
    <>
      <SidebarHeader className="border-b">
        <Link href="/" className="flex items-center gap-2 py-2 group-data-[collapsible=icon]:justify-center" onClick={handleLinkClick}>
          <PiggyBank className="h-7 w-7 text-primary group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
          <span className="font-headline text-xl font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            PennyPincher AI
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                className={cn(
                  "justify-start",
                  pathname === item.href && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                )}
                onClick={handleLinkClick} // Add onClick handler here
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip={{ children: "Settings", className: "group-data-[collapsible=icon]:block hidden" }}
              className="justify-start"
              onClick={handleLinkClick} // Add onClick handler here
            >
              {/* TODO: Link to actual settings page if/when created */}
              <Link href="#"> 
                <Cog className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton 
              asChild 
              tooltip={{ children: "Log Out", className: "group-data-[collapsible=icon]:block hidden" }}
              className="justify-start"
              onClick={handleLinkClick} // Add onClick handler here
            >
              {/* TODO: Implement actual log out functionality */}
              <Link href="#">
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
