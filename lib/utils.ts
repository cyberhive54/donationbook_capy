import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Collection, Expense, Stats, Transaction } from '@/types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string): string => {
  try {
    return format(new Date(date), 'dd MMM yyyy');
  } catch (error) {
    return date;
  }
};

export const calculateStats = (
  collections: Collection[],
  expenses: Expense[]
): Stats => {
  const totalCollection = collections.reduce((sum, c) => sum + Number(c.amount), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
  const numDonators = new Set(collections.map(c => c.name)).size;
  const balance = totalCollection - totalExpense;
  
  return { totalCollection, totalExpense, numDonators, balance };
};

export const combineTransactions = (
  collections: Collection[],
  expenses: Expense[]
): Transaction[] => {
  const collectionTxns: Transaction[] = collections.map(c => ({
    id: c.id,
    type: 'collection' as const,
    name: c.name,
    amount: c.amount,
    group_category: c.group_name,
    mode: c.mode,
    note: c.note,
    date: c.date,
    created_at: c.created_at,
  }));
  
  const expenseTxns: Transaction[] = expenses.map(e => ({
    id: e.id,
    type: 'expense' as const,
    name: e.item,
    amount: e.total_amount,
    group_category: e.category,
    mode: e.mode,
    note: e.note,
    date: e.date,
    created_at: e.created_at,
  }));
  
  return [...collectionTxns, ...expenseTxns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const filterByTimeRange = <T extends { date: string }>(
  data: T[],
  range: 'all' | '7days' | '14days' | '1month'
): T[] => {
  if (range === 'all') return data;
  
  const now = new Date();
  const cutoff = new Date();
  
  switch (range) {
    case '7days':
      cutoff.setDate(now.getDate() - 7);
      break;
    case '14days':
      cutoff.setDate(now.getDate() - 14);
      break;
    case '1month':
      cutoff.setMonth(now.getMonth() - 1);
      break;
  }
  
  return data.filter(item => new Date(item.date) >= cutoff);
};

export const groupByDate = <T extends { date: string; amount?: number; total_amount?: number }>(
  data: T[],
  days: number = 30
): { date: string; amount: number }[] => {
  const result: { [key: string]: number } = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = format(date, 'yyyy-MM-dd');
    result[key] = 0;
  }
  data.forEach(item => {
    const key = format(new Date(item.date), 'yyyy-MM-dd');
    if (key in result) {
      const amount = 'amount' in item ? Number(item.amount) : Number(item.total_amount);
      result[key] += amount;
    }
  });
  return Object.entries(result).map(([key, amount]) => ({
    date: format(new Date(key), 'dd MMM'),
    amount,
  }));
};

export const groupByDateBetween = <T extends { date: string; amount?: number; total_amount?: number }>(
  data: T[],
  startDate?: string | null,
  endDate?: string | null
): { date: string; amount: number }[] => {
  if (!startDate || !endDate) return groupByDate(data, 30);
  const start = startOfMonth(new Date(startDate));
  const end = endOfMonth(new Date(endDate));
  const days = eachDayOfInterval({ start, end });
  const result: Record<string, number> = {};
  days.forEach(d => { result[format(d, 'yyyy-MM-dd')] = 0; });
  data.forEach(item => {
    const key = format(new Date(item.date), 'yyyy-MM-dd');
    if (key in result) {
      const amount = 'amount' in item ? Number(item.amount) : Number(item.total_amount);
      result[key] += amount;
    }
  });
  return Object.entries(result).map(([key, amount]) => ({
    date: format(new Date(key), 'dd MMM'),
    amount,
  }));
};

export const groupBy = <T extends Record<string, any>>(
  data: T[],
  key: keyof T
): { [key: string]: T[] } => {
  return data.reduce((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as { [key: string]: T[] });
};
