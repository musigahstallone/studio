
"use client";

import type { AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Mail, CalendarDays, DollarSign, ShoppingBag, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, UserCircle, CheckCircle, XCircle, Trash2 as DeletedIcon } from "lucide-react";
import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format, parseISO, isValid } from 'date-fns';
import Image from "next/image";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


const ITEMS_PER_PAGE = 10;

interface UserListItemProps {
  user: AppUser;
}

function UserListItem({ user }: UserListItemProps) {
  const { displayCurrency, isMounted: settingsMounted } = useSettings();
  const [formattedJoinDate, setFormattedJoinDate] = useState('');

  useEffect(() => {
    if (user.joinDate) {
      try {
        const dateToParse = typeof user.joinDate === 'string' ? user.joinDate : String(user.joinDate);
        const parsedDate = parseISO(dateToParse);
        if (isValid(parsedDate)) {
          setFormattedJoinDate(format(parsedDate, 'PP'));
        } else {
          setFormattedJoinDate('Invalid Date');
        }
      } catch (e) {
        console.error("Error formatting join date for user:", user.uid, user.joinDate, e);
        setFormattedJoinDate(String(user.joinDate)); 
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
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={user.photoURL || undefined} alt={user.name || user.email || 'User'} data-ai-hint="user avatar"/>
        <AvatarFallback>
          {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5" />)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm sm:text-base md:text-lg text-foreground truncate">{user.name || 'Unnamed User'}</p>
          {user.isAdmin ? <Badge variant="secondary" className="text-xs"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge> : <Badge variant="outline" className="text-xs"><ShieldAlert className="h-3 w-3 mr-1" />User</Badge>}
          {user.isDeletedAccount ? (
            <Badge variant="destructive" className="text-xs"><DeletedIcon className="h-3 w-3 mr-1" />Deleted</Badge>
          ) : user.isActive ? (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
          ) : (
            <Badge variant="outline" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
          <span className="flex items-center"><Mail className="h-3 w-3 mr-1" />{user.email || 'no-email@example.com'}</span>
          <span className="flex items-center"><CalendarDays className="h-3 w-3 mr-1" />Joined: {formattedJoinDate}</span>
        </div>
      </div>

      <div className="flex flex-col items-start md:items-end gap-1 text-xs text-muted-foreground">
        <span className="flex items-center"><ShoppingBag className="h-3 w-3 mr-1 text-primary" />{user.transactionCount || 0} Txns</span>
        <span className="flex items-center"><DollarSign className="h-3 w-3 mr-1 text-green-500" />Spent: {formatCurrency(user.totalSpent || 0, displayCurrency)}</span>
      </div>
    </div>
  );
}

interface UserListProps {
  users: AppUser[];
}

export function UserList({ users }: UserListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { isMounted: settingsMounted } = useSettings();

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
      <Card className="mt-8 rounded-xl">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-sm md:text-base">No users found in the database.</p>
          <CardDescription className="text-center mt-2 text-xs sm:text-sm">Ensure users have signed up and their data is in the 'users' collection.</CardDescription>
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
