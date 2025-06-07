
"use client"

// This component is now primarily for structuring menu items,
// as the main sidebar layout is handled by AppHeader and Sheet for mobile.
// Some exports might be used by AppSidebarNav if it renders these styled components.

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider, // Keep TooltipProvider if tooltips are used elsewhere
  TooltipTrigger,
} from "@/components/ui/tooltip"


// Minimal context, might not be needed if not controlling a visual sidebar state.
// If useSidebar hook is only used for isMobile, it can be replaced by useIsMobile directly.
type SidebarContext = {
  // state: "expanded" | "collapsed" // No longer relevant for desktop
  // open: boolean // No longer relevant for desktop
  // setOpen: (open: boolean) => void // No longer relevant for desktop
  openMobile: boolean // For mobile drawer
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  // toggleSidebar: () => void // Replaced by direct setOpenMobile
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

export function useSidebar() { // Keep export if AppSidebarNav uses it for mobile logic
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider (which is now part of AppProviders).")
  }
  return context
}


// SidebarMenu and related components can still be used for styling lists of links,
// e.g., within the mobile navigation drawer.

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu" // Keep data attribute if styles depend on it
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  { // Removed group-data-[collapsible=icon] variants as desktop sidebar is gone
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm", // Removed group-data-[collapsible=icon]:!p-0
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip, // Tooltip might still be useful in some contexts, e.g., icon-only buttons
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    // const { isMobile, state } = useSidebar(); // State is no longer from this context for desktop

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }
    
    // Tooltip logic can be simplified or made conditional based on context (e.g., if it's an icon-only button)
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          // hidden={state !== "collapsed" || isMobile} // Condition needs to be re-evaluated
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"


// Exports that might still be used for styling navigation items in a list
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  // TooltipProvider can be part of AppProviders if tooltips are generally used
};

// Other components like Sidebar, SidebarHeader, SidebarFooter, SidebarContent,
// SidebarTrigger, SidebarRail, SidebarInset are removed as they were specific
// to the old desktop sidebar structure.
// SidebarInput, SidebarSeparator, SidebarGroup etc. are also removed for now.
// If AppSidebarNav used them internally for its structure, it needs to be adapted
// to use basic div/ul or other generic components.
// For the provided AppSidebarNav, it mainly uses SidebarMenu, SidebarMenuItem, SidebarMenuButton.
