import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [manualRate, setManualRate] = useState<string>('');
  const [isManual, setIsManual] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Persistent cache key
  const CACHE_KEY = 'clari_currency_cache';

  const fetchExchangeRate = useCallback(async (forceRefresh = false) => {
    if (fromCurrency === toCurrency) {
      setExchangeRate(1);
      setIsManual(false);
      setIsCached(false);
      return;
    }

    // 1. Check Persistent Cache (LocalStorage)
    const now = Date.now();
    const savedCache = localStorage.getItem(CACHE_KEY);
    let cacheObj: Record<string, { rates: Record<string, number>, timestamp: number }> = {};
    
    if (savedCache) {
      try {
        cacheObj = JSON.parse(savedCache);
        const cachedData = cacheObj[fromCurrency];
        
        // Use cache if not expired (4 hours TTL for persistent cache)
        if (!forceRefresh && cachedData && (now - cachedData.timestamp < 14400000)) {
          if (cachedData.rates[toCurrency]) {
            setExchangeRate(cachedData.rates[toCurrency]);
            setLastUpdated(cachedData.timestamp);
            setIsManual(false);
            setIsCached(true);
            setError(null);
            console.log(`[CurrencyConverter] Instant Load from LocalStorage`);
            return;
          }
        }
      } catch (e) {
        console.error('Cache parse error', e);
      }
    }

    setLoading(true);
    setError(null);
    setIsCached(false);

    // 2. Parallel Fetching (Race Strategy)
    // We fire all requests at once and take the fastest successful one
    const fetchFromFrankfurter = async () => {
      const resp = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}`);
      if (!resp.ok) throw new Error('Frankfurter failed');
      const data = await resp.json();
      return data.rates;
    };

    const fetchFromExchangeRateAPI = async () => {
      const resp = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      if (!resp.ok) throw new Error('ExchangeRate-API failed');
      const data = await resp.json();
      return data.rates;
    };

    const fetchFromOpenER = async () => {
      const resp = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
      if (!resp.ok) throw new Error('OpenER failed');
      const data = await resp.json();
      return data.rates;
    };

    try {
      console.log(`[CurrencyConverter] Racing APIs for ${fromCurrency}...`);
      
      // Promise.any returns the first one that succeeds
      const rates = await Promise.any([
        fetchFromFrankfurter(),
        fetchFromExchangeRateAPI(),
        fetchFromOpenER()
      ]);

      if (rates && rates[toCurrency]) {
        // Update Persistent Cache
        cacheObj[fromCurrency] = {
          rates,
          timestamp: now
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
        
        setExchangeRate(rates[toCurrency]);
        setLastUpdated(now);
        setIsManual(false);
        console.log(`[CurrencyConverter] Race won! Rates updated.`);
      } else {
        throw new Error(`Rate for ${toCurrency} not found in any source.`);
      }
    } catch (err) {
      // If all race participants fail
      const errorMessage = 'Network error. Using manual mode or retry.';
      setError(errorMessage);
      console.error('[CurrencyConverter] All APIs failed the race:', err);
    } finally {
      setLoading(false);
    }
  }, [fromCurrency, toCurrency]);

  const handleManualRateChange = (val: string) => {
    setManualRate(val);
    const rate = parseFloat(val);
    if (!isNaN(rate) && rate > 0) {
      setExchangeRate(rate);
      setIsManual(true);
      setIsCached(false);
      setLastUpdated(Date.now());
      setError(null);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    const prevFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(prevFrom);
  };

  const handleRefresh = () => {
    fetchExchangeRate(true);
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
            onClick={handleRefresh}
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
            <div className={`p-2 rounded-lg ${isManual ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <TrendingUp size={16} />
            </div>
            <p className="text-base font-bold text-zinc-700 dark:text-zinc-300">
              1 {fromCurrency} = {exchangeRate ? exchangeRate.toFixed(4) : '...'} {toCurrency}
              {isManual && <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-amber-500">(Manual)</span>}
              {isCached && <span className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-full">Instant</span>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              <Globe size={12} />
              <span>{isManual ? 'Manual Entry' : t('settings.converter.market_rate')}</span>
            </div>
            {lastUpdated && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <RefreshCw size={14} className="animate-spin" />
              </div>
              <p className="text-sm font-bold">{error}</p>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Troubleshooting:</p>
              <ul className="text-xs font-medium space-y-1 opacity-80 list-disc ml-4">
                <li>Check your internet connection</li>
                <li>Ensure you are running the app via a local server (npm run dev)</li>
                <li>Check if your network blocks currency APIs</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => fetchExchangeRate()}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Retry Auto-Fetch
              </button>
              
              <div className="flex-1 relative">
                <input 
                  type="number"
                  placeholder="Enter rate manually..."
                  value={manualRate}
                  onChange={(e) => handleManualRateChange(e.target.value)}
                  className="w-full py-3 px-4 bg-white dark:bg-zinc-900 border border-red-500/30 rounded-xl text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
