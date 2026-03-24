import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Transaction, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Trophy, 
  Zap, 
  ArrowLeft, 
  ArrowRight,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Camera
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Cell,
  Tooltip
} from 'recharts';
import { 
  format, 
  startOfYear, 
  endOfYear, 
  eachMonthOfInterval, 
  isWithinInterval, 
  getYear, 
  startOfMonth, 
  endOfMonth, 
  subMonths,
  addMonths,
  addYears,
  subYears,
  getMonth,
  isSameMonth,
  isSameYear
} from 'date-fns';
import { toBlob } from 'html-to-image';

interface FinancialRecapProps {
  transactions: Transaction[];
  currencySymbol: string;
}

type RecapMode = 'monthly' | 'yearly';

export default React.memo(function FinancialRecap({ transactions, currencySymbol }: FinancialRecapProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<RecapMode>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [step, setStep] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Reset step when period changes
  React.useEffect(() => {
    setStep(0);
  }, [selectedDate, mode]);

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => getYear(new Date(t.date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const recapData = useMemo(() => {
    let start: Date, end: Date;
    
    if (mode === 'yearly') {
      start = startOfYear(selectedDate);
      end = endOfYear(selectedDate);
    } else {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
    }
    
    const periodTransactions = transactions.filter(t => 
      isWithinInterval(new Date(t.date), { start, end })
    );

    if (periodTransactions.length === 0) return null;

    const totalSpent = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryTotals: Record<string, number> = {};
    periodTransactions.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];

    const biggestExpense = periodTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)[0];

    // For charts
    let chartData;
    if (mode === 'yearly') {
      chartData = eachMonthOfInterval({ start, end }).map(month => {
        const mStart = month;
        const mEnd = endOfMonth(month);
        const mSpent = periodTransactions
          .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: mStart, end: mEnd }))
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: format(month, 'MMM'), amount: mSpent };
      });
    } else {
      // Weekly breakdown for monthly
      const weeks = [];
      let current = start;
      while (current <= end) {
        const wEnd = new Date(current.getTime() + 6 * 24 * 60 * 60 * 1000);
        const wSpent = periodTransactions
          .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start: current, end: wEnd > end ? end : wEnd }))
          .reduce((sum, t) => sum + t.amount, 0);
        weeks.push({ name: `W${weeks.length + 1}`, amount: wSpent });
        current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      chartData = weeks;
    }

    // Determine "Financial Vibe"
    let vibe = t('recap.vibe_balanced');
    let vibeDesc = t('recap.vibe_balanced_desc');
    
    if (topCategory?.[0] === 'Travel') {
      vibe = t('recap.vibe_nomad');
      vibeDesc = t('recap.vibe_nomad_desc');
    } else if (topCategory?.[0] === 'Food') {
      vibe = t('recap.vibe_explorer');
      vibeDesc = t('recap.vibe_explorer_desc');
    } else if (topCategory?.[0] === 'Shopping') {
      vibe = t('recap.vibe_trendsetter');
      vibeDesc = t('recap.vibe_trendsetter_desc');
    } else if (totalIncome > totalSpent * 2) {
      vibe = t('recap.vibe_architect');
      vibeDesc = t('recap.vibe_architect_desc');
    }

    return {
      totalSpent,
      totalIncome,
      topCategory,
      biggestExpense,
      chartData,
      vibe,
      vibeDesc,
      count: periodTransactions.length,
      periodLabel: mode === 'yearly' ? format(selectedDate, 'yyyy') : format(selectedDate, 'MMMM yyyy')
    };
  }, [transactions, selectedDate, mode]);

  const steps = [
    { title: t('recap.steps.recap'), color: "from-blue-600 to-indigo-700" },
    { title: t('recap.steps.big_picture'), color: "from-emerald-500 to-teal-700" },
    { title: t('recap.steps.spotlight'), color: "from-purple-600 to-pink-700" },
    { title: t('recap.steps.rhythm'), color: "from-orange-500 to-rose-700" },
    { title: t('recap.steps.vibe'), color: "from-zinc-800 to-zinc-950" }
  ];

  const handleExportImage = async () => {
    if (shareCardRef.current === null) return;
    
    try {
      const blob = await toBlob(shareCardRef.current, { cacheBust: true });
      if (!blob) throw new Error('Failed to generate image');
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `ClariFi_Recap_${recapData?.periodLabel}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting image:', err);
    }
  };

  const handleShareImage = async () => {
    if (shareCardRef.current === null) return;
    
    try {
      const blob = await toBlob(shareCardRef.current, { cacheBust: true });
      if (!blob) throw new Error('Failed to generate image');

      const fileName = `ClariFi_Recap_${recapData?.periodLabel}.png`;
      let file: File;
      try {
        file = new File([blob], fileName, { type: 'image/png' });
      } catch (e) {
        console.warn('File constructor failed, using fallback:', e);
        // Fallback for environments where File constructor is restricted
        const fallbackFile = blob as unknown as File;
        try {
          Object.defineProperty(fallbackFile, 'name', { value: fileName, writable: false });
          Object.defineProperty(fallbackFile, 'lastModified', { value: Date.now(), writable: false });
        } catch (propError) {
          console.warn('Could not add properties to fallback file:', propError);
        }
        file = fallbackFile;
      }

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('recap.period_recap', { period: recapData?.periodLabel }),
          text: t('recap.share_text', { period: recapData?.periodLabel })
        });
      } else {
        // Fallback to download if sharing files is not supported
        handleExportImage();
        alert(t('recap.share_not_supported'));
      }
    } catch (err) {
      console.error('Error sharing image:', err);
      // Fallback to download on error
      handleExportImage();
    }
  };

  const handleShare = async () => {
    const shareText = t('recap.share_full_text', {
      period: recapData?.periodLabel,
      spent: recapData?.totalSpent.toLocaleString(),
      income: recapData?.totalIncome.toLocaleString(),
      category: recapData?.topCategory?.[0] || t('common.none'),
      vibe: recapData?.vibe,
      currency: currencySymbol
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('recap.period_recap', { period: recapData?.periodLabel }),
          text: shareText,
          url: 'https://clarifi-gamma.vercel.app'
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert(t('recap.share_summary_copied'));
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (!recapData) {
    return (
      <div className="py-20 text-center space-y-6 glass-card rounded-[40px] border-dashed">
        <div className="w-24 h-24 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
          <Calendar className="text-zinc-400" size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('recap.no_data')}</h3>
          <p className="text-zinc-500 font-medium">{t('recap.try_different')}</p>
        </div>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => setSelectedDate(mode === 'yearly' ? subYears(selectedDate, 1) : subMonths(selectedDate, 1))}
            className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 text-[11px] font-black uppercase tracking-widest"
          >
            {t('recap.today')}
          </button>
          <button 
            onClick={() => setMode(mode === 'monthly' ? 'yearly' : 'monthly')}
            className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl font-black text-xs uppercase tracking-widest"
          >
            {t('recap.switch_to', { mode: mode === 'monthly' ? t('recap.yearly') : t('recap.monthly') })}
          </button>
          <button 
            onClick={() => setSelectedDate(mode === 'yearly' ? addYears(selectedDate, 1) : addMonths(selectedDate, 1))}
            className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-[29px] font-black text-zinc-900 dark:text-white tracking-tight">
            {mode === 'yearly' ? t('recap.yearly') : t('recap.monthly')} {t('recap.title')}
          </h3>
          <p className="text-zinc-500 text-[13px] font-bold uppercase tracking-widest">
            {recapData.periodLabel}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
            <button 
              onClick={() => setMode('monthly')}
              className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                mode === 'monthly' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'
              }`}
            >
              {t('recap.monthly')}
            </button>
            <button 
              onClick={() => setMode('yearly')}
              className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                mode === 'yearly' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'
              }`}
            >
              {t('recap.yearly')}
            </button>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedDate(mode === 'yearly' ? subYears(selectedDate, 1) : subMonths(selectedDate, 1))}
              className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 text-[11px] font-black uppercase tracking-widest"
            >
              {t('recap.today')}
            </button>
            <button 
              onClick={() => setSelectedDate(mode === 'yearly' ? addYears(selectedDate, 1) : addMonths(selectedDate, 1))}
              className="p-3 bg-zinc-100 dark:bg-white/5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Story View */}
      <div className={`relative h-[500px] sm:h-[600px] rounded-[40px] overflow-hidden shadow-2xl bg-gradient-to-br ${steps[step].color} transition-all duration-700`}>
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-48 h-48 border-4 border-white rotate-45 animate-float" />
          <div className="absolute top-1/2 left-1/4 w-2 h-24 bg-white rotate-12" />
        </div>

        <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300" />
              <span className="text-[12px] font-black uppercase tracking-[0.3em]">{steps[step].title}</span>
            </div>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} 
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="flex-1 flex flex-col justify-center items-center text-center space-y-8"
            >
              {step === 0 && (
                <div className="space-y-6">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    className="w-32 h-32 bg-white/20 backdrop-blur-xl rounded-[40px] flex items-center justify-center mx-auto border border-white/30 shadow-2xl"
                  >
                    <Trophy size={64} className="text-yellow-300" />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none">
                      {recapData.periodLabel}<br />{t('recap.wrapped')}
                    </h3>
                    <p className="text-lg font-bold opacity-80">{t('recap.moves_made', { count: recapData.count })}</p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="w-full max-w-md space-y-12">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{t('recap.total_outflow')}</p>
                    <h3 className="text-[43px] font-black tracking-tighter">
                      {currencySymbol}{recapData.totalSpent.toLocaleString()}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{t('recap.total_inflow')}</p>
                      <p className="text-2xl font-black">{currencySymbol}{recapData.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{t('recap.net_flow')}</p>
                      <p className={`text-2xl font-black ${recapData.totalIncome > recapData.totalSpent ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {recapData.totalIncome > recapData.totalSpent ? '+' : ''}{currencySymbol}{(recapData.totalIncome - recapData.totalSpent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 w-full max-w-md">
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{t('recap.top_category')}</p>
                    <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/20 shadow-2xl">
                      <h3 className="text-5xl font-black tracking-tighter mb-2">{recapData.topCategory?.[0] || t('common.none')}</h3>
                      <p className="text-2xl font-bold text-white/80">
                        {recapData.topCategory ? `${currencySymbol}${recapData.topCategory[1].toLocaleString()}` : t('common.keep_it_up')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{t('recap.biggest_splurge')}</p>
                    <p className="text-lg font-bold italic">"{recapData.biggestExpense?.description || t('common.none')}"</p>
                    <p className="text-2xl font-black">
                      {recapData.biggestExpense ? `${currencySymbol}${recapData.biggestExpense.amount.toLocaleString()}` : '-'}
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="w-full h-full flex flex-col space-y-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{t('recap.spending_pulse')}</p>
                  <div className="flex-1 min-h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recapData.chartData}>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'white', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white text-zinc-900 p-2 rounded-lg shadow-xl font-black text-xs">
                                  {currencySymbol}{payload[0].value?.toLocaleString()}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {recapData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="rgba(255,255,255,0.8)" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8">
                  <motion.div 
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-40 h-40 bg-white text-zinc-900 rounded-full flex items-center justify-center mx-auto shadow-2xl border-8 border-white/20"
                  >
                    <Zap size={80} className="fill-current" />
                  </motion.div>
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{t('recap.you_are')}</p>
                    <h3 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">{recapData.vibe}</h3>
                    <p className="text-xl font-medium max-w-xs mx-auto opacity-90">{recapData.vibeDesc}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-8">
            <button 
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all disabled:opacity-20"
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-2 px-6 py-4 bg-white text-zinc-900 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl"
              >
                <Camera size={18} />
                {t('recap.visual_share')}
              </button>
              {step === steps.length - 1 ? (
                <button 
                  onClick={handleShare}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <Share2 size={24} />
                </button>
              ) : (
                <button 
                  onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
                  className="p-4 bg-white/20 hover:bg-white/30 rounded-2xl transition-all animate-pulse"
                >
                  <ArrowRight size={24} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Share Card Modal */}
      <AnimatePresence>
        {showShareCard && (
          <div 
            className="fixed inset-0 z-[2000] flex flex-col items-center justify-start sm:justify-center p-4 sm:p-8 bg-zinc-950/90 backdrop-blur-xl overflow-y-auto custom-scrollbar"
            onClick={() => setShowShareCard(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm flex flex-col gap-6 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-2">
                <button 
                  onClick={() => setShowShareCard(false)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white group"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              {/* The actual card that will be exported */}
              <div 
                ref={shareCardRef}
                className={`aspect-[9/16] w-full rounded-[40px] bg-gradient-to-br ${steps[4].color} p-10 flex flex-col justify-between text-white relative overflow-hidden`}
              >
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-20 left-10 w-40 h-40 border-8 border-white rounded-full" />
                  <div className="absolute bottom-40 right-10 w-60 h-60 border-8 border-white rotate-12" />
                </div>

                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                      <Sparkles size={16} className="text-yellow-300" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">ClariFi {t('recap.wrapped')}</span>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-50">{recapData.periodLabel}</span>
                </div>

                <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest opacity-70">{t('recap.you_are')}</p>
                    <h3 className="text-5xl font-black tracking-tighter leading-none">{recapData.vibe}</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{t('recap.total_outflow')}</p>
                      <p className="text-2xl font-black">{currencySymbol}{recapData.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{t('recap.top_category')}</p>
                      <p className="text-2xl font-black">{recapData.topCategory?.[0] || t('common.none')}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/20 pb-2">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-70">{t('recap.moves_made_label')}</p>
                      <p className="text-2xl font-black">{recapData.count}</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white text-zinc-950 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Zap size={32} className="fill-current" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-50">clarifi-gamma.vercel.app</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    onClick={handleExportImage}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/10 text-white rounded-2xl font-black text-sm border border-white/20 hover:bg-white/20 transition-all"
                  >
                    <Download size={18} />
                    {t('recap.save_png')}
                  </button>
                  <button 
                    onClick={handleShareImage}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-zinc-950 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] transition-all"
                  >
                    <Share2 size={18} />
                    {t('recap.share_image')}
                  </button>
                </div>
                <button 
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-3 text-white/50 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
                >
                  {t('recap.share_text_instead')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          icon={<TrendingUp className="text-emerald-500" />}
          label={t('recap.total_inflow')}
          value={`${currencySymbol}${recapData.totalIncome.toLocaleString()}`}
        />
        <SummaryCard 
          icon={<TrendingDown className="text-rose-500" />}
          label={t('recap.total_outflow')}
          value={`${currencySymbol}${recapData.totalSpent.toLocaleString()}`}
        />
        <SummaryCard 
          icon={<Zap className="text-blue-500" />}
          label={t('recap.top_category')}
          value={recapData.topCategory?.[0] || t('common.none')}
        />
        <SummaryCard 
          icon={<Trophy className="text-yellow-500" />}
          label={t('recap.steps.vibe')}
          value={recapData.vibe.split(' ')[recapData.vibe.split(' ').length - 1]}
        />
      </div>
    </div>
  );
});

function SummaryCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="glass-card p-6 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-white/10">
          {icon}
        </div>
        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</p>
    </div>
  );
}
