
"use client";

import type { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, ArrowDownCircle, ArrowUpCircle, Tag, CalendarDays, Building, ChevronLeft, ChevronRight, Info, LayoutList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format, parseISO } from 'date-fns';
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const ITEMS_PER_PAGE = 10;

interface ExpenseListItemProps {
  expense: Expense;
  onDeleteExpense: (id: string) => void;
  // onEditExpense: (expense: Expense) => void; // Editing is disabled
}

function ExpenseListItem({ expense, onDeleteExpense /*, onEditExpense */ }: ExpenseListItemProps) {
  const { displayCurrency, isMounted: settingsMounted } = useSettings();
  const isIncome = expense.type === 'income';
  const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const iconColor = isIncome ? 'text-green-500' : 'text-red-500';

  const [formattedDate, setFormattedDate] = useState('');
  const isSavingsRelatedTransaction = !!expense.relatedSavingsGoalId;

  useEffect(() => {
    if (expense.date) {
      try {
        setFormattedDate(format(parseISO(expense.date), 'PP'));
      } catch (e) {
        console.error("Error formatting date:", expense.date, e);
        setFormattedDate(expense.date);
      }
    }
  }, [expense.date]);

  if (!settingsMounted) {
     return (
      <Card className="mb-4 animate-pulse bg-muted/30 rounded-xl shadow-sm border-0"> {/* Added border-0 */}
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-6 w-3/5 bg-muted rounded"></div>
          <div className="h-6 w-1/5 bg-muted rounded"></div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="h-4 w-4/5 bg-muted rounded"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
        </CardContent>
        <CardFooter className="p-4 flex justify-end gap-2">
          {/* <div className="h-8 w-16 bg-muted rounded-md"></div> */} {/* Edit button placeholder commented out */}
          <div className="h-8 w-16 bg-muted rounded-md"></div>
        </CardFooter>
      </Card>
    );
  }

  // const editButton = (
  //   <Button
  //     variant="outline"
  //     size="sm"
  //     onClick={() => !isSavingsRelatedTransaction && onEditExpense(expense)}
  //     aria-label="Edit transaction"
  //     disabled={isSavingsRelatedTransaction}
  //     className="text-xs"
  //   >
  //     <Edit3 className="h-3.5 w-3.5 sm:mr-1.5" />
  //     <span className="hidden sm:inline">Edit</span>
  //   </Button>
  // );

  return (
    <Card className="mb-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-muted/50 transition-all duration-300 border-0"> {/* Added border-0 and hover:bg-muted/50 */}
      <CardHeader className="p-4 flex flex-row items-start sm:items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon className={`h-6 w-6 ${iconColor} flex-shrink-0`} />
          <CardTitle className="text-base md:text-lg font-semibold text-foreground truncate" title={expense.description}>
            {expense.description}
          </CardTitle>
        </div>
        <p className={`text-base sm:text-lg md:text-xl font-bold ${amountColor} whitespace-nowrap`}>
          {isIncome ? '+' : '-'}{formatCurrency(expense.amount, displayCurrency)}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-1.5">
        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Badge variant="outline" className="flex items-center text-xs">
            <Tag className="h-3 w-3 mr-1" />{expense.category}
          </Badge>
          <span className="flex items-center"><CalendarDays className="h-3 w-3 mr-1" />{formattedDate || 'Loading date...'}</span>
          {expense.merchant && (
            <span className="flex items-center"><Building className="h-3 w-3 mr-1" />{expense.merchant}</span>
          )}
        </div>
        {isSavingsRelatedTransaction && (
          <div className="flex items-center text-xs text-primary mt-1">
            <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span>Linked to a savings goal. Editing disabled for these transactions.</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-end gap-2">
        {/* {isSavingsRelatedTransaction ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{editButton}</TooltipTrigger>
              <TooltipContent>
                <p>Cannot edit: Linked to a savings goal.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          editButton
        )} */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeleteExpense(expense.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
          aria-label="Delete transaction"
        >
          <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  // onEditExpense: (expense: Expense) => void; // Editing is disabled
}

export function ExpenseList({ expenses, onDeleteExpense /*, onEditExpense */ }: ExpenseListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { isMounted: settingsMounted } = useSettings();

  const sortedExpenses = expenses.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateB !== dateA) return dateB - dateA;
    const createdAtA = a.createdAt && typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any)?.seconds || 0;
    const createdAtB = b.createdAt && typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any)?.seconds || 0;
    return createdAtB - createdAtA;
  });

  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExpenses = sortedExpenses.slice(startIndex, endIndex);

  if (!settingsMounted && expenses.length > 0) {
     return (
      <div className="mt-6 space-y-4">
        {[...Array(Math.min(ITEMS_PER_PAGE, 3))].map((_, i) => (
         <Card key={i} className="animate-pulse bg-muted/30 rounded-xl shadow-sm border-0"> {/* Added border-0 */}
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-6 w-3/5 bg-muted rounded"></div>
              <div className="h-6 w-1/5 bg-muted rounded"></div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <div className="h-4 w-4/5 bg-muted rounded"></div>
              <div className="h-4 w-1/2 bg-muted rounded"></div>
            </CardContent>
            <CardFooter className="p-4 flex justify-end gap-2">
              {/* <div className="h-8 w-16 bg-muted rounded-md"></div> */} {/* Edit button placeholder commented out */}
              <div className="h-8 w-16 bg-muted rounded-md"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="mt-8 rounded-xl shadow-lg border-0"> {/* Added border-0 */}
        <CardContent className="pt-6 text-center">
          <LayoutList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">No transactions recorded yet.</p>
          <CardDescription className="mt-2 text-sm md:text-base">Click &quot;Add Transaction&quot; to get started or try an AI tool.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-2">
      <div className="space-y-4">
        {paginatedExpenses.map((expense) => (
          <ExpenseListItem
            key={expense.id}
            expense={expense}
            onDeleteExpense={onDeleteExpense}
            // onEditExpense={onEditExpense} // Editing is disabled
          />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
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

    