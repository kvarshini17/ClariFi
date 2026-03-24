import React, { useState } from 'react';
import { Category, Budget } from '../types';
import { Plus, X } from 'lucide-react';
import { motion } from 'motion/react';

interface BudgetFormProps {
  onClose: () => void;
  onAdd: (budget: Omit<Budget, 'id' | 'uid' | 'createdAt'>) => void;
  currencySymbol: string;
  customCategories?: string[];
}

const DEFAULT_CATEGORIES: Category[] = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Others'];

export default function BudgetForm({ onClose, onAdd, currencySymbol, customCategories = [] }: BudgetFormProps) {
  const categories = [...DEFAULT_CATEGORIES.slice(0, -1), ...customCategories, 'Others'];
  
  const [newBudget, setNewBudget] = useState<{ category: Category; amount: number; period: 'monthly' | 'weekly'; alertThreshold: number }>({
    category: 'Food',
    amount: 0,
    period: 'monthly',
    alertThreshold: 80
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBudget.amount <= 0) return;
    onAdd(newBudget);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">New Budget</h3>
          <p className="text-[#ceceda] text-[11px] font-bold uppercase tracking-widest">Define your limit</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#ceceda] uppercase tracking-widest ml-1">Category</label>
          <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setNewBudget({ ...newBudget, category: cat })}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                  cat === 'Entertainment' ? 'col-span-2' : ''
                } ${
                  newBudget.category === cat 
                    ? 'bg-emerald-500 border-emerald-500 text-zinc-950' 
                    : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#ceceda] uppercase tracking-widest ml-1">Amount ({currencySymbol})</label>
          <input 
            type="number"
            value={newBudget.amount || ''}
            onChange={(e) => setNewBudget({ ...newBudget, amount: Number(e.target.value) })}
            className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-black text-xl"
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#ceceda] uppercase tracking-widest ml-1">Alert Threshold ({newBudget.alertThreshold}%)</label>
          <input 
            type="range"
            min="10"
            max="100"
            step="5"
            value={newBudget.alertThreshold}
            onChange={(e) => setNewBudget({ ...newBudget, alertThreshold: Number(e.target.value) })}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-sm font-bold text-[#ceceda]">
            <span>10%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNewBudget({ ...newBudget, period: 'monthly' })}
            className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all ${
              newBudget.period === 'monthly' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950' : 'bg-zinc-50 dark:bg-white/5 text-zinc-500'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setNewBudget({ ...newBudget, period: 'weekly' })}
            className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all ${
              newBudget.period === 'weekly' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950' : 'bg-zinc-50 dark:bg-white/5 text-zinc-500'
            }`}
          >
            Weekly
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 text-zinc-500 font-bold text-sm"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex-[2] py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Create Budget
          </button>
        </div>
      </form>
    </div>
  );
}
