
"use client";

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
import { PlusCircle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const { expenses, addExpense, deleteExpense, updateExpense, loadingExpenses } = useExpenses();
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | undefined>(undefined);
  const [activeView, setActiveView] = useState("list"); // "list", "text-ai", "receipt-ai", "camera-ai"
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);

  const handleOpenFormForNew = () => {
    setEditingExpense(undefined);
    setIsExpenseFormOpen(true);
  };

  // Modified to include receiptUrl from ProcessedExpenseData
  const handleAddOrUpdateExpense = (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    addExpense(expenseData, expenseData.receiptUrl); // Pass receiptUrl to context function
    setEditingExpense(undefined);
    setIsExpenseFormOpen(false);
  };

  const handleUpdateExistingExpense = (expense: Expense) => {
    updateExpense(expense); // Assumes updateExpense in context handles receiptUrl if present
    setEditingExpense(undefined);
    setIsExpenseFormOpen(false);
  };

  const handleEditExpense = (expenseToEdit: Expense) => {
    setEditingExpense(expenseToEdit);
    setIsExpenseFormOpen(true);
  };

  const handleDataExtracted = useCallback((data: ProcessedExpenseData) => { 
    setEditingExpense({ 
      description: data.description,
      amount: data.amount,
      date: data.date,
      category: data.category,
      merchant: data.merchant,
      type: data.type,
      receiptUrl: data.receiptUrl // Capture receipt URL from AI processing step
    });
    setIsExpenseFormOpen(true); 
  }, []);

  const handleFormSubmissionDone = () => {
    setEditingExpense(undefined);
    setIsExpenseFormOpen(false);
  };

  const formTitle = editingExpense?.id ? "Edit Transaction" : "Add New Transaction";
  const formDescription = editingExpense?.id ? "Update the details of your transaction." : "Enter the details for a new transaction.";


  if (authLoading || (user && loadingExpenses)) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-4 text-muted-foreground">Loading transactions...</p>
        </div>
      </AppShell>
    );
  }

  if (!user && !authLoading) {
     return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <CardTitle className="text-xl mb-2">Access Denied</CardTitle>
            <CardDescription>Please log in to manage your transactions.</CardDescription>
            {/* Add a login button/link here if you have a login page */}
        </div>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">Manage Transactions</h1>
          <Button onClick={handleOpenFormForNew} className="w-full sm:w-auto" disabled={!user}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>

        <div className="w-full sm:max-w-xs">
          <Select value={activeView} onValueChange={setActiveView} disabled={!user}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">All Transactions</SelectItem>
              <SelectItem value="text-ai">AI: Text Input</SelectItem>
              <SelectItem value="receipt-ai">AI: Receipt Upload</SelectItem>
              <SelectItem value="camera-ai">AI: Scan with Camera</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 space-y-6">
          {activeView === "list" && (
            <ExpenseList 
              expenses={expenses} 
              onDeleteExpense={deleteExpense} 
              onEditExpense={handleEditExpense} 
            />
          )}

          {activeView === "text-ai" && (
            <Card>
              <CardHeader>
                <CardTitle>Categorize by Text</CardTitle>
                <CardDescription>
                  Type a description (e.g., &quot;Lunch at Cafe Mocha $12.50&quot; or &quot;Received salary $2000&quot;), and AI will parse it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TextCategorizationForm onDataExtracted={handleDataExtracted} />
              </CardContent>
            </Card>
          )}

          {activeView === "receipt-ai" && (
            <Card>
              <CardHeader>
                <CardTitle>Extract from Receipt/Document</CardTitle>
                <CardDescription>
                  Upload an image of your receipt or financial document, and AI handles the rest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReceiptUploadForm onDataExtracted={handleDataExtracted} />
              </CardContent>
            </Card>
          )}

          {activeView === "camera-ai" && (
            <Card>
              <CardHeader>
                <CardTitle>Scan with Camera</CardTitle>
                <CardDescription>
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
            onUpdateExpense={handleUpdateExistingExpense}
            initialData={editingExpense} 
            formId="responsive-expense-entry-form"
            onSubmissionDone={handleFormSubmissionDone}
          />
        </ResponsiveFormWrapper>
      </div>
    </AppShell>
  );
}
