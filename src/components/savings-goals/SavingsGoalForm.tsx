
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { SavingsGoal, SavingsGoalWithdrawalCondition } from "@/lib/types";
import { DEFAULT_STORED_CURRENCY } from "@/lib/types";
import { PlusCircle, Save, CalendarIcon } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { convertToBaseCurrency, formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const SavingsGoalFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Goal name must be at least 2 characters." }).max(100, { message: "Name must be 100 characters or less."}),
  targetAmount: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : parseFloat(String(val))),
    z.number().positive({ message: "Target amount must be positive." })
  ),
  goalType: z.enum(["targetDate", "duration"]),
  targetDate: z.string().optional(),
  startDate: z.string().optional(),
  durationMonths: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : parseInt(String(val), 10)),
    z.number().int().positive().optional()
  ),
  allowsEarlyWithdrawal: z.boolean().default(false),
  earlyWithdrawalPenaltyRate: z.preprocess(
    (val) => (String(val).trim() === "" ? undefined : parseFloat(String(val))),
    z.number().min(0).max(100).optional()
  ),
  withdrawalCondition: z.enum(["targetAmountReached", "maturityDateReached"]).default("maturityDateReached"),
}).refine(data => {
  if (data.goalType === "targetDate") {
    if (!data.targetDate || !isValid(parseISO(data.targetDate))) return false;
    return parseISO(data.targetDate) > addDays(new Date(), -1);
  }
  return true;
}, {
  message: "A valid future target date is required if timeline type is 'Target Date'.",
  path: ["targetDate"],
}).refine(data => {
  if (data.goalType === "duration") {
    return !!data.durationMonths && data.durationMonths > 0 && !!data.startDate && isValid(parseISO(data.startDate));
  }
  return true;
}, {
  message: "A valid start date and positive duration (months) are required if timeline type is 'Duration'.",
  path: ["durationMonths"],
})
.superRefine((data, ctx) => {
  if (data.allowsEarlyWithdrawal) {
    if (data.earlyWithdrawalPenaltyRate === undefined || data.earlyWithdrawalPenaltyRate === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Penalty rate is required if early withdrawal is allowed.",
        path: ["earlyWithdrawalPenaltyRate"],
      });
    } else if (data.earlyWithdrawalPenaltyRate < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Penalty rate must be at least 10% if early withdrawal is allowed.",
        path: ["earlyWithdrawalPenaltyRate"],
      });
    } else if (data.earlyWithdrawalPenaltyRate > 100) {
       ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Penalty rate cannot exceed 100%.",
        path: ["earlyWithdrawalPenaltyRate"],
      });
    }
  }
});


type SavingsGoalFormData = z.infer<typeof SavingsGoalFormSchema>;

