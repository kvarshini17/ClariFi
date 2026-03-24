import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, RefreshCw, TrendingUp, TrendingDown, Globe, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
];

export default function CurrencyConverter() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ date: string; rate: number }[]>([]);

  const fetchExchangeRate = useCallback(async () => {
    if (fromCurrency === toCurrency) {
      setExchangeRate(1);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Try Frankfurter API first
      let response = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`);
      
      if (!response.ok) {
        // Fallback to ExchangeRate-API (Free tier, no key needed for basic latest rates)
        response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        if (!response.ok) throw new Error('Failed to fetch exchange rate from all sources');
        
        const data = await response.json();
        const rate = data.rates[toCurrency];
        if (!rate) throw new Error(`Currency ${toCurrency} not found in fallback API`);
        setExchangeRate(rate);
      } else {
        const data = await response.json();
        setExchangeRate(data.rates[toCurrency]);
      }
    } catch (err) {
      setError('Unable to fetch exchange rate. Please check your connection or try again later.');
      console.error('Currency Conversion Error:', err);
    } finally {
      setLoading(false);
    }
  }, [fromCurrency, toCurrency, t]);

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const convertedAmount = exchangeRate ? (amount * exchangeRate).toFixed(2) : '...';

  return (
    <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl relative overflow-hidden group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-[80px] group-hover:bg-emerald-500/10 transition-colors" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-24 -mb-24 blur-[60px] group-hover:bg-blue-500/10 transition-colors" />

      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-zinc-100 dark:bg-white/10 p-3 rounded-2xl border border-zinc-200 dark:border-white/10">
              <Calculator className="text-zinc-900 dark:text-white" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('settings.converter.title')}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">{t('settings.converter.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={fetchExchangeRate}
            disabled={loading}
            className="p-3 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-center">
          {/* From Currency */}
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest ml-1">{t('settings.converter.from')}</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-4 text-xl font-black text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none"
              >
                {POPULAR_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center pt-6">
            <button 
              onClick={handleSwap}
              className="p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-110 active:scale-95 transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/10"
            >
              <ArrowRightLeft className="w-6 h-6" />
            </button>
          </div>

          {/* To Currency */}
          <div className="space-y-3">
            <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest ml-1">{t('settings.converter.to')}</label>
            <div className="relative">
              <div className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-2xl px-5 py-4 text-xl font-black text-zinc-900 dark:text-white flex items-center">
                {loading ? (
                  <div className="h-7 w-24 bg-zinc-200 dark:bg-white/10 animate-pulse rounded-lg" />
                ) : (
                  <span>{convertedAmount}</span>
                )}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none"
              >
                {POPULAR_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rate Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <TrendingUp size={16} />
            </div>
            <p className="text-base font-bold text-zinc-700 dark:text-zinc-300">
              1 {fromCurrency} = {exchangeRate?.toFixed(4)} {toCurrency}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            <Globe size={12} />
            <span>{t('settings.converter.market_rate')}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-base font-bold flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} />
              {error}
            </div>
            <button 
              onClick={() => fetchExchangeRate()}
              className="w-full py-2 bg-red-500 text-white rounded-lg text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
