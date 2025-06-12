
"use client";

import type { SavingsGoal } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader & CardTitle
import { SavingsGoalItem } from "./SavingsGoalItem";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Landmark } from "lucide-react"; // Added Landmark icon
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

const ITEMS_PER_PAGE = 9; 

interface SavingsGoalListProps {
  savingsGoals: SavingsGoal[];
  onDeleteGoal: (id: string) => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onContributeToGoal: (goal: SavingsGoal) => void;
  onWithdrawFromGoal: (goal: SavingsGoal) => void; 
}

export function SavingsGoalList({
  savingsGoals,
  onDeleteGoal,
  onEditGoal,
  onContributeToGoal,
  onWithdrawFromGoal, 
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
          <Card key={i} className="animate-pulse bg-muted/30 rounded-xl shadow-md flex flex-col">
             <CardHeader className="p-4">
                <div className="h-5 w-3/5 bg-muted rounded mb-1"></div>
                <div className="h-4 w-1/4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-grow">
              <div className="h-3 w-full bg-muted rounded-full"></div>
              <div className="flex justify-between">
                <div className="h-3 w-2/5 bg-muted rounded"></div>
                <div className="h-3 w-1/4 bg-muted rounded"></div>
              </div>
              <div className="h-3 w-3/5 bg-muted rounded"></div>
            </CardContent>
            <CardContent className="p-4 border-t mt-auto">
                <div className="flex justify-end gap-2 w-full">
                     {[...Array(3)].map((_, i) => 
                        <div key={i} className="h-8 w-8 bg-muted rounded-md"></div>
                    )}
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (savingsGoals.length === 0) {
    return (
      <Card className="mt-8 rounded-xl shadow-lg">
        <CardContent className="pt-10 pb-10 text-center">
          <Landmark className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <CardTitle className="text-xl md:text-2xl font-semibold text-foreground mb-2">No Savings Goals Yet</CardTitle>
          <CardDescription className="text-sm md:text-base text-muted-foreground max-w-xs mx-auto">
            Start planning for your future! Click &quot;Create New Goal&quot; to set up your first savings target.
          </CardDescription>
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
            onContribute={onContributeToGoal}
            onWithdraw={onWithdrawFromGoal} 
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
            className="text-xs"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="text-xs"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

    