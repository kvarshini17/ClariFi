import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { format } from 'date-fns';
import { 
  Utensils, 
  Plane, 
  Receipt, 
  ShoppingBag, 
  HeartPulse, 
  Gamepad2, 
  MoreHorizontal,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useWindowSize } from '../hooks/useWindowSize';

interface TransactionListProps {
  transactions: Transaction[];
  currencySymbol: string;
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

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Food: <Utensils size={16} />,
  Travel: <Plane size={16} />,
  Bills: <Receipt size={16} />,
  Shopping: <ShoppingBag size={16} />,
  Health: <HeartPulse size={16} />,
  Entertainment: <Gamepad2 size={16} />,
  Others: <MoreHorizontal size={16} />,
  Income: <ArrowUpRight size={16} />,
};

const CATEGORY_COLORS: Record<Category, string> = {
  Food: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Travel: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Bills: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Shopping: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Health: 'bg-red-500/10 text-red-400 border-red-500/20',
  Entertainment: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Others: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  Income: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function TransactionList({ transactions, currencySymbol }: TransactionListProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isSmall = width < 640;
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const path = `expenses/${id}`;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-20 rounded-[40px] border border-zinc-200 dark:border-white/10 text-center space-y-6 shadow-2xl transition-colors">
        <div className="w-24 h-24 bg-zinc-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-zinc-200 dark:border-white/10">
          <Receipt className="text-zinc-400 dark:text-zinc-700" size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">No Transactions Found</h3>
          <p className="text-zinc-500 font-medium">Your financial journey starts with your first entry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div 
              key={tx.id} 
              className="bg-white dark:bg-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-xl relative group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border ${CATEGORY_COLORS[tx.category]}`}>
                    {React.cloneElement(CATEGORY_ICONS[tx.category] as React.ReactElement, { size: isSmall ? 14 : 16 })}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-zinc-900 dark:text-white tracking-tight text-sm sm:text-base truncate">{tx.category}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-500 font-bold">{format(tx.date, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-black text-base sm:text-lg tracking-tighter ${tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
                  </p>
                  <div className="flex justify-end mt-1">
                    {confirmDelete === tx.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="px-2 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest rounded-md"
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
                        onClick={() => setConfirmDelete(tx.id)}
                        className="p-1.5 text-zinc-400 dark:text-zinc-700 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-400/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {tx.note && (
                <p className="mt-2 text-xs sm:text-sm text-zinc-500 font-medium line-clamp-1 sm:line-clamp-2">
                  {tx.note}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden transition-colors">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md">
                <tr className="border-b border-zinc-200 dark:border-white/5">
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Type</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Category</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-6 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Note</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        tx.type === 'income' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl border ${CATEGORY_COLORS[tx.category]}`}>
                          {CATEGORY_ICONS[tx.category]}
                        </div>
                        <span className="font-black text-zinc-900 dark:text-white tracking-tight">{tx.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">{format(tx.date, 'MMM dd, yyyy')}</span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm text-zinc-500 font-medium truncate max-w-[150px] block">
                        {tx.note || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`font-black text-lg tracking-tighter ${tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end">
                        {confirmDelete === tx.id ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <button 
                              onClick={() => handleDelete(tx.id)}
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
                            onClick={() => setConfirmDelete(tx.id)}
                            className="p-3 text-zinc-400 dark:text-zinc-700 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-400/20"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
