
"use client";

import type { Expense } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
}

export function ExpenseList({ expenses, onDeleteExpense, onEditExpense }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No expenses or income recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="font-headline">Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {/* The Table component from shadcn/ui already handles overflow internally */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  {expense.type === 'income' ? 
                    <ArrowUpCircle className="h-5 w-5 text-green-500" /> : 
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />}
                </TableCell>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{expense.category}</Badge>
                </TableCell>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell>{expense.merchant || 'N/A'}</TableCell>
                <TableCell className={`text-right font-semibold ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {expense.type === 'income' ? '+' : '-'}${expense.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEditExpense(expense)} className="mr-2" aria-label="Edit">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteExpense(expense.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
