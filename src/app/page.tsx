
"use client";

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpenses } from '@/contexts/ExpenseContext'; 
import { useState, useMemo } from 'react';
import type { Category } from '@/lib/types';


const chartConfigBase = {
  total: { 
    label: "Total Expenses",
    color: "hsl(var(--chart-1))", 
  },
};


export default function DashboardPage() {
  const { expenses } = useExpenses(); 
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') {
      return expenses;
    }
    return expenses.filter(e => e.category === selectedCategory);
  }, [expenses, selectedCategory]);

  const totalIncome = filteredExpenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = filteredExpenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const expenseByCategory = useMemo(() => {
    return expenses 
      .filter(e => e.type === 'expense')
      .reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [expenses]);

  const chartData = useMemo(() => {
    const source = selectedCategory === 'all' ? expenseByCategory : 
        { [selectedCategory]: filteredExpenses.filter(e=>e.type === 'expense').reduce((sum, e) => sum + e.amount, 0) };
    
    return Object.entries(source)
      .map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
      .filter(item => item.total > 0) 
      .sort((a, b) => b.total - a.total);
  }, [expenseByCategory, selectedCategory, filteredExpenses]);
  
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(expenses.filter(e => e.type === 'expense').map(e => e.category))).sort();
  }, [expenses]);

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-semibold text-foreground">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Breakdown</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Category | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
               <ChartContainer config={chartConfigBase} className="min-h-[250px] h-[300px] w-full">
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 10) + (value.length > 10 ? '...' : '')}
                  />
                  <YAxis />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground">No expense data for {selectedCategory === 'all' ? 'any category' : selectedCategory} in the current period.</p>
            )}
          </CardContent>
        </Card>
        
      </div>
    </AppShell>
  );
}
