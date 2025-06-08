
"use client";

import { usePathname } from 'next/navigation';
import { adminNavItems, utilityNavItems, AdminSidebarNavItem } from './AdminSidebar'; // Import shared items and item component

interface AdminMobileNavProps {
  onLinkClick?: () => void;
}

export function AdminMobileNav({ onLinkClick }: AdminMobileNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex-grow overflow-y-auto p-4">
      <nav className="flex flex-col gap-2">
        <p className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Management</p>
        <ul className="space-y-1">
          {adminNavItems.map(item => (
            <AdminSidebarNavItem 
                key={item.href} 
                {...item} 
                pathname={pathname}
                isMobile={true}
                onClick={onLinkClick}
            />
          ))}
        </ul>
      </nav>
      <nav className="flex flex-col gap-2 pt-4 mt-4 border-t">
         <p className="px-2 py-1 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Utilities</p>
        <ul className="space-y-1">
          {utilityNavItems.map(item => (
             <AdminSidebarNavItem 
                key={item.href}
                {...item}
                pathname={pathname}
                isMobile={true}
                onClick={onLinkClick}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
}
