
"use client";

import type { AppUser } from "@/lib/types"; // Changed to AppUser
import { Button } from "@/components/ui/button";
import { Mail, CalendarDays, DollarSign, ShoppingBag, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format, parseISO } from 'date-fns';
import Image from "next/image";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

interface UserListItemProps {
  user: AppUser; // Changed to AppUser
}

function UserListItem({ user }: UserListItemProps) {
  const { currency, isMounted: settingsMounted } = useSettings();
  const [formattedJoinDate, setFormattedJoinDate] = useState('');

  useEffect(() => {
    if (user.joinDate) {
      try {
        // Ensure joinDate is a string before parsing
        const dateToParse = typeof user.joinDate === 'string' ? user.joinDate : String(user.joinDate);
        setFormattedJoinDate(format(parseISO(dateToParse), 'PP'));
      } catch (e) {
        console.error("Error formatting join date for user:", user.uid, user.joinDate, e);
        setFormattedJoinDate(String(user.joinDate)); // Fallback to string representation
      }
    } else {
      setFormattedJoinDate('N/A');
    }
  }, [user.joinDate, user.uid]);

  if (!settingsMounted) {
     return (
        <div className="p-4 border-b h-20 animate-pulse bg-muted/30 rounded-md my-1 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center">
            <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0"></div>
            <div className="flex-1 min-w-0 space-y-1">
                <div className="h-5 w-3/5 bg-muted rounded"></div>
                <div className="h-3 w-4/5 bg-muted rounded"></div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-1">
                <div className="h-3 w-24 bg-muted rounded"></div>
                <div className="h-3 w-20 bg-muted rounded"></div>
            </div>
        </div>
    );
  }

  return (
    <div className="p-4 border-b hover:bg-muted/50 transition-colors grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
            <Image
                src={user.photoURL || `https://placehold.co/40x40.png?text=${user.name ? user.name.charAt(0) : 'U'}`}
                alt={`${user.name || 'User'} avatar`}
                layout="fill"
                objectFit="cover"
                data-ai-hint="avatar profile"
             />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-base sm:text-lg text-foreground truncate">{user.name || 'Unnamed User'}</p>
          {user.isAdmin && <ShieldCheck className="h-4 w-4 text-primary" title="Admin User" />}
          {!user.isAdmin && <ShieldAlert className="h-4 w-4 text-muted-foreground/50" title="Regular User" />}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
          <span className="flex items-center"><Mail className="h-3 w-3 mr-1" />{user.email || 'no-email@example.com'}</span>
          <span className="flex items-center"><CalendarDays className="h-3 w-3 mr-1" />Joined: {formattedJoinDate || 'Loading date...'}</span>
        </div>
      </div>

      <div className="flex flex-col items-start md:items-end gap-1 text-xs text-muted-foreground">
        <span className="flex items-center"><ShoppingBag className="h-3 w-3 mr-1 text-primary" />{user.transactionCount || 0} Transactions</span>
        <span className="flex items-center"><DollarSign className="h-3 w-3 mr-1 text-green-500" />Total Spent: {formatCurrency(user.totalSpent || 0, currency)}</span>
        {/* Add action buttons here if needed in future e.g. View Details, Edit, Make Admin */}
        {/* <Button variant="outline" size="sm" className="mt-2">View Details</Button> */}
      </div>
    </div>
  );
}

interface UserListProps {
  users: AppUser[]; // Changed to AppUser
}

export function UserList({ users }: UserListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { isMounted: settingsMounted } = useSettings();

  // Users are already sorted by joinDate in the page component if needed
  const sortedUsers = users;

  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  if (!settingsMounted && users.length > 0) {
    return (
        <div className="mt-2 space-y-1">
            {[...Array(Math.min(ITEMS_PER_PAGE, 3))].map((_,i) => (
                <div key={i} className="p-4 border-b h-20 animate-pulse bg-muted/30 rounded-md grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0"></div>
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="h-5 w-3/5 bg-muted rounded"></div>
                        <div className="h-3 w-4/5 bg-muted rounded"></div>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-1">
                        <div className="h-3 w-24 bg-muted rounded"></div>
                        <div className="h-3 w-20 bg-muted rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No users found.</p>
          <CardDescription className="text-center mt-2">This section will display registered platform users once Firebase is connected and users are fetched.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-2">
      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {paginatedUsers.map((user) => (
            <UserListItem
              key={user.uid}
              user={user}
            />
          ))}
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
