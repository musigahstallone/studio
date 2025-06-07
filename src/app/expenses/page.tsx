
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { TextCategorizationForm } from '@/components/expenses/TextCategorizationForm';
import { ReceiptUploadForm } from '@/components/expenses/ReceiptUploadForm';
import { CameraReceiptScan } from '@/components/expenses/CameraReceiptScan'; // New import
import { ExpenseList } from '@/components/expenses/ExpenseList';
import type { Expense } from '@/lib/types';
import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProcessedExpenseData } from '@/actions/aiActions';
import { useExpenses } from '@/contexts/ExpenseContext';

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenses();
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("manual");

  const handleAddOrUpdateExpense = (expenseData: Omit<Expense, 'id'>) => {
    addExpense(expenseData);
    setEditingExpense(undefined); 
    setActiveTab("manual"); 
  };

  const handleUpdateExistingExpense = (expense: Expense) => {
    updateExpense(expense);
    setEditingExpense(undefined);
    setActiveTab("manual");
  };
  
  const handleEditExpense = (expenseToEdit: Expense) => {
    setEditingExpense(expenseToEdit);
    setActiveTab("manual"); 
    document.getElementById('manual-expense-form')?.scrollIntoView({ behavior: 'smooth' });
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
    setActiveTab("manual");
    setTimeout(() => {
        document.getElementById('manual-expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const handleFormSubmissionDone = () => {
    setEditingExpense(undefined);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-semibold text-foreground">Manage Transactions</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="text-ai">Text Input (AI)</TabsTrigger>
            <TabsTrigger value="receipt-ai">Receipt Upload (AI)</TabsTrigger>
            <TabsTrigger value="camera-ai">Scan with Camera (AI)</TabsTrigger> 
          </TabsList>
          
          <TabsContent value="manual">
            <Card id="manual-expense-form">
              <CardHeader>
                <CardTitle>{editingExpense?.id ? "Edit Transaction" : "Manual Transaction Entry"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseForm 
                    onAddExpense={handleAddOrUpdateExpense} 
                    onUpdateExpense={handleUpdateExistingExpense}
                    initialData={editingExpense} 
                    formId="manual-expense-entry-form"
                    onSubmissionDone={handleFormSubmissionDone}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="text-ai">
            <TextCategorizationForm onDataExtracted={handleDataExtracted} />
          </TabsContent>
          
          <TabsContent value="receipt-ai">
            <ReceiptUploadForm onDataExtracted={handleDataExtracted} />
          </TabsContent>

          <TabsContent value="camera-ai">
            <CameraReceiptScan onDataExtracted={handleDataExtracted} />
          </TabsContent>
        </Tabs>
        
        <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} onEditExpense={handleEditExpense} />
      </div>
    </AppShell>
  );
}
