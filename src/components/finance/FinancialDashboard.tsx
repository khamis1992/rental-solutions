import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FinancialMetricsCard } from "./charts/FinancialMetricsCard";
import { RevenueChart } from "./charts/RevenueChart";
import { ExpenseBreakdownChart } from "./charts/ExpenseBreakdownChart";
import { ProfitLossChart } from "./charts/ProfitLossChart";
import { BudgetTrackingSection } from "./budget/BudgetTrackingSection";
import { Loader2 } from "lucide-react";
import { TransactionType } from "./accounting/types/transaction.types";

interface Category {
  id: string;
  name: string;
  type: string;
  budget_limit: number | null;
  budget_period: string | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  transaction_date: string;
}

export const FinancialDashboard = () => {
  const { data: financialData, isLoading } = useQuery({
    queryKey: ["financial-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_transactions")
        .select(`
          *,
          category:accounting_categories(*)
        `)
        .order("transaction_date", { ascending: true });

      if (error) throw error;
      return data as Transaction[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Process data for different visualizations
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthTransactions = financialData?.filter(transaction => {
    const transactionDate = new Date(transaction.transaction_date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  const previousMonthTransactions = financialData?.filter(transaction => {
    const transactionDate = new Date(transaction.transaction_date);
    return transactionDate.getMonth() === (currentMonth - 1) && 
           transactionDate.getFullYear() === currentYear;
  });

  const currentMonthRevenue = currentMonthTransactions?.reduce(
    (sum, transaction) => transaction.type === TransactionType.INCOME ? sum + transaction.amount : sum, 
    0
  ) || 0;

  const previousMonthRevenue = previousMonthTransactions?.reduce(
    (sum, transaction) => transaction.type === TransactionType.INCOME ? sum + transaction.amount : sum, 
    0
  ) || 0;

  const currentMonthExpenses = currentMonthTransactions?.reduce(
    (sum, transaction) => transaction.type === TransactionType.EXPENSE ? sum + transaction.amount : sum, 
    0
  ) || 0;

  const previousMonthExpenses = previousMonthTransactions?.reduce(
    (sum, transaction) => transaction.type === TransactionType.EXPENSE ? sum + transaction.amount : sum, 
    0
  ) || 0;

  const percentageChangeRevenue = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
  const percentageChangeExpenses = ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;

  const revenueData = financialData
    ?.filter(t => t.type === TransactionType.INCOME)
    ?.reduce((acc, transaction) => {
      const date = transaction.transaction_date.split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.revenue += transaction.amount;
      } else {
        acc.push({ date, revenue: transaction.amount });
      }
      return acc;
    }, [] as { date: string; revenue: number }[]) || [];

  const expenseData = financialData
    ?.filter(t => t.type === TransactionType.EXPENSE)
    ?.reduce((acc, transaction) => {
      const category = transaction.category?.name || 'Uncategorized';
      const existing = acc.find(item => item.category === category);
      if (existing) {
        existing.amount += transaction.amount;
      } else {
        acc.push({ category, amount: transaction.amount });
      }
      return acc;
    }, [] as { category: string; amount: number }[]) || [];

  const profitLossData = financialData?.reduce((acc, transaction) => {
    const date = new Date(transaction.transaction_date);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const existing = acc.find(item => item.period === period);
    if (existing) {
      if (transaction.type === TransactionType.INCOME) {
        existing.revenue += transaction.amount;
      } else {
        existing.expenses += transaction.amount;
      }
      existing.profit = existing.revenue - existing.expenses;
    } else {
      acc.push({
        period,
        revenue: transaction.type === TransactionType.INCOME ? transaction.amount : 0,
        expenses: transaction.type === TransactionType.EXPENSE ? transaction.amount : 0,
        profit: transaction.type === TransactionType.INCOME ? transaction.amount : -transaction.amount
      });
    }
    return acc;
  }, [] as { period: string; revenue: number; expenses: number; profit: number }[]) || [];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <FinancialMetricsCard
          title="Monthly Revenue"
          value={currentMonthRevenue}
          previousValue={previousMonthRevenue}
          percentageChange={percentageChangeRevenue}
        />
        <FinancialMetricsCard
          title="Monthly Expenses"
          value={currentMonthExpenses}
          previousValue={previousMonthExpenses}
          percentageChange={percentageChangeExpenses}
        />
        <FinancialMetricsCard
          title="Net Profit"
          value={currentMonthRevenue - currentMonthExpenses}
          previousValue={previousMonthRevenue - previousMonthExpenses}
          percentageChange={
            ((currentMonthRevenue - currentMonthExpenses) - (previousMonthRevenue - previousMonthExpenses)) / 
            Math.abs(previousMonthRevenue - previousMonthExpenses) * 100
          }
        />
      </div>

      <BudgetTrackingSection 
        transactions={financialData || []}
        categories={Array.from(new Set(financialData?.map(t => t.category)
          .filter(Boolean))) as Category[]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart data={revenueData} />
        <ExpenseBreakdownChart data={expenseData} />
      </div>

      <ProfitLossChart data={profitLossData} />
    </div>
  );
};