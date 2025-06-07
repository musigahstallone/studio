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
import { PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenses();
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | undefined>(undefined);
  const [activeView, setActiveView] = useState("list");
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);

  const handleOpenFormForNew = () => {
    setEditingExpense(undefined);
    setIsExpenseFormOpen(true);
  };

  const handleAddOrUpdateExpense = (expenseData: Omit<Expense, 'id'>) => {
    addExpense(expenseData);
    setEditingExpense(undefined);
    setIsExpenseFormOpen(false);
  };

  const handleUpdateExistingExpense = (expense: Expense) => {
    updateExpense(expense);
    setEditingExpense(undefined);
    setIsExpenseFormOpen(false);
  };

  const handleEditExpense = (expenseToEdit: Expense) => {
    setEditingExpense(expenseToEdit);
    setIsExpenseFormOpen(true);
  };

  const handleDataExtracted = useCallback((data: ProcessedExpenseData & { type: "expense" | "income" }) => {
    setEditingExpense({ 
      description: data.description,
      amount: data.amount,
      date: data.date,
      category: data.category,
      merchant: data.merchant,
      type: data.type
    });
    setIsExpenseFormOpen(true);
  }, []);

  const handleFormSubmissionDone = () => {
    setEditingExpense(undefined);
    setIsExpenseFormOpen(false);
  };

  const formTitle = editingExpense?.id ? "Edit Transaction" : "Add New Transaction";
  const formDescription = editingExpense?.id ? "Update the details of your transaction." : "Enter the details for a new transaction.";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">Manage Transactions</h1>
          <Button onClick={handleOpenFormForNew} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>

        <div className="w-full sm:max-w-sm">
          <Select value={activeView} onValueChange={setActiveView}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">All Transactions</SelectItem>
              <SelectItem value="text-ai">Text Input (AI)</SelectItem>
              <SelectItem value="receipt-ai">Receipt Upload (AI)</SelectItem>
              <SelectItem value="camera-ai">Scan with Camera (AI)</SelectItem>
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
                  Enter a description like &quot;Lunch at Cafe Mocha - $12.50&quot;, and AI will extract it.
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
                <CardTitle>Extract from Receipt</CardTitle>
                <CardDescription>
                  Upload your receipt image and let AI handle the rest.
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
                <CardTitle>Scan Receipt with Camera</CardTitle>
                <CardDescription>
                  Point and scan — AI will extract data.
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
