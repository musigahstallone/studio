
"use client";

import type { SavingsGoal, SavingsGoalStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Target, DollarSign, CalendarClock, Gift, AlertTriangle, Download, Lock, Unlock } from "lucide-react";
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
  onWithdraw: (goal: SavingsGoal) => void; // New prop for withdrawal
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
  }


  const canContribute = goal.status === 'active' && !isGoalFunded;
  const canWithdraw = (goal.status === 'active' || goal.status === 'matured') && goal.currentAmount > 0 && (isReadyForWithdrawal || goal.allowsEarlyWithdrawal);
  

  const getStatusBadgeVariant = (status: SavingsGoalStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'matured': return 'secondary';
      case 'completed': return 'default'; // Or a success variant if you add one
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
      default: return status;
    }
  };


  if (!settingsMounted) {
    return (
      <Card className="animate-pulse bg-muted/30 rounded-lg shadow-md">
        <CardContent className="p-5 space-y-3">
          <div className="h-6 w-3/4 bg-muted rounded"></div>
          <div className="h-3 w-1/2 bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted rounded-full"></div>
          <div className="flex justify-between">
            <div className="h-3 w-1/4 bg-muted rounded"></div>
            <div className="h-3 w-1/4 bg-muted rounded"></div>
          </div>
           <div className="h-3 w-1/3 bg-muted rounded mt-1"></div>
          <div className="flex justify-end space-x-2 pt-2">
            <div className="h-8 w-24 bg-muted rounded-md"></div>
            <div className="h-8 w-20 bg-muted rounded-md"></div>
            <div className="h-8 w-20 bg-muted rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ${isGoalFunded && goal.status !== 'completed' && goal.status !== 'withdrawnEarly' ? 'border-green-500' : (goal.status === 'completed' ? 'border-green-600 bg-green-50 dark:bg-green-900/20' : '')}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            {goal.name}
          </CardTitle>
           <Badge variant={getStatusBadgeVariant(goal.status)} className="text-xs">
            {getStatusBadgeText(goal.status)}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Target: {formatCurrency(goal.targetAmount, displayCurrency)}
          {goal.withdrawalCondition === 'targetAmountReached' ? " (Withdraw when funded)" : effectiveMaturityDate ? ` (Withdraw on ${format(effectiveMaturityDate, "PP")})` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <Progress value={progressPercent} className={`h-2.5 ${isGoalFunded ? '[&>div]:bg-green-500' : ''}`} />
        <div className="flex justify-between text-sm">
          <span className={`${isGoalFunded ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
            Saved: {formatCurrency(goal.currentAmount, displayCurrency)}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progressPercent)}%
          </span>
        </div>
         {timeRemainingDisplay && (
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3 mr-1.5" />
            <span>{timeRemainingDisplay}</span>
          </div>
        )}
        {(isGoalMatureByDate && !isGoalFunded && goal.status === 'active') && (
            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 mr-1.5" />
                <span>Past maturity date, not yet fully funded.</span>
            </div>
        )}
         {!goal.allowsEarlyWithdrawal && goal.status === 'active' && !isReadyForWithdrawal && (
             <div className="flex items-center text-xs text-muted-foreground">
                <Lock className="h-3 w-3 mr-1.5 text-red-500" />
                <span>Early withdrawal not allowed.</span>
            </div>
         )}
         {goal.allowsEarlyWithdrawal && goal.status === 'active' && !isReadyForWithdrawal && (
             <div className="flex items-center text-xs text-muted-foreground">
                <Unlock className="h-3 w-3 mr-1.5 text-green-500" />
                <span>Early withdrawal allowed (penalty: {(goal.earlyWithdrawalPenaltyRate * 100).toFixed(0)}%).</span>
            </div>
         )}
      </CardContent>
      <div className="p-4 pt-2 border-t mt-auto">
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onContribute(goal)}
            disabled={!canContribute}
            className="flex-grow sm:flex-grow-0"
          >
            <DollarSign className="h-4 w-4 mr-1 sm:mr-1.5" /> Contribute
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWithdraw(goal)} // Call new prop
            disabled={!canWithdraw}
            className="flex-grow sm:flex-grow-0"
          >
            <Download className="h-4 w-4 mr-1 sm:mr-1.5" /> Withdraw
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditGoal(goal)} className="flex-grow sm:flex-grow-0" disabled={goal.status !== 'active'}>
            <Edit3 className="h-4 w-4 mr-1 sm:mr-1.5" /> Edit
          </Button>
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-grow sm:flex-grow-0">
                <Trash2 className="h-4 w-4 mr-1 sm:mr-1.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the savings goal "{goal.name}" and all its associated contribution records and expense entries. This action cannot be undone.
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
