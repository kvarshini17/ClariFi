import React, { useMemo } from 'react';
import { Transaction, FinancialPersonality as PersonalityType } from '../types';
import { Brain, TrendingUp, ShieldCheck, Zap, Scale, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface FinancialPersonalityProps {
  transactions: Transaction[];
}

export default function FinancialPersonality({ transactions }: FinancialPersonalityProps) {
  const personality = useMemo((): PersonalityType => {
    if (transactions.length === 0) {
      return {
        type: 'The Balanced',
        description: 'You are just starting your journey. Keep tracking to discover your financial DNA.',
        traits: ['Newcomer', 'Observant', 'Potential'],
        advice: 'Start by logging every small expense to get a clear picture.',
        score: 50
      };
    }

    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    const categories = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const shoppingRatio = (categories['Shopping'] || 0) / totalExpense;
    const entertainmentRatio = (categories['Entertainment'] || 0) / totalExpense;

    if (savingsRate > 30) {
      return {
        type: 'The Saver',
        description: 'You prioritize security and future growth. Your discipline is your greatest asset.',
        traits: ['Disciplined', 'Future-oriented', 'Secure'],
        advice: 'Consider investing some of your savings to beat inflation.',
        score: 85
      };
    }

    if (shoppingRatio > 0.4 || entertainmentRatio > 0.4) {
      return {
        type: 'The Impulse Buyer',
        description: 'You live in the moment! While life is for enjoying, your future self might need a hand.',
        traits: ['Spontaneous', 'Joy-seeker', 'Generous'],
        advice: 'Try the 24-hour rule: wait a day before any non-essential purchase.',
        score: 40
      };
    }

    if (totalExpense > totalIncome && totalIncome > 0) {
      return {
        type: 'The Spender',
        description: 'You are currently living beyond your means. It is time for some clarity.',
        traits: ['Bold', 'Extravagant', 'At-risk'],
        advice: 'Review your fixed costs and see where you can trim the fat.',
        score: 30
      };
    }

    return {
      type: 'The Strategist',
      description: 'You have a calculated approach to money. You know where every cent goes.',
      traits: ['Analytical', 'Calculated', 'Steady'],
      advice: 'Keep optimizing your budget categories for even better efficiency.',
      score: 75
    };
  }, [transactions]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'The Saver': return <ShieldCheck className="text-emerald-400" size={32} />;
      case 'The Spender': return <Zap className="text-amber-400" size={32} />;
      case 'The Strategist': return <TrendingUp className="text-blue-400" size={32} />;
      case 'The Impulse Buyer': return <Sparkles className="text-purple-400" size={32} />;
      default: return <Scale className="text-zinc-400" size={32} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-8 rounded-[40px] relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-emerald-500/10 transition-colors" />
      
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="relative">
          <div className="w-24 h-24 bg-zinc-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center border border-zinc-200 dark:border-white/10 shadow-inner">
            {getIcon(personality.type)}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-black px-2 py-1 rounded-lg">
            {personality.score}%
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Brain size={16} className="text-zinc-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Financial DNA</span>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{personality.type}</h3>
          </div>
          
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">
            {personality.description}
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {personality.traits.map(trait => (
              <span key={trait} className="px-3 py-1 bg-zinc-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider border border-zinc-200 dark:border-white/10">
                {trait}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full md:w-64 p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-500">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Expert Advice</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-emerald-100/70 font-medium leading-relaxed">
            "{personality.advice}"
          </p>
        </div>
      </div>
    </motion.div>
  );
}
