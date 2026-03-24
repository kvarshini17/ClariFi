import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Search, Check, ArrowRight } from 'lucide-react';
import { COUNTRIES } from '../constants';

interface CurrencySetupProps {
  onComplete: (country: string, currency: { code: string; symbol: string; name: string }) => void;
}

export default function CurrencySetup({ onComplete }: CurrencySetupProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof COUNTRIES[0] | null>(null);

  const filtered = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.currency.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Animated Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/10 rounded-[48px] p-8 sm:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative z-10 transition-colors"
      >
        <div className="text-center space-y-6 mb-12">
          <motion.div 
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="w-20 h-20 bg-emerald-500/10 rounded-[24px] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-2xl shadow-emerald-500/10"
          >
            <Globe className="text-emerald-400" size={36} />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight">Global Context</h1>
            <p className="text-zinc-500 font-medium text-lg">Select your primary currency to begin.</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search country or currency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
            {filtered.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelected(country)}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all group ${
                  selected?.code === country.code 
                    ? 'bg-emerald-500/20 border-emerald-500 text-zinc-900 dark:text-white shadow-lg shadow-emerald-500/10' 
                    : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10'
                }`}
              >
                <div className="text-left">
                  <p className={`text-sm font-black tracking-tight transition-colors ${selected?.code === country.code ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>{country.name}</p>
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mt-1 text-zinc-600 dark:text-zinc-400">{country.currency.code} • {country.currency.symbol}</p>
                </div>
                {selected?.code === country.code && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-emerald-500 rounded-full p-1">
                    <Check size={12} className="text-zinc-950" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>

          <button
            disabled={!selected}
            onClick={() => selected && onComplete(selected.name, selected.currency)}
            className="w-full group relative px-8 py-6 bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-[24px] font-black text-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 overflow-hidden shadow-2xl shadow-emerald-500/20"
          >
            <span className="relative z-10">Initialize Dashboard</span>
            <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
