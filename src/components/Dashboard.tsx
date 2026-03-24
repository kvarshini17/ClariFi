import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{t('dashboard.welcome')} {userName || 'Friend'}</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-[12px] font-bold uppercase tracking-widest">{t('dashboard.overview')}</p>
        </div>
        {onAddTransaction && (
          <button 
            onClick={onAddTransaction}
            style={{ height: '47.6px', width: '325.775px' }}
            className="w-full sm:w-auto px-6 py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
          >
            <Plus size={17} className="text-[#626268]" />
            {t('dashboard.newEntry')}
          </button>
        )}
      </div>

      {/* Financial Personality Section */}
      <div className="mb-4">
        <FinancialPersonality transactions={transactions} />
      </div>

      {/* Summary Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <div className="space-y-0.5">
            <h3 className="text-[22px] font-black text-zinc-900 dark:text-white tracking-tight">{t('dashboard.summary')}</h3>
            <p className="text-[12px] font-bold text-[#ceceda] uppercase tracking-widest">{t('dashboard.realtime')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/20 transition-colors" />
            <p className="text-[#ceceda] text-[13px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">{t('dashboard.totalBalance')}</p>
            <div className="flex items-end gap-2 relative z-10">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{currencySymbol}{(stats.currentIncome - stats.currentExpense).toLocaleString()}</h3>
            </div>
            <p className="text-[#ceceda] text-xs font-bold uppercase tracking-widest mt-2 sm:mt-3 flex items-center gap-1">
              <Wallet size={12} /> {t('dashboard.netWorth')}
            </p>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/20 transition-colors" />
            <p className="text-[#ceceda] text-[13px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">{t('dashboard.monthlyIncome')}</p>
            <div className="flex items-end gap-2 relative z-10">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 tracking-tighter">{currencySymbol}{stats.currentIncome.toLocaleString()}</h3>
              <ArrowUpRight className="text-emerald-400 mb-1 sm:mb-1.5" size={16} />
            </div>
            <p className="text-[#ceceda] text-[12px] font-bold uppercase tracking-widest mt-2 sm:mt-3">{t('dashboard.totalReceived')}</p>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-red-500/20 transition-colors" />
            <p className="text-[#ceceda] text-[13px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">{t('dashboard.monthlySpending')}</p>
            <div className="flex items-end gap-2 relative z-10">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{currencySymbol}{stats.currentExpense.toLocaleString()}</h3>
              <div className={`flex items-center gap-1 text-[11px] sm:text-xs font-black mb-1 sm:mb-1.5 px-1.5 sm:px-2 py-0.5 rounded-full ${percentChange > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {percentChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(percentChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-[#ceceda] text-[12px] font-bold uppercase tracking-widest mt-2 sm:mt-3">{t('dashboard.vsLastMonth', { amount: `${currencySymbol}${stats.lastExpense.toLocaleString()}` })}</p>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/20 transition-colors" />
            <p className="text-[#ceceda] text-[12px] font-black uppercase tracking-[0.2em] mb-2 sm:mb-3">{t('dashboard.healthScore')}</p>
            <div className="flex items-center gap-2 sm:gap-4 relative z-10">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{stats.score}<span className="text-[#ddddeb] text-[17px]">/100</span></h3>
              <div className="flex-1 bg-zinc-100 dark:bg-white/5 h-2 sm:h-3 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                    stats.score > 70 ? 'bg-emerald-500' : stats.score > 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stats.score}%` }}
                />
              </div>
            </div>
            <p className="text-[#ceceda] text-[12px] font-bold uppercase tracking-widest mt-2 sm:mt-3">{t('dashboard.aiAnalysis')}</p>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-1.5 h-8 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
          <div className="space-y-0.5">
            <h3 className="text-[23px] font-black text-zinc-900 dark:text-white tracking-tight">{t('dashboard.analytics')}</h3>
            <p className="text-[12px] font-bold text-[#ceceda] uppercase tracking-widest">{t('dashboard.trends')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Progress */}
          {stats.budgetProgress.length > 0 && (
            <div className="lg:col-span-2 bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl transition-all hover:shadow-emerald-500/5 group/budget overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{t('dashboard.budgetTracking')}</h4>
                  <p className="text-[11px] font-bold text-[#ceceda] uppercase tracking-widest">{t('dashboard.monthlyAllocation')}</p>
                </div>
                <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-white/10 group-hover/budget:border-emerald-500/30 transition-colors">
                  <Target size={20} className="text-emerald-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.budgetProgress.map((budget, index) => (
                  <div key={`${budget.id}-${index}`} className="space-y-3 p-4 rounded-2xl bg-zinc-50/50 dark:bg-white/2 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[13px] font-black text-[#ceceda] uppercase tracking-widest">{budget.category}</p>
                        <p className="text-xs font-black text-zinc-900 dark:text-white">{currencySymbol}{budget.spent.toLocaleString()} <span className="text-zinc-500 dark:text-zinc-400 text-xs font-bold">/ {currencySymbol}{budget.amount.toLocaleString()}</span></p>
                      </div>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${budget.percent >= (budget.alertThreshold || 80) ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {Math.round(budget.percent)}%
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${budget.percent}%` }}
                        className={`h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)] ${budget.percent >= (budget.alertThreshold || 80) ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl transition-colors overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{t('dashboard.expenseDistribution')}</h4>
              <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-white/10">
                <PieChartIcon size={20} className="text-emerald-400" />
              </div>
            </div>
            <div className="h-40 sm:h-52 min-w-0 relative group/chart">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-full blur-3xl opacity-0 group-hover/chart:opacity-100 transition-opacity duration-700" />
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
                        <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || COLORS.Others} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                      itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest text-sm italic">
                  No expense data for this month
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {stats.pieData.map((entry, idx) => (
                <div key={`${entry.name}-${idx}`} className="flex items-center gap-2 bg-zinc-50 dark:bg-white/5 p-2 rounded-lg border border-zinc-200 dark:border-white/5 h-[36.6px] w-full sm:w-[156.2px] text-left text-[11px]">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: (COLORS as any)[entry.name] || COLORS.Others }} />
                  <span className="text-[10px] text-[#ceceda] font-black uppercase tracking-widest text-left">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl transition-colors overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{t('dashboard.spendingTrend')}</h4>
              <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-white/10">
                <TrendingUp size={20} className="text-blue-400" />
              </div>
            </div>
            <div className="h-40 sm:h-52 min-w-0 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180} debounce={100}>
                <BarChart data={stats.barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#71717a', fontWeight: 'bold' }}
                    interval={isMobile ? 12 : 6}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#71717a', fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                    itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Overview Section */}
      {goals.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('dashboard.financialGoals')}</h3>
              <p className="text-[12px] font-bold text-[#ceceda] uppercase tracking-widest">{t('dashboard.longTermProgress')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.slice(0, 3).map((goal) => {
              const progress = goal.targetAmount > 0 
                ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) 
                : 0;
              return (
                <div key={goal.id} className="bg-white dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl transition-all hover:shadow-blue-500/5 group/goal overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-blue-500/10 transition-colors" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-[#ceceda] uppercase tracking-widest">{goal.title}</p>
                        <p className="text-xl font-black text-zinc-900 dark:text-white">
                          {currencySymbol}{goal.currentAmount.toLocaleString()} 
                          <span className="text-zinc-500 dark:text-zinc-400 text-sm font-bold ml-1">/ {currencySymbol}{goal.targetAmount.toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="bg-blue-500/10 text-blue-400 p-2 rounded-xl border border-blue-500/20">
                        <Target size={18} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-black text-[#ceceda] uppercase tracking-widest">
                        <span className="text-[12px]">{t('dashboard.progress')}</span>
                        <span className="text-blue-400">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                        />
                      </div>
                    </div>
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
          className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-white/5 rounded-full text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-white/10"
        >
          <ArrowUpRight size={17} className="-rotate-45 text-[#0e0e0f]" />
          {t('app.back_to_top')}
        </button>
      </div>
    </div>
  );
}