interface SavingsGoalFormProps {
  onSaveGoal: (goalData: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'>, id?: string) => void;
  existingGoals: SavingsGoal[];
  initialData?: Partial<SavingsGoal>;
  onSubmissionDone?: () => void;
}

export function SavingsGoalForm({ onSaveGoal, existingGoals, initialData, onSubmissionDone }: SavingsGoalFormProps) {
  const { toast } = useToast();
  const { localCurrency, displayCurrency, isMounted: settingsMounted } = useSettings();
  const isEditing = !!initialData?.id;

  const [selectedGoalType, setSelectedGoalType] = useState<"targetDate" | "duration">(
    initialData?.targetDate ? "targetDate" : (initialData?.durationMonths ? "duration" : "targetDate")
  );

  const form = useForm<SavingsGoalFormData>({
    resolver: zodResolver(SavingsGoalFormSchema),
    defaultValues: {
      id: undefined,
      name: "",
      targetAmount: undefined,
      goalType: "targetDate",
      targetDate: undefined,
      startDate: format(new Date(), "yyyy-MM-dd"),
      durationMonths: undefined,
      allowsEarlyWithdrawal: false,
      earlyWithdrawalPenaltyRate: undefined,
      withdrawalCondition: initialData?.withdrawalCondition || "maturityDateReached",
    },
  });

  useEffect(() => {
    let amountForFormDisplay: number | undefined = undefined;
    if (initialData?.targetAmount && settingsMounted && localCurrency !== DEFAULT_STORED_CURRENCY) {
      const rateFromBaseToLocal = 1 / (CONVERSION_RATES_TO_BASE_SAVINGS[localCurrency] || 1);
      amountForFormDisplay = parseFloat((initialData.targetAmount * rateFromBaseToLocal).toFixed(2));
    } else if (initialData?.targetAmount) {
      amountForFormDisplay = parseFloat(initialData.targetAmount.toFixed(2));
    }

    const currentGoalType = initialData?.targetDate ? "targetDate" : (initialData?.durationMonths ? "duration" : "targetDate");
    setSelectedGoalType(currentGoalType);

    form.reset({
      id: initialData?.id || undefined,
      name: initialData?.name || "",
      targetAmount: amountForFormDisplay,
      goalType: currentGoalType,
      targetDate: initialData?.targetDate && isValid(parseISO(initialData.targetDate)) ? format(parseISO(initialData.targetDate), "yyyy-MM-dd") : undefined,
      startDate: initialData?.startDate && isValid(parseISO(initialData.startDate)) ? format(parseISO(initialData.startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      durationMonths: initialData?.durationMonths,
      allowsEarlyWithdrawal: initialData?.allowsEarlyWithdrawal || false,
      earlyWithdrawalPenaltyRate: initialData?.earlyWithdrawalPenaltyRate ? (initialData.earlyWithdrawalPenaltyRate * 100) : undefined,
      withdrawalCondition: initialData?.withdrawalCondition || "maturityDateReached",
    });
  }, [initialData, form, settingsMounted, localCurrency]);


  function onSubmit(values: SavingsGoalFormData) {
    if (!settingsMounted) {
      toast({ variant: "destructive", title: "Error", description: "Settings not loaded. Please try again." });
      return;
    }

    if (existingGoals.some(g => g.name.toLowerCase() === values.name.toLowerCase() && g.id !== values.id)) {
      form.setError("name", { type: "manual", message: "A savings goal with this name already exists." });
      return;
    }

    const targetAmountInBaseCurrency = convertToBaseCurrency(values.targetAmount as number, localCurrency);
    
    let penaltyRateDecimal = 0;
    if (values.allowsEarlyWithdrawal && typeof values.earlyWithdrawalPenaltyRate === 'number') {
      penaltyRateDecimal = values.earlyWithdrawalPenaltyRate / 100;
    }

    const goalDataForContext: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'createdAt' | 'updatedAt' | 'status'> = {
      name: values.name,
      targetAmount: targetAmountInBaseCurrency,
      allowsEarlyWithdrawal: values.allowsEarlyWithdrawal,
      earlyWithdrawalPenaltyRate: penaltyRateDecimal,
      withdrawalCondition: values.withdrawalCondition,
      targetDate: null,
      startDate: null,
      durationMonths: null,
    };

    if (values.goalType === "targetDate" && values.targetDate) {
      goalDataForContext.targetDate = values.targetDate;
    } else if (values.goalType === "duration" && values.startDate && typeof values.durationMonths === 'number') {
      goalDataForContext.startDate = values.startDate;
      goalDataForContext.durationMonths = values.durationMonths;
    }


    onSaveGoal(goalDataForContext, values.id);

    toast({
      title: isEditing ? "Savings Goal Updated" : "Savings Goal Created",
      description: `${values.name} - Target: ${formatCurrency(targetAmountInBaseCurrency, displayCurrency)}`,
    });
    form.reset({
        id: undefined, name: "", targetAmount: undefined, goalType: "targetDate",
        targetDate: undefined, startDate: format(new Date(), "yyyy-MM-dd"), durationMonths: undefined,
        allowsEarlyWithdrawal: false, earlyWithdrawalPenaltyRate: undefined,
        withdrawalCondition: "maturityDateReached",
    });
    setSelectedGoalType("targetDate");
    if (onSubmissionDone) {
      onSubmissionDone();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Dream Vacation, New Laptop" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount (in {settingsMounted ? localCurrency : "local currency"})</FormLabel>
              <FormControl>
                <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value === undefined || field.value === null || isNaN(field.value as number) ? "" : String(field.value)}
                    onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : parseFloat(val));
                    }}
                />
              </FormControl>
              <FormDescription>
                Enter the total amount you want to save in your local input currency.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goalType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Timeline Type</FormLabel>
              <Select
                onValueChange={(value: "targetDate" | "duration") => {
                  field.onChange(value);
                  setSelectedGoalType(value);
                  if (value === "targetDate") {
                    form.setValue("durationMonths", undefined);
                    form.setValue("startDate", undefined);
                  } else {
                    form.setValue("targetDate", undefined);
                    if (!form.getValues("startDate")) {
                        form.setValue("startDate", format(new Date(), "yyyy-MM-dd"));
                    }
                  }
                }}
                value={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="targetDate">Set a Target Date</SelectItem>
                  <SelectItem value="duration">Set a Duration</SelectItem>
                </SelectContent>
              </Select>
              {!isEditing && (
                <FormDescription>
                  The timeline type cannot be changed after the goal is created.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedGoalType === "targetDate" && (
          <FormField
            control={form.control}
            name="targetDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Target Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isEditing}
                      >
                        {field.value && isValid(parseISO(field.value)) ? (
                          format(parseISO(field.value), "PPP")
                        ) : (
                          <span>Pick a target date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      disabled={(date) => date < addDays(new Date(), -1) || isEditing}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {!isEditing && (
                  <FormDescription>
                    The target date cannot be changed after the goal is created.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedGoalType === "duration" && (
          <>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date (for duration)</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                            )}
                            disabled={isEditing}
                        >
                            {field.value && isValid(parseISO(field.value)) ? (
                              format(parseISO(field.value), "PPP")
                            ) : (
                              <span>Pick a start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                        mode="single"
                        selected={field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        initialFocus
                        disabled={isEditing}
                        />
                    </PopoverContent>
                    </Popover>
                  <FormDescription>
                    Defaults to today if not set. {!isEditing && "Cannot be changed after creation."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (in months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 12 for one year"
                      {...field}
                      value={field.value === undefined || field.value === null || isNaN(field.value as number) ? "" : String(field.value)}
                       onChange={e => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : parseInt(val, 10));
                      }}
                      disabled={isEditing}
                    />
                  </FormControl>
                  {!isEditing && (
                    <FormDescription>
                      The duration cannot be changed after the goal is created.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="withdrawalCondition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Condition</FormLabel>
              <Select
                onValueChange={field.onChange as (value: SavingsGoalWithdrawalCondition) => void}
                value={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select when goal is ready for penalty-free withdrawal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="maturityDateReached">Maturity Date Reached</SelectItem>
                  <SelectItem value="targetAmountReached">Target Amount Reached</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Defines when the goal is considered mature for withdrawal without early penalties (if applicable).
                {!isEditing && " This cannot be changed after creation."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowsEarlyWithdrawal"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checkedBoolean) => {
                    const checked = Boolean(checkedBoolean)
                    field.onChange(checked);
                    if (!checked) {
                        form.setValue("earlyWithdrawalPenaltyRate", undefined, { shouldValidate: true });
                    }
                  }}
                  disabled={isEditing}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  Allow Early Withdrawal
                </FormLabel>
                <FormDescription>
                  Can funds be withdrawn before the goal matures or target is met?
                  {!isEditing && " If unchecked, withdrawals are blocked. This setting cannot be changed after creation."}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="earlyWithdrawalPenaltyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Early Withdrawal Penalty Rate (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 10 for 10%"
                  {...field}
                  value={field.value === undefined || field.value === null || isNaN(field.value as number) ? "" : String(field.value)}
                  onChange={e => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : parseFloat(val));
                  }}
                  disabled={!form.watch("allowsEarlyWithdrawal") || isEditing}
                />
              </FormControl>
              <FormDescription>
                Min 10%, Max 100%. Percentage of target amount penalized if withdrawn early.
                Only applicable if "Allow Early Withdrawal" is checked.
                {!isEditing && " This rate cannot be changed after creation."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={!settingsMounted || form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />)}
          {isEditing ? "Save Changes" : "Create Savings Goal"}
        </Button>
      </form>
    </Form>
  );
}

const CONVERSION_RATES_TO_BASE_SAVINGS: Record<string, number> = {
  USD: 1,
  EUR: 1 / 0.92,
  KES: 1 / 130,
};
    
    
