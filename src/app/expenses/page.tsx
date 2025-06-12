
"use client";

import { useEffect } from 'react'; 
import { useRouter } from 'next/navigation'; 

import { AppShell } from '@/components/layout/AppShell';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { TextCategorizationForm } from '@/components/expenses/TextCategorizationForm';
import { ReceiptUploadForm } from '@/components/expenses/ReceiptUploadForm';
import { CameraReceiptScan } from '@/components/expenses/CameraReceiptScan';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import type { Expense } from '@/lib/types';
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ProcessedExpenseData } from '@/actions/aiActions';
import { useExpenses } from '@/contexts/ExpenseContext';
import { ResponsiveFormWrapper } from '@/components/shared/ResponsiveFormWrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, LayoutList, FileText, UploadCloud, Camera } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext'; 

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { expenses, addExpense, deleteExpense, updateExpense, loadingExpenses } = useExpenses();
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | undefined>(undefined); // Still used for pre-filling NEW expenses from AI
  const [activeView, setActiveView] = useState("list"); 
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleOpenFormForNew = () => {
    setEditingExpense(undefined); // Ensure it's for a new expense
    setIsExpenseFormOpen(true);
  };

  const handleAddOrUpdateExpense = (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    // Since editing is disabled, this function will now primarily handle adding new expenses.
    // The `updateExpense` path (if `editingExpense.id` was set) is effectively bypassed by not setting `editingExpense.id` for existing items.
    addExpense(expenseData, expenseData.receiptUrl); 
    setEditingExpense(undefined);
    setIsExpenseFormOpen(false);
  };

  // const handleUpdateExistingExpense = (expense: Expense) => {
  //   // This function is effectively disabled as onEditExpense is not called from ExpenseList.
  //   // And the ExpenseForm is not opened in edit mode for existing transactions.
  //   updateExpense(expense); 
  //   setEditingExpense(undefined);
  //   setIsExpenseFormOpen(false);
  // };

  // const handleEditExpense = (expenseToEdit: Expense) => {
  //   // Editing is disabled. This function will not be called.
  //   // setEditingExpense(expenseToEdit);
  //   // setIsExpenseFormOpen(true);
  // };

  const handleDataExtracted = useCallback((data: ProcessedExpenseData) => { 
    // Pre-fill the form for a NEW transaction based on AI data. Do not set an existing ID.
    setEditingExpense({ 
      description: data.description,
      amount: data.amount,
      date: data.date,
      category: data.category,
      merchant: data.merchant,
      type: data.type,
      receiptUrl: data.receiptUrl 
      // id: undefined, // Explicitly ensure no id is set to prevent update path
    });
    setIsExpenseFormOpen(true); 
  }, []);

  const handleFormSubmissionDone = () => {
    setEditingExpense(undefined);
    setIsExpenseFormOpen(false);
  };

  // The form title will always be "Add New Transaction" as editing is disabled.
  const formTitle = "Add New Transaction";
  const formDescription = "Enter the details for a new transaction.";


  if (authLoading || (!user && !authLoading) || loadingExpenses) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-4 text-muted-foreground text-sm md:text-base">Loading transactions...</p>
        </div>
      </AppShell>
    );
  }

  const viewOptions = [
    { value: "list", label: "All Transactions", icon: LayoutList, description: "View and manage all your recorded transactions." },
    { value: "text-ai", label: "AI: Text Input", icon: FileText, description: "Type a description for AI to parse (e.g., \"Lunch $12.50\")." },
    { value: "receipt-ai", label: "AI: Receipt Upload", icon: UploadCloud, description: "Upload a receipt image for AI data extraction." },
    { value: "camera-ai", label: "AI: Scan with Camera", icon: Camera, description: "Use your camera to scan a receipt for AI processing." },
  ];

  const selectedViewOption = viewOptions.find(opt => opt.value === activeView);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-2xl md:text-3xl font-semibold text-foreground">Manage Transactions</h1>
          <Button onClick={handleOpenFormForNew} className="w-full sm:w-auto" disabled={!user}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>

        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Transaction Input Method</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {selectedViewOption?.description || "Select how you want to manage or add transactions."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={activeView} onValueChange={setActiveView} disabled={!user}>
              <SelectTrigger className="w-full md:max-w-sm text-sm md:text-base">
                <SelectValue placeholder="Select View / Input Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Views & AI Tools</SelectLabel>
                  {viewOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-sm md:text-base py-2">
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>


        <div className="mt-4 space-y-6">
          {activeView === "list" && (
            <ExpenseList 
              expenses={expenses} 
              onDeleteExpense={deleteExpense} 
              // onEditExpense={handleEditExpense} // Editing is disabled
            />
          )}

          {activeView === "text-ai" && (
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary"/> Categorize by Text
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Type a description (e.g., &quot;Lunch at Cafe Mocha $12.50&quot; or &quot;Received salary $2000&quot;), and AI will parse it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TextCategorizationForm onDataExtracted={handleDataExtracted} />
              </CardContent>
            </Card>
          )}

          {activeView === "receipt-ai" && (
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <UploadCloud className="mr-2 h-5 w-5 text-primary"/> Extract from Receipt/Document
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Upload an image of your receipt or financial document, and AI handles the rest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReceiptUploadForm onDataExtracted={handleDataExtracted} />
              </CardContent>
            </Card>
          )}

          {activeView === "camera-ai" && (
            <Card className="rounded-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center">
                  <Camera className="mr-2 h-5 w-5 text-primary"/> Scan with Camera
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Use your camera to scan a receipt or document for AI-powered data extraction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CameraReceiptScan onDataExtracted={handleDataExtracted} />
              </CardContent>
            </Card>
          )}
        </div>

        <ResponsiveFormWrapper
          isOpen={isExpenseFormOpen}
          onOpenChange={setIsExpenseFormOpen}
          title={formTitle}
          description={formDescription}
          side="right" 
        >
          <ExpenseForm 
            onAddExpense={handleAddOrUpdateExpense} 
            // onUpdateExpense={handleUpdateExistingExpense} // Editing is disabled
            onUpdateExpense={() => {}} // Provide a dummy function or ensure ExpenseForm doesn't require it if initialData.id is never passed
            initialData={editingExpense} // This will be for pre-filling a NEW expense from AI
            formId="responsive-expense-entry-form"
            onSubmissionDone={handleFormSubmissionDone}
          />
        </ResponsiveFormWrapper>
      </div>
    </AppShell>
  );
}
