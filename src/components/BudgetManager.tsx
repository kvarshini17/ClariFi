import React, { useState } from 'react';
import { Budget, Category } from '../types';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Plus, Trash2, Target, PieChart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BudgetManagerProps {
  uid: string;
  budgets: Budget[];
  currencySymbol: string;
  onAddClick: () => void;
}

const CATEGORIES: Category[] = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Others'];

export default function BudgetManager({ uid, budgets, currencySymbol, onAddClick }: BudgetManagerProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (budget: Budget) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        budgets: arrayRemove(budget)
      });
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Filter out duplicates by ID just in case
  const uniqueBudgets = Array.from(new Map(budgets.map(b => [b.id, b])).values());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-[25px] font-black text-zinc-900 dark:text-white tracking-tight">Budget Planning</h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-[12px] font-bold uppercase tracking-widest">Set your financial boundaries</p>
        </div>
        <button 
          onClick={onAddClick}
          className="p-3 bg-emerald-500 text-zinc-950 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {uniqueBudgets.map((budget, index) => (
            <motion.div 
              key={`${budget.id}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-white/10">
                  <Target className="text-emerald-400" size={24} />
                </div>
                <div>
                  <h4 className="font-black text-zinc-900 dark:text-white font-arial">{budget.category}</h4>
                  <div className="flex flex-col">
                    <p className="text-[12px] font-black text-[#ceceda] uppercase tracking-widest">
                      {budget.period} • {currencySymbol}{budget.amount.toLocaleString()}
                    </p>
                    <p className="text-[12px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                      Alert at {budget.alertThreshold}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {confirmDelete === budget.id ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <button 
                      onClick={() => handleDelete(budget)}
                      className="px-2 py-1 bg-red-500 text-white text-[11px] font-black uppercase tracking-widest rounded-md"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(null)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDelete(budget.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {uniqueBudgets.length === 0 && (
          <div className="col-span-full py-12 text-center space-y-4 bg-zinc-100/50 dark:bg-white/5 rounded-[40px] border border-dashed border-zinc-300 dark:border-white/10">
            <PieChart className="mx-auto text-zinc-400" size={48} />
            <p className="text-zinc-500 font-medium">No budgets set yet. Start planning today!</p>
          </div>
        )}
      </div>
    </div>
  );
}
