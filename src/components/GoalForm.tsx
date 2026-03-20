import React, { useState } from 'react';
import { Goal } from '../types';
import { X, Target, DollarSign, Calendar, Tag, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface GoalFormProps {
  onClose: () => void;
  onAdd: (goal: Omit<Goal, 'id' | 'uid' | 'createdAt' | 'currentAmount'>) => void;
  currencySymbol: string;
}

export default function GoalForm({ onClose, onAdd, currencySymbol }: GoalFormProps) {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('Savings');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(targetAmount);
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAdd({
      title,
      targetAmount: parsedAmount,
      category,
      deadline: deadline || undefined,
      icon
    });
  };

  const icons = ['🎯', '🏠', '🚗', '✈️', '🎓', '💍', '💻', '🏖️', '💰'];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Set a New Goal</h3>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Define your financial target</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">What are you saving for?</label>
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New MacBook Pro"
                className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Target Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">{currencySymbol}</span>
                <input 
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-10 pr-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Deadline (Optional)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Category</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
              >
                <option value="Savings">Savings</option>
                <option value="Investment">Investment</option>
                <option value="Purchase">Major Purchase</option>
                <option value="Travel">Travel</option>
                <option value="Emergency">Emergency Fund</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Choose an Icon</label>
            <div className="flex flex-wrap gap-2">
              {icons.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                    icon === i 
                      ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/20' 
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <Sparkles size={20} />
          Create Goal
        </button>
      </form>
    </div>
  );
}
