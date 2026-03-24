import { useMemo } from 'react';
import { Transaction, Budget } from '../types';
import { Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

interface SmartInsightsProps {
  transactions: Transaction[];
  budgets: Budget[];
  currencySymbol: string;
}

export default function SmartInsights({ transactions, budgets = [], currencySymbol }: SmartInsightsProps) {
  const insights = useMemo(() => {
    const expenses = transactions.filter(tx => tx.type === 'expense');
    
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const currentMonthExpenses = expenses.filter(e => isWithinInterval(e.date, { start: currentMonthStart, end: currentMonthEnd }));
    const lastMonthExpenses = expenses.filter(e => isWithinInterval(e.date, { start: lastMonthStart, end: lastMonthEnd }));

    const currentTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const result = [];

    // Budget Alerts
    budgets.forEach(budget => {
      const spent = currentMonthExpenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const percent = (spent / budget.amount) * 100;
      if (percent >= 100) {
        result.push({
          type: 'alert',
          title: `${budget.category} Budget Exceeded`,
          message: `You've spent ${currencySymbol}${spent.toLocaleString()} which is over your ${currencySymbol}${budget.amount.toLocaleString()} limit.`,
          icon: <AlertCircle className="text-red-400" size={20} />
        });
      } else if (percent >= (budget.alertThreshold || 80)) {
        result.push({
          type: 'warning',
          title: `${budget.category} Budget Warning`,
          message: `You've used ${Math.round(percent)}% of your ${budget.category} budget (Threshold: ${budget.alertThreshold || 80}%).`,
          icon: <AlertCircle className="text-amber-400" size={20} />
        });
      }
    });

    if (expenses.length === 0) return result.length > 0 ? result : [];

    // Spending Trend Insight
    if (lastTotal > 0) {
      const diff = ((currentTotal - lastTotal) / lastTotal) * 100;
      if (diff > 10) {
        result.push({
          type: 'alert',
          title: 'Spending Spike',
          message: `Your spending is up by ${Math.round(diff)}% compared to last month. Consider reviewing your recent purchases.`,
          icon: <AlertCircle className="text-red-400" size={20} />
        });
      } else if (diff < -10) {
        result.push({
          type: 'success',
          title: 'Great Progress!',
          message: `You've spent ${Math.round(Math.abs(diff))}% less than last month. Keep up the good work!`,
          icon: <CheckCircle2 className="text-emerald-400" size={20} />
        });
      }
    }

    // Category Insight
    const categoryTotals: Record<string, number> = {};
    currentMonthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && currentTotal > 0) {
      const percentage = (topCategory[1] / currentTotal) * 100;
      if (percentage > 40) {
        result.push({
          type: 'info',
          title: 'Category Concentration',
          message: `${topCategory[0]} accounts for ${Math.round(percentage)}% of your monthly spending. This is quite high for a single category.`,
          icon: <Info className="text-blue-400" size={20} />
        });
      }
    }

    // Weekend Spending
    const weekendSpending = currentMonthExpenses
      .filter(e => [0, 6].includes(e.date.getDay()))
      .reduce((sum, e) => sum + e.amount, 0);
    
    if (currentTotal > 0) {
      const weekendPercentage = (weekendSpending / currentTotal) * 100;
      if (weekendPercentage > 50) {
        result.push({
          type: 'info',
          title: 'Weekend Warrior',
          message: `Over half of your spending (${Math.round(weekendPercentage)}%) happens on weekends. Try setting a weekend budget.`,
          icon: <Sparkles className="text-amber-400" size={20} />
        });
      }
    }

    // Default insight if none generated
    if (result.length === 0) {
      result.push({
        type: 'info',
        title: 'Steady Habits',
        message: "Your spending habits look consistent. We'll notify you if we spot any unusual patterns.",
        icon: <Info className="text-zinc-500" size={20} />
      });
    }

    return result;
  }, [transactions, budgets, currencySymbol]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <Sparkles className="text-emerald-400" size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">AI Insights</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">Intelligent Pattern Recognition</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <div 
            key={idx}
            className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl flex gap-4 items-start relative overflow-hidden group transition-colors"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-zinc-50 dark:bg-white/5 blur-[30px] rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="mt-0.5 bg-zinc-50 dark:bg-white/5 p-3 rounded-xl border border-zinc-200 dark:border-white/5 relative z-10">{insight.icon}</div>
            <div className="space-y-2 relative z-10">
              <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{insight.title}</h4>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{insight.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-black rounded-[40px] p-10 text-zinc-900 dark:text-white relative overflow-hidden border border-zinc-200 dark:border-white/10 shadow-2xl transition-colors">
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest">
            Daily Wisdom
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-tight">The 50/30/20 Rule</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed font-medium">
            "Allocate 50% for needs, 30% for wants, and 20% for savings or debt repayment. This simple ratio is the foundation of long-term wealth."
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-15 -mb-15 blur-[60px]" />
      </div>
    </div>
  );
}
