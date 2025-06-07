"use client";

import { AppShell } from '@/components/layout/AppShell';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { TextCategorizationForm } from '@/components/expenses/TextCategorizationForm';
import { ReceiptUploadForm } from '@/components/expenses/ReceiptUploadForm';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import type { Expense } from '@/lib/types';
import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProcessedExpenseData } from '@/actions/aiActions';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock initial data
const initialExpenses: Expense[] = [
  { id: '1', type: 'expense', description: 'Coffee Meeting', amount: 12.50, date: '2024-07-15', category: 'Food & Drink', merchant: 'Cafe Mocha' },
  { id: '2', type: 'income', description: 'July Salary', amount: 2500, date: '2024-07-01', category: 'Salary' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [editingExpense, setEditingExpense] = useState<ProcessedExpenseData & { type: "expense" | "income"} | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("manual"); // To switch focus to manual form after AI extraction

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    setEditingExpense(undefined); // Clear any pre-filled data
    setActiveTab("manual"); // Switch to manual tab or ensure it's visible
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };
  
  const handleEditExpense = (expenseToEdit: Expense) => {
    // For now, this will pre-fill the form for re-adding. True edit would update existing.
    setEditingExpense({
      description: expenseToEdit.description,
      amount: expenseToEdit.amount,
      date: expenseToEdit.date,
      category: expenseToEdit.category,
      merchant: expenseToEdit.merchant,
      type: expenseToEdit.type,
    });
    setActiveTab("manual"); // Switch to manual form
    // Scroll to form or ensure it's visible
    document.getElementById('manual-expense-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDataExtracted = useCallback((data: ProcessedExpenseData & { type: "expense" | "income" }) => {
    setEditingExpense(data);
    setActiveTab("manual");
    // Ensure the manual form is visible and scrolled into view
    setTimeout(() => {
        document.getElementById('manual-expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-semibold text-foreground">Manage Transactions</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="text-ai">Text Input (AI)</TabsTrigger>
            <TabsTrigger value="receipt-ai">Receipt Scan (AI)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <Card id="manual-expense-form">
              <CardHeader>
                <CardTitle>Manual Transaction Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseForm onAddExpense={addExpense} initialData={editingExpense} formId="manual-expense-entry-form"/>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="text-ai">
            <TextCategorizationForm onDataExtracted={handleDataExtracted} />
          </TabsContent>
          
          <TabsContent value="receipt-ai">
            <ReceiptUploadForm onDataExtracted={handleDataExtracted} />
          </TabsContent>
        </Tabs>
        
        <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} onEditExpense={handleEditExpense} />
      </div>
    </AppShell>
  );
}
