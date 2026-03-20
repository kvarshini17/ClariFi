import React, { useState } from 'react';
import { Goal } from '../types';
import { Plus, Target, Calendar, Trash2, ChevronRight, Sparkles, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface GoalTrackerProps {
  uid: string;
  goals: Goal[];
  currencySymbol: string;
  onAddClick: () => void;
}

export default function GoalTracker({ uid, goals, currencySymbol, onAddClick }: GoalTrackerProps) {
  const [contributeAmount, setContributeAmount] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (goal: Goal) => {
    try {
      const updatedGoals = goals.filter(g => g.id !== goal.id);
      await updateDoc(doc(db, 'users', uid), {
        goals: updatedGoals
      });
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleContribute = async (goal: Goal) => {
    const amountStr = contributeAmount[goal.id] || '';
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    setIsSubmitting(goal.id);
    try {
      const updatedGoals = goals.map(g => {
        if (g.id === goal.id) {
          return { ...g, currentAmount: g.currentAmount + amount };
        }
        return g;
      });

      await updateDoc(doc(db, 'users', uid), {
        goals: updatedGoals
      });

      setContributeAmount(prev => ({ ...prev, [goal.id]: '' }));
    } catch (error) {
      console.error("Error contributing to goal:", error);
    } finally {
      setIsSubmitting(null);
    }
  };

  // Filter out duplicates by ID just in case
  const uniqueGoals = Array.from(new Map(goals.map(goal => [goal.id, goal])).values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Financial Goals</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Turn your dreams into reality</p>
        </div>
        <button 
          onClick={onAddClick}
          className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {uniqueGoals.map((goal) => {
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const progress = goal.targetAmount > 0 
              ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) 
              : 0;
            
            const formatDate = (dateStr: string) => {
              try {
                const date = new Date(dateStr);
                return isNaN(date.getTime()) 
                  ? 'No date' 
                  : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
              } catch {
                return 'No date';
              }
            };

            const isConfirmingDelete = confirmDelete === goal.id;

            return (
              <motion.div 
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass-card p-6 rounded-[32px] group relative overflow-hidden transition-all duration-500 ${
                  isCompleted ? 'ring-2 ring-emerald-500/50' : ''
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 transition-colors ${
                  isCompleted ? 'bg-emerald-500/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'
                }`} />
                
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${
                      isCompleted 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                      <span className="text-2xl">{goal.icon || '🎯'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-zinc-900 dark:text-white text-lg">{goal.title}</h4>
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-emerald-500"
                          >
                            <CheckCircle2 size={16} />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {goal.category}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <button 
                          onClick={() => handleDelete(goal)}
                          className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(null)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDelete(goal.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Progress</p>
                      <p className="text-xl font-black text-zinc-900 dark:text-white">
                        {currencySymbol}{goal.currentAmount.toLocaleString()} 
                        <span className="text-zinc-400 text-sm font-medium ml-1">/ {currencySymbol}{goal.targetAmount.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${isCompleted ? 'text-emerald-500' : 'text-blue-500'}`}>
                        {Math.round(progress)}%
                      </p>
                    </div>
                  </div>

                  <div className="h-3 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={`h-full rounded-full shadow-lg ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/20' 
                          : 'bg-gradient-to-r from-blue-500 to-emerald-400 shadow-blue-500/20'
                      }`}
                    />
                  </div>

                  {!isCompleted && (
                    <div className="flex flex-col xs:flex-row gap-2 mt-4">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">{currencySymbol}</span>
                        <input 
                          type="number"
                          placeholder="Amount"
                          value={contributeAmount[goal.id] || ''}
                          onChange={(e) => setContributeAmount(prev => ({ ...prev, [goal.id]: e.target.value }))}
                          className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                        />
                      </div>
                      <button 
                        onClick={() => handleContribute(goal)}
                        disabled={isSubmitting === goal.id}
                        className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
                      >
                        {isSubmitting === goal.id ? '...' : 'Contribute'}
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-3"
                    >
                      <div className="bg-emerald-500 text-white p-1.5 rounded-lg">
                        <Sparkles size={14} />
                      </div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Goal Achieved! You're amazing.</p>
                    </motion.div>
                  )}

                  {goal.deadline && (
                    <div className="flex items-center gap-2 text-zinc-500 mt-2">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Target: {formatDate(goal.deadline)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {goals.length === 0 && (
          <div className="col-span-full py-16 text-center space-y-4 glass-card rounded-[40px] border-dashed">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="text-zinc-400" size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-zinc-900 dark:text-white font-black text-xl">No goals set yet</p>
              <p className="text-zinc-500 text-sm">Start tracking your financial milestones today.</p>
            </div>
            <button 
              onClick={onAddClick}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-sm hover:scale-105 transition-all"
            >
              Create My First Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
