
"use client";

import type { SavingsGoal, SavingsGoalStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Target, DollarSign, CalendarClock, Download, Lock, Unlock, Info } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";
import { format, differenceInDays, addMonths, isValid, parseISO, isPast, isToday } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SavingsGoalItemProps {
  goal: SavingsGoal;
  onDeleteGoal: (id: string) => void;
  onEditGoal: (goal: SavingsGoal) => void; 
  onContribute: (goal: SavingsGoal) => void;
  onWithdraw: (goal: SavingsGoal) => void;
}

export function SavingsGoalItem({ goal, onDeleteGoal, onEditGoal, onContribute, onWithdraw }: SavingsGoalItemProps) {
  const { displayCurrency, isMounted: settingsMounted } = useSettings();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const progressPercent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;

  let effectiveMaturityDate: Date | null = null;
  if (goal.targetDate) {
    try {
      const tDate = parseISO(goal.targetDate);
      if (isValid(tDate)) effectiveMaturityDate = tDate;
    } catch (e) { console.error("Error parsing targetDate for maturity:", e); }
  } else if (goal.startDate && goal.durationMonths && goal.durationMonths > 0) {
    try {
      const sDate = parseISO(goal.startDate);
      if (isValid(sDate)) effectiveMaturityDate = addMonths(sDate, goal.durationMonths);
    } catch (e) { console.error("Error parsing startDate/durationMonths for maturity:", e); }
  }

  const isGoalMatureByDate = effectiveMaturityDate ? isPast(effectiveMaturityDate) || isToday(effectiveMaturityDate) : false;
  const isGoalFunded = goal.currentAmount >= goal.targetAmount;

  let isReadyForWithdrawal = false;
  if (goal.status === 'active' || goal.status === 'matured') {
    if (goal.withdrawalCondition === 'targetAmountReached' && isGoalFunded) {
      isReadyForWithdrawal = true;
    } else if (goal.withdrawalCondition === 'maturityDateReached' && isGoalMatureByDate) {
      isReadyForWithdrawal = true;
    }
  }

  let timeRemainingDisplay = "";
  if (effectiveMaturityDate && goal.status === 'active') {
    const daysLeft = differenceInDays(effectiveMaturityDate, new Date());
    if (daysLeft < 0) {
      timeRemainingDisplay = `Matured on ${format(effectiveMaturityDate, "PP")}`;
    } else if (daysLeft === 0) {
      timeRemainingDisplay = "Matures today!";
    } else {
      timeRemainingDisplay = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
    }
  } else if (goal.status === 'matured') {
    timeRemainingDisplay = `Matured on ${effectiveMaturityDate ? format(effectiveMaturityDate, "PP") : 'N/A'}`;
  } else if (goal.status === 'completed') {
    timeRemainingDisplay = "Goal completed!";
  } else if (goal.status === 'withdrawnEarly') {
    timeRemainingDisplay = "Withdrawn early.";
  } else if (goal.status === 'cancelled') {
    timeRemainingDisplay = "Goal cancelled.";
  }

  const terminalStatus = goal.status === 'completed' || goal.status === 'withdrawnEarly' || goal.status === 'cancelled';

  const canContribute = goal.status === 'active' && !isGoalFunded && !terminalStatus;
  const canWithdraw = (goal.status === 'active' || goal.status === 'matured') && goal.currentAmount > 0 && (isReadyForWithdrawal || goal.allowsEarlyWithdrawal) && !terminalStatus;
  const canDelete = true; 

  const getStatusBadgeVariant = (status: SavingsGoalStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'matured': return 'secondary';
      case 'completed': return 'default'; 
      case 'withdrawnEarly': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getStatusBadgeText = (status: SavingsGoalStatus): string => {
    switch (status) {
      case 'active': return 'Active';
      case 'matured': return 'Matured';
      case 'completed': return 'Completed';
      case 'withdrawnEarly': return 'Withdrawn Early';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (!settingsMounted) {
    return (
      <Card className="animate-pulse bg-muted/30 rounded-xl shadow-sm flex flex-col">
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
          <div className="h-3 w-1/2 bg-muted rounded"></div>
        </CardContent>
        <CardFooter className="p-4 pt-0 mt-auto border-t">
          <div className="flex justify-end gap-2 w-full">
            {[...Array(3)].map((_, i) => 
              <div key={i} className="h-8 w-8 bg-muted rounded-md"></div>
            ))}
          </div>
        </CardFooter>
      </Card>
    );
  }

  let footerContent;
  if (terminalStatus) {
    let message = "Goal Concluded";
    if (goal.status === 'completed') message = "Goal Completed";
    else if (goal.status === 'withdrawnEarly') message = "Funds Withdrawn";
    else if (goal.status === 'cancelled') message = "Goal Cancelled";

    footerContent = (
      <div className="flex justify-between items-center w-full">
        <span className="text-xs sm:text-sm text-muted-foreground px-1">{message}</span>
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      disabled={!canDelete}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete"
                  >
                      <Trash2 className="h-4.5 w-4.5" />
                  </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{!canDelete ? "Deletion not allowed" : "Delete Goal"}</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the savings goal "{goal.name}" and all its associated contribution & withdrawal records, including linked expense/income entries. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDeleteGoal(goal.id);
                  setShowDeleteConfirm(false);
                }}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Yes, Delete Goal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  } else {
    footerContent = (
      <div className="flex justify-end gap-1.5 w-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onContribute(goal)}
              disabled={!canContribute}
              aria-label="Contribute"
            >
              <DollarSign className="h-4.5 w-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{!canContribute ? (isGoalFunded ? "Goal fully funded" : "Goal not active for contributions") : "Contribute"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onWithdraw(goal)}
              disabled={!canWithdraw}
              aria-label="Withdraw"
            >
              <Download className="h-4.5 w-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{!canWithdraw ? "Withdrawal conditions not met or no funds" : "Withdraw"}</TooltipContent>
        </Tooltip>
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      disabled={!canDelete}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete"
                  >
                      <Trash2 className="h-4.5 w-4.5" />
                  </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{!canDelete ? "Deletion not allowed" : "Delete Goal"}</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the savings goal "{goal.name}" and all its associated contribution & withdrawal records, including linked expense/income entries. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDeleteGoal(goal.id);
                  setShowDeleteConfirm(false);
                }}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Yes, Delete Goal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }


  return (
    <Card className={cn(
        "flex flex-col rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border",
        goal.status === 'completed' ? 'border-green-500 bg-green-500/5 dark:bg-green-500/10' : 
        isGoalFunded && goal.status !== 'withdrawnEarly' && goal.status !== 'cancelled' ? 'border-primary/50' : 
        'border-border'
    )}>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="h-5 w-5 text-primary flex-shrink-0" />
            <CardTitle className="text-base md:text-lg font-semibold text-foreground truncate" title={goal.name}>
              {goal.name}
            </CardTitle>
          </div>
          <Badge variant={getStatusBadgeVariant(goal.status)} className="text-xs flex-shrink-0 capitalize">
            {getStatusBadgeText(goal.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-2 flex-grow">
        <div className="mb-3">
          <div className="flex justify-between text-xs sm:text-sm mb-1">
            <span className={cn(
              "font-medium",
              isGoalFunded && goal.status !== 'withdrawnEarly' && goal.status !== 'cancelled' ? "text-green-600 dark:text-green-400" : "text-foreground"
            )}>
              {formatCurrency(goal.currentAmount, displayCurrency)}
            </span>
            <span className="text-muted-foreground">
              / {formatCurrency(goal.targetAmount, displayCurrency)} ({Math.round(progressPercent)}%)
            </span>
          </div>
          <Progress
            value={progressPercent}
            className={cn(
                "h-2 rounded-full transition-all duration-500",
                isGoalFunded && goal.status !== 'withdrawnEarly' && goal.status !== 'cancelled' ? '[&>div]:bg-green-500' : 
                (goal.status === 'withdrawnEarly' || goal.status === 'cancelled') ? '[&>div]:bg-destructive' :
                '[&>div]:bg-primary'
            )}
            aria-label={`${Math.round(progressPercent)}% funded`}
          />
        </div>

        {timeRemainingDisplay && (
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{timeRemainingDisplay}</span>
          </div>
        )}

        <div className="flex items-center text-xs text-muted-foreground">
          {goal.allowsEarlyWithdrawal ? (
            <>
              <Unlock className="h-3.5 w-3.5 mr-1.5 text-green-500 flex-shrink-0" />
              <span className="truncate">Early withdrawal: Yes ({(goal.earlyWithdrawalPenaltyRate * 100).toFixed(0)}% penalty)</span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 mr-1.5 text-red-500 flex-shrink-0" />
              <span className="truncate">Early withdrawal: No</span>
            </>
          )}
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">Withdrawal: On {goal.withdrawalCondition === 'maturityDateReached' ? 'maturity' : 'target met'}</span>
        </div>

      </CardContent>

      <CardFooter className="p-3 border-t mt-auto bg-muted/30 dark:bg-muted/10">
        {footerContent}
      </CardFooter>
    </Card>
  );
}
