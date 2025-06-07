
"use client";

import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, CalendarDays, DollarSign, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format, parseISO } from 'date-fns';
import Image from "next/image"; // For placeholder avatar

const ITEMS_PER_PAGE = 10;

interface UserListItemProps {
  user: User;
}

function UserListItem({ user }: UserListItemProps) {
  const [formattedJoinDate, setFormattedJoinDate] = useState('');

  useEffect(() => {
    if (user.joinDate) {
      try {
        setFormattedJoinDate(format(parseISO(user.joinDate), 'PP'));
      } catch (e) {
        setFormattedJoinDate(user.joinDate);
      }
    }
  }, [user.joinDate]);

  return (
    <div className="p-4 border-b hover:bg-muted/50 transition-colors grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-center">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
            <Image 
                src={`https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} 
                alt={`${user.name} avatar`} 
                layout="fill"
                objectFit="cover"
                data-ai-hint="avatar profile"
             />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-base sm:text-lg text-foreground truncate">{user.name}</p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
          <span className="flex items-center"><Mail className="h-3 w-3 mr-1" />{user.email}</span>
          <span className="flex items-center"><CalendarDays className="h-3 w-3 mr-1" />Joined: {formattedJoinDate || 'Loading date...'}</span>
        </div>
      </div>

      <div className="flex flex-col items-start md:items-end gap-1 text-xs text-muted-foreground">
        <span className="flex items-center"><ShoppingBag className="h-3 w-3 mr-1 text-primary" />{user.transactionCount} Transactions</span>
        <span className="flex items-center"><DollarSign className="h-3 w-3 mr-1 text-green-500" />Total Spent: ${user.totalSpent.toFixed(2)}</span>
         {/* Add action buttons here if needed in future e.g. View Details, Edit, Suspend */}
        {/* <Button variant="outline" size="sm" className="mt-2">View Details</Button> */}
      </div>
    </div>
  );
}

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Users are already sorted by joinDate in the page component
  const sortedUsers = users;

  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  if (users.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No users found.</p>
          <CardDescription className="text-center mt-2">This section will display registered platform users.</CardDescription>
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
              key={user.id}
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
