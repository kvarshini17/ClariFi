import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createNotification } from '../services/notificationService';
import { Category, TransactionType, Budget } from '../types';
import { X, DollarSign, Calendar, Tag, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionFormProps {
  onClose: () => void;
  uid: string;
  currencySymbol: string;
  budgets?: Budget[];
  transactions?: any[];
  initialData?: { amount: number; category: string; note: string } | null;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const EXPENSE_CATEGORIES: Category[] = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Others'];
const INCOME_CATEGORIES: Category[] = ['Income'];

export default function TransactionForm({ onClose, uid, currencySymbol, budgets = [], transactions = [], initialData }: TransactionFormProps) {
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<Category>((initialData?.category as Category) || 'Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(initialData?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const path = 'expenses';
    try {
      await addDoc(collection(db, path), {
        uid,
        amount: numAmount,
        category: type === 'income' ? 'Income' : category,
        type,
        date: (() => {
          try {
            const d = new Date(date);
            return isNaN(d.getTime()) ? new Date() : d;
          } catch {
            return new Date();
          }
        })(),
        note: note.trim(),
        createdAt: serverTimestamp()
      });

      // Budget Check
      if (type === 'expense') {
        const budget = budgets.find(b => b.category === category);
        if (budget) {
          const spent = transactions
            .filter(tx => tx.type === 'expense' && tx.category === category)
            .reduce((sum, tx) => sum + tx.amount, 0) + numAmount;
          
          if (spent >= budget.amount) {
            await createNotification({
              uid,
              title: `${category} Budget Exceeded!`,
              message: `You've spent ${currencySymbol}${spent.toLocaleString()} which is over your ${currencySymbol}${budget.amount.toLocaleString()} limit.`,
              type: 'warning'
            });
          } else if (spent >= budget.amount * 0.8) {
            await createNotification({
              uid,
              title: `${category} Budget Alert`,
              message: `You've used 80% of your ${category} budget.`,
              type: 'info'
            });
          }
        }
      }

      onClose();
    } catch (err) {
      console.error("Error adding transaction:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (finalErr: any) {
        setError(finalErr.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 bg-white dark:bg-zinc-950 transition-colors">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">New Entry</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Record your {type}</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium break-all">
          <p className="font-black uppercase tracking-widest mb-1">Error</p>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Toggle */}
        <div className="flex bg-zinc-50 dark:bg-white/5 p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('Food');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              type === 'expense' 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownRight size={14} />
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('Income');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              type === 'income' 
                ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' 
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight size={14} />
            Income
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
            Amount ({currencySymbol})
          </label>
          <div className="relative">
            <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black ${type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
              {currencySymbol}
            </span>
            <input 
              type="number" 
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              placeholder="0.00"
              className={`w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-5 pl-12 pr-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:ring-2 outline-none transition-all text-3xl font-black tracking-tighter ${
                type === 'expense' ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
              }`}
            />
          </div>
        </div>

        {type === 'expense' && (
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                    category === cat 
                      ? 'bg-red-500/20 border-red-500 text-red-400' 
                      : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              Date
            </label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 px-5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-sm"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              Note
            </label>
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional..."
              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 px-5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-sm"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className={`w-full group relative px-8 py-4 rounded-2xl font-black text-lg transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 overflow-hidden shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
            type === 'expense' 
              ? 'bg-red-500 text-white shadow-red-500/20' 
              : 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20'
          }`}
        >
          {isSubmitting ? 'Processing...' : `Confirm ${type === 'expense' ? 'Expense' : 'Income'}`}
        </button>
      </form>
    </div>
  );
}
