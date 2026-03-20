import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { COUNTRIES } from '../constants';
import { User, Globe, CreditCard, Save, CheckCircle2, Phone, Moon, Sun, Monitor, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme, Transaction } from '../types';
import FinancialRecap from './FinancialRecap';

interface ProfileSettingsProps {
  profile: UserProfile;
  transactions: Transaction[];
  currencySymbol: string;
  onViewRecap: () => void;
  initialTab?: 'general' | 'recap';
}

export default function ProfileSettings({ profile, transactions, currencySymbol, onViewRecap, initialTab = 'general' }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'recap'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [selectedCountry, setSelectedCountry] = useState(profile.country || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
  const [theme, setTheme] = useState<Theme>(profile.theme || 'dark');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const countryData = COUNTRIES.find(c => c.name === selectedCountry);
      const updates: any = {
        displayName,
        country: selectedCountry,
        phoneNumber,
        theme,
      };

      if (countryData) {
        updates.currency = countryData.currency;
      }

      await updateDoc(doc(db, 'users', profile.uid), updates);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentCountry = COUNTRIES.find(c => c.name === selectedCountry);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Settings Navigation */}
      <div className="flex gap-2 bg-zinc-100 dark:bg-white/5 p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 w-fit mx-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'general' 
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xl' 
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <User size={14} />
          General
        </button>
        <button
          onClick={() => setActiveTab('recap')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            activeTab === 'recap' 
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xl' 
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Sparkles size={14} />
          Recap
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'general' ? (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-2xl space-y-10 transition-colors duration-300"
          >
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Profile Settings</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Manage your account preferences</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              {/* Display Name */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <User size={12} className="text-emerald-500" />
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Phone size={12} className="text-amber-500" />
                  Phone Number (Optional)
                </label>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                />
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Moon size={12} className="text-violet-500" />
                  Appearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light', icon: <Sun size={16} /> },
                    { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
                    { id: 'system', label: 'System', icon: <Monitor size={16} /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as Theme)}
                      className={`px-4 py-4 rounded-2xl text-center border transition-all flex flex-col items-center gap-2 ${
                        theme === t.id 
                          ? 'bg-violet-500/20 border-violet-500 text-violet-400' 
                          : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20'
                      }`}
                    >
                      {t.icon}
                      <span className="font-bold text-[10px] uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe size={12} className="text-blue-500" />
                  Country & Region
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => setSelectedCountry(country.name)}
                      className={`px-4 py-4 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                        selectedCountry === country.name 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                          : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-sm">{country.name}</span>
                      <span className="text-[10px] font-black opacity-40 group-hover:opacity-100 transition-opacity">
                        {country.currency.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Preview */}
              {currentCountry && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                    <CreditCard className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Currency</p>
                    <p className="text-zinc-900 dark:text-white font-black text-lg">
                      {currentCountry.currency.name} ({currentCountry.currency.symbol})
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="pt-4 flex items-center gap-4">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 group relative px-8 py-5 bg-emerald-500 text-zinc-950 rounded-2xl font-black text-xl transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 overflow-hidden shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {isSaving ? 'Saving Changes...' : 'Save Settings'}
                </button>

                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-widest"
                    >
                      <CheckCircle2 size={18} />
                      Saved!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="recap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FinancialRecap transactions={transactions} currencySymbol={currencySymbol} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
