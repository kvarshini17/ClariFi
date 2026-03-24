import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  X,
  Filter,
  Search,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { useWindowSize } from '../hooks/useWindowSize';

interface TransactionListProps {
  transactions: Transaction[];
  currencySymbol: string;
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
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isSmall = width < 640;
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getCategoryIcon = (category: string, size: number = 16) => {
    const icon = CATEGORY_ICONS[category as Category];
    if (icon) {
      return React.cloneElement(icon as React.ReactElement, { size });
    }
    return <MoreHorizontal size={size} />;
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as Category] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

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

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tx => 
        tx.note?.toLowerCase().includes(query) || 
        tx.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(tx => tx.category === selectedCategory);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(tx => {
        const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
        return txDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(tx => {
        const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
        return txDate <= end;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);

      switch (sortBy) {
        case 'date-desc': return dateB.getTime() - dateA.getTime();
        case 'date-asc': return dateA.getTime() - dateB.getTime();
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        default: return 0;
      }
    });

    return result;
  }, [transactions, searchQuery, selectedCategory, sortBy, startDate, endDate]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-20 rounded-[40px] border border-zinc-200 dark:border-white/10 text-center space-y-6 shadow-2xl transition-colors">
        <div className="w-24 h-24 bg-zinc-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-zinc-200 dark:border-white/10">
          <Receipt className="text-zinc-400 dark:text-zinc-700" size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('transactions.no_transactions')}</h3>
          <p className="text-zinc-500 font-medium">{t('transactions.start_journey')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#d6d6e7] group-focus-within:text-emerald-500 transition-colors" size={19} style={{ width: '23px', height: '19px' }} />
          <input 
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-[48.6px]"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-4 rounded-2xl border transition-all flex items-center gap-2 font-sans font-black text-base uppercase tracking-widest h-[48.6px] ${
              showFilters 
                ? 'bg-emerald-500 border-emerald-500 text-zinc-950' 
                : 'bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-zinc-300'
            }`}
          >
            <Filter size={17} className={showFilters ? 'text-zinc-950' : 'text-[#0e0e0f]'} />
            {t('transactions.filters')}
          </button>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-6 pr-12 text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer w-[176.6px] h-[48.6px]"
            >
              <option value="date-desc">{t('transactions.sort_newest')}</option>
              <option value="date-asc">{t('transactions.sort_oldest')}</option>
              <option value="amount-desc">{t('transactions.sort_highest')}</option>
              <option value="amount-asc">{t('transactions.sort_lowest')}</option>
            </select>
            <ArrowUpDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#ceceda] ml-2">{t('transactions.start_date')}</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-[#ceceda] ml-2">{t('transactions.end_date')}</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-[#ceceda] ml-2">{t('transactions.categories')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  <button 
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                      selectedCategory === 'All' 
                        ? 'bg-emerald-500 border-emerald-500 text-zinc-950' 
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-500'
                    }`}
                  >
                    {t('common.all')}
                  </button>
                  {(Object.keys(CATEGORY_ICONS) as Category[]).map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                        selectedCategory === cat 
                          ? 'bg-emerald-500 border-emerald-500 text-zinc-950' 
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-500'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-black uppercase tracking-widest text-[#ceceda] hover:text-emerald-500 transition-colors"
                >
                  {t('transactions.reset_filters')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div 
              key={tx.id} 
              className="bg-white dark:bg-white/5 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-xl relative group"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border ${getCategoryColor(tx.category)}`}>
                    {getCategoryIcon(tx.category, isSmall ? 14 : 16)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-zinc-900 dark:text-white tracking-tight text-base truncate">{tx.category}</p>
                    <p className="text-sm text-[#ceceda] font-bold">{format(tx.date, 'MMM dd, yyyy')}</p>
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
                          className="px-2 py-1 bg-red-500 text-white text-[11px] font-black uppercase tracking-widest rounded-md"
                        >
                          {t('common.confirm')}
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
                <p className="mt-2 text-sm text-[#ceceda] font-medium line-clamp-1 sm:line-clamp-2" style={{ lineHeight: '15px' }}>
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
                  <th className="px-8 py-6 text-sm font-black text-[#ceceda] uppercase tracking-[0.2em]">{t('transactions.type')}</th>
                  <th className="px-8 py-6 text-sm font-black text-[#ceceda] uppercase tracking-[0.2em]">{t('transactions.categories')}</th>
                  <th className="px-8 py-6 text-sm font-black text-[#ceceda] uppercase tracking-[0.2em]">{t('transactions.date')}</th>
                  <th className="px-6 py-6 text-sm font-black text-[#ceceda] uppercase tracking-[0.2em]">{t('transactions.note')}</th>
                  <th className="px-8 py-6 text-sm font-black text-[#ceceda] uppercase tracking-[0.2em] text-right">{t('transactions.amount')}</th>
                  <th className="px-8 py-6 text-sm font-black text-[#ceceda] uppercase tracking-[0.2em] text-right">{t('transactions.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {filteredTransactions.map((tx) => (
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
                        <div className={`p-3 rounded-2xl border ${getCategoryColor(tx.category)}`}>
                          {getCategoryIcon(tx.category)}
                        </div>
                        <span className="font-black text-zinc-900 dark:text-white tracking-tight">{tx.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-base text-zinc-700 dark:text-zinc-300 font-bold">{format(tx.date, 'MMM dd, yyyy')}</span>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-base text-zinc-600 dark:text-zinc-400 font-medium truncate max-w-[150px] block">
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
                              className="px-3 py-1.5 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-500/20 hover:scale-105 transition-all"
                            >
                              {t('common.confirm')}
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
