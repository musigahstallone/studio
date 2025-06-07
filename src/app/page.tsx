import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Expense } from '@/lib/types';

// Mock data for demonstration
const mockExpenses: Expense[] = [
  { id: '1', description: 'Groceries', amount: 75.50, date: '2024-07-15', category: 'Groceries', type: 'expense', merchant: 'SuperMart' },
  { id: '2', description: 'Salary July', amount: 3000, date: '2024-07-01', category: 'Salary', type: 'income' },
  { id: '3', description: 'Dinner with friends', amount: 45.00, date: '2024-07-10', category: 'Food & Drink', type: 'expense', merchant: 'The Italian Place' },
  { id: '4', description: 'Gasoline', amount: 50.00, date: '2024-07-05', category: 'Transportation', type: 'expense', merchant: 'Gas Station' },
  { id: '5', description: 'Movie tickets', amount: 25.00, date: '2024-07-12', category: 'Entertainment', type: 'expense', merchant: 'Cineplex' },
  { id: '6', description: 'Freelance Project', amount: 500, date: '2024-07-20', category: 'Salary', type: 'income' },
];

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
  },
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
};

export default function DashboardPage() {
  const totalIncome = mockExpenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = mockExpenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const expenseByCategory = mockExpenses
    .filter(e => e.type === 'expense')
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expenseByCategory)
    .map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);

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
              <p className="text-xs text-muted-foreground">July 2024</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">July 2024</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">July 2024</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Breakdown</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.keys(expenseByCategory).map(cat => (
                    <SelectItem key={cat} value={cat.toLowerCase().replace(' ', '-')}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
               <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                  <Bar dataKey="total" fill="var(--color-expenses)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground">No expense data available for chart.</p>
            )}
          </CardContent>
        </Card>
        
        {/* TODO: Add Recent Transactions Table */}
      </div>
    </AppShell>
  );
}
