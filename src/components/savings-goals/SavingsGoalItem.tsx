
"use client";

import type { SavingsGoal, SavingsGoalStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Target, DollarSign, CalendarClock, Download, Lock, Unlock } from "lucide-react";
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
    if (daysLeft < 0) { // Should ideally transition to 'matured' status via a backend job or context update
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


  const canContribute = goal.status === 'active' && !isGoalFunded;
  const canWithdraw = (goal.status === 'active' || goal.status === 'matured') && goal.currentAmount > 0 && (isReadyForWithdrawal || goal.allowsEarlyWithdrawal);
  const canEdit = goal.status === 'active';
  const canDelete = true; // Always allow delete for now, might change based on business rules (e.g. if funds exist)

  const getStatusBadgeVariant = (status: SavingsGoalStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'matured': return 'secondary'; // Use secondary for matured, as it's a step before completion
      case 'completed': return 'default'; // Keep default (primary color) for completed for positive feedback
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
      case 'withdrawnEarly': return 'Early Withdrawal';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1); // Capitalize if unknown
    }
  };

  if (!settingsMounted) {
    return (
      <Card className="animate-pulse bg-muted/30 rounded-lg shadow-md max-w-full">
        <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between gap-2">
                <div className="h-5 w-3/5 bg-muted rounded"></div>
                <div className="h-5 w-1/5 bg-muted rounded-full"></div>
            </div>
            <div className="h-3 w-2/5 bg-muted rounded mt-1"></div>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          <div className="h-3 w-full bg-muted rounded-full"></div>
          <div className="flex justify-between">
            <div className="h-3 w-1/4 bg-muted rounded"></div>
            <div className="h-3 w-1/4 bg-muted rounded"></div>
          </div>
          <div className="h-3 w-1/3 bg-muted rounded"></div>
          <div className="h-3 w-2/3 bg-muted rounded"></div>
        </CardContent>
         <div className="p-4 pt-0 border-t">
            <div className="flex flex-wrap justify-end gap-2">
                <div className="h-8 w-24 bg-muted rounded-md"></div>
                <div className="h-8 w-24 bg-muted rounded-md"></div>
                <div className="h-8 w-20 bg-muted rounded-md"></div>
                <div className="h-8 w-20 bg-muted rounded-md"></div>
            </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 max-w-full border ${
        goal.status === 'completed' ? 'border-green-600 bg-green-50 dark:bg-green-900/20' 
        : (isGoalFunded && goal.status !== 'withdrawnEarly' ? 'border-green-500' 
        : 'border-border')
    }`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center truncate max-w-[calc(100%-80px)]"> {/* Adjust max-width if badge is too wide */}
            <Target className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            <span className="truncate" title={goal.name}>{goal.name}</span>
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(goal.status)} className="text-xs flex-shrink-0">
            {getStatusBadgeText(goal.status)}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground truncate">
          Target: {formatCurrency(goal.targetAmount, displayCurrency)}
          {goal.withdrawalCondition === 'targetAmountReached' && effectiveMaturityDate ? ` (Withdraw when funded or on ${format(effectiveMaturityDate, "PP")})` 
           : goal.withdrawalCondition === 'targetAmountReached' ? " (Withdraw when funded)"
           : effectiveMaturityDate ? ` (Withdraw on ${format(effectiveMaturityDate, "PP")})` 
           : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2 flex-grow">
        <Progress
          value={progressPercent}
          className={`h-2 rounded-full ${isGoalFunded ? '[&>div]:bg-green-500' : '[&>div]:bg-primary'} transition-all duration-500`}
        />
        <div className="flex justify-between text-sm">
          <span className={`${isGoalFunded && goal.status !== 'withdrawnEarly' ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
            Saved: {formatCurrency(goal.currentAmount, displayCurrency)}
          </span>
          <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
        </div>
        
        {timeRemainingDisplay && (
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5 mr-1" />
            <span className="truncate">{timeRemainingDisplay}</span>
          </div>
        )}

        {goal.status === 'active' && (
            isGoalMatureByDate && !isGoalFunded ? (
            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
                <span className="truncate">Past maturity date, not fully funded.</span>
            </div>
            ) : !isReadyForWithdrawal && (
                <div className="flex items-center text-xs text-muted-foreground">
                {goal.allowsEarlyWithdrawal ? (
                    <>
                    <Unlock className="h-3.5 w-3.5 mr-1 text-green-500" />
                    <span className="truncate">Early withdrawal allowed (penalty: {(goal.earlyWithdrawalPenaltyRate * 100).toFixed(0)}%).</span>
                    </>
                ) : (
                    <>
                    <Lock className="h-3.5 w-3.5 mr-1 text-red-500" />
                    <span className="truncate">Early withdrawal not allowed.</span>
                    </>
                )}
                </div>
            )
        )}

      </CardContent>
      <div className="p-4 pt-0 border-t mt-auto"> {/* Ensure footer is always at bottom */}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onContribute(goal)}
            disabled={!canContribute}
            className="hover:bg-primary/90 transition-colors"
            title={!canContribute ? (isGoalFunded ? "Goal fully funded" : "Goal not active for contributions") : "Contribute funds"}
          >
            <DollarSign className="h-4 w-4 mr-1" /> Contribute
          </Button>
          <Button
            variant="secondary" 
            size="sm"
            onClick={() => onWithdraw(goal)}
            disabled={!canWithdraw}
            className="hover:bg-secondary/80 transition-colors"
            title={!canWithdraw ? "Withdrawal conditions not met or no funds" : "Withdraw funds"}
          >
            <Download className="h-4 w-4 mr-1" /> Withdraw
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditGoal(goal)}
            disabled={!canEdit}
            className="hover:bg-muted/50 transition-colors"
            title={!canEdit ? "Goal cannot be edited in current status" : "Edit goal"}
          >
            <Edit3 className="h-4 w-4 mr-1" /> Edit
          </Button>
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!canDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                title={!canDelete ? "Deletion not allowed" : "Delete goal"}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
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
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}

    
