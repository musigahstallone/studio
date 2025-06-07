
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { TextCategorizationForm } from '@/components/expenses/TextCategorizationForm';
import { ReceiptUploadForm } from '@/components/expenses/ReceiptUploadForm';
import { CameraReceiptScan } from '@/components/expenses/CameraReceiptScan';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import type { Expense } from '@/lib/types';
import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ProcessedExpenseData } from '@/actions/aiActions';
import { useExpenses } from '@/contexts/ExpenseContext';
import { ResponsiveFormWrapper } from '@/components/shared/ResponsiveFormWrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ExpensesPage() {
  const { expenses, addExpense, deleteExpense, updateExpense } = useExpenses();
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("list"); // Default to list view
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-semibold text-foreground">Manage Transactions</h1>
          <Button onClick={handleOpenFormForNew} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-6">
            <TabsTrigger value="list">All Transactions</TabsTrigger>
            <TabsTrigger value="text-ai">Text Input (AI)</TabsTrigger>
            <TabsTrigger value="receipt-ai">Receipt Upload (AI)</TabsTrigger>
            <TabsTrigger value="camera-ai">Scan with Camera (AI)</TabsTrigger> 
          </TabsList>
          
          <TabsContent value="list">
            <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} onEditExpense={handleEditExpense} />
          </TabsContent>
          
          <TabsContent value="text-ai">
            <Card>
              <CardHeader>
                <CardTitle>Categorize by Text</CardTitle>
                <CardDescription>
                  Enter a free-form description (e.g., &quot;Lunch at Cafe Mocha - $12.50&quot;) and let AI extract the details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TextCategorizationForm onDataExtracted={handleDataExtracted} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="receipt-ai">
            <Card>
              <CardHeader>
                <CardTitle>Extract from Receipt</CardTitle>
                <CardDescription>
                  Upload an image of your receipt, and AI will attempt to extract the details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReceiptUploadForm onDataExtracted={handleDataExtracted} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camera-ai">
            <Card>
              <CardHeader>
                <CardTitle>Scan Receipt with Camera</CardTitle>
                <CardDescription>
                  Point your camera at a receipt and capture it. AI will attempt to extract the details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CameraReceiptScan onDataExtracted={handleDataExtracted} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
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
