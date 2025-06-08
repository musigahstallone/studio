
"use client";

import type { SavingsGoal } from "@/lib/types";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { SavingsGoalItem } from "./SavingsGoalItem";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

const ITEMS_PER_PAGE = 6; // Adjusted for potentially larger cards

interface SavingsGoalListProps {
  savingsGoals: SavingsGoal[];
  onDeleteGoal: (id: string) => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onContributeToGoal: (goal: SavingsGoal) => void; // New prop
}

export function SavingsGoalList({
  savingsGoals,
  onDeleteGoal,
  onEditGoal,
  onContributeToGoal, // Destructure new prop
}: SavingsGoalListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { isMounted: settingsMounted } = useSettings();

  const sortedGoals = savingsGoals.sort((a, b) => {
    const aDate = a.createdAt instanceof Date ? a.createdAt : (typeof a.createdAt === 'string' ? new Date(a.createdAt) : new Date());
    const bDate = b.createdAt instanceof Date ? b.createdAt : (typeof b.createdAt === 'string' ? new Date(b.createdAt) : new Date());
    return bDate.getTime() - aDate.getTime();
  });

  const totalPages = Math.ceil(sortedGoals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedGoals = sortedGoals.slice(startIndex, endIndex);

  if (!settingsMounted && savingsGoals.length > 0) {
    return (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(Math.min(ITEMS_PER_PAGE, 3))].map((_, i) => (
          <Card key={i} className="animate-pulse bg-muted/30 rounded-lg shadow-md">
            <CardContent className="p-5 space-y-3">
              <div className="h-6 w-3/4 bg-muted rounded"></div>
              <div className="h-3 w-1/2 bg-muted rounded"></div>
              <div className="h-4 w-full bg-muted rounded-full"></div>
              <div className="flex justify-between">
                <div className="h-3 w-1/4 bg-muted rounded"></div>
                <div className="h-3 w-1/4 bg-muted rounded"></div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <div className="h-8 w-20 bg-muted rounded-md"></div>
                <div className="h-8 w-20 bg-muted rounded-md"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (savingsGoals.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No savings goals set yet.</p>
          <CardDescription className="text-center mt-2">Click "Create New Goal" to get started.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedGoals.map((goal) => (
          <SavingsGoalItem
            key={goal.id}
            goal={goal}
            onDeleteGoal={onDeleteGoal}
            onEditGoal={onEditGoal}
            onContribute={onContributeToGoal} // Pass the handler here
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
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
