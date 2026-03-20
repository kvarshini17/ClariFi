import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Transaction, Category, Budget, Goal } from '../types';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { TrendingUp, TrendingDown, Target, PieChart as PieChartIcon, Wallet, ArrowUpRight, ArrowDownRight, Plus, Brain } from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';
import FinancialPersonality from './FinancialPersonality';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  currencySymbol: string;
  userName?: string;
  onAddTransaction?: () => void;
}

const COLORS = {
  Food: '#10b981', // emerald-500
  Travel: '#3b82f6', // blue-500
  Bills: '#f59e0b', // amber-500
  Shopping: '#ec4899', // pink-500
  Health: '#ef4444', // red-500
  Entertainment: '#8b5cf6', // violet-500
  Others: '#6b7280', // gray-500
  Income: '#10b981', // emerald-500
};

export default function Dashboard({ 
  transactions, 
  budgets = [], 
  goals = [], 
  currencySymbol,
  userName,
  onAddTransaction
}: DashboardProps) {
  const { width } = useWindowSize();
  const isMobile = width < 640;
  const isSmall = width < 480;

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    let currentExpense = 0;
    let currentIncome = 0;
    let lastExpense = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach(tx => {
      const isCurrentMonth = isWithinInterval(tx.date, { start: currentMonthStart, end: currentMonthEnd });
      const isLastMonth = isWithinInterval(tx.date, { start: lastMonthStart, end: lastMonthEnd });

      if (isCurrentMonth) {
        if (tx.type === 'expense') {
          currentExpense += tx.amount;
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        } else {
          currentIncome += tx.amount;
        }
      }
      
      if (isLastMonth && tx.type === 'expense') {
        lastExpense += tx.amount;
      }
    });

    const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
    
    // Daily spending for last 30 days
    const dailyData: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = format(subMonths(now, 0).setDate(now.getDate() - i), 'MMM dd');
      dailyData[date] = 0;
    }

    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        const dateStr = format(tx.date, 'MMM dd');
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr] += tx.amount;
        }
      }
    });

    const barData = Object.entries(dailyData).map(([name, amount]) => ({ name, amount }));

    const budgetProgress = budgets.map(budget => {
      const spent = categoryTotals[budget.category] || 0;
      const percent = Math.min(100, (spent / budget.amount) * 100);
      return { ...budget, spent, percent };
    });

    // Financial Health Score
    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpense) / currentIncome) * 100 : 0;
    const score = Math.max(0, Math.min(100, 50 + savingsRate / 2));

    return {
      currentExpense,
      currentIncome,
      lastExpense,
      pieData,
      barData,
      budgetProgress,
      score: Math.round(score)
    };
  }, [transactions, budgets]);

  const percentChange = stats.lastExpense === 0 
    ? 0 
    : ((stats.currentExpense - stats.lastExpense) / stats.lastExpense) * 100;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Hi, {userName || 'Friend'}</h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Welcome back to your financial overview</p>
        </div>
        {onAddTransaction && (
          <button 
            onClick={onAddTransaction}
            className="w-full sm:w-auto px-6 py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
          >
            <Plus size={18} />
            New Entry
          </button>
        )}
      </div>

      {/* Financial Personality Section */}
      <div className="mb-4">
        <FinancialPersonality transactions={transactions} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/20 transition-colors" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">Total Balance</p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{currencySymbol}{(stats.currentIncome - stats.currentExpense).toLocaleString()}</h3>
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2 sm:mt-3 flex items-center gap-1">
            <Wallet size={10} /> Net Worth
          </p>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/20 transition-colors" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">Monthly Income</p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 tracking-tighter">{currencySymbol}{stats.currentIncome.toLocaleString()}</h3>
            <ArrowUpRight className="text-emerald-400 mb-1 sm:mb-1.5" size={14} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2 sm:mt-3">Total Received</p>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-red-500/20 transition-colors" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">Monthly Spending</p>
          <div className="flex items-end gap-2 relative z-10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{currencySymbol}{stats.currentExpense.toLocaleString()}</h3>
            <div className={`flex items-center gap-1 text-[8px] sm:text-[10px] font-black mb-1 sm:mb-1.5 px-1.5 sm:px-2 py-0.5 rounded-full ${percentChange > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {percentChange > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              {Math.abs(percentChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2 sm:mt-3">vs {currencySymbol}{stats.lastExpense.toLocaleString()} last month</p>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/20 transition-colors" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">Health Score</p>
          <div className="flex items-center gap-2 sm:gap-4 relative z-10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{stats.score}<span className="text-zinc-600 text-sm sm:text-lg">/100</span></h3>
            <div className="flex-1 bg-zinc-100 dark:bg-white/5 h-2 sm:h-3 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-white/5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                  stats.score > 70 ? 'bg-emerald-500' : stats.score > 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.score}%` }}
              />
            </div>
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2 sm:mt-3">AI-Powered Analysis</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        {stats.budgetProgress.length > 0 && (
          <div className="lg:col-span-2 bg-white dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl transition-colors">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Budget Tracking</h4>
              <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-white/10">
                <Target size={20} className="text-emerald-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.budgetProgress.map((budget, index) => (
                <div key={`${budget.id}-${index}`} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{budget.category}</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">{currencySymbol}{budget.spent.toLocaleString()} / {currencySymbol}{budget.amount.toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${budget.percent >= (budget.alertThreshold || 80) ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {Math.round(budget.percent)}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${budget.percent}%` }}
                      className={`h-full rounded-full ${budget.percent >= (budget.alertThreshold || 80) ? 'bg-red-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Expense Distribution</h4>
            <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-white/10">
              <PieChartIcon size={20} className="text-emerald-400" />
            </div>
          </div>
          <div className="h-48 sm:h-60 min-w-0 relative">
            {stats.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180} debounce={100}>
                <RePieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 65 : 85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as Category]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-xs italic">
                No expense data for this month
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
            {stats.pieData.map((entry, idx) => (
              <div key={`${entry.name}-${idx}`} className="flex items-center gap-2 bg-zinc-50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200 dark:border-white/5">
                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[entry.name as Category] }} />
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Spending Trend</h4>
            <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-white/10">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="h-48 sm:h-60 min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180} debounce={100}>
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#52525b', fontWeight: 'bold' }}
                  interval={isMobile ? 12 : 6}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fill: '#52525b', fontWeight: 'bold' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Goals Overview */}
      {goals.length > 0 && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Financial Goals</h4>
            <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-white/10">
              <Target size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.slice(0, 3).map((goal) => {
              const progress = goal.targetAmount > 0 
                ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) 
                : 0;
              return (
                <div key={goal.id} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{goal.title}</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">{currencySymbol}{goal.currentAmount.toLocaleString()} / {currencySymbol}{goal.targetAmount.toLocaleString()}</p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Back to Top - Mobile Only */}
      <div className="flex justify-center pt-8 pb-4 sm:hidden">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-white/10"
        >
          <ArrowUpRight size={14} className="-rotate-45" />
          Back to Top
        </button>
      </div>
    </div>
  );
}
